# Issue #10: Timeline layout and view modes

## User-visible symptom

The timeline only supported week and 3-day layouts, had no zoom control, and the weekday header scrolled out of view during long schedules.

## Root cause

View configuration was limited to a compact toggle plus two layout modes, and the grid/header were rendered as one non-sticky block.

## Fix

- Replaced the compact height toggle with explicit zoom levels: `100%`, `150%`, and `200%`.
- Added a dedicated `1 day` view mode alongside the existing `3 days` and `week` modes.
- Moved the planner into a fixed-height layout so the title and controls remain visible while the grid scrolls.
- Made the weekday header sticky inside the scrollable timeline area.
- Added a minimum per-day column width so week mode remains readable on narrow screens, with horizontal scrolling when needed.

## Verification

- `cmd /c npm run lint`
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run build`
