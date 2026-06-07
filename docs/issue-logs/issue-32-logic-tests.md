# Issue #32: Logic Layer Tests

## Symptom

Core scheduling data could regress without a focused test catching it. Time formatting, minute snapping, event import validation, and legacy `dayIndex` migration all sit below the UI, so failures could surface as corrupted schedule data later.

## Root cause

The project already had build and lint coverage plus some date/alarm tests, but `lib/time.ts` and `lib/storage.ts` still lacked direct normal and error-path coverage.

## Fix

- Added tests for `pad2`, `minToHHMM`, `clamp`, and `snap`.
- Added storage tests for `safeParse`, event validation, optional field normalization, JSON import rejection, and legacy `dayIndex` migration.
- Added this issue log and restored the issue log README text so the test coverage change is discoverable.

## Verification

- `npm test`
- `npm run lint`
- `npm run build`
