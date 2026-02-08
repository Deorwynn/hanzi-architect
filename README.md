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

- **Architectural UI:** A "Blueprint" themed interface focused on clarity and
  structural analysis.
- **IPC Bridge:** High-performance asynchronous communication between Next.js
  and Rust.
- **Type Safety:** Shared TypeScript interfaces ensuring data integrity from
  database to display.

## 🏗 Current Progress

- [x] Next.js 15 + Tauri v2 Bridge established.
- [x] SQLite schema designed and 9,500+ records seeded.
- [x] Robust Rust-side path resolution for dev/prod environments.
- [x] Metadata visualization system (MetadataCard UI).
- [ ] Character Hero Showcase (In Progress).
- [ ] LocalStorage-based search history.
- [ ] Character component decomposition.
