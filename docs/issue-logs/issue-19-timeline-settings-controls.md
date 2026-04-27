# Issue #19: Timeline scale and start-hour controls

## Symptom

The settings modal only allowed fixed zoom buttons and a two-state timeline start toggle.

## Root cause

`useViewOptions` stored zoom as a fixed union and stored the start position as `startAtMidnight`, which limited the UI to preset buttons.

## Fix

- Changed zoom to a numeric value from `75` to `200` in `5` percent steps.
- Replaced fixed zoom buttons with a range slider.
- Replaced `startAtMidnight` with `startHour`.
- Added a start-hour select covering `0:00` through `12:00`.
- Kept timeline drag, quick-add, and rendering calculations based on `viewStartMin`, so existing interactions continue to use the same coordinate model.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- In-app browser: confirmed the settings modal shows a scale slider and a `0:00` to `12:00` start-hour select.
