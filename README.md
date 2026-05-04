# Timebox

A minimal timeboxing web application for planning work in fixed time blocks.

No account is required. Data is stored locally in your browser.

[Japanese version](README_JA.md)

## Live Demo

https://isikoro1.github.io/timebox/

## Concept

Timebox is built around a simple rule: plan the day on a calendar-like timeline and keep work inside clear time boundaries.

The current UI uses **15-minute blocks** as the editing unit.

- 1 block = 15 minutes
- Double-click an empty slot to add an event
- Drag an event to move it across time and dates
- Resize events with 15-minute snapping
- View the current time line on today's column

## Features

- Date-based scheduling
- Up to 31 visible days with horizontal scrolling
- Calendar popover for date navigation
- Japanese era year and Japanese holiday labels
- Current time indicator
- Event detail editing with label, memo, and URLs
- Clickable URL link from event blocks
- JSON export and import for backup or transfer
- Alarm notifications while the tab is open
- Touch swipe navigation and pinch zoom support

## Architecture

### Serverless Design

- No authentication
- No database
- Static export for GitHub Pages
- Event data is stored in browser `localStorage`

### Time Management Logic

- Times are stored internally as minutes from midnight
- UI editing snaps to 15-minute intervals
- Drag and resize operations convert pointer position into normalized minutes
- Legacy weekday-based data can be migrated to date-based events

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Static export (`output: "export"`)
- GitHub Pages

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```

## Future Improvements

- Add automated tests for date, time, and storage logic
- Persist view settings such as start hour and zoom level
- Improve event layout when three or more events overlap
- Improve alarm status visibility and test controls
- Research login-free cross-device sync options

## License

MIT
