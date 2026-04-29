# Issue #27: Mobile swipe date navigation

## Symptom

Mobile users needed a natural way to move dates by swiping the timeline, without losing normal vertical scrolling or breaking event manipulation.

## Root cause

Date navigation was only available through fixed buttons, and touch gestures on the timeline were not interpreted as date navigation. The bottom navigation also competed for screen space on small viewports.

## Fix

- Added touch-only pointer gesture tracking around the timeline.
- Moved to the previous or next date when a quick horizontal swipe starts on timeline empty space.
- Cancelled swipe navigation once vertical movement clearly indicates timeline scrolling.
- Ignored swipe starts from buttons, inputs, links, selects, textareas, and event blocks.
- Hid the bottom previous/next buttons on mobile and kept them available from the `sm` breakpoint upward.
- Kept visible-day controls outside the sticky timeline header so they do not interfere with the scrollable grid.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- In-app browser: confirmed the timeline still renders cleanly after the navigation control changes.
- Code path check: confirmed swipe navigation is touch-only, ignores interactive targets, cancels on vertical movement, and leaves event-block pointer handlers untouched.
