# Issue #38: Overlap Layout for Three or More Events

## Symptom

When three or more events overlapped in the same day column, the layout still collapsed them into two lanes. Some events could cover each other or become difficult to select.

## Root Cause

`WeekGrid` used a local two-lane layout helper, while `components/week/layout.ts` also had an older two-lane helper. Both models capped `lanesCount` at 2.

## Fix

- Replaced the two-lane helper with `computeOverlapLayout`, which assigns as many lanes as an overlap group needs.
- Shared `LayoutInfo` from `components/week/layout.ts` so the grid and event block use the same layout contract.
- Updated `EventBlock` width calculation to divide the available column width across any number of lanes.
- Removed completed Future Improvements entries from the English README.

## Verification

- `npm run lint`
- `npm run build`
