# Issue #21: Inline day-count controls up to 31 days

## Symptom

The number of visible days was controlled by fixed view-mode buttons in the settings modal.

## Root cause

The view state used a `day | 3days | week` mode instead of a numeric day count.

## Fix

- Replaced `viewMode` with `visibleDayCount`.
- Clamped visible days from `1` to `31`.
- Added inline `-` and `+` controls in the sticky date header area.
- Removed fixed view-mode buttons from the settings modal.
- Preserved one-day date navigation from the floating previous/today/next controls.
- Allowed horizontal timeline scrolling once more than seven days are visible, while keeping day columns wide enough to remain usable.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- In-app browser: confirmed the header controls clamp at `31`, the `+` button disables at the maximum, holiday headers still render, and horizontal scrolling remains available.
