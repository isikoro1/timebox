# Issue #34: Persist View Options

## Symptom

The timeline start hour, vertical zoom, horizontal day width zoom, and focused date reset to defaults after reloading the app.

## Root Cause

Event data was persisted in localStorage, but `useViewOptions` kept view preferences only in React state.

## Fix

- Added a dedicated `timeboxing-tool:v1:view-options` localStorage key.
- Restored saved view options when `useViewOptions` mounts on the client.
- Persisted `startHour`, `zoom`, `dayWidthZoom`, and `centerDateKey` after the initial load.
- Clamped numeric settings to their supported ranges and ignored invalid stored dates or broken JSON.

## Verification

- `npm run lint`
- `npm run build`

