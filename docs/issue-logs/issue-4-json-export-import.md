# Issue #4: JSON export / import

## User-visible symptom

Users could only persist events in `localStorage`, so there was no way to back up or move data between browsers.

## Root cause

The app loaded and saved event data exclusively through the `useTimeboxingItems` hook, and there was no validation path for external JSON payloads.

## Fix

- Added `Export JSON` and `Import JSON` controls to the main header.
- Added JSON parsing and event-shape validation in `lib/storage.ts`.
- Sanitized imported items so optional fields fall back to safe defaults.
- Kept `localStorage` as the default persistence path after import.

## Verification

- `cmd /c npm run lint`
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run build`
