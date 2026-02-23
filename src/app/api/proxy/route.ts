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
