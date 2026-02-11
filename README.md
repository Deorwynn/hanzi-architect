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

## Project Structure

### 📂 Data & Persistence

- **Source Data:** `data/dictionary.txt` is included to facilitate the initial
  database seeding.
- **Local-First Philosophy:** The application is designed to be fully functional
  offline. By shipping with a pre-populated SQLite database, users have instant
  access to 9,500+ character decompositions without needing an internet
  connection or external API calls.

## 🚀 Getting Started

1. **Prerequisites:** Install [Node.js] and the [Rust toolchain]
   (https://nodejs.org/) (https://rustup.rs/).
2. **Install Dependencies:** Run `npm install`.
3. **Launch Environment:** Run `npm run tauri dev`.

> **Note:** Since this is a Tauri app, a native desktop window will launch
> separately from your browser.

## ✨ Key Features

- **Architectural UI:** A "Blueprint" themed interface utilizing Tailwind CSS 4,
  focused on structural analysis and technical clarity.
- **Pan-CJK Typography:** Full support for Simplified and Traditional character
  sets via integrated Noto Serif SC/TC.
- **Session Persistence:** LocalStorage-backed session restoration and a rolling
  10-item search history.
- **IPC Bridge:** High-performance asynchronous communication between Next.js
  and Rust via Tauri's command system.

## 🏗 Roadmap & Progress

- [x] Next.js 15 + Tauri v2 Bridge established.
- [x] SQLite schema designed and 9,500+ records seeded.
- [x] Pan-CJK Typography implementation (Noto Serif).
- [x] LocalStorage-based search history & session persistence.
- [ ] **Next:** HSK Level integration and database migration (HAN-11).
- [ ] **Next:** Radical Discovery System (Explorer view).
- [ ] Stroke order animation and SVG-based decomposition.
