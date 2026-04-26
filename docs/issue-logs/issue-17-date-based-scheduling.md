# Issue #17: Date-based scheduling

## Symptom

The planner stored events by weekday index (`0` to `6`), so schedules behaved like a reusable weekly template rather than real calendar dates.

## Root cause

The event model, visible range calculation, drag handling, quick-add flow, import validation, and alarm matching all used `dayIndex` as the event's day identity.

## Fix

- Added date utilities for local `YYYY-MM-DD` keys, date arithmetic, week starts, and header labels.
- Replaced event identity from `dayIndex` to `dateKey`.
- Updated the timeline grid, columns, drag/drop movement, quick-add modal, event details, and alarms to use actual dates.
- Added legacy import/localStorage migration from `dayIndex` to the current week date so existing data can still load.
- Updated JSON validation to accept real `YYYY-MM-DD` dates and reject invalid date strings.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Reloaded the app in the in-app browser and confirmed the timeline headers show date labels such as `Mon 4/20` and `Sun 4/26`.
