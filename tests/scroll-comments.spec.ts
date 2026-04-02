import { test, expect, Page } from '@playwright/test'

/**
 * Debug test for scroll-anchored comments.
 *
 * This test:
 * 1. Opens a markup page
 * 2. Captures console logs from both parent and iframe
 * 3. Scrolls the page and verifies postMessage communication
 * 4. Creates a comment and verifies scroll data is captured
 */

test.describe('Scroll-Anchored Comments', () => {
    // Capture console logs
    const consoleLogs: string[] = []

    test.beforeEach(async ({ page }) => {
        consoleLogs.length = 0

        // Listen to console logs from parent window
        page.on('console', msg => {
            const text = msg.text()
            if (text.includes('[Feedback') || text.includes('[IframeRenderer') || text.includes('[Comment')) {
                consoleLogs.push(`[PARENT] ${text}`)
                console.log(`[PARENT] ${text}`)
            }
        })

        // Also capture any errors
        page.on('pageerror', err => {
            console.log(`[ERROR] ${err.message}`)
        })
    })

    test('should receive scroll messages from iframe', async ({ page }) => {
        // Navigate to a markup page via share URL (no auth needed)
        // Using markup ID: dm9trg (basenine.co homepage)
        await page.goto('http://localhost:3000/share/dm9trg')

        // Wait for iframe to load
        await page.waitForTimeout(3000)

        // Check if we received any scroll messages
        console.log('\n--- Console Logs After Load ---')
        consoleLogs.forEach(log => console.log(log))

        // Get the overlay element (where we scroll)
        const overlay = page.locator('.cursor-crosshair').first()

        // Check if overlay exists
        const overlayExists = await overlay.count() > 0
        console.log('\nOverlay element exists:', overlayExists)

        if (overlayExists) {
            // Perform wheel scroll on overlay
            console.log('\n--- Performing Wheel Scroll ---')
            await overlay.hover()
            await page.mouse.wheel(0, 500)
            await page.waitForTimeout(1000)

            console.log('\n--- Console Logs After Scroll ---')
            consoleLogs.slice(-10).forEach(log => console.log(log))
        }

        // Check iframe content
        const iframe = page.frameLocator('iframe[title="Preview"]')
        const iframeExists = await page.locator('iframe[title="Preview"]').count() > 0
        console.log('\nIframe exists:', iframeExists)

        // Try to get iframe scroll position directly
        if (iframeExists) {
            const iframeElement = page.locator('iframe[title="Preview"]')
            const src = await iframeElement.getAttribute('src')
            console.log('Iframe src:', src)
        }
    })

    test('should track scroll position when creating comment', async ({ page }) => {
        // Navigate to markup page
        await page.goto('http://localhost:3000/share/dm9trg')
        await page.waitForTimeout(3000)

        // Get the overlay for clicking
        const overlay = page.locator('.cursor-crosshair').first()
        const overlayExists = await overlay.count() > 0

        if (!overlayExists) {
            console.log('Overlay not found - may not be in comment mode')
            // Try to find a mode toggle
            const modeToggle = page.locator('text=Comment').first()
            if (await modeToggle.count() > 0) {
                await modeToggle.click()
                await page.waitForTimeout(500)
            }
        }

        // First scroll down a bit
        const overlayAfter = page.locator('.cursor-crosshair').first()
        if (await overlayAfter.count() > 0) {
            console.log('\n--- Scrolling iframe before placing comment ---')
            await overlayAfter.hover()
            await page.mouse.wheel(0, 300)
            await page.waitForTimeout(1000)

            // Log scroll messages
            console.log('Scroll logs:', consoleLogs.filter(l => l.includes('scroll')))

            // Click to create a comment
            console.log('\n--- Clicking to create comment ---')
            const box = await overlayAfter.boundingBox()
            if (box) {
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
                await page.waitForTimeout(500)

                // Check if comment input appeared
                const commentInput = page.locator('textarea[placeholder*="comment"]')
                const inputExists = await commentInput.count() > 0
                console.log('Comment input appeared:', inputExists)

                if (inputExists) {
                    // Type a comment
                    await commentInput.fill('Test comment with scroll position')

                    // Submit
                    const sendBtn = page.locator('button:has-text("Send")')
                    if (await sendBtn.count() > 0) {
                        await sendBtn.click()
                        await page.waitForTimeout(1000)
                    }
                }
            }

            // Final log dump
            console.log('\n--- Final Console Logs ---')
            consoleLogs.forEach(log => console.log(log))
        }
    })

    test('verify comment anchoring with new comment', async ({ page }) => {
        // Go to share page
        await page.goto('http://localhost:3000/share/dm9trg')
        await page.waitForTimeout(4000) // Wait for iframe to load

        // Get the overlay
        const overlay = page.locator('.cursor-crosshair').first()
        if (await overlay.count() === 0) {
            console.log('Overlay not found')
            return
        }

        // First, scroll the page down a bit
        console.log('\n--- Step 1: Initial scroll to 200px ---')
        await overlay.hover()
        await page.mouse.wheel(0, 200)
        await page.waitForTimeout(1000)

        // Log current state
        console.log('Console logs after initial scroll:')
        consoleLogs.slice(-5).forEach(log => console.log(log))

        // Now click to create a comment (at scroll=200)
        console.log('\n--- Step 2: Create comment at scroll=200 ---')
        const box = await overlay.boundingBox()
        if (box) {
            // Click in the middle of the viewport
            const clickX = box.x + box.width / 2
            const clickY = box.y + box.height / 2
            console.log(`Clicking at (${clickX}, ${clickY})`)
            await page.mouse.click(clickX, clickY)
            await page.waitForTimeout(500)

            // Find and fill the comment input
            const input = page.locator('textarea').first()
            if (await input.count() > 0) {
                await input.fill('Test comment at scroll 200')
                const sendBtn = page.locator('button:has-text("Send")')
                if (await sendBtn.count() > 0) {
                    await sendBtn.click()
                    await page.waitForTimeout(1000)
                    console.log('Comment saved!')
                }
            }
        }

        // Scroll back to top
        console.log('\n--- Step 3: Scroll back to top (scroll=0) ---')
        await overlay.hover()
        await page.mouse.wheel(0, -300)  // Scroll up
        await page.waitForTimeout(1000)

        // Log the final state
        console.log('Console logs after scroll back:')
        consoleLogs.slice(-10).forEach(log => console.log(log))

        // Look for the comment we just created
        const pins = page.locator('.pin-marker')
        const pinCount = await pins.count()
        console.log(`\nTotal pins visible: ${pinCount}`)

        // If comment was placed at scroll=200, and we scrolled back to scroll=0:
        // The comment should appear BELOW its original viewport position
        // (200px lower in percentage terms)
    })

    test('debug: inspect iframe postMessage', async ({ page }) => {
        // Go to markup page
        await page.goto('http://localhost:3000/share/dm9trg')
        await page.waitForTimeout(2000)

        // Inject a script to intercept postMessage
        await page.evaluate(() => {
            const originalPostMessage = window.postMessage
            window.postMessage = function (...args) {
                console.log('[DEBUG] postMessage called:', JSON.stringify(args[0]))
                return originalPostMessage.apply(this, args)
            }

            // Also listen for messages
            window.addEventListener('message', (event) => {
                console.log('[DEBUG] message received:', JSON.stringify(event.data))
            })
        })

        // Wait and scroll
        await page.waitForTimeout(1000)

        const overlay = page.locator('.cursor-crosshair').first()
        if (await overlay.count() > 0) {
            await overlay.hover()
            await page.mouse.wheel(0, 200)
            await page.waitForTimeout(2000)
        }

        console.log('\n--- All logs captured ---')
        consoleLogs.forEach(log => console.log(log))
    })

    test('visual verification: comment position changes on scroll', async ({ page }) => {
        // This test verifies scroll-anchored comments by checking:
        // 1. Legacy comments (scrollY=0) move UP and eventually disappear
        // 2. New comments (scrollY=creation scroll) stay anchored to content

        await page.goto('http://localhost:3000/share/dm9trg')
        await page.waitForTimeout(4000)

        // Count visible pins before scroll
        const pinsBeforeCount = await page.locator('.pin-marker').count()
        console.log(`\n📍 Visible pins at scroll=0: ${pinsBeforeCount}`)

        // Get all pin numbers to identify them
        const pinNumbers = await page.locator('.pin-marker').allTextContents()
        console.log(`Pin numbers visible: [${pinNumbers.join(', ')}]`)

        // Get pin container styles before scroll
        const allPins = page.locator('.pin-marker')
        for (let i = 0; i < await allPins.count(); i++) {
            const pinContainer = allPins.nth(i).locator('..')
            const style = await pinContainer.getAttribute('style')
            console.log(`Pin ${i + 1} style: ${style}`)
        }

        // Scroll the iframe down
        const overlay = page.locator('.cursor-crosshair').first()
        if (await overlay.count() > 0) {
            console.log('\n🔄 Scrolling iframe by 500px...')
            await overlay.hover()
            await page.mouse.wheel(0, 500)
            await page.waitForTimeout(1500)

            // Count visible pins after scroll
            const pinsAfterCount = await page.locator('.pin-marker').count()
            console.log(`\n📍 Visible pins at scroll=500: ${pinsAfterCount}`)

            const pinNumbersAfter = await page.locator('.pin-marker').allTextContents()
            console.log(`Pin numbers visible: [${pinNumbersAfter.join(', ')}]`)

            // Get styles after scroll
            for (let i = 0; i < await allPins.count(); i++) {
                const pinContainer = allPins.nth(i).locator('..')
                const style = await pinContainer.getAttribute('style')
                console.log(`Pin ${i + 1} style: ${style}`)
            }

            // VERIFICATION:
            // - Legacy comment (scrollY=0) at y=34.3% should become invisible at scroll=500
            //   because adjusted = 34.3 - (500/616)*100 = 34.3 - 81.2 = -46.9% (off screen)
            // - New comment (scrollY=200) at y=50% should be at 50 - ((500-200)/616)*100 = 50 - 48.7 = 1.3%

            console.log('\n✅ VERIFICATION SUMMARY:')
            console.log('If legacy comment (pin 1) disappeared after scrolling → anchoring works!')
            console.log('If new comment (pin 2) moved to top of viewport → anchoring works!')

            if (pinsAfterCount < pinsBeforeCount) {
                console.log('🎉 SUCCESS: Some comments became invisible (scrolled off-screen)')
            }
        }

        // Print filtered logs for verification
        const scrollLogs = consoleLogs.filter(log =>
            log.includes('adjusted:') || log.includes('visible=')
        )
        console.log('\n--- Comment Position Logs ---')
        scrollLogs.forEach(log => console.log(log))
    })

    test('debug: check iframe script injection', async ({ page }) => {
        // Go directly to the proxy URL to see if script is injected
        const proxyUrl = 'http://localhost:3000/api/proxy?url=' + encodeURIComponent('https://basenine.co')

        const response = await page.goto(proxyUrl)
        const content = await response?.text()

        // Check for our injected script
        const hasScript = content?.includes('FEEDBACK_SCROLL')
        console.log('Proxy response contains FEEDBACK_SCROLL script:', hasScript)

        if (content) {
            // Find the script portion
            const scriptMatch = content.match(/<script>\s*\(function\(\)\s*\{[\s\S]*?FEEDBACK_SCROLL[\s\S]*?\}\)\(\);\s*<\/script>/)
            if (scriptMatch) {
                console.log('\n--- Injected Script Found ---')
                console.log(scriptMatch[0].substring(0, 500) + '...')
            } else {
                console.log('\n--- Looking for script pattern ---')
                const anyScript = content.match(/FEEDBACK_SCROLL/g)
                console.log('FEEDBACK_SCROLL occurrences:', anyScript?.length || 0)
            }
        }

        expect(hasScript).toBe(true)
    })
})
