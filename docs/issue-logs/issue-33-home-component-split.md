# Issue #33: Split Home Component Responsibilities

## Symptom

`app/page.tsx` owned top-level app state, settings UI, calendar UI, JSON import/export, swipe navigation, pinch zoom, and event editing glue in one large component. This made future review and regression checks harder.

## Root Cause

Feature work had accumulated in `Home` because shared controls and interaction logic were implemented inline instead of behind focused component or hook boundaries.

## Fix

- Moved the calendar popover and month calendar helpers into `components/CalendarPopover.tsx`.
- Moved settings dialog rendering into `components/SettingsDialog.tsx`.
- Moved floating date, settings, and zoom controls into `components/FloatingControls.tsx`.
- Moved JSON import/export state and file input handling into `hooks/useJsonTransfer.ts`.
- Moved swipe navigation and pinch zoom pointer handling into `hooks/useSwipeNavigation.ts`.
- Kept `Home` focused on state wiring, event CRUD glue, and the main `WeekGrid` layout.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
