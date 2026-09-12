# 🌿 HabitTrack — Mindful Habit Tracker & Multiplayer Growth OS

> A beautifully crafted, zero-friction habit tracker and personal growth dashboard featuring authentic real-time leaderboards, routine stacking, focus soundscapes, streak protection, and multi-theme customization.

![HabitTrack](https://img.shields.io/badge/React-18-blue.svg)
![Database](https://img.shields.io/badge/Database-Supabase-green.svg)
![Design](https://img.shields.io/badge/Design-Mindful%20Organic-orange.svg)
![License](https://img.shields.io/badge/License-MIT-purple.svg)

---

## ✨ Features at a Glance

### 1. 📅 Mindful Daily Dashboard & Routine Stacking
- **Atomic Habits Routine Stacking**: Organize habits by time of day (🌅 Morning, ☀️ Afternoon, 🌙 Evening, ⭐ Anytime).
- **One-Click Routine Filtering**: Filter tasks by active time-of-day chunks with live counter badges.
- **Micro-Delight Feedback**: Built-in acoustic checkmark pops using native Web Audio API (zero audio files needed) and a full physics-simulated confetti shower upon completing 100% of your daily habits.

### 2. 🏆 Real-Time Authentic Leaderboard (Zero Bots)
- **100% Real Members**: Strictly zero simulated bots or fake users. Displays only genuine registered accounts.
- **Live Streak Synchronization**: Real-time cross-tab updates via storage events and live Supabase Realtime channel subscriptions.
- **Multi-Metric Rankings**: View rankings by **Active Current Streak** or **All-Time Longest Streak**.
- **Interactive Podium**: 1st (Gold Crown 👑), 2nd (Silver 🥈), and 3rd (Bronze 🥉) place showcase with 1-click Friend Code copying.

### 3. 🛡️ Streak Shield & Freeze Mechanic
- **Momentum Protection**: Automatically shields missed days so sickness or travel doesn't erase hard-earned streaks.
- **Consistency Milestones**: Earn +1 Streak Shield every 7 consecutive days of habit adherence (up to 3 max).

### 4. 🎨 Dynamic Multi-Theme Engine
Switch effortlessly between 4 tailored color palettes to match your environment:
- **🏜️ Warm Sand**: Calming organic parchment and cream tones.
- **🌌 Midnight Dark**: Pure dark mode optimized for OLED screens and late-night reflection.
- **🌲 Forest Moss**: Grounding evergreen and deep moss hues inspired by nature.
- **🔮 Twilight Violet**: Subtle celestial violet and lavender tones for mindful contemplation.

### 5. ⚔️ Multiplayer Friend Challenges (Streak Battles)
- Challenge friends using their 6-character unique Friend Code (#ALICE7, #BOB888).
- Real-time head-to-head streak races with completion tracking.

### 6. ⏱️ Focus Timer & Ambient Soundscapes
- Built-in Pomodoro/Focus timer with adjustable session intervals.
- Integrated ambient audio generators (Rain, Waves, White Noise).
- Link focus sessions directly to specific habits or todos.

### 7. 📖 Reflective Daily Journal & Leftover Rollover
- Daily mindfulness journal with mood tagging and automatic word counters.
- Unfinished tasks from previous days automatically roll over so nothing slips through the cracks.

### 8. ☁️ Supabase Cloud Sync & Local-First Resilience
- Works 100% offline out-of-the-box using local storage.
- Optional 1-click connection to Supabase for seamless multi-device cloud backup and real-time syncing.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari).
- Python 3 (standard on Windows/macOS/Linux) or any static HTTP server.

### Option 1: Double-Click Batch File (Windows)
Double-click 
un_server.bat in the project folder. It will launch a local server and open:
`
http://localhost:8080
`

### Option 2: Command Line (Any OS)
Run the following command inside the project directory:
`ash
python -m http.server 8080
`
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📁 Project Structure

`
├── index.html          # Clean HTML shell loading React 18, Babel Standalone & SDKs
├── app.jsx             # Complete React application (Components, Theme Engine, State)
├── schema.sql          # Supabase SQL schema for cloud database & real-time sync
├── run_server.bat      # 1-click Windows launcher for local HTTP server
├── .gitignore          # Git exclusion rules for clean repository tracking
└── README.md           # Documentation & feature guide
`

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Standalone via Babel), Vanilla CSS-in-JS design system.
- **Audio Engine**: Web Audio API (Synthesized acoustic chimes & pops).
- **Celebration Effects**: Canvas Confetti.
- **Cloud Backend**: Supabase (PostgreSQL, Realtime subscriptions, KV store).
- **Email Delivery**: EmailJS v4 SDK (One-time password / login verification).

---

## 📄 License
MIT License — feel free to use, modify, and build upon this project!
