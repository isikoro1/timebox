# Issue #36: Alarm Status and Test Controls

## Symptom

The alarm settings could enable alarms and request notification permission, but users could not clearly see whether alarms were enabled, what the browser notification permission was, or which event would fire next.

## Root Cause

`useAlarm` already exposed the next scheduled alarm and a test sound action, but the settings UI only surfaced the enable checkbox, lead minutes, and a generic notification permission button. The hook also exposed permission as a boolean, which was not enough to distinguish `granted`, `denied`, and `default`.

## Fix

- Added `notificationPermission` to `useAlarm`, preserving the existing `hasNotificationPermission` boolean for compatibility.
- Added alarm status, notification permission, and next alarm summary rows to the settings modal.
- Added a user-triggered `Test sound` button.
- Renamed the notification permission action to `Request notification`.

## Verification

- `npm run lint`
- `npm run build`

