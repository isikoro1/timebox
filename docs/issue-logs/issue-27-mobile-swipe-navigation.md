# Issue #27: Mobile swipe date navigation

## Symptom

Mobile users needed a natural way to move dates by swiping the timeline, without losing normal vertical scrolling or breaking event manipulation.

## Root cause

Date navigation was only available through fixed buttons, and touch gestures on the timeline were not interpreted as date navigation. The bottom navigation also competed for screen space on small viewports.

## Fix

- Added touch-only pointer gesture tracking around the timeline.
- Moved to the previous or next date when a quick horizontal swipe or mouse drag starts on timeline empty space.
- Cancelled swipe navigation once vertical movement clearly indicates timeline scrolling.
- Ignored swipe starts from buttons, inputs, links, selects, textareas, and event blocks.
- Hid the bottom previous/next buttons on mobile and kept them available from the `sm` breakpoint upward.
- Replaced visible-day count controls with top-row horizontal and vertical zoom buttons.
- Rendered a fixed 31-day range so users can scroll horizontally to nearby dates.
- Added two-finger pinch zoom on the timeline to scale both day width and timeline height together.
- Highlighted Saturdays, Sundays, and Japanese holidays in the header and day columns.
- Lowered the current-time line layer so it no longer overlaps the sticky date header text.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- In-app browser: confirmed the timeline still renders cleanly after the navigation control changes.
- In-app browser: confirmed mouse dragging timeline empty space moves the date range.
- In-app browser: confirmed weekend and holiday columns are visually distinct and the current-time line stays below the sticky header.
- Code path check: confirmed swipe navigation ignores interactive targets, cancels on vertical movement, supports mouse and touch pointers, and leaves event-block pointer handlers untouched.
