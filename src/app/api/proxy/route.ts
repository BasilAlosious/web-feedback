import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    try {
        const response = await fetch(url)
        const contentType = response.headers.get("Content-Type") || ""

        // Only proxy HTML content
        if (!contentType.includes("text/html")) {
            // For non-HTML (images, css, etc.), redirect to original source or fetch as blob
            // Redirect is simpler but might hit CORS if used in <img> tags on our origin.
            // Let's proxy the bytes directly.
            const blob = await response.blob()
            return new NextResponse(blob, {
                status: response.status,
                headers: {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                },
            })
        }

        let html = await response.text()

        // Inject <base> tag to fix relative links
        const urlObj = new URL(url)
        const baseTag = `<base href="${urlObj.origin}/">`
        html = html.replace("<head>", `<head>${baseTag}`)

        // Inject scroll tracking script for comment anchoring
        // This script reports scroll position to the parent window via postMessage
        const scrollScript = `
<script>
(function() {
    console.log('[Feedback Iframe] Script loaded');
    var ticking = false;

    function sendScrollPosition() {
        var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        var scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
        var docHeight = Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0
        );
        var docWidth = Math.max(
            document.body ? document.body.scrollWidth : 0,
            document.documentElement ? document.documentElement.scrollWidth : 0
        );

        console.log('[Feedback Iframe] Sending scroll position:', scrollY);
        window.parent.postMessage({
            type: 'FEEDBACK_SCROLL',
            scrollY: scrollY,
            scrollX: scrollX,
            documentHeight: docHeight,
            documentWidth: docWidth,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth
        }, '*');
    }

    // Stamp every element with a stable, deterministic id (document order) so the
    // parent can anchor comments to specific elements. Re-stamped on DOM mutations.
    function stampElementIds() {
        var els = document.body ? document.body.getElementsByTagName('*') : [];
        for (var i = 0; i < els.length; i++) {
            els[i].setAttribute('data-fb-id', String(i));
        }
    }
    function stampSoon() { try { stampElementIds(); } catch (e) {} }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        stampSoon();
    } else {
        document.addEventListener('DOMContentLoaded', stampSoon);
    }
    window.addEventListener('load', stampSoon);
    [200, 800, 2000].forEach(function(t) { setTimeout(stampSoon, t); });
    // Re-stamp (debounced) when the DOM changes so ids stay in sync.
    var stampTimer = null;
    try {
        var mo = new MutationObserver(function() {
            if (stampTimer) clearTimeout(stampTimer);
            stampTimer = setTimeout(stampSoon, 300);
        });
        if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    // Send initial position on load
    if (document.readyState === 'complete') {
        sendScrollPosition();
    } else {
        window.addEventListener('load', sendScrollPosition);
    }

    // Re-send a few times after load. The parent's message listener may mount after
    // our first send (race), and document height settles as fonts/images load — these
    // resends ensure the parent reliably learns the document height (needed for the
    // scrollbar to appear without the user scrolling first).
    [100, 400, 1000, 2000, 3500].forEach(function(t) { setTimeout(sendScrollPosition, t); });
    window.addEventListener('resize', sendScrollPosition, { passive: true });

    // Throttled scroll listener using requestAnimationFrame
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                sendScrollPosition();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Listen for scroll commands from parent
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // Jump-to-comment: scroll to absolute position
        if (event.data.type === 'FEEDBACK_SCROLL_TO') {
            console.log('[Feedback Iframe] Received SCROLL_TO:', event.data.scrollY);
            window.scrollTo({
                top: event.data.scrollY || 0,
                left: event.data.scrollX || 0,
                behavior: event.data.smooth ? 'smooth' : 'auto'
            });
        }

        // Forwarded wheel event: scroll by delta
        if (event.data.type === 'FEEDBACK_SCROLL_BY') {
            console.log('[Feedback Iframe] Received SCROLL_BY:', event.data.deltaY);
            window.scrollBy({
                top: event.data.deltaY || 0,
                left: event.data.deltaX || 0
            });
        }
    });
})();
</script>
`

        // Inject before </body> or at end of document
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scrollScript}</body>`)
        } else {
            html += scrollScript
        }

        // Remove X-Frame-Options and CSP headers from the response itself
        // Note: We are constructing a NEW response, so original headers are discarded unless we copy them.
        // We specifically WANT to discard X-Frame-Options and Content-Security-Policy.

        return new NextResponse(html, {
            status: response.status,
            headers: {
                "Content-Type": "text/html",
                "Access-Control-Allow-Origin": "*",
            },
        })

    } catch (error) {
        console.error("Proxy error:", error)
        return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 })
    }
}
