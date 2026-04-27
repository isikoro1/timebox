# Issue #18: Month, Japanese era, and holiday labels

## Symptom

The timeline header showed dates but did not include a calendar-aware month label, Japanese era year, or Japanese public holiday labels.

## Root cause

The date utilities only formatted weekday and month/day strings. There was no local calendar metadata layer for era names or public holidays.

## Fix

- Added local Japanese calendar helpers for era-year labels.
- Added Japanese public holiday calculation for fixed holidays, happy Monday holidays, equinox holidays, substitute holidays, and citizen holidays.
- Updated the floating month label to show a month/year plus Japanese era year, for example `April 2026 (令和8年)`.
- Added holiday labels to each date header when a visible date is a Japanese public holiday.

## Notes

Holiday labels are calculated locally from current public holiday rules and do not call an external API. If Japan changes holiday law in the future, the local helper must be updated.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- In-app browser: confirmed `April 2026 (令和8年)`, `昭和の日`, `憲法記念日`, `みどりの日`, `こどもの日`, and `振替休日` render in the timeline header.
