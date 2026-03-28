/**
 * Scroll-related utilities for comment position calculations.
 * Used to anchor comments to webpage content when scrolling.
 */

export interface ScrollAdjustedPosition {
    displayY: number
    displayX: number
    isVisible: boolean
    isAboveViewport: boolean
    isBelowViewport: boolean
}

/**
 * Calculate the display position of a comment based on scroll offset.
 *
 * When the iframe content scrolls, comments need to move in the opposite direction
 * to stay anchored to the content they were placed on.
 *
 * @param originalY - Original Y position (percentage 0-100 of viewport)
 * @param originalX - Original X position (percentage 0-100 of viewport)
 * @param commentScrollY - Scroll position when comment was created (pixels)
 * @param commentScrollX - Scroll position when comment was created (pixels)
 * @param currentScrollY - Current scroll position (pixels)
 * @param currentScrollX - Current scroll position (pixels)
 * @param containerHeight - Height of the viewport container (pixels)
 * @param containerWidth - Width of the viewport container (pixels)
 */
export function calculateScrollAdjustedPosition(
    originalY: number,
    originalX: number,
    commentScrollY: number | undefined,
    commentScrollX: number | undefined,
    currentScrollY: number,
    currentScrollX: number,
    containerHeight: number,
    containerWidth: number
): ScrollAdjustedPosition {
    // For legacy comments without scrollY, assume they were placed at scroll=0
    const scrollYAtCreation = commentScrollY ?? 0
    const scrollXAtCreation = commentScrollX ?? 0

    // Calculate scroll delta in pixels
    const scrollDeltaY = currentScrollY - scrollYAtCreation
    const scrollDeltaX = currentScrollX - scrollXAtCreation

    // Convert delta to percentage of container
    // Guard against division by zero
    const deltaPercentY = containerHeight > 0 ? (scrollDeltaY / containerHeight) * 100 : 0
    const deltaPercentX = containerWidth > 0 ? (scrollDeltaX / containerWidth) * 100 : 0

    // Adjusted position: move opposite to scroll direction
    // When user scrolls DOWN, content moves UP, so comments should move UP (decrease Y)
    const displayY = originalY - deltaPercentY
    const displayX = originalX - deltaPercentX

    // Visibility bounds (with some margin for partial visibility of pins)
    const MARGIN = 5 // percentage
    const isAboveViewport = displayY < -MARGIN
    const isBelowViewport = displayY > 100 + MARGIN
    const isVisible = !isAboveViewport && !isBelowViewport

    return {
        displayY,
        displayX,
        isVisible,
        isAboveViewport,
        isBelowViewport
    }
}

/**
 * Calculate the scroll position needed to bring a comment into view.
 * Used for "jump to comment" functionality.
 *
 * @param commentScrollY - Scroll position when comment was created (pixels)
 * @returns Target scroll position to show the comment
 */
export function calculateScrollToComment(
    commentScrollY: number | undefined
): number {
    // Simply scroll to where the comment was created
    // This will position the comment at the same viewport position it was placed
    return commentScrollY ?? 0
}
