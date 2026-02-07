# Hánzì Architect

A desktop application designed to deconstruct Chinese characters into their
fundamental radicals and stroke patterns.

## Why this project?

I’m building this to explore the "Local-first" software movement. By using
**Tauri v2** and **SQLite**, the app provides a lightning-fast experience that
works entirely offline, bypassing the latency of traditional web APIs.

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS 4
- **Backend:** Tauri v2 (Rust)
- **Database:** SQLite (Better-SQLite3 for seeding)

## 🚀 Getting Started

1. **Prerequisites:** Install [Node.js] and the [Rust toolchain]
   (https://nodejs.org/) (https://rustup.rs/).
2. **Install Dependencies:** Run `npm install`.
3. **Launch Environment:** Run `npm run tauri dev`.

> **Note:** Since this is a Tauri app, a native desktop window will launch
> separately from your browser.

## 🏗 Current Progress

- [x] Next.js 15 + Tauri v2 Bridge established.
- [x] Rust-to-JS command "Smoke Test" passing.
- [ ] Initial SQLite schema designed.
- [ ] Data parsing and seeding (In Progress).
