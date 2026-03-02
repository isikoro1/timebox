# Timebox

A minimal timeboxing web application focused on structured time management.

No registration required. Completely free to use.

🇯🇵 [日本語版はこちら](README_JA.md)

---

## 🔗 Live Demo

https://isikoro1.github.io/timebox/

---

## 🧭 Concept

Inspired by the timeboxing method popularized by Elon Musk,  
this tool is designed to enforce focused work sessions.

Time is normalized in **15-minute blocks**.

- 1 block = 15 minutes
- Drag & resize snaps to 15-minute intervals
- Tasks can be rescheduled to later slots if unfinished
- Visual current-time indicator

The goal is to maximize focus through strict time boundaries.

---

## ✨ Features

- Weekly / 3-day view toggle
- Double-click to create events
- Drag to move (time & day)
- Resize by dragging edges (15-min snapping)
- Current time indicator
- Event detail editing
- URL link support
- Alarm (works while tab is open)

---

## 🏗 Architecture

### Serverless Design

- No authentication
- No database
- Fully static export
- Data stored in browser `localStorage`

Deployed via GitHub Pages.

---

### Time Management Logic

- Time stored internally in minutes
- UI normalized to 15-minute snapping
- Drag position → minute conversion → state normalization

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Static Export (`output: "export"`)
- GitHub Pages

---

## 🚀 Future Improvements

- JSON Export / Import
- 5-minute mode
- 25-minute (Pomodoro) mode
- Adjustable zoom levels
- Day-only view
- Alarm precision improvements
- OSS support (issues & contributions)

---

## 📄 License

MIT