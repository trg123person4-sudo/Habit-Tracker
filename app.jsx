// Destructure React hooks from window.React for Babel standalone browser compatibility
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// =========================================================================
// CRYPTOGRAPHIC & SECURITY UTILITIES
// =========================================================================
const AUTH_PASSWORD_SALT = "ht_v2_salt_secure_auth";

async function hashPassword(plainPassword, salt = AUTH_PASSWORD_SALT) {
  if (!plainPassword) return "";
  const rawStr = String(plainPassword);
  // If already a valid 64-character SHA-256 hex string, return as is
  if (/^[a-f0-9]{64}$/i.test(rawStr)) return rawStr.toLowerCase();
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(salt + ":" + rawStr);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {}
  // Deterministic fallback for non-crypto contexts
  let hash = 0;
  const str = salt + ":" + rawStr;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "h_" + Math.abs(hash).toString(16).padStart(8, "0");
}

function getSecureRandomInt(min, max) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const range = max - min + 1;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    let rand;
    const arr = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(arr);
      rand = arr[0];
    } while (rand >= limit);
    return min + (rand % range);
  }
  return Math.floor(min + Math.random() * (max - min + 1));
}

const PALETTE = [
  { name: "sage", hex: "#7C9473" },
  { name: "amber", hex: "#C08A2E" },
  { name: "clay", hex: "#B0654A" },
  { name: "slate", hex: "#5B7A8C" },
  { name: "plum", hex: "#7A5C82" },
  { name: "emerald", hex: "#2E7D5B" },
  { name: "terracotta", hex: "#C46243" },
  { name: "navy", hex: "#3A506B" },
];

const MINIMAL_ICONS = {
  sparkle: {
    label: "Sparkle",
    svg: <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />,
  },
  book: {
    label: "Reading",
    svg: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
  },
  water: {
    label: "Water",
    svg: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  },
  run: {
    label: "Running",
    svg: (
      <>
        <circle cx="15" cy="5" r="2" />
        <path d="M8 21l3-6 3 2 3-4" />
        <path d="M15 9l-4 3-4-2" />
      </>
    ),
  },
  dumbbell: {
    label: "Workout",
    svg: <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />,
  },
  zen: {
    label: "Meditation",
    svg: <path d="M12 3c0 5-4 8-8 9 4 1 8 4 8 9 0-5 4-8 8-9-4-1-8-4-8-9z" />,
  },
  moon: {
    label: "Sleep",
    svg: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  },
  sun: {
    label: "Morning",
    svg: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </>
    ),
  },
  leaf: {
    label: "Plant",
    svg: (
      <>
        <path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-10 16z" />
        <path d="M4 20l7-7" />
      </>
    ),
  },
  pen: {
    label: "Writing",
    svg: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  },
  heart: {
    label: "Health",
    svg: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  },
  target: {
    label: "Focus",
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  coffee: {
    label: "Coffee",
    svg: <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />,
  },
  laptop: {
    label: "Work",
    svg: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M2 20h20" />
      </>
    ),
  },
  apple: {
    label: "Nutrition",
    svg: (
      <>
        <path d="M12 4c.5-1.5 2-2.5 3-2.5" />
        <path d="M12 6a5.5 5.5 0 0 0-4-2c-3 0-5 3-5 6.5 0 4.5 3.5 9 6.5 10.5 1 .5 2 .5 3 0 3-1.5 6.5-6 6.5-10.5 0-3.5-2-6.5-5-6.5a5.5 5.5 0 0 0-2 2z" />
      </>
    ),
  },
  bike: {
    label: "Cycling",
    svg: (
      <>
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6h3l3 8M5.5 17.5L9 11l4.5 6.5M12 11h4" />
      </>
    ),
  },
  music: {
    label: "Music",
    svg: (
      <>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
  },
  palette: {
    label: "Art",
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="8" cy="10" r="1.5" />
        <circle cx="12" cy="7" r="1.5" />
        <circle cx="16" cy="10" r="1.5" />
        <circle cx="14" cy="15" r="1.5" />
      </>
    ),
  },
  walk: {
    label: "Steps",
    svg: (
      <>
        <path d="M13 4v4l3 3M7 20l4-7 2 2 3-5" />
        <circle cx="11" cy="4" r="2" />
      </>
    ),
  },
  brain: {
    label: "Mind",
    svg: <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 .6.1 1.1.3 1.6A4.5 4.5 0 0 0 4 12a4.5 4.5 0 0 0 1.5 3.4 4.5 4.5 0 0 0 4 6.6c.7 0 1.4-.2 2-.5M14.5 2A4.5 4.5 0 0 1 19 6.5c0 .6-.1 1.1-.3 1.6A4.5 4.5 0 0 1 20 12a4.5 4.5 0 0 1-1.5 3.4 4.5 4.5 0 0 1-4 6.6c-.7 0-1.4-.2-2-.5" />,
  },
  pill: {
    label: "Vitamins",
    svg: (
      <>
        <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
        <path d="M8.5 8.5l7 7" />
      </>
    ),
  },
  smile: {
    label: "Mood",
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  check: {
    label: "Discipline",
    svg: <polyline points="20 6 9 17 4 12" />,
  },
  clock: {
    label: "Routine",
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  // Special UI badges
  flame: {
    label: "Streak",
    svg: <path d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5c0-2-1.5-3-2.5-4.5C12 8.5 12 7 12 5c-1.5 2-3.5 4-3.5 6.5 0 .9.3 1.7.8 2.3-.5.2-.8.5-.8.7z" />,
  },
  bell: {
    label: "Reminder",
    svg: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  },
  calendar: {
    label: "Calendar",
    svg: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  tag: {
    label: "Tag",
    svg: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
      </>
    ),
  },
  trophy: {
    label: "Trophy",
    svg: (
      <>
        <path d="M6 9V2h12v7a6 6 0 0 1-12 0z" />
        <path d="M6 5H2a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h2" />
        <path d="M18 5h4a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-2" />
        <path d="M12 15v5" />
        <path d="M8 22h8" />
      </>
    ),
  },
  users: {
    label: "Friends",
    svg: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  swords: {
    label: "Challenge",
    svg: (
      <>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </>
    ),
  },
  share: {
    label: "Share",
    svg: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </>
    ),
  },
  inbox: {
    label: "Mailbox",
    svg: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </>
    ),
  },
  mail: {
    label: "Mail",
    svg: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
  },
  grid: {
    label: "Dashboard",
    svg: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  checkCircle: {
    label: "Habits",
    svg: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
  list: {
    label: "Todos",
    svg: (
      <>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </>
    ),
  },
  timer: {
    label: "Timer",
    svg: (
      <>
        <circle cx="12" cy="13" r="8" />
        <polyline points="12 9 12 13 15 15" />
        <path d="M12 2v3M9 2h6" />
      </>
    ),
  },
  journal: {
    label: "Journal",
    svg: (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
  },
  ranks: {
    label: "Leaderboard",
    svg: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  shield: {
    label: "Admin",
    svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  crown: {
    label: "Crown",
    svg: <polygon points="2 4 5 20 19 20 22 4 15 10 12 2 9 10 2 4" fill="currentColor" stroke="none" />,
  },
  plus: {
    label: "Add",
    svg: <path d="M12 5v14M5 12h14" />,
  },
  signOut: {
    label: "Sign Out",
    svg: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  },
  pieChart: {
    label: "Breakdown",
    svg: (
      <>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </>
    ),
  },
  barChart: {
    label: "Trends",
    svg: (
      <>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </>
    ),
  },
  archive: {
    label: "Archive",
    svg: (
      <>
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </>
    ),
  },
  download: {
    label: "Download",
    svg: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
  },
  database: {
    label: "Database",
    svg: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </>
    ),
  },
  cloud: {
    label: "Cloud",
    svg: (
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    ),
  },
  gear: {
    label: "Settings",
    svg: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
};

const HABIT_ICONS = [
  "sparkle", "book", "water", "run", "dumbbell", "zen",
  "moon", "sun", "leaf", "pen", "heart", "target",
  "coffee", "laptop", "apple", "bike", "music", "palette",
  "walk", "brain", "pill", "smile", "check", "clock"
];

const EMOJI_TO_ICON_MAP = {
  "🏃": "run",
  "🧘": "zen",
  "💧": "water",
  "📚": "book",
  "🏋️": "dumbbell",
  "✍️": "pen",
  "🍎": "apple",
  "💤": "moon",
  "💻": "laptop",
  "🎯": "target",
  "🌿": "leaf",
  "💊": "pill",
  "🚴": "bike",
  "🧹": "sparkle",
  "🎨": "palette",
  "🎵": "music",
  "🚶": "walk",
  "🌅": "sun",
  "🧠": "brain",
  "☕": "coffee",
  "🥑": "apple",
  "🤝": "heart",
  "💰": "sparkle",
  "✨": "sparkle",
  "🙂": "smile",
  "🔥": "flame",
  "🔔": "bell",
  "📅": "calendar",
  "🏷️": "tag",
  "🏆": "trophy",
  "👥": "users",
  "⚔️": "swords",
  "⚡": "swords",
  "🔗": "share",
  "📦": "archive",
  "📥": "download",
};

/* =========================================================================
   HABIT TEMPLATES BUNDLES (Pre-built starter routines)
   ========================================================================= */
const HABIT_TEMPLATES = [
  {
    id: "tpl_water",
    name: "Hydrate 2.5L Water",
    category: "Health & Fitness",
    icon: "water",
    color: "#5B7A8C",
    frequencyType: "everyday",
    description: "Drink pure water consistently throughout the day for clear energy.",
  },
  {
    id: "tpl_read",
    name: "Read 20 Pages",
    category: "Learning",
    icon: "book",
    color: "#B0654A",
    frequencyType: "everyday",
    description: "Deepen focus, gain fresh knowledge, and calm the evening mind.",
  },
  {
    id: "tpl_meditate",
    name: "10m Morning Stillness",
    category: "Mind & Wellness",
    icon: "zen",
    color: "#7C9473",
    frequencyType: "everyday",
    description: "Centered breathing and silent presence before opening any screens.",
  },
  {
    id: "tpl_workout",
    name: "30m Movement & Cardio",
    category: "Health & Fitness",
    icon: "run",
    color: "#C46243",
    frequencyType: "everyday",
    description: "Cardio, brisk walk, or calisthenics to awaken physical vitality.",
  },
  {
    id: "tpl_sunset",
    name: "Digital Sunset at 10 PM",
    category: "Mind & Wellness",
    icon: "moon",
    color: "#7A5C82",
    frequencyType: "everyday",
    description: "Disconnect devices 1 hour before bed to protect natural sleep rhythms.",
  },
  {
    id: "tpl_deepwork",
    name: "Deep Focus 45m Block",
    category: "Productivity",
    icon: "sparkle",
    color: "#C08A2E",
    frequencyType: "everyday",
    description: "Single-task with unwavering attention on high-impact work.",
  },
];

/* =========================================================================
   ACHIEVEMENTS & BADGES DEFINITIONS
   ========================================================================= */
const BADGE_DEFINITIONS = [
  {
    id: "first_step",
    title: "First Step",
    description: "Complete your very first habit check-in.",
    icon: "sparkle",
    badgeColor: "#7C9473",
    check: (s) => s.totalCompletions >= 1,
    progress: (s) => Math.min(100, Math.round((s.totalCompletions / 1) * 100)),
    targetText: "1 check-in",
    currentVal: (s) => s.totalCompletions,
  },
  {
    id: "streak_3",
    title: "Spark Ignition",
    description: "Reach an unbroken 3-day streak on any habit.",
    icon: "flame",
    badgeColor: "#C08A2E",
    check: (s) => s.maxStreak >= 3,
    progress: (s) => Math.min(100, Math.round((s.maxStreak / 3) * 100)),
    targetText: "3-day streak",
    currentVal: (s) => `${s.maxStreak}d`,
  },
  {
    id: "streak_7",
    title: "Unstoppable Week",
    description: "Maintain a flawless 7-day streak on a habit.",
    icon: "trophy",
    badgeColor: "#C46243",
    check: (s) => s.maxStreak >= 7,
    progress: (s) => Math.min(100, Math.round((s.maxStreak / 7) * 100)),
    targetText: "7-day streak",
    currentVal: (s) => `${s.maxStreak}d`,
  },
  {
    id: "streak_30",
    title: "Iron Will",
    description: "Achieve a legendary 30-day streak milestone.",
    icon: "crown",
    badgeColor: "#7A5C82",
    check: (s) => s.maxStreak >= 30,
    progress: (s) => Math.min(100, Math.round((s.maxStreak / 30) * 100)),
    targetText: "30-day streak",
    currentVal: (s) => `${s.maxStreak}d`,
  },
  {
    id: "century_100",
    title: "Century Club",
    description: "Complete 100 total habit check-ins all-time.",
    icon: "checkCircle",
    badgeColor: "#2E7D5B",
    check: (s) => s.totalCompletions >= 100,
    progress: (s) => Math.min(100, Math.round((s.totalCompletions / 100) * 100)),
    targetText: "100 check-ins",
    currentVal: (s) => s.totalCompletions,
  },
  {
    id: "focus_monk",
    title: "Focus Monk",
    description: "Complete 5 Pomodoro focus sessions.",
    icon: "timer",
    badgeColor: "#5B7A8C",
    check: (s) => s.timerSessionsCount >= 5,
    progress: (s) => Math.min(100, Math.round((s.timerSessionsCount / 5) * 100)),
    targetText: "5 focus sessions",
    currentVal: (s) => s.timerSessionsCount,
  },
  {
    id: "mindful_scribe",
    title: "Mindful Scribe",
    description: "Write at least 3 daily reflections in your Journal.",
    icon: "journal",
    badgeColor: "#3A506B",
    check: (s) => s.journalCount >= 3,
    progress: (s) => Math.min(100, Math.round((s.journalCount / 3) * 100)),
    targetText: "3 reflections",
    currentVal: (s) => s.journalCount,
  },
  {
    id: "task_master",
    title: "Task Finisher",
    description: "Check off 5 actionable todos from your list.",
    icon: "list",
    badgeColor: "#B0654A",
    check: (s) => s.completedTodosCount >= 5,
    progress: (s) => Math.min(100, Math.round((s.completedTodosCount / 5) * 100)),
    targetText: "5 completed todos",
    currentVal: (s) => s.completedTodosCount,
  },
  {
    id: "habit_architect",
    title: "Habit Architect",
    description: "Create an intentional routine with 4 active habits.",
    icon: "grid",
    badgeColor: "#7C9473",
    check: (s) => s.activeHabitsCount >= 4,
    progress: (s) => Math.min(100, Math.round((s.activeHabitsCount / 4) * 100)),
    targetText: "4 active habits",
    currentVal: (s) => s.activeHabitsCount,
  },
  {
    id: "arena_challenger",
    title: "Battle Ready",
    description: "Participate in or send a friend streak challenge.",
    icon: "swords",
    badgeColor: "#C08A2E",
    check: (s) => s.challengesCount >= 1,
    progress: (s) => Math.min(100, Math.round((s.challengesCount / 1) * 100)),
    targetText: "1 challenge",
    currentVal: (s) => s.challengesCount,
  },
];

function computeBadgeStats({
  habits = [],
  completions = {},
  todos = [],
  journal = {},
  timerSessions = [],
  challenges = [],
  currentUser = null,
}) {
  let totalCompletions = 0;
  if (completions && typeof completions === "object") {
    Object.values(completions).forEach((dayMap) => {
      if (dayMap && typeof dayMap === "object") {
        Object.values(dayMap).forEach((val) => {
          if (val) totalCompletions++;
        });
      }
    });
  }

  let maxStreak = 0;
  (habits || []).forEach((h) => {
    try {
      const s = computeStreak(completions, h);
      if (s > maxStreak) maxStreak = s;
    } catch (e) {}
  });

  const timerSessionsCount = Array.isArray(timerSessions) ? timerSessions.length : 0;
  const journalCount = Object.keys(journal || {}).length;
  const completedTodosCount = (todos || []).filter((t) => t.completed).length;
  const activeHabitsCount = (habits || []).filter((h) => !h.archived).length;

  const userChallenges = (challenges || []).filter((c) => {
    return isChallengeForUser(c, currentUser) || isChallengeFromUser(c, currentUser);
  });
  const challengesCount = userChallenges.length;

  return {
    totalCompletions,
    maxStreak,
    timerSessionsCount,
    journalCount,
    completedTodosCount,
    activeHabitsCount,
    challengesCount,
  };
}

/* =========================================================================
   DATA EXPORT HELPERS (JSON & CSV)
   ========================================================================= */
function exportDataAsJSON({
  currentUser,
  habits = [],
  completions = {},
  todos = [],
  journal = {},
  timerSessions = [],
  challenges = [],
}) {
  const exportPayload = {
    app: "Mindful Habit Tracker",
    version: "2.1",
    exportedAt: new Date().toISOString(),
    user: {
      username: currentUser?.username || "User",
      email: currentUser?.identifier || "",
      code: currentUser?.code || "",
    },
    habits,
    completions,
    todos,
    journal,
    timerSessions,
    challenges,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const userTag = (currentUser?.username || currentUser?.identifier || "backup").replace(/[^a-zA-Z0-9]/g, "_");
  a.href = url;
  a.download = `habit_tracker_${userTag}_${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportHabitsAsCSV({ habits = [], completions = {}, currentUser }) {
  const headers = ["Habit Name", "Category", "Frequency", "Current Streak", "Total Check-ins", "Archived", "Start Date"];
  
  // Prevent CSV Formula Injection (CWE-1236): Escape quotes and prefix formula triggers (=, +, -, @, \t, \r) with '
  const sanitizeCell = (val) => {
    let str = String(val !== undefined && val !== null ? val : "").replace(/"/g, '""');
    if (/^[=\+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str}"`;
  };

  const rows = habits.map((h) => {
    let streak = 0;
    try {
      streak = computeStreak(completions, h);
    } catch (e) {}

    let totalDone = 0;
    Object.values(completions || {}).forEach((dayMap) => {
      if (dayMap && dayMap[h.id]) totalDone++;
    });

    return [
      sanitizeCell(h.name),
      sanitizeCell(h.category || "General"),
      sanitizeCell(h.frequencyType || "everyday"),
      streak,
      totalDone,
      h.archived ? "Yes" : "No",
      sanitizeCell(h.startDate || ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const userTag = (currentUser?.username || currentUser?.identifier || "habits").replace(/[^a-zA-Z0-9]/g, "_");
  a.href = url;
  a.download = `habits_${userTag}_${todayKey()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MinimalIcon({ name, size = 18, color = "currentColor", strokeWidth = 1.8, style = {} }) {
  const iconKey = EMOJI_TO_ICON_MAP[name] || name;
  const iconDef = MINIMAL_ICONS[iconKey];

  if (iconDef) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
        aria-label={iconDef.label}
      >
        {iconDef.svg}
      </svg>
    );
  }

  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        verticalAlign: "middle",
        filter: "grayscale(0.2) contrast(0.95)",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Mind & Wellness",
  "Productivity",
  "Learning",
  "Personal Care",
  "Lifestyle",
];

const DAYS_OF_WEEK = [
  { id: 1, label: "M", full: "Mon" },
  { id: 2, label: "T", full: "Tue" },
  { id: 3, label: "W", full: "Wed" },
  { id: 4, label: "T", full: "Thu" },
  { id: 5, label: "F", full: "Fri" },
  { id: 6, label: "S", full: "Sat" },
  { id: 0, label: "S", full: "Sun" },
];

const EMAILJS_CONFIG = {
  PUBLIC_KEY: "gWFmTRlE96gpgXAay",
  SERVICE_ID: "service_yiopycq",
  TEMPLATE_ID: "template_q65krfp",
};

// Optional: Restrict login to specific email addresses.
// Leave empty [] to allow any valid email to sign in/up, or add your email: ["you@example.com"]
const ALLOWED_EMAILS = [];

// In-memory fallback if browser storage is restricted
const memoryStorage = new Map();

// =========================================================================
// SUPABASE CONFIGURATION, CLIENT & CLOUD SYNC MODULE
// =========================================================================
const SUPABASE_URL_STORAGE_KEY = "habit_supabase_url";
const SUPABASE_KEY_STORAGE_KEY = "habit_supabase_anon_key";

function isValidSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) return false;
  const u = String(url).trim().toLowerCase();
  const k = String(anonKey).trim();
  // Must be an actual URL containing supabase.co and key must be a valid JWT (starts with eyJ)
  return (u.startsWith("https://") || u.startsWith("http://")) && u.includes("supabase.co") && k.startsWith("eyJ") && k.length > 30;
}

function getSupabaseCredentials() {
  let url = "";
  let anonKey = "";
  try {
    if (typeof localStorage !== "undefined") {
      url = localStorage.getItem(SUPABASE_URL_STORAGE_KEY) || "";
      anonKey = localStorage.getItem(SUPABASE_KEY_STORAGE_KEY) || "";
    }
  } catch (e) {}

  // If credentials exist but are invalid format (like a raw ref id 'ecxpyxligsbscauisfkf'), purge them immediately
  if ((url || anonKey) && !isValidSupabaseConfig(url, anonKey)) {
    clearSupabaseCredentials();
    return { url: "", anonKey: "" };
  }

  return { url: url.trim(), anonKey: anonKey.trim() };
}

function saveSupabaseCredentials(url, anonKey) {
  try {
    if (typeof localStorage !== "undefined") {
      if (url) localStorage.setItem(SUPABASE_URL_STORAGE_KEY, url.trim());
      else localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
      if (anonKey) localStorage.setItem(SUPABASE_KEY_STORAGE_KEY, anonKey.trim());
      else localStorage.removeItem(SUPABASE_KEY_STORAGE_KEY);
    }
  } catch (e) {}
  return initSupabaseClient(url, anonKey);
}

function clearSupabaseCredentials() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
      localStorage.removeItem(SUPABASE_KEY_STORAGE_KEY);
    }
  } catch (e) {}
  window.supabaseClient = null;
}

function isSupabaseConfigured() {
  const creds = getSupabaseCredentials();
  return isValidSupabaseConfig(creds.url, creds.anonKey);
}

function initSupabaseClient(customUrl, customKey) {
  const creds = getSupabaseCredentials();
  const url = (customUrl !== undefined ? customUrl : creds.url || "").trim();
  const key = (customKey !== undefined ? customKey : creds.anonKey || "").trim();

  if (!isValidSupabaseConfig(url, key)) {
    window.supabaseClient = null;
    return null;
  }

  if (typeof window !== "undefined" && window.supabase?.createClient) {
    try {
      window.supabaseClient = window.supabase.createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      return window.supabaseClient;
    } catch (e) {
      console.warn("Failed to initialize Supabase client:", e);
      window.supabaseClient = null;
    }
  }
  return null;
}

// Auto-initialize on load if credentials exist
try {
  initSupabaseClient();
} catch (e) {}

async function testSupabaseConnection(url, anonKey) {
  if (!url || !anonKey) return { success: false, error: "URL and Anon Key are required." };
  if (typeof window === "undefined" || !window.supabase?.createClient) {
    return { success: false, error: "Supabase JS SDK not loaded in browser." };
  }
  try {
    const testClient = window.supabase.createClient(url.trim(), anonKey.trim(), {
      auth: { persistSession: false },
    });
    // Attempt a lightweight select on app_kv_store or profiles
    const { data, error } = await testClient.from("app_kv_store").select("key").limit(1);
    if (error) {
      // If table doesn't exist yet, it is still a valid connection to project
      if (error.code === "42P01" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return {
          success: true,
          tableMissing: true,
          message: "Connected to Supabase project! Please run the schema.sql script in the SQL Editor to create tables.",
        };
      }
      return { success: false, error: error.message || "Failed to query database." };
    }
    return { success: true, tableMissing: false, message: "Connected to Supabase successfully!" };
  } catch (err) {
    return { success: false, error: err.message || "Connection failed. Please check your credentials." };
  }
}

// Background sync to specialized relational tables
async function syncKeyToSupabaseRelational(key, parsedVal) {
  if (!window.supabaseClient) return;
  try {
    // 1. User accounts & streaks -> profiles table
    if (key === "habit_registered_accounts" && parsedVal && typeof parsedVal === "object") {
      const profileRows = Object.values(parsedVal).map((acc) => ({
        email: (acc.email || "").trim().toLowerCase(),
        username: acc.username || "",
        code: acc.code || "",
        password_hash: acc.passwordHash || "",
        is_admin: !!acc.is_admin,
        current_streak: acc.currentStreak || 0,
        longest_streak: acc.longestStreak || 0,
        updated_at: new Date().toISOString(),
      }));
      if (profileRows.length > 0) {
        await window.supabaseClient.from("profiles").upsert(profileRows);
      }
    }

    // 2. Challenges -> challenges table
    if (key === "habit_challenges_v1" && Array.isArray(parsedVal)) {
      const challengeRows = parsedVal.map((c) => ({
        id: c.id,
        title: c.title || c.habitName || "Streak Battle",
        habit_name: c.habitName || "",
        category: c.category || "General",
        duration_days: c.durationDays || c.targetDays || 7,
        creator_email: c.creator?.identifier || c.creatorEmail || "",
        creator_username: c.creator?.username || c.creatorUsername || "",
        creator_code: c.creator?.code || c.creatorCode || "",
        target_email: c.targetUser?.identifier || c.targetEmail || "",
        target_username: c.targetUser?.username || c.targetUsername || "",
        target_code: c.targetUser?.code || c.targetCode || "",
        status: c.status || "pending",
        start_date: c.startDate || null,
        end_date: c.endDate || null,
        winner: c.winner || null,
        completions: c.completions || {},
        created_at: c.createdAt || new Date().toISOString(),
      }));
      if (challengeRows.length > 0) {
        await window.supabaseClient.from("challenges").upsert(challengeRows);
      }
    }

    // 3. User habits and completions -> habits & habit_completions tables
    if (key.startsWith("habit_user_data_") && parsedVal && typeof parsedVal === "object") {
      const userEmail = decodeURIComponent(key.replace("habit_user_data_", "")).trim().toLowerCase();
      if (Array.isArray(parsedVal.habits) && parsedVal.habits.length > 0) {
        const habitRows = parsedVal.habits.map((h) => ({
          id: h.id,
          user_email: userEmail,
          name: h.name,
          category: h.category || "General",
          frequency_type: h.frequencyType || "everyday",
          color: h.color || "#7C9473",
          icon: h.icon || "sparkle",
          archived: !!h.archived,
          created_at: h.createdAt || new Date().toISOString(),
        }));
        await window.supabaseClient.from("habits").upsert(habitRows);
      }

      if (parsedVal.completions && typeof parsedVal.completions === "object") {
        const compRows = [];
        Object.entries(parsedVal.completions).forEach(([dateStr, habitMap]) => {
          if (habitMap && typeof habitMap === "object") {
            Object.entries(habitMap).forEach(([hId, isDone]) => {
              if (isDone) {
                compRows.push({
                  user_email: userEmail,
                  date: dateStr,
                  habit_id: hId,
                  completed: true,
                });
              }
            });
          }
        });
        if (compRows.length > 0) {
          await window.supabaseClient.from("habit_completions").upsert(compRows);
        }
      }
    }

    // 4. Todos -> todos table
    if (key.startsWith("habit_todos_") && Array.isArray(parsedVal)) {
      const userEmail = decodeURIComponent(key.replace("habit_todos_", "")).trim().toLowerCase();
      const todoRows = parsedVal.map((t) => ({
        id: t.id,
        user_email: userEmail,
        title: t.title,
        priority: t.priority || "medium",
        category: t.category || "General",
        due_date: t.dueDate || null,
        completed: !!t.completed,
        created_at: t.createdAt || new Date().toISOString(),
      }));
      if (todoRows.length > 0) {
        await window.supabaseClient.from("todos").upsert(todoRows);
      }
    }

    // 5. Journal -> journal_entries table
    if (key.startsWith("habit_journal_") && parsedVal && typeof parsedVal === "object") {
      const userEmail = decodeURIComponent(key.replace("habit_journal_", "")).trim().toLowerCase();
      const journalRows = Object.entries(parsedVal).map(([dateStr, entry]) => ({
        user_email: userEmail,
        date: dateStr,
        text: entry?.text || "",
        mood: entry?.mood || "",
        word_count: entry?.wordCount || 0,
        updated_at: entry?.updatedAt || new Date().toISOString(),
      }));
      if (journalRows.length > 0) {
        await window.supabaseClient.from("journal_entries").upsert(journalRows);
      }
    }

    // 6. Focus Timer sessions -> timer_sessions table
    if (key.startsWith("habit_timer_sessions_") && Array.isArray(parsedVal)) {
      const userEmail = decodeURIComponent(key.replace("habit_timer_sessions_", "")).trim().toLowerCase();
      const sessionRows = parsedVal.map((s) => ({
        id: s.id || `session_${Math.random().toString(36).substring(2, 9)}`,
        user_email: userEmail,
        duration_seconds: s.durationSeconds || s.duration || 0,
        mode: s.mode || "focus",
        linked_type: s.linkedType || null,
        linked_id: s.linkedId || null,
        linked_name: s.linkedName || s.task || null,
        created_at: s.createdAt || s.completedAt || new Date().toISOString(),
      }));
      if (sessionRows.length > 0) {
        await window.supabaseClient.from("timer_sessions").upsert(sessionRows);
      }
    }

    // 7. Badges -> user_badges table
    if (key.startsWith("habit_badges_") && parsedVal && typeof parsedVal === "object") {
      const userEmail = decodeURIComponent(key.replace("habit_badges_", "")).trim().toLowerCase();
      const badgeRows = Object.entries(parsedVal)
        .filter(([, isUnlocked]) => !!isUnlocked)
        .map(([bId, val]) => ({
          user_email: userEmail,
          badge_id: bId,
          unlocked_at: typeof val === "string" ? val : new Date().toISOString(),
        }));
      if (badgeRows.length > 0) {
        await window.supabaseClient.from("user_badges").upsert(badgeRows);
      }
    }
  } catch (syncErr) {
    console.warn("Background relational Supabase sync failed:", syncErr);
  }
}

// 1-Click Migration: copies all localStorage keys to Supabase
async function migrateLocalStorageToSupabase() {
  if (!window.supabaseClient) {
    return { success: false, error: "Supabase is not connected. Please enter your project URL and key first." };
  }

  const counts = {
    accounts: 0,
    habits: 0,
    completions: 0,
    todos: 0,
    journals: 0,
    challenges: 0,
    badges: 0,
  };

  try {
    if (typeof localStorage === "undefined") {
      return { success: false, error: "No local storage found in browser." };
    }

    const allKeys = Object.keys(localStorage);
    const kvRows = [];

    for (const k of allKeys) {
      if (k.startsWith("habit_") || k === "habit-auth-session" || k === "habit-last-email") {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            let parsed = raw;
            try { parsed = JSON.parse(raw); } catch (e) {}

            kvRows.push({
              key: k,
              value: parsed,
              updated_at: new Date().toISOString(),
            });

            // Count items
            if (k === "habit_registered_accounts" && parsed && typeof parsed === "object") {
              counts.accounts += Object.keys(parsed).length;
            } else if (k === "habit_challenges_v1" && Array.isArray(parsed)) {
              counts.challenges += parsed.length;
            } else if (k.startsWith("habit_user_data_") && parsed && typeof parsed === "object") {
              if (Array.isArray(parsed.habits)) counts.habits += parsed.habits.length;
              if (parsed.completions) {
                Object.values(parsed.completions).forEach((day) => {
                  if (day && typeof day === "object") counts.completions += Object.keys(day).length;
                });
              }
            } else if (k.startsWith("habit_todos_") && Array.isArray(parsed)) {
              counts.todos += parsed.length;
            } else if (k.startsWith("habit_journal_") && parsed && typeof parsed === "object") {
              counts.journals += Object.keys(parsed).length;
            } else if (k.startsWith("habit_badges_") && parsed && typeof parsed === "object") {
              counts.badges += Object.values(parsed).filter(Boolean).length;
            }

            // Sync to relational tables
            await syncKeyToSupabaseRelational(k, parsed);
          }
        } catch (itemErr) {
          console.warn("Could not migrate key:", k, itemErr);
        }
      }
    }

    // Upsert all keys into app_kv_store in chunks of 50
    for (let i = 0; i < kvRows.length; i += 50) {
      const chunk = kvRows.slice(i, i + 50);
      const { error } = await window.supabaseClient.from("app_kv_store").upsert(chunk);
      if (error) console.warn("Supabase batch kv_store upsert warning:", error);
    }

    return { success: true, counts };
  } catch (err) {
    return { success: false, error: err.message || "Migration encountered an unexpected error." };
  }
}

// Upgraded Safe Storage Wrapper with Dual-Mode Cloud Persistence
const storage = {
  get: async (key) => {
    // 1. Check local cache first for instant synchronous feel
    let localVal = null;
    try {
      if (typeof localStorage !== "undefined") {
        const val = localStorage.getItem(key);
        if (val !== null) localVal = val;
      }
    } catch (e) {}

    if (localVal === null && memoryStorage.has(key)) {
      localVal = memoryStorage.get(key);
    }

    // 2. If Supabase is connected and local cache was missing, query cloud with 1200ms timeout
    if (window.supabaseClient && localVal === null && !window.__supabaseOffline) {
      try {
        const queryPromise = window.supabaseClient
          .from("app_kv_store")
          .select("value")
          .eq("key", key)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase timeout")), 1200)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (data && data.value !== undefined && !error) {
          const stringVal = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
          // Cache locally for faster subsequent access
          try {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(key, stringVal);
            }
          } catch (e) {}
          return { value: stringVal };
        }
      } catch (cloudErr) {
        if (cloudErr && cloudErr.message === "Supabase timeout") {
          window.__supabaseOffline = true;
        }
      }
    }

    if (localVal !== null) {
      return { value: localVal };
    }

    // 3. Fallback to window.storage if present
    try {
      if (typeof window !== "undefined" && window.storage?.get) {
        const res = await window.storage.get(key);
        if (res && res.value !== undefined) return res;
      }
    } catch (e) {}

    return null;
  },
  set: async (key, value) => {
    let saved = false;

    // 1. Immediate native browser localStorage update
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        saved = true;
      }
    } catch (e) {
      console.warn("localStorage set failed:", e);
    }

    // 2. In-memory store fallback
    memoryStorage.set(key, value);

    // 3. window.storage if present
    try {
      if (typeof window !== "undefined" && window.storage?.set) {
        await window.storage.set(key, value);
        saved = true;
      }
    } catch (e) {}

    // 4. Asynchronous Cloud Persistence to Supabase
    if (window.supabaseClient) {
      (async () => {
        try {
          let parsed = value;
          try { parsed = JSON.parse(value); } catch (e) {}

          // Upsert to general key-value store
          await window.supabaseClient.from("app_kv_store").upsert({
            key,
            value: parsed,
            updated_at: new Date().toISOString(),
          });

          // Sync to relational tables
          await syncKeyToSupabaseRelational(key, parsed);
        } catch (cloudErr) {
          console.warn("Cloud write to Supabase failed:", cloudErr);
        }
      })();
    }

    return true;
  },
  remove: async (key) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    try {
      if (typeof window !== "undefined" && window.storage?.remove) {
        await window.storage.remove(key);
      }
    } catch (e) {}
    memoryStorage.delete(key);

    if (window.supabaseClient) {
      try {
        window.supabaseClient.from("app_kv_store").delete().eq("key", key).then();
      } catch (e) {}
    }
  },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function keyFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function lastNDays(n) {
  const out = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(keyFromDate(d));
  }
  return out;
}

function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {}
}

function computeStreak(completions, habitOrId, shieldedDates = new Set()) {
  const habitId = typeof habitOrId === "object" ? habitOrId.id : habitOrId;
  const daysOfWeek = typeof habitOrId === "object" && habitOrId.frequencyType === "specific_days" && habitOrId.daysOfWeek?.length > 0
    ? habitOrId.daysOfWeek
    : null;

  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let cursor = new Date(now);

  const doneToday = !!(completions[keyFromDate(cursor)] || {})[habitId];

  // If today is not marked done yet, calculate streak through yesterday
  if (!doneToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const applies = !daysOfWeek || daysOfWeek.includes(cursor.getDay());
    if (applies) {
      const k = keyFromDate(cursor);
      if ((completions[k] || {})[habitId] || (shieldedDates && shieldedDates.has(k))) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Registered accounts storage key
const ACCOUNTS_STORAGE_KEY = "habit_registered_accounts";

function generateUniqueUserCode(existingAccounts = {}) {
  // 6-character uppercase alphanumeric code using unambiguous chars (no 0/O, 1/I)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const existingCodes = new Set(
    Object.values(existingAccounts)
      .map((a) => (a.code || "").toUpperCase())
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      const idx = getSecureRandomInt(0, chars.length - 1);
      code += chars.charAt(idx);
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return "U" + getSecureRandomInt(10000, 99999);
}

async function getRegisteredAccounts() {
  const BANNED_BOT_EMAILS = new Set(["maya@flow.io", "liam@zenith.co", "zara@mind.org", "elena@pace.io"]);
  // If Supabase is connected, fetch public profile data from the profiles table (NEVER select password or password_hash)
  if (window.supabaseClient && !window.__supabaseOffline) {
    try {
      const queryPromise = window.supabaseClient
        .from("profiles")
        .select("email, username, code, is_admin, current_streak, longest_streak, updated_at");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase timeout")), 1200)
      );
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      if (data && Array.isArray(data) && data.length > 0 && !error) {
        let localCache = {};
        try {
          if (typeof localStorage !== "undefined") {
            localCache = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || "{}");
          }
        } catch (e) {}

        const remoteAccounts = {};
        data.forEach((p) => {
          if (p.email) {
            const clean = p.email.trim().toLowerCase();
            if (BANNED_BOT_EMAILS.has(clean)) return;
            const existingLocal = localCache[clean] || {};
            remoteAccounts[clean] = {
              email: clean,
              username: p.username || clean.split("@")[0],
              passwordHash: existingLocal.passwordHash || "",
              code: (p.code || "").toUpperCase(),
              is_admin: !!p.is_admin,
              currentStreak: p.current_streak || 0,
              longestStreak: p.longest_streak || 0,
              updatedAt: p.updated_at,
            };
          }
        });
        // Cache locally for offline resilience
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(remoteAccounts));
          }
        } catch (e) {}
        return remoteAccounts;
      }
    } catch (err) {
      console.warn("Could not fetch profiles from Supabase, using local fallback", err);
    }
  }

  // Fallback to local storage
  try {
    const res = await storage.get(ACCOUNTS_STORAGE_KEY);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      const cleanAccounts = {};
      let changed = false;
      Object.keys(parsed || {}).forEach((k) => {
        const clean = k.trim().toLowerCase();
        if (BANNED_BOT_EMAILS.has(clean)) {
          changed = true;
        } else {
          cleanAccounts[clean] = parsed[k];
          // Auto-migrate legacy password to passwordHash if needed
          if (cleanAccounts[clean].password && !cleanAccounts[clean].passwordHash) {
            changed = true;
          }
        }
      });
      if (changed) {
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(cleanAccounts));
          }
          await storage.set(ACCOUNTS_STORAGE_KEY, JSON.stringify(cleanAccounts));
        } catch (e) {}
      }
      return cleanAccounts;
    }
  } catch (e) {}
  return {};
}

async function saveRegisteredAccount(email, username, password, code, is_admin, extraData = {}) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = await getRegisteredAccounts();
    const existing = accounts[cleanEmail] || {};
    const finalCode = (code || existing.code || generateUniqueUserCode(accounts)).toUpperCase();
    const isFirstAccount = Object.keys(accounts).length === 0;
    const finalAdmin = is_admin !== undefined ? !!is_admin : (existing.is_admin !== undefined ? !!existing.is_admin : isFirstAccount);
    
    let nextPasswordHash = existing.passwordHash || "";
    if (password !== undefined && password !== null && password !== "") {
      nextPasswordHash = await hashPassword(password);
    } else if (existing.password && !nextPasswordHash) {
      nextPasswordHash = await hashPassword(existing.password);
    }

    accounts[cleanEmail] = {
      ...existing,
      email: cleanEmail,
      username: (username || existing.username || "").trim(),
      passwordHash: nextPasswordHash,
      code: finalCode,
      is_admin: finalAdmin,
      birthDate: extraData.birthDate || existing.birthDate || null,
      ageVerified: extraData.ageVerified !== undefined ? !!extraData.ageVerified : (existing.ageVerified !== undefined ? !!existing.ageVerified : true),
      ageVerifiedAt: extraData.ageVerifiedAt || existing.ageVerifiedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Permanently scrub any legacy plaintext password field
    delete accounts[cleanEmail].password;

    await storage.set(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    return accounts[cleanEmail];
  } catch (e) {
    console.warn("Could not save account", e);
  }
}

// =========================================================================
// CHALLENGES STORAGE & LOGIC
// =========================================================================
const CHALLENGES_STORAGE_KEY = "habit_challenges_v1";

async function getStoredChallenges() {
  // If Supabase is connected, fetch live multiplayer challenges from cloud
  if (window.supabaseClient && !window.__supabaseOffline) {
    try {
      const queryPromise = window.supabaseClient
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase timeout")), 1200)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (data && Array.isArray(data) && !error) {
        const mapped = data.map((row) => ({
          id: row.id,
          title: row.title,
          habitName: row.habit_name,
          category: row.category,
          durationDays: row.duration_days,
          creator: {
            identifier: row.creator_email,
            username: row.creator_username,
            code: row.creator_code,
          },
          targetUser: {
            identifier: row.target_email,
            username: row.target_username,
            code: row.target_code,
          },
          status: row.status,
          startDate: row.start_date,
          endDate: row.end_date,
          winner: row.winner,
          completions: row.completions || {},
          createdAt: row.created_at,
        }));

        // Cache locally for offline availability
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(mapped));
          }
        } catch (e) {}

        return mapped;
      }
    } catch (err) {
      console.warn("Could not fetch challenges from Supabase, using local fallback", err);
    }
  }

  // Fallback to local storage
  try {
    const res = await storage.get(CHALLENGES_STORAGE_KEY);
    if (res && res.value) {
      return JSON.parse(res.value);
    }
  } catch (e) {
    console.warn("Could not read challenges", e);
  }
  return [];
}

async function saveStoredChallenges(challenges) {
  try {
    await storage.set(CHALLENGES_STORAGE_KEY, JSON.stringify(challenges));
    return true;
  } catch (e) {
    console.warn("Could not save challenges", e);
    return false;
  }
}

function computeChallengeStreak(userCompletions = {}) {
  if (!userCompletions || typeof userCompletions !== "object") return 0;
  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let cursor = new Date(now);

  const doneToday = !!userCompletions[keyFromDate(cursor)];
  if (!doneToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const k = keyFromDate(cursor);
    if (userCompletions[k]) {
      streak++;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function isChallengeForUser(c, user) {
  if (!c || !user) return false;
  const uEmail = (user.identifier || "").trim().toLowerCase();
  const uName = (user.username || "").trim().toLowerCase();
  const uCode = (user.code || "").replace(/^#/, "").trim().toUpperCase();

  const pEmail = (c.participant?.identifier || "").trim().toLowerCase();
  const pName = (c.participant?.username || "").trim().toLowerCase();
  const pCode = (c.participant?.code || "").replace(/^#/, "").trim().toUpperCase();
  const pRaw = (c.participant?.rawInput || "").replace(/^[@#]/, "").trim().toLowerCase();

  // Match by unique code
  if (uCode && pCode && uCode === pCode) return true;
  // Match by email
  if (uEmail && pEmail && uEmail === pEmail) return true;
  // Match by username
  if (uName && pName && uName === pName) return true;
  // Match raw input against user's code, username, or email prefix
  if (uCode && pRaw && pRaw.toUpperCase() === uCode) return true;
  if (uName && pRaw && (pRaw === uName || pRaw === `@${uName}`)) return true;
  if (uEmail && pRaw && (pRaw === uEmail || pRaw === uEmail.split("@")[0])) return true;
  if (uEmail && pEmail && (pEmail === uEmail.split("@")[0] || pEmail === uEmail)) return true;

  return false;
}

function isChallengeFromUser(c, user) {
  if (!c || !user) return false;
  const uEmail = (user.identifier || "").trim().toLowerCase();
  const uName = (user.username || "").trim().toLowerCase();
  const uCode = (user.code || "").replace(/^#/, "").trim().toUpperCase();

  const cEmail = (c.creator?.identifier || "").trim().toLowerCase();
  const cName = (c.creator?.username || "").trim().toLowerCase();
  const cCode = (c.creator?.code || "").replace(/^#/, "").trim().toUpperCase();

  if (uCode && cCode && uCode === cCode) return true;
  if (uEmail && cEmail && uEmail === cEmail) return true;
  if (uName && cName && uName === cName) return true;

  return false;
}

async function getOtherRegisteredAccounts(currentIdentifier) {
  try {
    const accounts = await getRegisteredAccounts();
    const cleanCur = (currentIdentifier || "").trim().toLowerCase();
    return Object.values(accounts).filter((acc) => {
      const id = (acc.email || "").trim().toLowerCase();
      return id && id !== cleanCur;
    });
  } catch (e) {
    return [];
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Restore current active session
  useEffect(() => {
    (async () => {
      try {
        const session = await storage.get("habit-auth-session");
        if (session && session.value) {
          const user = JSON.parse(session.value);
          const cleanEmail = (user.identifier || "").trim().toLowerCase();
          // Look up latest username & unique challenge code from registered accounts
          const accounts = await getRegisteredAccounts();
          const account = accounts[cleanEmail];
          if (account) {
            if (account.username) {
              user.username = account.username;
            }
            if (!account.code) {
              account.code = generateUniqueUserCode(accounts);
              await saveRegisteredAccount(cleanEmail, account.username, undefined, account.code, account.is_admin);
            }
            user.code = account.code;
            user.is_admin = !!account.is_admin;
          } else if (!user.code) {
            user.code = generateUniqueUserCode(accounts);
            user.is_admin = (Object.keys(accounts).length <= 1);
          } else if (user.is_admin === undefined) {
            user.is_admin = (Object.keys(accounts).length <= 1);
          }
          if (user.isReturning === undefined) {
            user.isReturning = true;
          }
          setCurrentUser(user);
        }
      } catch (e) {
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  async function handleLoginSuccess(user) {
    const cleanEmail = (user.identifier || "").trim().toLowerCase();
    const accounts = await getRegisteredAccounts();
    const existingAccount = accounts[cleanEmail] || {};
    const userCode = (user.code || existingAccount.code || generateUniqueUserCode(accounts)).toUpperCase();
    const isAdmin = existingAccount.is_admin !== undefined ? !!existingAccount.is_admin : (Object.keys(accounts).length <= 1);

    const cleanUser = {
      ...user,
      identifier: cleanEmail,
      code: userCode,
      is_admin: isAdmin,
      isReturning: user.isReturning !== false,
    };
    setCurrentUser(cleanUser);
    await storage.set("habit-auth-session", JSON.stringify(cleanUser));
    await storage.set("habit-last-email", cleanUser.identifier);
    if (cleanUser.username) {
      await saveRegisteredAccount(cleanUser.identifier, cleanUser.username, existingAccount.password, userCode, isAdmin);
    }
  }

  async function handleUpdateUsername(newUsername) {
    if (!currentUser) return;
    const cleanName = newUsername.trim();
    const cleanEmail = (currentUser.identifier || "").trim().toLowerCase();
    const accounts = await getRegisteredAccounts();
    const existingAccount = accounts[cleanEmail] || {};
    const userCode = (currentUser.code || existingAccount.code || generateUniqueUserCode(accounts)).toUpperCase();
    const isAdmin = currentUser.is_admin !== undefined ? !!currentUser.is_admin : (existingAccount.is_admin !== undefined ? !!existingAccount.is_admin : true);

    const updated = {
      ...currentUser,
      username: cleanName,
      code: userCode,
      is_admin: isAdmin,
    };
    setCurrentUser(updated);
    await storage.set("habit-auth-session", JSON.stringify(updated));
    await saveRegisteredAccount(cleanEmail, cleanName, existingAccount.password, userCode, isAdmin);
  }

  async function handleLogout() {
    setCurrentUser(null);
    await storage.remove("habit-auth-session");
  }

  if (authChecking) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <OtpLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // First-time login without a username -> prompt to choose one
  if (!currentUser.username || currentUser.username.trim() === "") {
    return (
      <SetUsernameScreen
        currentUser={currentUser}
        onSaveUsername={handleUpdateUsername}
        onLogout={handleLogout}
      />
    );
  }

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", background: "#FAF7F1", color: "#B0654A", minHeight: "100vh" }}>
          <h2 style={{margin: 0}}>Oops, something crashed!</h2>
          <p style={{color: "#5B5545"}}>The app encountered a rendering error. This often happens if the database schema is missing tables.</p>
          <pre style={{ background: "rgba(0,0,0,0.05)", padding: 20, borderRadius: 8, whiteSpace: "pre-wrap", color: "#22301F", fontSize: 13, overflow: "auto" }}>
            {this.state.error?.toString()}
            {"\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 20, padding: "10px 20px", background: "#7C9473", color: "#FAF7F1", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

  return (
    <ErrorBoundary>
      <HabitTracker currentUser={currentUser} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}

/* =========================================================================
   SET USERNAME ONBOARDING COMPONENT
   ========================================================================= */
function SetUsernameScreen({ currentUser, onSaveUsername, onLogout }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit() {
    const clean = username.trim();
    if (!clean || clean.length < 2) {
      setError("Please choose a username with at least 2 characters.");
      return;
    }
    onSaveUsername(clean);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Welcome!</h1>
        <p style={styles.subtitle}>
          Choose a username for your new Habit Tracker account ({currentUser.identifier}).
        </p>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.addForm}>
        <label style={styles.fieldLabel}>Choose a Username</label>
        <input
          autoFocus
          type="text"
          style={styles.input}
          placeholder="e.g. Jordan or Alex"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <div style={{ ...styles.challengeSummaryBox, marginTop: 4, marginBottom: 4 }}>
          <MinimalIcon name="trophy" size={14} color="#7C9473" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: "#5B5545", lineHeight: 1.4 }}>
            <strong>Streak Challenges:</strong> You'll automatically receive a unique challenge code (e.g. <code>#7K9X2B</code>) alongside your username so friends can challenge your streaks effortlessly!
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={handleSubmit}>
            Continue to Habit Tracker →
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <button style={styles.ghostLink} onClick={onLogout}>
            Sign in with a different email
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   OTP LOGIN / CREATE ACCOUNT COMPONENT
   ========================================================================= */
function OtpLogin({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState("signin"); // 'signin' | 'signup' | 'forgot'
  const [step, setStep] = useState("input"); // 'input' | 'otp' | 'new_password'
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [resendTimer, setResendTimer] = useState(30);

  const [activeSession, setActiveSession] = useState(null);
  const otpInputs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Pre-fill last used email on sign in
  useEffect(() => {
    (async () => {
      try {
        const lastEmail = await storage.get("habit-last-email");
        if (lastEmail && lastEmail.value && !identifier) {
          setIdentifier(lastEmail.value);
        }
      } catch (e) {}
    })();
  }, []);

  // ONE-CLICK DEMO EXPLORE (SEED SAMPLE DATA FOR ACTIVE DEMO USER ONLY - ZERO FAKE BOTS)
  async function handleDemoExplore() {
    const demoUser = {
      identifier: "alex@test.com",
      username: "Alex Rivera",
      code: "ALEX99",
      is_admin: true,
      isReturning: true,
    };
    const existingAccounts = await getRegisteredAccounts();
    const BANNED_BOT_EMAILS = new Set(["maya@flow.io", "liam@zenith.co", "zara@mind.org", "elena@pace.io"]);
    const cleanExisting = {};
    Object.keys(existingAccounts || {}).forEach((k) => {
      if (!BANNED_BOT_EMAILS.has(k.toLowerCase())) {
        cleanExisting[k] = existingAccounts[k];
      }
    });

    const accounts = {
      ...cleanExisting,
      "alex@test.com": {
        email: "alex@test.com",
        username: "Alex Rivera",
        code: "ALEX99",
        is_admin: true,
        currentStreak: 5,
        longestStreak: 8,
        updatedAt: new Date().toISOString(),
      },
    };
    await storage.set("habit_registered_accounts", JSON.stringify(accounts));
    
    const today = todayKey();
    const habitsData = {
      user: "alex@test.com",
      habits: [
        { id: "h1", name: "Morning Meditation", frequencyType: "everyday", category: "Mind & Wellness", color: "#7C9473", icon: "zen" },
        { id: "h2", name: "Hydrate 2.5L Water", frequencyType: "everyday", category: "Health & Fitness", color: "#557A95", icon: "water" },
        { id: "h3", name: "Read 20 Pages", frequencyType: "everyday", category: "Learning", color: "#B0654A", icon: "book" }
      ],
      completions: {
        [today]: { "h1": true }
      }
    };
    await storage.set("habit_user_data_alex%40test.com", JSON.stringify(habitsData));

    const todos = [
      { id: "t1", title: "Prepare quarterly review notes", priority: "high", category: "Work", dueDate: "2026-09-10", completed: false },
      { id: "t2", title: "Pick up herbal tea", priority: "low", category: "Personal", dueDate: today, completed: false },
      { id: "t3", title: "Evening stretch routine", priority: "medium", category: "Health", dueDate: today, completed: true }
    ];
    await storage.set("habit_todos_alex%40test.com", JSON.stringify(todos));

    const journal = {
      [today]: {
        text: "🌱 What went gently: Had a peaceful morning tea and set clear intentions for the day.",
        mood: "🌿 Calm",
        wordCount: 17,
        updatedAt: new Date().toISOString()
      }
    };
    await storage.set("habit_journal_alex%40test.com", JSON.stringify(journal));

    // Clean out any fake bot challenges
    const existingChallenges = await getStoredChallenges();
    const cleanChallenges = (existingChallenges || []).filter(
      (c) => !BANNED_BOT_EMAILS.has((c.creator?.identifier || c.createdBy || "").toLowerCase())
    );
    await storage.set("habit_challenges_v1", JSON.stringify(cleanChallenges));

    await storage.set("habit-auth-session", JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  }

  // DIRECT PASSWORD SIGN IN (NO OTP NEEDED)
  async function handlePasswordSignIn() {
    const cleanEmail = identifier.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(cleanEmail)) {
      setError("This email address is not authorized to access this Habit Tracker.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

      // Server-Managed Authentication (Supabase Auth GoTrue)
      if (window.supabaseClient && !window.__supabaseOffline) {
        try {
          const { data: authData, error: authErr } = await window.supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
          });
          if (authErr && !authErr.message?.includes("Invalid login credentials")) {
            console.debug("Supabase server auth status:", authErr.message);
          }
        } catch (serverAuthErr) {
          console.warn("Server auth check warning:", serverAuthErr);
        }
      }

      // Verify password
      const inputHash = await hashPassword(password);
      const storedHash = account.passwordHash;
      const storedPlain = account.password;

      let isValid = false;
      if (storedHash) {
        isValid = storedHash === inputHash;
      } else if (storedPlain) {
        if (storedPlain === password) {
          isValid = true;
          // Auto-upgrade legacy account to hashed password
          await saveRegisteredAccount(cleanEmail, account.username, password, account.code, account.is_admin);
        }
      } else {
        // First-time password set for legacy accounts without password
        isValid = true;
        await saveRegisteredAccount(cleanEmail, account.username, password, account.code, account.is_admin);
      }

      if (!isValid) {
        setLoading(false);
        setError("Incorrect password. Please try again or reset your password.");
        return;
      }

      // Legacy account missing unique code generation
      let userCode = account.code;
      if (!userCode) {
        userCode = generateUniqueUserCode(accounts);
        await saveRegisteredAccount(cleanEmail, account.username, undefined, userCode, account.is_admin);
      }

      setLoading(false);
      onLoginSuccess({
        identifier: cleanEmail,
        username: account.username || "",
        code: userCode,
        is_admin: !!account.is_admin,
        loggedInAt: new Date().toISOString(),
        isReturning: true,
      });
    } catch (err) {
      setLoading(false);
      setError("An error occurred while signing in. Please try again.");
    }
  }

  // DIRECT ACCOUNT CREATION (NO OTP NEEDED)
  async function handleCreateAccount() {
    const cleanEmail = identifier.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }
    if (cleanEmail.length > 100) {
      setError("Email address is too long (max 100 characters).");
      return;
    }

    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      setError("Please choose a username with at least 2 characters.");
      return;
    }
    if (cleanUsername.length > 50) {
      setError("Username must be 50 characters or less.");
      return;
    }

    if (!password || password.length < 4) {
      setError("Please create a password with at least 4 characters.");
      return;
    }
    if (password.length > 128) {
      setError("Password must be 128 characters or less.");
      return;
    }

    // --- STRICT AGE VERIFICATION (COPPA & DIGITAL PRIVACY COMPLIANCE) ---
    if (!birthDate) {
      setError("Age Verification Required: Please select your date of birth.");
      return;
    }

    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) {
      setError("Please enter a valid date of birth.");
      return;
    }

    const today = new Date();
    if (dob > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 13) {
      setError("Age Verification Failed: You must be at least 13 years old to create an account on HabitTrack (COPPA Compliance).");
      return;
    }

    if (age > 120) {
      setError("Please enter a realistic date of birth.");
      return;
    }

    if (!ageConfirmed) {
      setError("Please check the confirmation box verifying that you are at least 13 years of age.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const accounts = await getRegisteredAccounts();
      const existingAccount = accounts[cleanEmail];
      if (existingAccount && (existingAccount.passwordHash || existingAccount.password)) {
        setLoading(false);
        setError("An account with this email already exists. Please sign in.");
        return;
      }

      const isFirst = Object.keys(accounts).length === 0;
      const userCode = existingAccount?.code || generateUniqueUserCode(accounts);
      const verifiedTimestamp = new Date().toISOString();

      await saveRegisteredAccount(cleanEmail, cleanUsername, password, userCode, isFirst, {
        birthDate: birthDate,
        ageVerified: true,
        ageVerifiedAt: verifiedTimestamp,
      });
      setLoading(false);

      onLoginSuccess({
        identifier: cleanEmail,
        username: cleanUsername,
        code: userCode,
        is_admin: isFirst,
        birthDate: birthDate,
        ageVerified: true,
        loggedInAt: verifiedTimestamp,
        isReturning: !existingAccount,
      });
    } catch (err) {
      setLoading(false);
      setError("Failed to create account. Please try again.");
    }
  }


  // FORGOT PASSWORD: SENDS RESET CODE
  async function handleSendForgotOtp() {
    const cleanEmail = identifier.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please enter your registered email address.");
      return;
    }

    const accounts = await getRegisteredAccounts();
    const existingAccount = accounts[cleanEmail];
    if (!existingAccount) {
      setError(`No account found for ${cleanEmail}.`);
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    const generatedCode = String(getSecureRandomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    try {
      emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
      await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, {
        to_email: cleanEmail,
        user_email: cleanEmail,
        email: cleanEmail,
        recipient: cleanEmail,
        to_name: existingAccount.username || cleanEmail.split("@")[0],
        otp_code: generatedCode,
        otp: generatedCode,
        passcode: generatedCode,
        code: generatedCode,
        message: `Your password reset code is: ${generatedCode}`,
      });

      setActiveSession({
        code: generatedCode,
        expiresAt: expiresAt,
        email: cleanEmail,
        username: existingAccount.username,
        authMode: "forgot",
      });

      setInfoMessage(`Password reset code sent to ${cleanEmail}.`);
      setLoading(false);
      setStep("otp");
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } catch (err) {
      console.error("EmailJS error:", err);
      setLoading(false);
      setError(`Failed to send email: ${err?.text || err?.message}`);
    }
  }

  function handleOtpChange(val, index) {
    const cleanVal = val.replace(/\D/g, "");
    const nextOtp = [...otp];
    if (!cleanVal) {
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }
    nextOtp[index] = cleanVal[cleanVal.length - 1];
    setOtp(nextOtp);
    if (index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(e, index) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.every((d) => d !== "")) {
      handleVerifyOtp();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const nextOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      nextOtp[i] = pasteData[i];
    }
    setOtp(nextOtp);
    const targetIdx = Math.min(pasteData.length, 5);
    otpInputs.current[targetIdx]?.focus();
  }

  async function handleVerifyOtp() {
    const enteredCode = otp.join("");
    if (enteredCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(async () => {
      setLoading(false);

      if (!activeSession) {
        setError("No active verification found. Please request a new code.");
        return;
      }

      if (Date.now() > activeSession.expiresAt) {
        setError("Code has expired. Please tap 'Resend code'.");
        return;
      }

      // STRICT VERIFICATION: Code must strictly match the generated code
      if (enteredCode === activeSession.code) {
        const targetEmail = activeSession.email;
        const targetUsername = activeSession.username;
        const targetPassword = activeSession.password;

        if (activeSession.authMode === "signup") {
          // Permanently save new account with password and unique alphanumeric code
          const accounts = await getRegisteredAccounts();
          const userCode = generateUniqueUserCode(accounts);
          await saveRegisteredAccount(targetEmail, targetUsername, targetPassword, userCode);

          onLoginSuccess({
            identifier: targetEmail,
            username: targetUsername,
            code: userCode,
            loggedInAt: new Date().toISOString(),
            isReturning: false,
          });
        } else if (activeSession.authMode === "forgot") {
          setStep("new_password");
          setPassword("");
        }
      } else {
        setError("Incorrect code. Please check your email and try again.");
      }
    }, 400);
  }

  async function handleSaveNewPassword() {
    if (!password || password.length < 4) {
      setError("Please enter a new password with at least 4 characters.");
      return;
    }
    if (password.length > 128) {
      setError("Password must be 128 characters or less.");
      return;
    }
    setLoading(true);
    const targetEmail = activeSession.email;
    const targetUsername = activeSession.username;
    await saveRegisteredAccount(targetEmail, targetUsername, password);
    setLoading(false);
    onLoginSuccess({
      identifier: targetEmail,
      username: targetUsername,
      loggedInAt: new Date().toISOString(),
      isReturning: true,
    });
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        input { font-family: inherit; }
        .otp-box:focus {
          border-color: #22301F !important;
          background: #FFFFFF !important;
        }
      `}</style>

      {/* Quick Explore Demo Banner */}
      {step === "input" && (
        <div style={{
          background: "#EDE8DC",
          border: "1px solid #D8D2C2",
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#22301F", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✨</span>
              <span>Explore All 6 Features (1-Click Demo)</span>
            </div>
            <div style={{ fontSize: 12, color: "#5B5545", marginTop: 2 }}>
              Instant access with sample habits, leftover tracking, focus timer, daily journal, streak battles, and admin panel.
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoExplore}
            style={{
              background: "#22301F",
              color: "#FAF7F1",
              border: "none",
              borderRadius: 6,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(34, 48, 31, 0.15)",
              whiteSpace: "nowrap"
            }}
          >
            Explore Demo Mode →
          </button>
        </div>
      )}

      {/* Mode Switcher Tabs (Sign In vs Create Account) */}
      {step === "input" && authMode !== "forgot" && (
        <div style={styles.authToggle}>
          <button
            type="button"
            style={{
              ...styles.authTab,
              ...(authMode === "signin" ? styles.authTabActive : {}),
            }}
            onClick={() => {
              setAuthMode("signin");
              setError(null);
              setInfoMessage(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              ...styles.authTab,
              ...(authMode === "signup" ? styles.authTabActive : {}),
            }}
            onClick={() => {
              setAuthMode("signup");
              setError(null);
              setInfoMessage(null);
            }}
          >
            Create Account
          </button>
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.title}>
          {step === "input"
            ? (authMode === "signup"
                ? "Create Account"
                : (authMode === "forgot" ? "Reset Password" : "Sign In"))
            : (step === "otp" ? "Verify Email" : "Set New Password")}
        </h1>
        <p style={styles.subtitle}>
          {step === "input" && authMode === "signin" && "Welcome back! Enter your email and password to access your habits."}
          {step === "input" && authMode === "signup" && "Choose your username, email, and password. An OTP is only needed this first time."}
          {step === "input" && authMode === "forgot" && "Enter your registered email to receive a password reset code."}
          {step === "otp" && `We sent a 6-digit code to ${identifier}. This verification is only needed once.`}
          {step === "new_password" && "Enter your new password below to complete reset."}
        </p>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {infoMessage && <div style={styles.infoBanner}>{infoMessage}</div>}

      <div style={styles.addForm}>
        {step === "input" ? (
          <>
            {authMode === "signup" && (
              <>
                <label style={styles.fieldLabel}>Choose a Username</label>
                <input
                  autoFocus
                  type="text"
                  style={styles.input}
                  placeholder="e.g. Jordan or Alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </>
            )}

            <label style={styles.fieldLabel}>Email address</label>
            <input
              autoFocus={authMode !== "signup"}
              type="email"
              style={styles.input}
              placeholder="e.g. name@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && authMode === "forgot") handleSendForgotOtp();
              }}
            />

            {authMode !== "forgot" && (
              <>
                <label style={styles.fieldLabel}>
                  {authMode === "signup" ? "Create a Password" : "Password"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    style={{ ...styles.input, paddingRight: 56, width: "100%" }}
                    placeholder={authMode === "signup" ? "Create a password (min 4 chars)" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (authMode === "signup") handleCreateAccount();
                        else handlePasswordSignIn();
                      }
                    }}
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </>
            )}

            {authMode === "signup" && (
              <>
                <label style={styles.fieldLabel}>
                  Date of Birth <span style={{ color: "#B0654A", fontWeight: 700 }}>*</span> (Age Verification)
                </label>
                <input
                  type="date"
                  style={styles.input}
                  max={new Date().toISOString().split("T")[0]}
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateAccount();
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    margin: "6px 0 12px",
                    background: "#F4EFE6",
                    border: "1px solid #E8E3D6",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="ageConsentCheck"
                    checked={ageConfirmed}
                    onChange={(e) => {
                      setAgeConfirmed(e.target.checked);
                      setError(null);
                    }}
                    style={{
                      marginTop: 2,
                      width: 16,
                      height: 16,
                      accentColor: "#7C9473",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <label
                    htmlFor="ageConsentCheck"
                    style={{
                      fontSize: 12,
                      color: "#4A4536",
                      lineHeight: 1.45,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <strong>Age Verification & Safety:</strong> I confirm that I am at least <strong>13 years of age</strong> (COPPA compliant) and agree to the Terms of Service.
                  </label>
                </div>
              </>
            )}

            <div style={styles.formActions}>
              {authMode === "signin" && (
                <button
                  style={{ ...styles.primaryBtn, width: "100%" }}
                  onClick={handlePasswordSignIn}
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              )}

              {authMode === "signup" && (
                <button
                  type="button"
                  style={{ ...styles.primaryBtn, width: "100%" }}
                  onClick={handleCreateAccount}
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create Account & Sign In →"}
                </button>
              )}

              {authMode === "forgot" && (
                <button
                  style={{ ...styles.primaryBtn, width: "100%" }}
                  onClick={handleSendForgotOtp}
                  disabled={loading}
                >
                  {loading ? "Sending code…" : "Send Reset Code"}
                </button>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
              {authMode === "signin" && (
                <>
                  <p style={styles.helperText}>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      style={styles.inlineLink}
                      onClick={() => {
                        setAuthMode("signup");
                        setError(null);
                        setInfoMessage(null);
                      }}
                    >
                      Create account
                    </button>
                  </p>
                  <button
                    type="button"
                    style={styles.ghostLink}
                    onClick={() => {
                      setAuthMode("forgot");
                      setError(null);
                      setInfoMessage(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </>
              )}

              {authMode === "signup" && (
                <p style={styles.helperText}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    style={styles.inlineLink}
                    onClick={() => {
                      setAuthMode("signin");
                      setError(null);
                      setInfoMessage(null);
                    }}
                  >
                    Sign in with password
                  </button>
                </p>
              )}

              {authMode === "forgot" && (
                <button
                  type="button"
                  style={styles.ghostLink}
                  onClick={() => {
                    setAuthMode("signin");
                    setError(null);
                    setInfoMessage(null);
                  }}
                >
                  ← Back to Sign In
                </button>
              )}
            </div>
          </>
        ) : step === "otp" ? (
          <>
            <div style={styles.otpContainer}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className="otp-box"
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={handleOtpPaste}
                  style={styles.otpInput}
                />
              ))}
            </div>

            <div style={styles.resendRow}>
              {resendTimer > 0 ? (
                <span style={styles.timerText}>
                  Resend code in {resendTimer}s
                </span>
              ) : (
                <button
                  style={styles.addLink}
                  onClick={() => {
                    if (activeSession?.authMode === "signup") handleSendSignupOtp();
                    else handleSendForgotOtp();
                  }}
                  disabled={loading}
                >
                  Resend code
                </button>
              )}
              <button
                style={styles.ghostLink}
                onClick={() => {
                  setStep("input");
                  setError(null);
                  setInfoMessage(null);
                }}
              >
                Back / Edit info
              </button>
            </div>

            <div style={styles.formActions}>
              <button
                style={{ ...styles.primaryBtn, width: "100%" }}
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? "Verifying…" : "Confirm Code & Complete Registration"}
              </button>
            </div>
          </>
        ) : (
          /* step === "new_password" */
          <>
            <label style={styles.fieldLabel}>Set New Password</label>
            <div style={{ position: "relative" }}>
              <input
                autoFocus
                type={showPassword ? "text" : "password"}
                style={{ ...styles.input, paddingRight: 56, width: "100%" }}
                placeholder="Enter new password (min 4 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNewPassword();
                }}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div style={styles.formActions}>
              <button
                style={{ ...styles.primaryBtn, width: "100%" }}
                onClick={handleSaveNewPassword}
                disabled={loading}
              >
                {loading ? "Saving…" : "Save New Password & Sign In"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   CREATE A HABIT MODAL
   ========================================================================= */
function CreateHabitModal({ isOpen, onClose, onSaveHabit }) {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [customIcon, setCustomIcon] = useState("");
  const [color, setColor] = useState(PALETTE[0].hex);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(HABIT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Routine time: "anytime" | "morning" | "afternoon" | "evening"
  const [routineTime, setRoutineTime] = useState("anytime");

  // Frequency: "everyday" | "specific_days"
  const [frequencyType, setFrequencyType] = useState("everyday");
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]); // Mon-Fri default

  // Period: "ongoing" | "month" | "custom_period"
  const [periodType, setPeriodType] = useState("ongoing");
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return keyFromDate(d);
  });

  // Reminder
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [notifPermission, setNotifPermission] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";
  });
  const [error, setError] = useState(null);

  async function requestNotificationPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      } catch (e) {}
    }
  }

  function toggleDay(dayId) {
    if (daysOfWeek.includes(dayId)) {
      if (daysOfWeek.length === 1) return; // Keep at least 1 day
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayId));
    } else {
      setDaysOfWeek([...daysOfWeek, dayId].sort((a, b) => a - b));
    }
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter a habit name.");
      return;
    }
    if (cleanName.length > 100) {
      setError("Habit name must be 100 characters or less.");
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || "General")
      : category;

    const finalIcon = customIcon.trim() || icon || "✨";

    let finalEndDate = null;
    if (periodType === "month") {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      finalEndDate = keyFromDate(d);
    } else if (periodType === "custom_period") {
      finalEndDate = endDate;
    }

    const newHabit = {
      id: `h_${Date.now()}`,
      name: cleanName,
      icon: finalIcon,
      color: color,
      description: description.trim(),
      category: finalCategory,
      routineTime: routineTime || "anytime",
      frequencyType: frequencyType,
      daysOfWeek: frequencyType === "specific_days" ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      periodType: periodType,
      startDate: startDate || todayKey(),
      endDate: finalEndDate,
      reminderTime: hasReminder && reminderTime ? reminderTime : "",
      createdAt: todayKey(),
    };

    onSaveHabit(newHabit);
    onClose();
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Create a Habit</h2>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Quick-Start Templates Picker */}
        <div style={{ padding: "12px 14px", background: "#FAF7F1", borderRadius: 10, border: "1px solid #E8E3D6", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5B5545" }}>
              ✨ Quick-Start Templates
            </span>
            <span style={{ fontSize: 11, color: "#8A8371" }}>One-click auto-fill</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {HABIT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setName(tpl.name);
                  setCategory(tpl.category);
                  setIsCustomCategory(false);
                  setIcon(tpl.icon);
                  setCustomIcon("");
                  setColor(tpl.color);
                  setDescription(tpl.description);
                  setFrequencyType(tpl.frequencyType);
                  if (error) setError(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "#FFFFFF",
                  border: "1px solid #DED8C8",
                  borderRadius: 16,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#22301F",
                  cursor: "pointer",
                }}
                title={tpl.description}
              >
                <MinimalIcon name={tpl.icon} size={13} color={tpl.color} />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {/* Habit Name */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Habit Name *</label>
            <input
              autoFocus
              type="text"
              style={styles.modalInput}
              placeholder="e.g. Morning Run, Read 10 pages, Meditate"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          {/* Choose an Icon */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Choose an Icon (Minimalist line style)</label>
            <div style={styles.iconScrollGrid}>
              {HABIT_ICONS.map((iconKey) => {
                const isSelected = icon === iconKey && !customIcon;
                const iconDef = MINIMAL_ICONS[iconKey];
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => {
                      setIcon(iconKey);
                      setCustomIcon("");
                    }}
                    style={{
                      ...styles.iconPickerBtn,
                      background: isSelected ? `${color}20` : "#FFFFFF",
                      borderColor: isSelected ? color : "#DED8C8",
                      color: isSelected ? color : "#5B5545",
                    }}
                    title={iconDef?.label || iconKey}
                  >
                    <MinimalIcon name={iconKey} size={18} color={isSelected ? color : "#5B5545"} />
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "#8A8371" }}>Or custom emoji/symbol:</span>
              <input
                type="text"
                maxLength={4}
                style={{ ...styles.modalInput, width: 60, textAlign: "center", padding: "4px 8px" }}
                placeholder="🎯"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
              />
              <span style={{ fontSize: 13, color: "#8A8371", display: "inline-flex", alignItems: "center", gap: 6 }}>
                Selected:
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${color}18`,
                    border: `1px solid ${color}44`,
                  }}
                >
                  <MinimalIcon name={customIcon || icon} size={16} color={color} />
                </span>
              </span>
            </div>
          </div>

          {/* Choose Color */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Habit Color</label>
            <div style={styles.swatches}>
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  style={{
                    ...styles.swatch,
                    background: c.hex,
                    outline: color === c.hex ? "3px solid #22301F" : "none",
                    outlineOffset: 2,
                    cursor: "pointer",
                  }}
                  title={c.name}
                  aria-label={`Choose ${c.name}`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Description / Notes (Optional)</label>
            <textarea
              rows={2}
              style={{ ...styles.modalInput, resize: "vertical", minHeight: 48 }}
              placeholder="e.g. 15 minutes before breakfast, no phone"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Category</label>
            <div style={styles.chipRow}>
              {HABIT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setIsCustomCategory(false);
                  }}
                  style={{
                    ...styles.chipBtn,
                    ...(category === cat && !isCustomCategory ? styles.chipBtnActive : {}),
                  }}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomCategory(true)}
                style={{
                  ...styles.chipBtn,
                  ...(isCustomCategory ? styles.chipBtnActive : {}),
                }}
              >
                + Custom
              </button>
            </div>
            {isCustomCategory && (
              <input
                type="text"
                autoFocus
                style={{ ...styles.modalInput, marginTop: 6 }}
                placeholder="Enter custom category (e.g. Finance, Creative)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          {/* Routine Time */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Routine Time</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { id: "anytime", label: "Anytime", icon: "⭐" },
                { id: "morning", label: "Morning", icon: "🌅" },
                { id: "afternoon", label: "Afternoon", icon: "☀️" },
                { id: "evening", label: "Evening", icon: "🌙" },
              ].map((r) => {
                const active = routineTime === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoutineTime(r.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: active ? `2px solid ${color || "#7C9473"}` : "1px solid #DED8C8",
                      background: active ? (color ? `${color}18` : "#EEF3EB") : "#FFFFFF",
                      color: active ? (color || "#22301F") : "#5B5545",
                      cursor: "pointer",
                      fontWeight: active ? 700 : 500,
                      fontSize: 12,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule & Frequency */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Frequency (Few days a week or Everyday)</label>
            <div style={styles.radioGroup}>
              <button
                type="button"
                onClick={() => setFrequencyType("everyday")}
                style={{
                  ...styles.pillBtn,
                  ...(frequencyType === "everyday" ? styles.pillBtnActive : {}),
                }}
              >
                Everyday (7 days)
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("specific_days")}
                style={{
                  ...styles.pillBtn,
                  ...(frequencyType === "specific_days" ? styles.pillBtnActive : {}),
                }}
              >
                Few days a week
              </button>
            </div>

            {frequencyType === "specific_days" && (
              <div style={styles.daysSelectorRow}>
                {DAYS_OF_WEEK.map((d) => {
                  const selected = daysOfWeek.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      style={{
                        ...styles.dayCircleBtn,
                        background: selected ? color : "#FFFFFF",
                        color: selected ? "#FAF7F1" : "#22301F",
                        borderColor: selected ? color : "#DED8C8",
                      }}
                      title={d.full}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Period / Duration */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Target Duration / Period</label>
            <div style={styles.radioGroup}>
              <button
                type="button"
                onClick={() => setPeriodType("ongoing")}
                style={{
                  ...styles.pillBtn,
                  ...(periodType === "ongoing" ? styles.pillBtnActive : {}),
                }}
              >
                Ongoing Habit
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("month")}
                style={{
                  ...styles.pillBtn,
                  ...(periodType === "month" ? styles.pillBtnActive : {}),
                }}
              >
                1 Month Challenge (30 Days)
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("custom_period")}
                style={{
                  ...styles.pillBtn,
                  ...(periodType === "custom_period" ? styles.pillBtnActive : {}),
                }}
              >
                Specific Period
              </button>
            </div>

            {periodType === "custom_period" && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#8A8371" }}>Start Date</label>
                  <input
                    type="date"
                    style={styles.modalInput}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#8A8371" }}>End Date</label>
                  <input
                    type="date"
                    style={styles.modalInput}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Daily Reminder */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Daily Reminder</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="reminder-checkbox"
                checked={hasReminder}
                onChange={(e) => {
                  setHasReminder(e.target.checked);
                  if (e.target.checked && notifPermission === "default") {
                    requestNotificationPermission();
                  }
                }}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="reminder-checkbox" style={{ cursor: "pointer", fontSize: 13, color: "#22301F" }}>
                Set a reminder at a specific time of the day
              </label>
            </div>

            {hasReminder && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="time"
                  style={{ ...styles.modalInput, width: 130 }}
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
                <span style={{ fontSize: 12, color: "#8A8371" }}>
                  Alerts you at {formatTime12h(reminderTime)}
                </span>
                {notifPermission !== "granted" && (
                  <button
                    type="button"
                    style={styles.notifPermBtn}
                    onClick={requestNotificationPermission}
                  >
                    Enable Browser Notifications 🔔
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div style={styles.modalActions}>
            <button type="submit" style={{ ...styles.primaryBtn, flex: 1 }}>
              Create Habit
            </button>
            <button type="button" style={styles.ghostBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   CREATE CHALLENGE MODAL COMPONENT
   ========================================================================= */
function CreateChallengeModal({
  isOpen,
  onClose,
  currentUser,
  existingHabits = [],
  prefillHabit = null,
  onChallengeCreated,
}) {
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("sparkle");
  const [habitColor, setHabitColor] = useState("#7C9473");
  const [goalType, setGoalType] = useState("target_days"); // 'longest_streak' | 'target_days'
  const [targetDays, setTargetDays] = useState(7);
  const [friendInput, setFriendInput] = useState("");
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [copiedMyCode, setCopiedMyCode] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (prefillHabit) {
        setHabitName(prefillHabit.name || "");
        setHabitIcon(prefillHabit.icon || "sparkle");
        setHabitColor(prefillHabit.color || "#7C9473");
      } else if (existingHabits.length > 0) {
        setHabitName(existingHabits[0].name);
        setHabitIcon(existingHabits[0].icon || "sparkle");
        setHabitColor(existingHabits[0].color || "#7C9473");
      } else {
        setHabitName("");
        setHabitIcon("run");
        setHabitColor("#7C9473");
      }
      setGoalType("target_days");
      setTargetDays(7);
      setFriendInput("");
      setError(null);

      (async () => {
        const others = await getOtherRegisteredAccounts(currentUser?.identifier);
        setSuggestedFriends(others);
      })();
    }
  }, [isOpen, prefillHabit, existingHabits, currentUser]);

  if (!isOpen) return null;

  function handleCopyMyCode() {
    if (!currentUser?.code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`#${currentUser.code}`);
    }
    setCopiedMyCode(true);
    setTimeout(() => setCopiedMyCode(false), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanHabitName = habitName.trim();
    if (!cleanHabitName) {
      setError("Please specify a habit to compete on.");
      return;
    }

    const cleanFriend = friendInput.trim();
    if (!cleanFriend) {
      setError("Please enter your friend's unique code, username, or email.");
      return;
    }

    const cleanCurId = (currentUser?.identifier || "").trim().toLowerCase();
    const cleanCurUser = (currentUser?.username || "").trim().toLowerCase();
    const cleanCurCode = (currentUser?.code || "").replace(/^#/, "").trim().toUpperCase();

    const cleanInput = cleanFriend.replace(/^#/, "").trim();

    if (
      cleanInput.toLowerCase() === cleanCurId ||
      cleanInput.toLowerCase() === cleanCurUser ||
      cleanInput.toLowerCase() === `@${cleanCurUser}` ||
      (cleanCurCode && cleanInput.toUpperCase() === cleanCurCode)
    ) {
      setError("You cannot challenge yourself! Enter a friend's unique code, username, or email.");
      return;
    }

    let friendEmail = "";
    let friendUsername = "";
    let friendCode = "";

    // Look for matching friend in registered accounts by code, username, or email
    const allAccounts = await getRegisteredAccounts();
    const cleanNoAt = cleanInput.replace(/^@/, "").toLowerCase();
    const cleanUpperCode = cleanInput.replace(/^#/, "").toUpperCase();

    const match = Object.values(allAccounts).find((acc) => {
      const accCode = (acc.code || "").replace(/^#/, "").trim().toUpperCase();
      const accUser = (acc.username || "").trim().toLowerCase();
      const accEmail = (acc.email || "").trim().toLowerCase();
      const accPrefix = accEmail.split("@")[0];

      return (
        (accCode && accCode === cleanUpperCode) ||
        (accUser && (accUser === cleanNoAt || accUser === cleanInput.toLowerCase())) ||
        (accEmail && (accEmail === cleanFriend.toLowerCase() || accPrefix === cleanNoAt))
      );
    });

    if (match) {
      friendEmail = match.email;
      friendUsername = match.username || "";
      friendCode = match.code || "";
    } else if (cleanFriend.includes("@")) {
      friendEmail = cleanFriend.toLowerCase();
      friendUsername = cleanFriend.split("@")[0];
    } else if (cleanFriend.startsWith("#") || cleanUpperCode.length === 6) {
      friendCode = cleanUpperCode;
    } else {
      friendUsername = cleanNoAt;
    }

    const newChallenge = {
      id: "chal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      habitName: cleanHabitName,
      habitIcon,
      habitColor,
      goalType,
      targetDays: goalType === "target_days" ? targetDays : null,
      creator: {
        identifier: cleanCurId,
        username: currentUser?.username || cleanCurId.split("@")[0],
        code: currentUser?.code || "",
      },
      participant: {
        identifier: friendEmail || "",
        username: friendUsername || "",
        code: friendCode || "",
        rawInput: cleanFriend,
      },
      status: "pending",
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      winner: null,
      completions: {
        [cleanCurId]: {},
      },
    };

    onChallengeCreated(newChallenge);
    onClose();
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "#EDE8DC" }}>
              <MinimalIcon name="swords" size={16} color="#22301F" />
            </span>
            <h2 style={styles.modalTitle}>Challenge a Friend</h2>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose} type="button">✕</button>
        </div>

        {currentUser?.code && (
          <div style={styles.challengerCodeSnippet}>
            <span style={{ fontSize: 11, color: "#8A8371" }}>Your Challenge Code:</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#22301F" }}>
              #{currentUser.code}
            </span>
            <button
              type="button"
              onClick={handleCopyMyCode}
              style={styles.copySmallLink}
            >
              {copiedMyCode ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Quick Pick Habit from Existing */}
          {existingHabits.length > 0 && (
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Select from Your Habits</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {existingHabits.map((h) => {
                  const isSelected = habitName.toLowerCase() === h.name.toLowerCase();
                  return (
                    <button
                      key={h.id}
                      type="button"
                      style={{
                        ...styles.filterChip,
                        backgroundColor: isSelected ? "#22301F" : "#F4EFE6",
                        color: isSelected ? "#FAF7F1" : "#5B5545",
                        borderColor: isSelected ? "#22301F" : "#E8E3D6",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onClick={() => {
                        setHabitName(h.name);
                        setHabitIcon(h.icon || "sparkle");
                        setHabitColor(h.color || "#7C9473");
                      }}
                    >
                      <MinimalIcon name={h.icon || "sparkle"} size={13} color={isSelected ? "#FAF7F1" : h.color || "#7C9473"} />
                      {h.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Habit Name */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Habit Name *</label>
            <input
              type="text"
              style={styles.modalInput}
              placeholder="e.g. Morning 5km Run, Reading 20 mins"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              required
            />
          </div>

          {/* Icon & Color Selector */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Habit Icon & Color</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              {PALETTE.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: p.hex,
                    border: habitColor === p.hex ? "3px solid #22301F" : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                  }}
                  onClick={() => setHabitColor(p.hex)}
                  title={p.name}
                />
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, maxHeight: 110, overflowY: "auto", padding: "4px 2px" }}>
              {HABIT_ICONS.map((iconKey) => {
                const isSelected = habitIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 34,
                      borderRadius: 6,
                      border: isSelected ? `2px solid ${habitColor}` : "1px solid #E8E3D6",
                      backgroundColor: isSelected ? `${habitColor}1E` : "#FAF7F1",
                      cursor: "pointer",
                    }}
                    onClick={() => setHabitIcon(iconKey)}
                  >
                    <MinimalIcon name={iconKey} size={16} color={isSelected ? habitColor : "#5B5545"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Challenge Goal Mode */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>Challenge Goal *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                style={{
                  ...styles.periodOptionBtn,
                  borderColor: goalType === "longest_streak" ? "#22301F" : "#E8E3D6",
                  backgroundColor: goalType === "longest_streak" ? "#22301F" : "#F4EFE6",
                  color: goalType === "longest_streak" ? "#FAF7F1" : "#22301F",
                }}
                onClick={() => setGoalType("longest_streak")}
              >
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <MinimalIcon name="flame" size={13} color={goalType === "longest_streak" ? "#FAF7F1" : "#B0654A"} />
                  Endless Showdown
                </span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>Longest streak wins</span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.periodOptionBtn,
                  borderColor: goalType === "target_days" ? "#22301F" : "#E8E3D6",
                  backgroundColor: goalType === "target_days" ? "#22301F" : "#F4EFE6",
                  color: goalType === "target_days" ? "#FAF7F1" : "#22301F",
                }}
                onClick={() => setGoalType("target_days")}
              >
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <MinimalIcon name="trophy" size={13} color={goalType === "target_days" ? "#FAF7F1" : "#C08A2E"} />
                  Target Milestone
                </span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>First to reach streak wins</span>
              </button>
            </div>

            {goalType === "target_days" && (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    style={{
                      ...styles.dayOfWeekBtn,
                      flex: 1,
                      backgroundColor: targetDays === days ? "#22301F" : "#F4EFE6",
                      color: targetDays === days ? "#FAF7F1" : "#5B5545",
                      borderColor: targetDays === days ? "#22301F" : "#E8E3D6",
                      fontWeight: 600,
                      height: 34,
                      fontSize: 12,
                    }}
                    onClick={() => setTargetDays(days)}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Friend Invitation */}
          <div style={styles.modalField}>
            <label style={styles.modalLabel}>
              Invite Friend by Code, Username, or Email *
            </label>
            <input
              type="text"
              style={styles.modalInput}
              placeholder="e.g. #7K9X2B, @alex, or alex@domain.com"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              required
            />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8A8371" }}>
              💡 Entering a friend's 6-character code (e.g. <code>#7K9X2B</code>) makes inviting fast and foolproof.
            </p>

            {suggestedFriends.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#8A8371", marginRight: 6 }}>
                  Quick pick registered user:
                </span>
                <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {suggestedFriends.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      style={styles.friendPickChip}
                      onClick={() => setFriendInput(acc.code ? `#${acc.code}` : (acc.username ? `@${acc.username}` : acc.email))}
                      title={acc.code ? `Unique Code: #${acc.code}` : acc.email}
                    >
                      <span>{acc.username ? `@${acc.username}` : acc.email}</span>
                      {acc.code && (
                        <span style={{ fontFamily: "monospace", opacity: 0.7, fontWeight: 600 }}>
                          #{acc.code}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Box */}
          <div style={styles.challengeSummaryBox}>
            <MinimalIcon name="swords" size={14} color="#B0654A" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "#5B5545", lineHeight: 1.4 }}>
              <strong>How it works:</strong> Both you and your friend check in daily. If either of you misses a day, that streak resets.{" "}
              {goalType === "longest_streak"
                ? "The player who holds their streak the longest takes the win!"
                : `The first player to reach a consecutive ${targetDays}-day streak wins the trophy!`}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={styles.modalActions}>
            <button type="submit" style={{ ...styles.primaryBtn, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MinimalIcon name="swords" size={14} color="#FAF7F1" />
              Send Challenge Invite
            </button>
            <button type="button" style={styles.ghostBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MAILBOX MODAL COMPONENT (Unified Hub for Challenges & Daily Reminders)
   ========================================================================= */
function MailboxModal({
  isOpen,
  onClose,
  currentUser,
  challenges = [],
  habits = [],
  completions = {},
  today,
  onAcceptChallenge,
  onRejectChallenge,
  onCancelChallenge,
  onCopyInviteLink,
  onToggleHabit,
  onOpenCreateChallenge,
  onNavigateToChallenges,
}) {
  const [activeMailboxTab, setActiveMailboxTab] = useState("all"); // 'all' | 'incoming' | 'sent' | 'reminders'
  const [actionFeedback, setActionFeedback] = useState(null);

  if (!isOpen) return null;

  const todayDayOfWeek = new Date().getDay();

  // 1. Pending incoming challenges
  const incomingChallenges = challenges.filter(
    (c) => c.status === "pending" && isChallengeForUser(c, currentUser) && !isChallengeFromUser(c, currentUser)
  );

  // 2. Pending sent invitations
  const pendingSentInvites = challenges.filter(
    (c) => c.status === "pending" && isChallengeFromUser(c, currentUser)
  );

  // 3. Active battles
  const activeChallenges = challenges.filter(
    (c) => c.status === "active" && (isChallengeFromUser(c, currentUser) || isChallengeForUser(c, currentUser))
  );

  // 4. Habits due today
  const dueTodayHabits = habits.filter((h) => {
    if (h.frequencyType === "specific_days" && h.daysOfWeek?.length > 0) {
      return h.daysOfWeek.includes(todayDayOfWeek);
    }
    return true;
  });

  const uncompletedHabits = dueTodayHabits.filter((h) => !(completions[today] || {})[h.id]);
  const completedHabits = dueTodayHabits.filter((h) => !!(completions[today] || {})[h.id]);

  const totalUnread = incomingChallenges.length + uncompletedHabits.length;

  function showFeedback(msg) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{ ...styles.modalContent, maxWidth: 580, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: totalUnread > 0 ? "#F9EFEA" : "#EDE8DC",
              }}
            >
              <MinimalIcon name="inbox" size={18} color={totalUnread > 0 ? "#B0654A" : "#22301F"} />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ ...styles.modalTitle, margin: 0 }}>Mailbox</h2>
                {totalUnread > 0 ? (
                  <span style={styles.mailboxModalBadge}>{totalUnread} pending</span>
                ) : (
                  <span style={styles.mailboxAllClearBadge}>All caught up ✓</span>
                )}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#8A8371" }}>
                Streak battle invitations and your daily task reminders in one place
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onOpenCreateChallenge && (
              <button
                type="button"
                style={{
                  background: "#22301F",
                  color: "#FAF7F1",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
                onClick={() => {
                  onClose();
                  onOpenCreateChallenge();
                }}
              >
                <MinimalIcon name="plus" size={12} color="#FAF7F1" />
                Send Challenge
              </button>
            )}
            <button style={styles.modalCloseBtn} onClick={onClose} type="button">✕</button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div style={styles.mailboxFeedbackBanner}>
            {actionFeedback}
          </div>
        )}

        {/* Tab Filters */}
        <div style={styles.mailboxSubNav}>
          <button
            type="button"
            style={activeMailboxTab === "all" ? styles.mailboxTabActive : styles.mailboxTabInactive}
            onClick={() => setActiveMailboxTab("all")}
          >
            All Items ({incomingChallenges.length + pendingSentInvites.length + dueTodayHabits.length})
          </button>
          <button
            type="button"
            style={activeMailboxTab === "incoming" ? styles.mailboxTabActive : styles.mailboxTabInactive}
            onClick={() => setActiveMailboxTab("incoming")}
          >
            <MinimalIcon name="swords" size={12} style={{ marginRight: 4 }} />
            Incoming ({incomingChallenges.length})
          </button>
          <button
            type="button"
            style={activeMailboxTab === "sent" ? styles.mailboxTabActive : styles.mailboxTabInactive}
            onClick={() => setActiveMailboxTab("sent")}
          >
            <MinimalIcon name="users" size={12} style={{ marginRight: 4 }} />
            Sent ({pendingSentInvites.length})
          </button>
          <button
            type="button"
            style={activeMailboxTab === "reminders" ? styles.mailboxTabActive : styles.mailboxTabInactive}
            onClick={() => setActiveMailboxTab("reminders")}
          >
            <MinimalIcon name="bell" size={12} style={{ marginRight: 4 }} />
            Daily Tasks ({uncompletedHabits.length} due)
          </button>
        </div>

        {/* Modal Body / Scrollable Area */}
        <div style={{ overflowY: "auto", paddingRight: 4, flex: 1 }}>
          {/* SECTION 1: INCOMING CHALLENGES */}
          {(activeMailboxTab === "all" || activeMailboxTab === "incoming") && (
            <div style={{ marginBottom: 20 }}>
              <div style={styles.mailboxSectionHeading}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MinimalIcon name="swords" size={14} color="#B0654A" />
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#22301F" }}>
                    Incoming Challenge Invites
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8A8371" }}>
                    {incomingChallenges.length} waiting
                  </span>
                  {onOpenCreateChallenge && (
                    <button
                      type="button"
                      style={{
                        background: "#EDE8DC",
                        border: "1px solid #DED8C8",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#22301F",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        onClose();
                        onOpenCreateChallenge();
                      }}
                    >
                      + Send Challenge
                    </button>
                  )}
                </div>
              </div>

              {incomingChallenges.length === 0 ? (
                <div style={styles.mailboxEmptyCard}>
                  <MinimalIcon name="swords" size={16} color="#B4AE9F" style={{ marginBottom: 4 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#8A8371" }}>
                    No pending challenge requests from friends right now.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {incomingChallenges.map((inv) => {
                    const challengerCode = inv.creator?.code ? `#${inv.creator.code}` : "";
                    const challengerName = inv.creator?.username
                      ? (challengerCode ? `@${inv.creator.username} (${challengerCode})` : `@${inv.creator.username}`)
                      : (challengerCode || inv.creator?.identifier);
                    const habitColor = inv.habitColor || "#7C9473";
                    const habitIcon = inv.habitIcon || "sparkle";

                    return (
                      <div key={inv.id} style={styles.mailboxChallengeCard}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div
                            style={{
                              ...styles.habitIconBadge,
                              backgroundColor: `${habitColor}18`,
                              borderColor: `${habitColor}33`,
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                            }}
                          >
                            <MinimalIcon name={habitIcon} size={18} color={habitColor} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#22301F" }}>
                                {inv.habitName}
                              </span>
                              <span style={{ ...styles.metaBadge, backgroundColor: "#FAF0E6", color: "#B0654A", fontSize: 10.5, padding: "2px 6px" }}>
                                <MinimalIcon name="swords" size={10} color="#B0654A" style={{ marginRight: 3 }} />
                                {inv.goalType === "longest_streak" ? "Longest Streak" : `First to ${inv.targetDays} Days`}
                              </span>
                            </div>

                            <div style={{ fontSize: 12, color: "#5B5545", marginTop: 3 }}>
                              From: <strong>{challengerName}</strong>
                            </div>

                            <div style={{ fontSize: 11, color: "#8A8371", marginTop: 2 }}>
                              Received {new Date(inv.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} • Battle will start once accepted
                            </div>
                          </div>
                        </div>

                        {/* Accept / Reject Buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end", borderTop: "1px solid #F0ECE1", paddingTop: 10 }}>
                          <button
                            type="button"
                            style={styles.mailboxRejectBtn}
                            onClick={async () => {
                              await onRejectChallenge(inv);
                              showFeedback(`Rejected challenge for "${inv.habitName}".`);
                            }}
                          >
                            Reject ✕
                          </button>
                          <button
                            type="button"
                            style={styles.mailboxAcceptBtn}
                            onClick={async () => {
                              await onAcceptChallenge(inv);
                              showFeedback(`Accepted! Streak battle for "${inv.habitName}" has begun ⚔️`);
                            }}
                          >
                            <MinimalIcon name="swords" size={13} color="#FAF7F1" style={{ marginRight: 4 }} />
                            Accept Challenge
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: SENT CHALLENGE INVITATIONS */}
          {(activeMailboxTab === "all" || activeMailboxTab === "sent") && (
            <div style={{ marginBottom: 20 }}>
              <div style={styles.mailboxSectionHeading}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MinimalIcon name="users" size={14} color="#7C9473" />
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#22301F" }}>
                    Your Sent Invitations (Waiting for Friends)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8A8371" }}>
                    {pendingSentInvites.length} pending
                  </span>
                  {onOpenCreateChallenge && (
                    <button
                      type="button"
                      style={{
                        background: "#22301F",
                        color: "#FAF7F1",
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        onClose();
                        onOpenCreateChallenge();
                      }}
                    >
                      + Send New
                    </button>
                  )}
                </div>
              </div>

              {pendingSentInvites.length === 0 ? (
                <div style={styles.mailboxEmptyCard}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8A8371" }}>
                    You haven't sent any challenge invites waiting for friends.
                  </p>
                  {onOpenCreateChallenge && (
                    <button
                      type="button"
                      style={{
                        background: "#7C9473",
                        color: "#FAF7F1",
                        border: "none",
                        borderRadius: 5,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        onClose();
                        onOpenCreateChallenge();
                      }}
                    >
                      Challenge a Friend Now +
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pendingSentInvites.map((sent) => {
                    const recipientCode = sent.participant?.code ? `#${sent.participant.code}` : "";
                    const recipient = sent.participant?.username
                      ? (recipientCode ? `@${sent.participant.username} (${recipientCode})` : `@${sent.participant.username}`)
                      : (recipientCode || sent.participant?.identifier);
                    return (
                      <div key={sent.id} style={styles.sentInviteCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ ...styles.habitIconBadge, backgroundColor: `${sent.habitColor || "#7C9473"}14` }}>
                            <MinimalIcon name={sent.habitIcon || "sparkle"} size={18} color={sent.habitColor || "#7C9473"} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#22301F" }}>
                              {sent.habitName} vs {recipient}
                            </div>
                            <div style={{ fontSize: 11, color: "#8A8371" }}>
                              Waiting for {recipient} to accept...
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {onCopyInviteLink && (
                            <button
                              type="button"
                              style={styles.shareBtn}
                              onClick={() => {
                                onCopyInviteLink(sent);
                                showFeedback(`Copied invite link for "${sent.habitName}"!`);
                              }}
                            >
                              <MinimalIcon name="share" size={12} color="#5B5545" style={{ marginRight: 4 }} />
                              Copy Link
                            </button>
                          )}
                          {onCancelChallenge && (
                            <button
                              type="button"
                              style={styles.cancelInviteBtn}
                              onClick={async () => {
                                await onCancelChallenge(sent);
                                showFeedback(`Cancelled invite for "${sent.habitName}".`);
                              }}
                              title="Cancel invite"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: DAILY TASK REMINDERS */}
          {(activeMailboxTab === "all" || activeMailboxTab === "reminders") && (
            <div>
              <div style={styles.mailboxSectionHeading}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MinimalIcon name="bell" size={14} color="#3A506B" />
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#22301F" }}>
                    Daily Tasks & Reminders (Today)
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#8A8371" }}>
                  {uncompletedHabits.length} due today
                </span>
              </div>

              {dueTodayHabits.length === 0 ? (
                <div style={styles.mailboxEmptyCard}>
                  <MinimalIcon name="calendar" size={16} color="#B4AE9F" style={{ marginBottom: 4 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#8A8371" }}>
                    No habits or reminders scheduled for today.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Pending tasks first, then completed */}
                  {[...uncompletedHabits, ...completedHabits].map((habit) => {
                    const isDone = !!(completions[today] || {})[habit.id];
                    const streak = computeStreak(completions, habit);
                    const habitColor = habit.color || "#7C9473";
                    const habitIcon = habit.icon || "sparkle";

                    return (
                      <div
                        key={habit.id}
                        style={{
                          ...styles.mailboxTaskCard,
                          opacity: isDone ? 0.75 : 1,
                          borderColor: isDone ? "#E8E3D6" : "#DDD7C7",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              ...styles.habitIconBadge,
                              backgroundColor: `${habitColor}14`,
                              borderColor: `${habitColor}33`,
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                            }}
                          >
                            <MinimalIcon name={habitIcon} size={16} color={habitColor} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: isDone ? "#6C6656" : "#22301F",
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                              >
                                {habit.name}
                              </span>

                              {/* Streak */}
                              <span style={{ ...styles.streakBadge, fontSize: 10.5, padding: "1px 6px" }}>
                                <MinimalIcon name="flame" size={11} color="#B0654A" style={{ marginRight: 3 }} />
                                {streak}d streak
                              </span>

                              {/* Reminder time badge */}
                              {habit.reminderTime && (
                                <span style={{ ...styles.metaBadge, backgroundColor: "#EBF3FA", color: "#3A506B", fontSize: 10.5, padding: "1px 6px" }}>
                                  <MinimalIcon name="bell" size={10} color="#3A506B" style={{ marginRight: 3 }} />
                                  {formatTime12h(habit.reminderTime)}
                                </span>
                              )}
                            </div>

                            {habit.description && (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: "#777060",
                                  marginTop: 2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {habit.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Task Action */}
                        <div style={{ flexShrink: 0, marginLeft: 8 }}>
                          {isDone ? (
                            <button
                              type="button"
                              style={styles.mailboxDoneBadge}
                              onClick={() => {
                                onToggleHabit(habit.id);
                                showFeedback(`Unmarked "${habit.name}".`);
                              }}
                              title="Click to undo"
                            >
                              Done ✓
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.mailboxCheckInBtn}
                              onClick={() => {
                                onToggleHabit(habit.id);
                                showFeedback(`Marked "${habit.name}" completed! Streak extended 🔥`);
                              }}
                            >
                              Mark Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #E8E3D6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {currentUser?.code && (
              <span style={{ fontSize: 11.5, color: "#8A8371" }}>
                Your code: <strong>#{currentUser.code}</strong>
              </span>
            )}
            {onNavigateToChallenges && (
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7C9473",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
                onClick={() => {
                  onClose();
                  onNavigateToChallenges();
                }}
              >
                Go to Battles Arena ({activeChallenges.length} active) →
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onOpenCreateChallenge && (
              <button
                type="button"
                style={{ ...styles.primaryBtn, background: "#7C9473", borderColor: "#7C9473", fontSize: 12, padding: "7px 14px" }}
                onClick={() => {
                  onClose();
                  onOpenCreateChallenge();
                }}
              >
                + New Challenge
              </button>
            )}
            <button type="button" style={styles.ghostBtn} onClick={onClose}>
              Close Mailbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   FRIEND CHALLENGES VIEW COMPONENT
   ========================================================================= */
function FriendChallengesView({
  currentUser,
  challenges = [],
  today,
  onAcceptChallenge,
  onDeclineChallenge,
  onCancelChallenge,
  onCheckIn,
  onOpenCreateModal,
  onCopyInviteLink,
  copyFeedback,
}) {
  const [copiedUserCode, setCopiedUserCode] = useState(false);

  const cleanId = (currentUser?.identifier || "").trim().toLowerCase();
  const cleanUser = (currentUser?.username || "").trim().toLowerCase();
  const cleanCode = (currentUser?.code || "").replace(/^#/, "").trim().toUpperCase();

  // Categorize challenges
  const incomingInvites = challenges.filter(
    (c) => c.status === "pending" && isChallengeForUser(c, currentUser) && !isChallengeFromUser(c, currentUser)
  );

  const activeChallenges = challenges.filter(
    (c) => c.status === "active" && (isChallengeFromUser(c, currentUser) || isChallengeForUser(c, currentUser))
  );

  const pendingSentInvites = challenges.filter(
    (c) => c.status === "pending" && isChallengeFromUser(c, currentUser)
  );

  const completedChallenges = challenges.filter(
    (c) => c.status === "completed" && (isChallengeFromUser(c, currentUser) || isChallengeForUser(c, currentUser))
  );

  return (
    <div>
      {/* Top Action Header */}
      <div style={styles.challengeHeaderBar}>
        <div>
          <h2 style={styles.challengeViewTitle}>Streak Battles</h2>
          <p style={styles.challengeViewSubtitle}>
            Go head-to-head with friends. Stay consistent daily to build and protect your streak!
          </p>
        </div>
        <button
          type="button"
          style={styles.challengeCreateBtn}
          onClick={onOpenCreateModal}
        >
          <span style={{ fontSize: 14, marginRight: 6, lineHeight: 1 }}>+</span>
          New Challenge
        </button>
      </div>

      {/* User Unique Challenge Code Card */}
      {currentUser?.code && (
        <div style={styles.friendCodeCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={styles.friendCodeBadgeIcon}>
                <MinimalIcon name="trophy" size={16} color="#7C9473" />
              </span>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A8371", fontWeight: 600 }}>
                  Your Unique Challenge Code
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#22301F", letterSpacing: "0.05em" }}>
                    #{currentUser.code}
                  </span>
                  <button
                    type="button"
                    style={styles.copyCodeBtn}
                    onClick={() => {
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(`#${currentUser.code}`);
                      }
                      setCopiedUserCode(true);
                      setTimeout(() => setCopiedUserCode(false), 2000);
                    }}
                  >
                    <MinimalIcon name="share" size={11} color="#FAF7F1" style={{ marginRight: 4 }} />
                    {copiedUserCode ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#5B5545", maxWidth: 300, lineHeight: 1.35 }}>
              Share this code with friends so they can challenge you to streak duels!
            </p>
          </div>
        </div>
      )}

      {copyFeedback && (
        <div style={styles.infoBanner}>
          <MinimalIcon name="share" size={13} color="#3B5A33" style={{ marginRight: 6 }} />
          {copyFeedback}
        </div>
      )}

      {/* 1. Pending Incoming Invites */}
      {incomingInvites.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={styles.challengeSectionTitle}>
            <MinimalIcon name="bell" size={14} color="#B0654A" style={{ marginRight: 6 }} />
            Pending Invitations ({incomingInvites.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {incomingInvites.map((inv) => {
              const challengerCode = inv.creator?.code ? `#${inv.creator.code}` : "";
              const challengerName = inv.creator?.username
                ? (challengerCode ? `@${inv.creator.username} (${challengerCode})` : `@${inv.creator.username}`)
                : (challengerCode || inv.creator?.identifier);
              const habitColor = inv.habitColor || "#7C9473";
              const habitIcon = inv.habitIcon || "sparkle";
              return (
                <div key={inv.id} style={styles.inviteNoticeCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...styles.habitIconBadge, backgroundColor: `${habitColor}14` }}>
                      <MinimalIcon name={habitIcon} size={20} color={habitColor} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#22301F" }}>
                        {challengerName} challenged you to a streak battle!
                      </div>
                      <div style={{ fontSize: 12, color: "#5B5545", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Habit: <strong>{inv.habitName}</strong></span>
                        <span>•</span>
                        <span>
                          {inv.goalType === "longest_streak"
                            ? "Endless Showdown"
                            : `${inv.targetDays}-Day Milestone`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      style={styles.acceptChallengeBtn}
                      onClick={() => onAcceptChallenge(inv)}
                    >
                      Accept Challenge ⚔️
                    </button>
                    <button
                      type="button"
                      style={styles.declineChallengeBtn}
                      onClick={() => onDeclineChallenge(inv)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Active Challenges (Head-to-Head Arena) */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={styles.challengeSectionTitle}>
          <MinimalIcon name="swords" size={14} color="#22301F" style={{ marginRight: 6 }} />
          Active Battles ({activeChallenges.length})
        </h3>

        {activeChallenges.length === 0 ? (
          <div style={styles.challengeEmptyBox}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: "#EDE8DC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <MinimalIcon name="swords" size={22} color="#8A8371" />
            </div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: "#22301F" }}>No active challenges yet</p>
            <p style={{ margin: "6px 0 16px", fontSize: 13, color: "#8A8371" }}>
              Invite a friend to see who can hold the longest streak without breaking!
            </p>
            <button
              type="button"
              style={styles.createHabitBigBtn}
              onClick={onOpenCreateModal}
            >
              <span style={{ fontSize: 14, marginRight: 6, lineHeight: 1 }}>+</span>
              Start a Streak Challenge
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeChallenges.map((c) => {
              const cId = (c.creator?.identifier || "").trim().toLowerCase();
              const pId = (c.participant?.identifier || "").trim().toLowerCase();
              const cCode = (c.creator?.code || "").replace(/^#/, "").trim().toUpperCase();
              const pCode = (c.participant?.code || "").replace(/^#/, "").trim().toUpperCase();

              const isCreator =
                (cCode && cleanCode && cCode === cleanCode) ||
                cleanId === cId ||
                (c.creator?.username && c.creator?.username.toLowerCase() === cleanUser);

              const myId = cleanId;
              const friendId = isCreator ? pId : cId;

              const myComps = (c.completions || {})[myId] || {};
              const friendComps = (c.completions || {})[friendId] || {};

              const myStreak = computeChallengeStreak(myComps);
              const friendStreak = computeChallengeStreak(friendComps);

              const myDoneToday = !!myComps[today];
              const friendDoneToday = !!friendComps[today];

              const friendInfo = isCreator ? c.participant : c.creator;
              const friendDisplayName = (isCreator ? c.participant?.username : c.creator?.username) ||
                (isCreator ? c.participant?.identifier?.split("@")[0] : c.creator?.identifier?.split("@")[0]) ||
                (friendInfo?.code ? `#${friendInfo.code}` : "Friend");
              const friendCode = friendInfo?.code ? `#${friendInfo.code}` : "";

              const habitColor = c.habitColor || "#7C9473";
              const habitIcon = c.habitIcon || "sparkle";

              let momentumText = "";
              let momentumColor = "#5B5545";
              if (myStreak > friendStreak) {
                const diff = myStreak - friendStreak;
                momentumText = `🔥 You're leading by ${diff} day${diff > 1 ? "s" : ""}! Keep the fire burning!`;
                momentumColor = "#7C9473";
              } else if (friendStreak > myStreak) {
                const diff = friendStreak - myStreak;
                momentumText = `⚡ @${friendDisplayName} is ahead by ${diff} day${diff > 1 ? "s" : ""}. Check in to catch up!`;
                momentumColor = "#C08A2E";
              } else {
                momentumText = `⚔️ Tied at ${myStreak} day${myStreak === 1 ? "" : "s"}! Who will hold out longer?`;
                momentumColor = "#5B7A8C";
              }

              const isTargetGoal = c.goalType === "target_days" && c.targetDays;
              const target = c.targetDays || 7;

              return (
                <div key={c.id} style={styles.challengeCard}>
                  {/* Card Header */}
                  <div style={styles.challengeCardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...styles.habitIconBadge, backgroundColor: `${habitColor}14` }}>
                        <MinimalIcon name={habitIcon} size={20} color={habitColor} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#22301F" }}>
                          {c.habitName}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                          <span style={styles.metaBadge}>
                            <MinimalIcon
                              name={c.goalType === "longest_streak" ? "flame" : "trophy"}
                              size={11}
                              color="#5B5545"
                              style={{ marginRight: 4 }}
                            />
                            {c.goalType === "longest_streak"
                              ? "Longest Streak Showdown"
                              : `First to ${target} Days`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={styles.shareBtn}
                      onClick={() => onCopyInviteLink(c)}
                      title="Copy invite link to share"
                    >
                      <MinimalIcon name="share" size={13} color="#5B5545" style={{ marginRight: 4 }} />
                      Share Link
                    </button>
                  </div>

                  {/* Head to Head Arena */}
                  <div style={styles.duelArena}>
                    {/* Left Player: Current User */}
                    <div style={styles.duelPlayerCol}>
                      <div style={styles.duelPlayerName}>
                        You (@{currentUser?.username || "You"})
                        {currentUser?.code && (
                          <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4, fontFamily: "monospace" }}>
                            #{currentUser.code}
                          </span>
                        )}
                      </div>
                      <div style={styles.duelStreakBox}>
                        <MinimalIcon name="flame" size={18} color="#B0654A" style={{ marginRight: 4 }} />
                        <span style={styles.duelStreakNumber}>{myStreak}</span>
                      </div>
                      <div style={styles.duelStreakLabel}>day streak</div>
                      <div style={{ marginTop: 8 }}>
                        {myDoneToday ? (
                          <span style={styles.duelDoneBadge}>Done today ✓</span>
                        ) : (
                          <button
                            type="button"
                            style={styles.duelCheckInBtn}
                            onClick={() => onCheckIn(c)}
                          >
                            Check In Today ✓
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div style={styles.duelVsDivider}>
                      <div style={styles.duelVsBadge}>VS</div>
                    </div>

                    {/* Right Player: Friend */}
                    <div style={styles.duelPlayerCol}>
                      <div style={styles.duelPlayerName}>
                        @{friendDisplayName}
                        {friendCode && (
                          <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4, fontFamily: "monospace" }}>
                            {friendCode}
                          </span>
                        )}
                      </div>
                      <div style={styles.duelStreakBox}>
                        <MinimalIcon name="flame" size={18} color="#C08A2E" style={{ marginRight: 4 }} />
                        <span style={styles.duelStreakNumber}>{friendStreak}</span>
                      </div>
                      <div style={styles.duelStreakLabel}>day streak</div>
                      <div style={{ marginTop: 8 }}>
                        {friendDoneToday ? (
                          <span style={styles.duelDoneBadge}>Done today ✓</span>
                        ) : (
                          <span style={styles.duelWaitingBadge}>Pending today ⏳</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars if Target Milestone */}
                  {isTargetGoal && (
                    <div style={{ marginTop: 14, background: "#FAF7F1", padding: "10px 12px", borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A8371", marginBottom: 4 }}>
                        <span>Target: {target} Days</span>
                        <span>You: {myStreak}/{target} | @{friendDisplayName}: {friendStreak}/{target}</span>
                      </div>
                      <div style={{ width: "100%", height: 6, background: "#E8E3D6", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                        <div
                          style={{
                            width: `${Math.min(100, (myStreak / target) * 100)}%`,
                            height: "100%",
                            background: "#7C9473",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div style={{ width: "100%", height: 6, background: "#E8E3D6", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, (friendStreak / target) * 100)}%`,
                            height: "100%",
                            background: "#C08A2E",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Momentum Status Bar */}
                  <div style={{ ...styles.duelMomentumBar, color: momentumColor }}>
                    {momentumText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Pending Sent Invites */}
      {pendingSentInvites.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={styles.challengeSectionTitle}>
            <MinimalIcon name="users" size={14} color="#8A8371" style={{ marginRight: 6 }} />
            Sent Invitations ({pendingSentInvites.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingSentInvites.map((sent) => {
              const recipientCode = sent.participant?.code ? `#${sent.participant.code}` : "";
              const recipient = sent.participant?.username
                ? (recipientCode ? `@${sent.participant.username} (${recipientCode})` : `@${sent.participant.username}`)
                : (recipientCode || sent.participant?.identifier);
              return (
                <div key={sent.id} style={styles.sentInviteCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ ...styles.habitIconBadge, backgroundColor: `${sent.habitColor || "#7C9473"}14` }}>
                      <MinimalIcon name={sent.habitIcon || "sparkle"} size={18} color={sent.habitColor || "#7C9473"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#22301F" }}>
                        {sent.habitName} vs {recipient}
                      </div>
                      <div style={{ fontSize: 11, color: "#8A8371" }}>
                        Waiting for {recipient} to accept...
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      type="button"
                      style={styles.shareBtn}
                      onClick={() => onCopyInviteLink(sent)}
                    >
                      <MinimalIcon name="share" size={12} color="#5B5545" style={{ marginRight: 4 }} />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      style={styles.cancelInviteBtn}
                      onClick={() => onCancelChallenge(sent)}
                      title="Cancel invite"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={styles.challengeSectionTitle}>
            <MinimalIcon name="trophy" size={14} color="#C08A2E" style={{ marginRight: 6 }} />
            Past Challenges ({completedChallenges.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {completedChallenges.map((c) => {
              const isWinner = c.winner === cleanId;
              return (
                <div key={c.id} style={styles.sentInviteCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MinimalIcon name="trophy" size={20} color={isWinner ? "#C08A2E" : "#8A8371"} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#22301F" }}>
                        {c.habitName}
                      </div>
                      <div style={{ fontSize: 11, color: isWinner ? "#2E7D5B" : "#8A8371" }}>
                        {isWinner ? "🏆 You won this challenge!" : "Challenge completed"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STORAGE HELPERS & AUDIO CHIME FOR NEW MODULES
   ========================================================================= */
const TODOS_STORAGE_KEY_PREFIX = "habit_todos_";
const JOURNAL_STORAGE_KEY_PREFIX = "habit_journal_";
const TIMER_STORAGE_KEY_PREFIX = "habit_timer_";
const LEFTOVERS_DISMISSED_KEY_PREFIX = "habit_dismissed_leftovers_";

async function getStoredTodos(userId) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    const res = await storage.get(`${TODOS_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return [];
}

async function saveStoredTodos(userId, todos) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    await storage.set(`${TODOS_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`, JSON.stringify(todos));
    return true;
  } catch (e) {
    return false;
  }
}

async function getStoredJournal(userId) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    const res = await storage.get(`${JOURNAL_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return {};
}

async function saveStoredJournal(userId, journal) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    await storage.set(`${JOURNAL_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`, JSON.stringify(journal));
    return true;
  } catch (e) {
    return false;
  }
}

async function getStoredTimerSessions(userId) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    const res = await storage.get(`${TIMER_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return [];
}

async function saveStoredTimerSessions(userId, sessions) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    await storage.set(`${TIMER_STORAGE_KEY_PREFIX}${encodeURIComponent(cleanId)}`, JSON.stringify(sessions));
    return true;
  } catch (e) {
    return false;
  }
}

async function getStoredDismissedLeftovers(userId) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    const res = await storage.get(`${LEFTOVERS_DISMISSED_KEY_PREFIX}${encodeURIComponent(cleanId)}`);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {}
  return [];
}

async function saveStoredDismissedLeftovers(userId, dismissed) {
  try {
    const cleanId = (userId || "guest").trim().toLowerCase();
    await storage.set(`${LEFTOVERS_DISMISSED_KEY_PREFIX}${encodeURIComponent(cleanId)}`, JSON.stringify(dismissed));
    return true;
  } catch (e) {
    return false;
  }
}

function playTimerChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(528, now, 1.4);
    playTone(792, now + 0.16, 1.7);
    playTone(1056, now + 0.32, 2.0);
  } catch (e) {
    console.warn("Chime audio error:", e);
  }
}

// Gentle, rewarding pop sound when checking off an intention
function playHabitPopSound() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("habit_sound_enabled") === "false") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
}

// Grand celebratory chord when completing all daily intentions
function playDayCelebrationChime() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("habit_sound_enabled") === "false") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.9);
    });
  } catch (e) {}
}

// Lightweight, pure JS celebratory canvas confetti physics
function triggerConfetti() {
  try {
    if (typeof document === "undefined") return;
    let canvas = document.getElementById("habit-confetti-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "habit-confetti-canvas";
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "99999";
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ["#7C9473", "#C08A2E", "#B0654A", "#5B7A8C", "#E6AF2E", "#2E7D5B", "#9B59B6", "#E74C3C"];
    const particles = [];
    const count = 95;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width * (0.15 + 0.7 * Math.random()),
        y: height * 0.4,
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 15 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        opacity: 1,
      });
    }

    const start = performance.now();
    const duration = 2800;

    function render(now) {
      const elapsed = now - start;
      const progress = elapsed / duration;
      if (progress >= 1) {
        ctx.clearRect(0, 0, width, height);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - progress * 1.15);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  } catch (e) {
    console.warn("Confetti error:", e);
  }
}

// 4 Distinct Aesthetic Themes
const THEMES = {
  warm: {
    id: "warm",
    name: "Warm Sand",
    icon: "🏜️",
    bg: "#FAF7F1",
    cardBg: "#F4EFE6",
    surface: "#FAF7F1",
    text: "#22301F",
    textMuted: "#8A8371",
    border: "#E2DCCE",
    accent: "#7C9473",
    navbarBg: "#FAF7F1",
  },
  midnight: {
    id: "midnight",
    name: "Midnight Dark",
    icon: "🌌",
    bg: "#121417",
    cardBg: "#1A1E24",
    surface: "#21262D",
    text: "#F0EDE6",
    textMuted: "#9CA3AF",
    border: "#2F363D",
    accent: "#56A376",
    navbarBg: "#16191F",
  },
  forest: {
    id: "forest",
    name: "Forest Moss",
    icon: "🌲",
    bg: "#0D1812",
    cardBg: "#15241C",
    surface: "#1C3126",
    text: "#E8F5E9",
    textMuted: "#81C784",
    border: "#254B3A",
    accent: "#4CAF50",
    navbarBg: "#101F17",
  },
  twilight: {
    id: "twilight",
    name: "Twilight Violet",
    icon: "🔮",
    bg: "#13111C",
    cardBg: "#1D192B",
    surface: "#28233D",
    text: "#F3E8FF",
    textMuted: "#A78BFA",
    border: "#3B3353",
    accent: "#9333EA",
    navbarBg: "#181524",
  },
};

function computeLeftoverItems(habits = [], completions = {}, todos = [], dismissedIds = []) {
  const leftovers = [];
  const dismissedSet = new Set(dismissedIds || []);
  const todayStr = todayKey();
  
  // 1. Check yesterday's habits
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = keyFromDate(yesterday);
  const yesterdayDayOfWeek = yesterday.getDay();
  const yesterdayComps = completions[yesterdayStr] || {};

  habits.forEach((h) => {
    const itemKey = `habit_${h.id}_${yesterdayStr}`;
    if (dismissedSet.has(itemKey)) return;
    let wasScheduled = false;
    if (!h.frequencyType || h.frequencyType === "everyday") {
      wasScheduled = true;
    } else if (h.frequencyType === "specific_days" && Array.isArray(h.daysOfWeek)) {
      wasScheduled = h.daysOfWeek.includes(yesterdayDayOfWeek);
    }
    if (wasScheduled && !yesterdayComps[h.id]) {
      leftovers.push({
        id: itemKey,
        rawId: h.id,
        type: "habit",
        title: h.name,
        subtitle: `Incomplete from yesterday (${yesterday.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })})`,
        color: h.color || "#7C9473",
        icon: h.icon || "sparkle",
        targetDate: yesterdayStr,
        raw: h,
      });
    }
  });

  // 2. Check overdue todos
  todos.forEach((t) => {
    const itemKey = `todo_${t.id}`;
    if (t.completed) return;
    if (dismissedSet.has(itemKey)) return;
    if (t.dueDate && t.dueDate < todayStr) {
      leftovers.push({
        id: itemKey,
        rawId: t.id,
        type: "todo",
        title: t.title,
        subtitle: `Overdue task (was scheduled for ${t.dueDate})`,
        color: "#B0654A",
        icon: "list",
        targetDate: t.dueDate,
        raw: t,
      });
    }
  });

  return leftovers;
}

/* =========================================================================
   LEFTOVER BANNER COMPONENT
   ========================================================================= */
function LeftoverBanner({ leftovers = [], onMarkDone, onCarryOver, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (!leftovers || leftovers.length === 0) {
    return (
      <div style={styles.leftoverCaughtUpBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={styles.caughtUpIconCircle}>
            <MinimalIcon name="checkCircle" size={16} color="#2E7D5B" />
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#22301F" }}>
              All caught up!
            </div>
            <div style={{ fontSize: 12, color: "#5B5545" }}>
              No unfinished recurring items from previous periods.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.leftoverWarningCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={styles.leftoverWarnIcon}>
            <MinimalIcon name="alert" size={16} color="#B0654A" />
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#7A4430" }}>
              Leftover Tracking: {leftovers.length} {leftovers.length === 1 ? "item needs" : "items need"} attention
            </div>
            <div style={{ fontSize: 11.5, color: "#8A5A44" }}>
              Items not finished in their scheduled period can be completed, carried forward, or dismissed.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={styles.leftoverToggleBtn}
        >
          {expanded ? "Hide Leftovers ↑" : `View & Resolve (${leftovers.length}) ↓`}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {leftovers.map((item) => (
            <div key={item.id} style={styles.leftoverItemRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
                <div style={{ ...styles.habitIconBadge, width: 28, height: 28, backgroundColor: `${item.color}18` }}>
                  <MinimalIcon name={item.icon} size={15} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#22301F" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8371" }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={styles.leftoverActionBtnDone}
                  onClick={() => onMarkDone(item)}
                  title="Mark as completed"
                >
                  ✓ Mark Done
                </button>
                <button
                  type="button"
                  style={styles.leftoverActionBtnCarry}
                  onClick={() => onCarryOver(item)}
                  title="Carry over to today"
                >
                  → Carry Over
                </button>
                <button
                  type="button"
                  style={styles.leftoverActionBtnDismiss}
                  onClick={() => onDismiss(item)}
                  title="Dismiss from leftovers"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   UNIFIED NAVBAR COMPONENT (Streamlined & Minimal)
   ========================================================================= */
function Navbar({
  activeTab,
  onSelectTab,
  currentUser,
  totalMailboxBadgeCount = 0,
  unseenBadgesCount = 0,
  onOpenQuickAdd,
  onOpenSettings,
}) {
  const initials = useMemo(() => {
    const name = (currentUser?.username || currentUser?.identifier || "HT").trim();
    const parts = name.replace(/@.+/, "").split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }, [currentUser]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "habits", label: "Habits", icon: "checkCircle" },
    { id: "ranks", label: "Leaderboard", icon: "ranks" },
    { id: "challenges", label: "Challenges", icon: "swords" },
    { id: "todos", label: "Todos", icon: "list" },
    { id: "timer", label: "Timer", icon: "timer" },
    { id: "journal", label: "Journal", icon: "journal" },
  ];

  if (currentUser?.is_admin === true) {
    navItems.push({ id: "admin", label: "Admin", icon: "shield" });
  }

  const sectionLabel = useMemo(() => {
    const found = navItems.find((n) => n.id === activeTab);
    return found ? found.label : (activeTab === "challenges" ? "Challenges" : "Habit Tracker");
  }, [activeTab, navItems]);

  const hasUnreadAlert = totalMailboxBadgeCount > 0 || unseenBadgesCount > 0;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navInner}>
        {/* Left: Brand logo & dynamic section breadcrumb */}
        <div style={styles.navBrandCol}>
          <div
            style={styles.navBrandBadge}
            onClick={() => onSelectTab("dashboard")}
            role="button"
            tabIndex={0}
          >
            <span style={styles.navLogoIcon}>HT</span>
            <span style={styles.navBrandText}>HabitTrack</span>
          </div>
          <span style={styles.navBreadcrumbDivider}>/</span>
          <span style={styles.navSectionBreadcrumb}>{sectionLabel}</span>
        </div>

        {/* Center: Navigation pills */}
        <div style={styles.navPillsWrapper}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  ...styles.navPillBtn,
                  ...(isActive ? styles.navPillBtnActive : {}),
                }}
              >
                <MinimalIcon
                  name={item.icon}
                  size={14}
                  color={isActive ? "#FAF7F1" : "#5B5545"}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Quick Add (+ New), Profile Picture Avatar & Gear Settings Button */}
        <div style={styles.navRightCol}>
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              style={styles.navQuickAddBtn}
              title="Quick Add Habit or Todo"
            >
              <MinimalIcon name="plus" size={13} color="#FAF7F1" />
              <span style={{ fontSize: 12, fontWeight: 600 }}>New</span>
            </button>
          )}

          {/* Profile Pic Avatar (click opens Settings) */}
          <div
            style={{ ...styles.navAvatarCircle, cursor: "pointer" }}
            title={`${currentUser?.username || currentUser?.identifier || ""} ${currentUser?.is_admin ? "(Admin)" : ""} — Click for settings & menu`}
            onClick={onOpenSettings}
            role="button"
            tabIndex={0}
          >
            {initials}
          </div>

          {/* Gear Settings Button (opens all menu items with pop up) */}
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              ...styles.navMailboxBtn,
              position: "relative",
              padding: "7px 9px",
            }}
            title="Settings & Menu"
            aria-label="Settings"
          >
            <MinimalIcon name="gear" size={16} color="#22301F" />
            {hasUnreadAlert && (
              <span
                style={{
                  ...styles.navMailboxBadge,
                  background: totalMailboxBadgeCount > 0 ? "#B0654A" : "#C08A2E",
                  minWidth: 10,
                  height: 10,
                  padding: 0,
                  borderRadius: "50%",
                  top: -2,
                  right: -2,
                }}
              />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* =========================================================================
   DAILY DASHBOARD VIEW COMPONENT
   ========================================================================= */
function DailyDashboardView({
  currentUser,
  habits = [],
  completions = {},
  todos = [],
  leftovers = [],
  challenges = [],
  isSupabaseConnected = false,
  onOpenSupabase,
  onToggleHabit,
  onToggleTodo,
  onMarkLeftoverDone,
  onCarryOverLeftover,
  onDismissLeftover,
  onOpenCharts,
  onOpenAchievements,
  onOpenExport,
  onOpenQuickAdd,
  onOpenCreateChallenge,
  onNavigateTab,
  streakShields = 1,
}) {
  const todayStr = todayKey();
  const todayComps = completions[todayStr] || {};
  const [selectedRoutine, setSelectedRoutine] = useState("all"); // 'all' | 'morning' | 'afternoon' | 'evening'

  const dueTodayHabits = useMemo(() => {
    const todayDay = new Date().getDay();
    return habits.filter((h) => {
      if (h.archived) return false;
      if (h.frequencyType === "specific_days" && Array.isArray(h.daysOfWeek)) {
        return h.daysOfWeek.includes(todayDay);
      }
      return true;
    });
  }, [habits]);

  const filteredHabits = useMemo(() => {
    if (selectedRoutine === "all") return dueTodayHabits;
    return dueTodayHabits.filter((h) => (h.routineTime || "anytime") === selectedRoutine);
  }, [dueTodayHabits, selectedRoutine]);

  const dueTodayTodos = useMemo(() => {
    return todos.filter((t) => !t.completed && (t.dueDate === todayStr || !t.dueDate));
  }, [todos, todayStr]);

  const completedTodayHabits = dueTodayHabits.filter((h) => todayComps[h.id]).length;
  const totalToday = dueTodayHabits.length + dueTodayTodos.length;
  const completedTodayTotal = completedTodayHabits + todos.filter((t) => t.completed && t.dueDate === todayStr).length;
  const percentDone = totalToday > 0 ? Math.round((completedTodayTotal / totalToday) * 100) : 0;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      {/* 1. Leftover Tracking Banner */}
      <LeftoverBanner
        leftovers={leftovers}
        onMarkDone={onMarkLeftoverDone}
        onCarryOver={onCarryOverLeftover}
        onDismiss={onDismissLeftover}
      />

      {/* 2. Mindful Momentum Hero Card */}
      <div style={styles.dashboardHeroCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7C9473", fontWeight: 700 }}>
                Mindful Momentum
              </div>
              <div
                title="Streak Shields protect your habit streaks if you miss a scheduled day. Earn 1 shield every 7-day streak!"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: streakShields > 0 ? "rgba(124, 148, 115, 0.15)" : "rgba(138, 131, 113, 0.12)",
                  border: streakShields > 0 ? "1px solid rgba(124, 148, 115, 0.35)" : "1px solid rgba(138, 131, 113, 0.25)",
                  borderRadius: 20,
                  padding: "2px 8px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: streakShields > 0 ? "#2E7D5B" : "#8A8371",
                }}
              >
                <span>🛡️</span>
                <span>{streakShields > 0 ? `${streakShields} Shield${streakShields > 1 ? "s" : ""} Active` : "0 Shields"}</span>
              </div>
            </div>
            <h2 style={styles.dashboardHeroTitle}>
              {percentDone === 100 && totalToday > 0
                ? "Wonderful work! You've fulfilled all intentions today."
                : `${completedTodayTotal} of ${totalToday || "0"} daily intentions fulfilled today.`}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#5B5545", fontSize: 13 }}>
              Gentle consistency over rigid perfection. Breathe and celebrate small steps.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={styles.heroActionBtn}
              onClick={() => onNavigateTab("challenges")}
            >
              <MinimalIcon name="swords" size={13} color="#22301F" />
              Streak Battles
            </button>
            <button
              type="button"
              style={styles.heroActionBtn}
              onClick={() => onNavigateTab("timer")}
            >
              <MinimalIcon name="timer" size={13} color="#22301F" />
              Focus Timer
            </button>
            <button
              type="button"
              style={styles.heroActionBtn}
              onClick={() => onNavigateTab("journal")}
            >
              <MinimalIcon name="journal" size={13} color="#22301F" />
              Daily Reflection
            </button>
            <button
              type="button"
              style={styles.heroActionBtn}
              onClick={onOpenCharts}
            >
              <MinimalIcon name="pieChart" size={13} color="#22301F" />
              Visuals
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#22301F", marginBottom: 6 }}>
            <span>Today's Progress</span>
            <span>{percentDone}%</span>
          </div>
          <div style={styles.dashboardProgressBarTrack}>
            <div style={{ ...styles.dashboardProgressBarFill, width: `${percentDone}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Two Column Layout: Today's Habits & Today's Todos */}
      <div style={styles.dashboardTwoColGrid}>
        {/* Left Column: Habits Due Today */}
        <div style={styles.dashboardCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MinimalIcon name="checkCircle" size={16} color="#7C9473" />
              <h3 style={styles.dashboardSectionTitle}>Today's Habits</h3>
            </div>
            <button
              type="button"
              style={styles.dashboardSubLink}
              onClick={() => onNavigateTab("habits")}
            >
              View All →
            </button>
          </div>

          {/* Routine Filter Chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
            {[
              { id: "all", label: "All", icon: "⭐", count: dueTodayHabits.length },
              { id: "morning", label: "Morning", icon: "🌅", count: dueTodayHabits.filter((h) => h.routineTime === "morning").length },
              { id: "afternoon", label: "Afternoon", icon: "☀️", count: dueTodayHabits.filter((h) => h.routineTime === "afternoon").length },
              { id: "evening", label: "Evening", icon: "🌙", count: dueTodayHabits.filter((h) => h.routineTime === "evening").length },
            ].map((r) => {
              const active = selectedRoutine === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoutine(r.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 9px",
                    borderRadius: 16,
                    fontSize: 11.5,
                    fontWeight: active ? 700 : 500,
                    background: active ? "#7C9473" : "#F4EFE6",
                    color: active ? "#FAF7F1" : "#5B5545",
                    border: active ? "1px solid #7C9473" : "1px solid #DED8C8",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.85 }}>({r.count})</span>
                </button>
              );
            })}
          </div>

          {filteredHabits.length === 0 ? (
            <div style={styles.dashboardEmptyBox}>
              {selectedRoutine === "all" ? "No habits scheduled for today." : `No ${selectedRoutine} habits scheduled.`}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredHabits.slice(0, 8).map((h) => {
                const done = !!todayComps[h.id];
                const habitColor = h.color || "#7C9473";
                return (
                  <div key={h.id} style={styles.dashboardItemRow}>
                    <button
                      type="button"
                      onClick={() => onToggleHabit(h.id)}
                      style={{
                        ...styles.checkCircle,
                        width: 26,
                        height: 26,
                        background: done ? habitColor : "transparent",
                        borderColor: habitColor,
                      }}
                    >
                      {done && <span style={{ color: "#FAF7F1", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F", textDecoration: done ? "line-through" : "none" }}>
                          {h.name}
                        </span>
                        {h.routineTime && h.routineTime !== "anytime" && (
                          <span
                            title={`Routine: ${h.routineTime}`}
                            style={{
                              fontSize: 10,
                              padding: "1px 5px",
                              borderRadius: 4,
                              background: "rgba(124, 148, 115, 0.12)",
                              color: "#5B5545",
                              textTransform: "capitalize",
                            }}
                          >
                            {h.routineTime === "morning" ? "🌅 Morning" : h.routineTime === "afternoon" ? "☀️ Afternoon" : "🌙 Evening"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#8A8371" }}>
                        {h.category || "Habit"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Next Todos */}
        <div style={styles.dashboardCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MinimalIcon name="list" size={16} color="#B0654A" />
              <h3 style={styles.dashboardSectionTitle}>Next Actions & Todos</h3>
            </div>
            <button
              type="button"
              style={styles.dashboardSubLink}
              onClick={() => onNavigateTab("todos")}
            >
              View All →
            </button>
          </div>

          {dueTodayTodos.length === 0 ? (
            <div style={styles.dashboardEmptyBox}>
              No pending tasks for today.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dueTodayTodos.slice(0, 5).map((t) => (
                <div key={t.id} style={styles.dashboardItemRow}>
                  <button
                    type="button"
                    onClick={() => onToggleTodo(t.id)}
                    style={{
                      ...styles.todoCheckbox,
                      width: 22,
                      height: 22,
                      background: t.completed ? "#7C9473" : "transparent",
                      borderColor: t.completed ? "#7C9473" : "#DED8C8",
                    }}
                  >
                    {t.completed && <span style={{ color: "#FAF7F1", fontSize: 12 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "#22301F" }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#8A8371" }}>
                      {t.category || "Task"} {t.priority === "high" && "• 🔴 High"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Streak Battles Overview Card */}
      <div style={{ ...styles.dashboardCard, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MinimalIcon name="swords" size={16} color="#B0654A" />
            <h3 style={styles.dashboardSectionTitle}>Streak Battles & Challenges</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onOpenCreateChallenge && (
              <button
                type="button"
                style={{
                  ...styles.todoNewBtn,
                  background: "#7C9473",
                  fontSize: 12,
                  padding: "5px 12px",
                }}
                onClick={onOpenCreateChallenge}
              >
                + Challenge a Friend
              </button>
            )}
            <button
              type="button"
              style={styles.dashboardSubLink}
              onClick={() => onNavigateTab("challenges")}
            >
              Battles Arena →
            </button>
          </div>
        </div>

        {challenges.filter((c) => c.status === "active").length === 0 ? (
          <div style={styles.dashboardEmptyBox}>
            <p style={{ margin: "0 0 6px", color: "#8A8371", fontSize: 13 }}>
              No active streak battles right now. Challenge a friend to compare daily streaks head-to-head!
            </p>
            {onOpenCreateChallenge && (
              <button
                type="button"
                style={{
                  background: "#22301F",
                  color: "#FAF7F1",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 4,
                }}
                onClick={onOpenCreateChallenge}
              >
                Start a Streak Battle ⚔️
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {challenges.filter((c) => c.status === "active").slice(0, 3).map((c) => (
              <div key={c.id} style={styles.dashboardItemRow}>
                <div style={{ ...styles.habitIconBadge, width: 28, height: 28, backgroundColor: `${c.habitColor || "#7C9473"}14` }}>
                  <MinimalIcon name={c.habitIcon || "sparkle"} size={15} color={c.habitColor || "#7C9473"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>
                    {c.habitName}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8371" }}>
                    {c.goalType === "longest_streak" ? "Endless Showdown" : `Target: ${c.targetDays} Days`}
                  </div>
                </div>
                <button
                  type="button"
                  style={styles.dashboardSubLink}
                  onClick={() => onNavigateTab("challenges")}
                >
                  View Duel →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   TODOS VIEW COMPONENT
   ========================================================================= */
function TodosView({
  todos = [],
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onStartFocusOnTodo,
}) {
  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("Personal");
  const [newDueDate, setNewDueDate] = useState(todayKey());
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ["Personal", "Work", "Health", "Mindfulness", "Home", "Learning"];

  function handleCreate(e) {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTodo({
      id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    setNewTitle("");
    setShowAddForm(false);
  }

  const todayStr = todayKey();

  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (filter === "today") return !t.completed && t.dueDate === todayStr;
      if (filter === "upcoming") return !t.completed && t.dueDate > todayStr;
      if (filter === "completed") return t.completed;
      if (filter === "overdue") return !t.completed && t.dueDate < todayStr;
      return true;
    });
  }, [todos, filter, todayStr]);

  const overdueCount = useMemo(() => {
    return todos.filter((t) => !t.completed && t.dueDate < todayStr).length;
  }, [todos, todayStr]);

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      {/* Header & New Task Toggle */}
      <div style={styles.todosHeaderBar}>
        <div>
          <h2 style={styles.viewMainTitle}>Todos & Next Actions</h2>
          <p style={styles.viewSubTitle}>
            Clear tasks, flexible priorities, and mindful execution.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          style={styles.todoNewBtn}
        >
          {showAddForm ? "Close Form" : "+ Add Task"}
        </button>
      </div>

      {/* Add Task Box */}
      {showAddForm && (
        <form onSubmit={handleCreate} style={styles.todoAddCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              autoFocus
              type="text"
              placeholder="What task would you like to accomplish?"
              style={styles.todoInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#8A8371" }}>Priority:</span>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  style={styles.todoSelect}
                >
                  <option value="high">High (🔴)</option>
                  <option value="medium">Medium (🟡)</option>
                  <option value="low">Low (🟢)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#8A8371" }}>Category:</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={styles.todoSelect}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#8A8371" }}>Due Date:</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  style={styles.todoDateInput}
                />
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button type="submit" style={styles.todoSaveBtn}>
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={styles.todoFilterTabs}>
        {[
          { id: "all", label: `All (${todos.length})` },
          { id: "today", label: "Today" },
          { id: "upcoming", label: "Upcoming" },
          { id: "completed", label: `Done (${todos.filter((t) => t.completed).length})` },
          { id: "overdue", label: `Overdue (${overdueCount})`, alert: overdueCount > 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              ...styles.todoFilterBtn,
              ...(filter === tab.id ? styles.todoFilterBtnActive : {}),
              ...(tab.alert ? { color: "#B0654A" } : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div style={styles.todoListContainer}>
        {filteredTodos.length === 0 ? (
          <div style={styles.todoEmptyState}>
            <p style={{ margin: 0, color: "#8A8371", fontSize: 14 }}>
              {filter === "completed"
                ? "No completed tasks yet."
                : "No tasks found in this view."}
            </p>
          </div>
        ) : (
          filteredTodos.map((t) => {
            const isOverdue = !t.completed && t.dueDate < todayStr;
            return (
              <div
                key={t.id}
                style={{
                  ...styles.todoRowItem,
                  opacity: t.completed ? 0.6 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTodo(t.id)}
                  style={{
                    ...styles.todoCheckbox,
                    background: t.completed ? "#7C9473" : "transparent",
                    borderColor: t.completed ? "#7C9473" : "#DED8C8",
                  }}
                  title={t.completed ? "Mark incomplete" : "Mark completed"}
                >
                  {t.completed && <span style={{ color: "#FAF7F1", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#22301F",
                      textDecoration: t.completed ? "line-through" : "none",
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={styles.todoCategoryBadge}>{t.category || "General"}</span>
                    {t.priority === "high" && <span style={styles.priorityHigh}>High Priority</span>}
                    {t.priority === "medium" && <span style={styles.priorityMed}>Medium</span>}
                    {t.priority === "low" && <span style={styles.priorityLow}>Low</span>}
                    {t.dueDate && (
                      <span style={{ fontSize: 11, color: isOverdue ? "#B0654A" : "#8A8371", fontWeight: isOverdue ? 600 : 400 }}>
                        📅 {t.dueDate} {isOverdue && "(Overdue)"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!t.completed && onStartFocusOnTodo && (
                    <button
                      type="button"
                      style={styles.todoFocusBtn}
                      onClick={() => onStartFocusOnTodo(t)}
                      title="Start Pomodoro focus session on this task"
                    >
                      ⏱ Focus
                    </button>
                  )}
                  <button
                    type="button"
                    style={styles.todoDeleteBtn}
                    onClick={() => onDeleteTodo(t.id)}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   FOCUS TIMER VIEW COMPONENT
   ========================================================================= */
function FocusTimerView({
  currentUser,
  habits = [],
  todos = [],
  timerSessions = [],
  onAddSession,
  prefillTask,
  onCompleteLinkedHabit,
  onCompleteLinkedTodo,
}) {
  const [mode, setMode] = useState("pomodoro");
  const durations = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const [timeLeft, setTimeLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTask, setSelectedTask] = useState(prefillTask || "");
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState(null);

  function switchMode(newMode) {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode]);
  }

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (soundEnabled) {
        playTimerChime();
      }
      const durationMins = Math.round(durations[mode] / 60);

      let linkedNotice = "";
      if (mode === "pomodoro" && selectedTask) {
        if (selectedTask.startsWith("habit:")) {
          const parts = selectedTask.split(":");
          const linkedId = parts[1];
          const linkedName = parts.slice(2).join(":") || "Linked habit";
          if (onCompleteLinkedHabit) onCompleteLinkedHabit(linkedId);
          linkedNotice = ` • "${linkedName}" marked done for today!`;
        } else if (selectedTask.startsWith("todo:")) {
          const parts = selectedTask.split(":");
          const linkedId = parts[1];
          const linkedName = parts.slice(2).join(":") || "Linked todo";
          if (onCompleteLinkedTodo) onCompleteLinkedTodo(linkedId);
          linkedNotice = ` • "${linkedName}" completed!`;
        }
      }

      const cleanTaskTitle = selectedTask.startsWith("habit:") || selectedTask.startsWith("todo:")
        ? selectedTask.split(":").slice(2).join(":")
        : selectedTask;

      onAddSession({
        id: Date.now(),
        mode,
        durationMinutes: durationMins,
        completedAt: new Date().toISOString(),
        taskTitle: cleanTaskTitle || (mode === "pomodoro" ? "Deep Focus Session" : "Mindful Rest"),
      });

      setSessionCompletedNotice(
        `🎉 ${mode === "pomodoro" ? "Focus session" : "Break"} completed! ${durationMins}m logged${linkedNotice}`
      );
      setTimeout(() => setSessionCompletedNotice(null), 5000);
      setTimeLeft(durations[mode]);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, soundEnabled, selectedTask]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds = durations[mode];
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const todaySessions = useMemo(() => {
    const todayStr = todayKey();
    return timerSessions.filter((s) => s.completedAt && s.completedAt.startsWith(todayStr));
  }, [timerSessions]);

  const totalMinutesToday = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [todaySessions]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={styles.viewMainTitle}>Focus Timer</h2>
        <p style={styles.viewSubTitle}>
          Single-task with presence. Harmonious Pomodoro cycles with ambient bells.
        </p>
      </div>

      {sessionCompletedNotice && (
        <div style={styles.timerNoticeBanner}>{sessionCompletedNotice}</div>
      )}

      <div style={styles.timerMainCard}>
        <div style={styles.timerModePills}>
          <button
            type="button"
            onClick={() => switchMode("pomodoro")}
            style={{
              ...styles.timerModeBtn,
              ...(mode === "pomodoro" ? styles.timerModeBtnActive : {}),
            }}
          >
            Pomodoro (25m)
          </button>
          <button
            type="button"
            onClick={() => switchMode("shortBreak")}
            style={{
              ...styles.timerModeBtn,
              ...(mode === "shortBreak" ? styles.timerModeBtnActive : {}),
            }}
          >
            Short Break (5m)
          </button>
          <button
            type="button"
            onClick={() => switchMode("longBreak")}
            style={{
              ...styles.timerModeBtn,
              ...(mode === "longBreak" ? styles.timerModeBtnActive : {}),
            }}
          >
            Long Break (15m)
          </button>
        </div>

        <div style={styles.timerCircleContainer}>
          <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="120" cy="120" r={radius} fill="transparent" stroke="#E8E3D6" strokeWidth="8" />
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="transparent"
              stroke={mode === "pomodoro" ? "#7C9473" : "#B0654A"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>

          <div style={styles.timerCenterContent}>
            <div style={styles.timerDigits}>{timeFormatted}</div>
            <div style={styles.timerModeLabel}>
              {mode === "pomodoro" ? "Deep Focus" : (mode === "shortBreak" ? "Rest & Breathe" : "Extended Break")}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 360, margin: "16px auto 0", textAlign: "center" }}>
          <label style={{ fontSize: 11.5, color: "#8A8371", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Link to intention or task:
          </label>
          <select
            style={styles.timerTaskSelect}
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
          >
            <option value="">(No specific task linked)</option>
            <optgroup label="Habits (Auto-completes upon finish)">
              {habits.filter((h) => !h.archived).map((h) => (
                <option key={h.id} value={`habit:${h.id}:${h.name}`}>
                  Habit: {h.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Todos (Auto-completes upon finish)">
              {todos.filter((t) => !t.completed).map((t) => (
                <option key={t.id} value={`todo:${t.id}:${t.title}`}>
                  Todo: {t.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div style={styles.timerControlRow}>
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            style={{
              ...styles.timerPrimaryBtn,
              background: isRunning ? "#B0654A" : "#22301F",
            }}
          >
            {isRunning ? "Pause" : "Start Focus"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durations[mode]);
            }}
            style={styles.timerResetBtn}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={styles.timerSoundToggle}
            title={soundEnabled ? "Mute bell chime" : "Enable bell chime"}
          >
            {soundEnabled ? "🔔 Chime On" : "🔕 Muted"}
          </button>
        </div>
      </div>

      <div style={styles.timerHistoryCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#22301F" }}>
            Today's Focus Log
          </h3>
          <span style={styles.timerTotalPill}>
            ⏱ {totalMinutesToday} mins total today
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#8A8371", fontSize: 13 }}>
            No sessions completed today yet. Start a 25m Pomodoro to build your momentum!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaySessions.slice().reverse().map((s) => (
              <div key={s.id} style={styles.timerSessionItem}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>
                    {s.mode === "pomodoro" ? "🎯" : "☕"}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#22301F" }}>
                      {s.taskTitle || "Focus Session"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8A8371" }}>
                      {new Date(s.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {s.mode}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#7C9473" }}>
                  +{s.durationMinutes}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   DAILY JOURNAL VIEW COMPONENT
   ========================================================================= */
function DailyJournalView({ currentUser, journal = {}, onSaveJournalEntry }) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [text, setText] = useState("");
  const [mood, setMood] = useState("🌿 Calm");
  const [savedBanner, setSavedBanner] = useState(null);

  useEffect(() => {
    const entry = journal[selectedDate];
    if (entry) {
      setText(entry.text || "");
      setMood(entry.mood || "🌿 Calm");
    } else {
      setText("");
      setMood("🌿 Calm");
    }
  }, [selectedDate, journal]);

  const sparks = [
    { label: "🌱 What went gently?", prompt: "\n🌱 What went gently: " },
    { label: "☕ A quiet micro-joy", prompt: "\n☕ A quiet micro-joy: " },
    { label: "🌊 Tension let go", prompt: "\n🌊 Tension let go: " },
    { label: "🎯 Focus win", prompt: "\n🎯 Focus win: " },
  ];

  const moods = ["🌿 Calm", "✨ Inspired", "☕ Steady", "🌊 Flowing", "🌙 Restful"];

  const wordCount = useMemo(() => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [text]);

  function handleAddSpark(spark) {
    if (!text.trim()) {
      setText(spark.prompt.trimStart());
    } else {
      setText((prev) => prev + (prev.endsWith("\n") ? "" : "\n") + spark.prompt);
    }
  }

  function handleDateShift(deltaDays) {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(keyFromDate(d));
  }

  function handleSave() {
    onSaveJournalEntry(selectedDate, {
      text,
      mood,
      wordCount,
      updatedAt: new Date().toISOString(),
    });
    setSavedBanner(`Saved reflection for ${selectedDate} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓`);
    setTimeout(() => setSavedBanner(null), 3000);
  }

  const isToday = selectedDate === todayKey();
  const displayDateStr = useMemo(() => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={styles.journalDateBar}>
        <button
          type="button"
          onClick={() => handleDateShift(-1)}
          style={styles.journalNavBtn}
          title="Previous day"
        >
          ←
        </button>
        <div style={styles.journalCurrentDateDisplay}>
          <MinimalIcon name="calendar" size={14} color="#7C9473" />
          <span style={{ fontWeight: 600 }}>{isToday ? `Today (${displayDateStr})` : displayDateStr}</span>
        </div>
        <button
          type="button"
          onClick={() => handleDateShift(1)}
          disabled={isToday}
          style={{
            ...styles.journalNavBtn,
            opacity: isToday ? 0.35 : 1,
            cursor: isToday ? "not-allowed" : "pointer",
          }}
          title="Next day"
        >
          →
        </button>
      </div>

      {savedBanner && (
        <div style={styles.journalSavedAlert}>{savedBanner}</div>
      )}

      <div style={styles.journalCard}>
        <div style={styles.journalCardHeader}>
          <div>
            <h2 style={styles.journalTitle}>Daily Reflection</h2>
            <p style={styles.journalSubtitle}>
              A mindful space to notice what grounded you today.
            </p>
          </div>

          <div style={styles.journalMoodGroup}>
            {moods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                style={{
                  ...styles.journalMoodBtn,
                  ...(mood === m ? styles.journalMoodBtnActive : {}),
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.journalSparksBar}>
          <span style={{ fontSize: 11.5, color: "#8A8371", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Reflection Sparks:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {sparks.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleAddSpark(s)}
                style={styles.journalSparkChip}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          style={styles.journalTextarea}
          placeholder="Write whatever came up today — no pressure, just noticing..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />

        <div style={styles.journalCardFooter}>
          <span style={styles.journalWordCounter}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            style={styles.journalSaveBtn}
          >
            Save Reflection ✓
          </button>
        </div>
      </div>

      {Object.keys(journal).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={styles.journalHistoryTitle}>Past Reflections</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {Object.entries(journal)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .slice(0, 5)
              .map(([dateKey, entry]) => (
                <div
                  key={dateKey}
                  style={styles.journalHistoryItem}
                  onClick={() => setSelectedDate(dateKey)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#22301F" }}>
                      {dateKey} {dateKey === todayKey() ? "(Today)" : ""}
                    </div>
                    <span style={styles.journalHistoryMood}>{entry.mood || "🌿 Calm"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#5B5545", marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {entry.text ? entry.text.replace(/\n+/g, " ").substring(0, 120) + "..." : "(Empty reflection)"}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   REAL-TIME AUTHENTIC LEADERBOARD VIEW COMPONENT (Zero Fake Accounts)
   ========================================================================= */
function LeaderboardView({
  currentUser,
  habits = [],
  completions = {},
  shieldedDates = new Set(),
  challenges = [],
  onOpenChallengeModal,
}) {
  const [metric, setMetric] = useState("current"); // "current" | "longest"
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Compute current user's real in-memory streak directly from active habits & completions
  const myRealCurrentStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    return Math.max(0, ...habits.map((h) => computeStreak(completions, h, shieldedDates)));
  }, [habits, completions, shieldedDates]);

  // Load real registered accounts ONLY - strictly NO fake demo bots or synthetic numbers
  const loadLeaderboardData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const accounts = await getRegisteredAccounts();
      const cleanAccounts = Object.values(accounts || {});
      const myCleanEmail = (currentUser?.identifier || "").trim().toLowerCase();

      const mapped = cleanAccounts.map((acc, idx) => {
        const accEmail = (acc.email || "").trim().toLowerCase();
        const isMe = accEmail === myCleanEmail;

        let curStreak = acc.currentStreak || 0;
        let longStreak = acc.longestStreak || 0;

        if (isMe) {
          curStreak = myRealCurrentStreak;
          longStreak = Math.max(longStreak, myRealCurrentStreak);
        }

        return {
          id: acc.email || `user_${idx}`,
          email: acc.email,
          username: (acc.username || acc.email?.split("@")[0] || "Member").trim(),
          code: (acc.code || "HT0000").replace(/^#/, "").toUpperCase(),
          isMe,
          isAdmin: !!acc.is_admin,
          currentStreak: curStreak,
          longestStreak: Math.max(curStreak, longStreak),
        };
      });

      // Ensure current user is included even if first time loading
      if (!mapped.some((u) => u.isMe) && currentUser) {
        mapped.push({
          id: myCleanEmail || "me",
          email: myCleanEmail,
          username: (currentUser.username || myCleanEmail.split("@")[0] || "You").trim(),
          code: (currentUser.code || "HT0000").replace(/^#/, "").toUpperCase(),
          isMe: true,
          isAdmin: !!currentUser.is_admin,
          currentStreak: myRealCurrentStreak,
          longestStreak: myRealCurrentStreak,
        });
      }

      setUsersList(mapped);
    } catch (e) {
      console.warn("Could not sync leaderboard", e);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 400);
    }
  }, [currentUser, myRealCurrentStreak]);

  // Real-time synchronization
  useEffect(() => {
    loadLeaderboardData();

    // 1. Cross-tab and local storage events
    const handleSync = () => loadLeaderboardData();
    window.addEventListener("storage", handleSync);
    window.addEventListener("habit_streak_updated", handleSync);

    // 2. High-frequency live polling (every 3.5s) to guarantee instantaneous leaderboard updates
    const pollInterval = setInterval(() => {
      loadLeaderboardData();
    }, 3500);

    // 3. Supabase Realtime channel subscription (if connected)
    let supabaseChannel = null;
    if (window.supabaseClient && !window.__supabaseOffline) {
      try {
        supabaseChannel = window.supabaseClient
          .channel("realtime_leaderboard_feed")
          .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
            loadLeaderboardData();
          })
          .subscribe();
      } catch (e) {}
    }

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("habit_streak_updated", handleSync);
      clearInterval(pollInterval);
      if (supabaseChannel && window.supabaseClient) {
        try {
          window.supabaseClient.removeChannel(supabaseChannel);
        } catch (e) {}
      }
    };
  }, [loadLeaderboardData]);

  const sortedUsers = useMemo(() => {
    return [...usersList].sort((a, b) => {
      const valA = metric === "current" ? a.currentStreak : a.longestStreak;
      const valB = metric === "current" ? b.currentStreak : b.longestStreak;
      if (valB !== valA) return valB - valA;
      return a.username.localeCompare(b.username);
    });
  }, [usersList, metric]);

  const top1 = sortedUsers[0] || null;
  const top2 = sortedUsers[1] || null;
  const top3 = sortedUsers[2] || null;

  function handleCopy(code) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`#${code}`);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={styles.leaderboardHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={styles.viewMainTitle}>Live Community Leaderboard</h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(46, 125, 91, 0.12)",
                border: "1px solid rgba(46, 125, 91, 0.3)",
                color: "#2E7D5B",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}
              title="Updates in real-time as users complete habits across devices"
            >
              <span style={{ fontSize: 8, color: isSyncing ? "#C08A2E" : "#2E7D5B" }}>●</span>
              <span>{isSyncing ? "SYNCING..." : "LIVE REAL-TIME"}</span>
            </div>
          </div>
          <p style={styles.viewSubTitle}>
            Authentic, verified consistency rankings from registered community members.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={styles.leaderboardTabs}>
            <button
              type="button"
              onClick={() => setMetric("current")}
              style={{
                ...styles.leaderboardTabBtn,
                ...(metric === "current" ? styles.leaderboardTabBtnActive : {}),
              }}
            >
              🔥 Current Streak
            </button>
            <button
              type="button"
              onClick={() => setMetric("longest")}
              style={{
                ...styles.leaderboardTabBtn,
                ...(metric === "longest" ? styles.leaderboardTabBtnActive : {}),
              }}
            >
              🏆 All-Time Longest
            </button>
          </div>
          <button
            type="button"
            onClick={loadLeaderboardData}
            style={{
              background: "#FAF7F1",
              border: "1px solid #DED8C8",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "#5B5545",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            title="Refresh now"
          >
            🔄 Sync
          </button>
        </div>
      </div>

      {/* Solo Leaderboard Champion Banner (when 1 verified user exists) */}
      {sortedUsers.length === 1 && (
        <div
          style={{
            background: "#F4EFE6",
            border: "1.5px solid #E2DCCE",
            borderRadius: 12,
            padding: "24px 20px",
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 36 }}>👑</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#22301F" }}>
              You are Currently #1 on the Leaderboard!
            </div>
            <div style={{ fontSize: 13, color: "#5B5545", maxWidth: 520, margin: "6px auto 0", lineHeight: 1.5 }}>
              Zero fake bots or simulated accounts. Share your unique Friend Code with friends, family, or colleagues so they can join and battle streaks with you in real time!
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            {currentUser?.code && (
              <button
                type="button"
                onClick={() => handleCopy(currentUser.code)}
                style={{
                  background: "#22301F",
                  color: "#FAF7F1",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>#{currentUser.code}</span>
                <span>{copiedCode === currentUser.code ? "✓ Copied" : "Copy Friend Code"}</span>
              </button>
            )}
            {onOpenChallengeModal && (
              <button
                type="button"
                onClick={() => onOpenChallengeModal()}
                style={{
                  background: "#7C9473",
                  color: "#FAF7F1",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>⚔️ Create Streak Battle</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top 3 Podium (shown when 2 or more real members exist) */}
      {sortedUsers.length >= 2 && (
        <div style={styles.podiumContainer}>
          {top2 && (
            <div style={styles.podiumCol2}>
              <div style={styles.podiumRankBadgeSilver}>2</div>
              <div style={styles.podiumAvatarSilver}>
                {top2.username.substring(0, 2).toUpperCase()}
              </div>
              <div style={styles.podiumName}>{top2.username} {top2.isMe && "(You)"}</div>
              <div style={styles.podiumCode} onClick={() => handleCopy(top2.code)} title="Click to copy code">
                #{top2.code} {copiedCode === top2.code && "✓"}
              </div>
              <div style={styles.podiumStreakBadge}>
                🔥 {metric === "current" ? top2.currentStreak : top2.longestStreak} days
              </div>
            </div>
          )}

          {top1 && (
            <div style={styles.podiumCol1}>
              <div style={styles.podiumCrownIcon}>
                <MinimalIcon name="crown" size={26} color="#E6AF2E" />
              </div>
              <div style={styles.podiumRankBadgeGold}>1</div>
              <div style={styles.podiumAvatarGold}>
                {top1.username.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ ...styles.podiumName, fontWeight: 700, fontSize: 16 }}>
                {top1.username} {top1.isMe && "(You)"}
              </div>
              <div style={styles.podiumCode} onClick={() => handleCopy(top1.code)} title="Click to copy code">
                #{top1.code} {copiedCode === top1.code && "✓"}
              </div>
              <div style={styles.podiumStreakBadgeGold}>
                🔥 {metric === "current" ? top1.currentStreak : top1.longestStreak} days
              </div>
            </div>
          )}

          {top3 && (
            <div style={styles.podiumCol3}>
              <div style={styles.podiumRankBadgeBronze}>3</div>
              <div style={styles.podiumAvatarBronze}>
                {top3.username.substring(0, 2).toUpperCase()}
              </div>
              <div style={styles.podiumName}>{top3.username} {top3.isMe && "(You)"}</div>
              <div style={styles.podiumCode} onClick={() => handleCopy(top3.code)} title="Click to copy code">
                #{top3.code} {copiedCode === top3.code && "✓"}
              </div>
              <div style={styles.podiumStreakBadge}>
                🔥 {metric === "current" ? top3.currentStreak : top3.longestStreak} days
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Rankings Table */}
      <div style={styles.leaderboardTableCard}>
        <div style={styles.leaderboardTableHeader}>
          <span style={{ width: 44 }}>Rank</span>
          <span style={{ flex: 1 }}>Member</span>
          <span style={{ width: 140, textAlign: "center" }}>Friend Code</span>
          <span style={{ width: 120, textAlign: "right" }}>Verified Streak</span>
          <span style={{ width: 90, textAlign: "right" }}>Action</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {sortedUsers.map((u, i) => {
            const rank = i + 1;
            const streakVal = metric === "current" ? u.currentStreak : u.longestStreak;
            return (
              <div
                key={u.id}
                style={{
                  ...styles.leaderboardTableRow,
                  ...(u.isMe ? styles.leaderboardRowMe : {}),
                }}
              >
                <div style={{ width: 44, fontWeight: 700, color: rank === 1 ? "#E6AF2E" : rank === 2 ? "#8A94A6" : rank === 3 ? "#B87333" : "#8A8371" }}>
                  #{rank}
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={styles.tableAvatar}>
                    {u.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#22301F", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{u.username}</span>
                      {u.isMe && <span style={styles.mePill}>You</span>}
                      {u.isAdmin && <span style={styles.adminPill}>Admin</span>}
                    </div>
                  </div>
                </div>

                <div style={{ width: 140, textAlign: "center" }}>
                  <button
                    type="button"
                    style={styles.tableCodeChip}
                    onClick={() => handleCopy(u.code)}
                    title="Click to copy Friend Code"
                  >
                    #{u.code} {copiedCode === u.code ? "✓" : ""}
                  </button>
                </div>

                <div style={{ width: 120, textAlign: "right", fontWeight: 700, color: "#22301F", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                  <span>🔥</span>
                  <span>{streakVal} days</span>
                </div>

                <div style={{ width: 90, textAlign: "right" }}>
                  {!u.isMe ? (
                    <button
                      type="button"
                      style={styles.challengeMiniBtn}
                      onClick={() => onOpenChallengeModal && onOpenChallengeModal(u)}
                    >
                      Battle ⚔️
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#7C9473" }}>Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ADMIN PANEL VIEW COMPONENT
   ========================================================================= */
function AdminPanelView({ currentUser, onBroadcastNotice }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFeedback, setActionFeedback] = useState(null);

  async function loadDirectory() {
    setLoading(true);
    try {
      const accs = await getRegisteredAccounts();
      setUsers(Object.values(accs || {}));
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDirectory();
  }, []);

  async function handleToggleAdminRole(userEmail, currentAdminStatus) {
    if (!currentUser?.is_admin) {
      console.warn("Unauthorized attempt to toggle admin role.");
      return;
    }
    try {
      const cleanEmail = userEmail.trim().toLowerCase();
      const accounts = await getRegisteredAccounts();
      const target = accounts[cleanEmail];
      if (!target) return;
      const nextStatus = !currentAdminStatus;
      await saveRegisteredAccount(cleanEmail, target.username, undefined, target.code, nextStatus);
      setActionFeedback(`Updated permissions for ${target.username || cleanEmail} to ${nextStatus ? "Admin" : "Member"}`);
      setTimeout(() => setActionFeedback(null), 3500);
      await loadDirectory();
    } catch (e) {
      console.warn("Could not toggle admin role", e);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.code || "").toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MinimalIcon name="shield" size={24} color="#7C9473" />
          <h2 style={styles.viewMainTitle}>Administration Center</h2>
        </div>
        <p style={styles.viewSubTitle}>
          Manage platform accounts, permissions, and inspect system consistency.
        </p>
      </div>

      {actionFeedback && (
        <div style={styles.infoBanner}>{actionFeedback}</div>
      )}

      <div style={styles.adminStatsRow}>
        <div style={styles.adminStatCard}>
          <div style={styles.adminStatNum}>{users.length}</div>
          <div style={styles.adminStatLabel}>Registered Accounts</div>
        </div>
        <div style={styles.adminStatCard}>
          <div style={styles.adminStatNum}>{users.filter((u) => u.is_admin).length}</div>
          <div style={styles.adminStatLabel}>Platform Admins</div>
        </div>
        <div style={styles.adminStatCard}>
          <div style={styles.adminStatNum}>100%</div>
          <div style={styles.adminStatLabel}>Local DB Health</div>
        </div>
      </div>

      <div style={styles.adminTableCard}>
        <div style={styles.adminSearchRow}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#22301F" }}>
            Account Directory
          </h3>
          <input
            type="text"
            placeholder="Search by username, email, or #CODE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.adminSearchInput}
          />
        </div>

        <div style={styles.adminTableHeader}>
          <span style={{ flex: 1 }}>User / Email</span>
          <span style={{ width: 120 }}>Code</span>
          <span style={{ width: 110 }}>Role</span>
          <span style={{ width: 140, textAlign: "right" }}>Action</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredUsers.map((u) => (
            <div key={u.email} style={styles.adminTableRow}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.tableAvatar}>
                  {(u.username || u.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#22301F" }}>
                    {u.username || "(No username set)"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8A8371" }}>{u.email}</div>
                </div>
              </div>

              <div style={{ width: 120 }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#5B5545" }}>
                  #{u.code || "----"}
                </span>
              </div>

              <div style={{ width: 110 }}>
                {u.is_admin ? (
                  <span style={styles.adminBadge}>Admin</span>
                ) : (
                  <span style={styles.memberBadge}>Member</span>
                )}
              </div>

              <div style={{ width: 140, textAlign: "right" }}>
                <button
                  type="button"
                  style={styles.adminToggleRoleBtn}
                  onClick={() => handleToggleAdminRole(u.email, !!u.is_admin)}
                  disabled={u.email === currentUser?.identifier}
                  title={u.email === currentUser?.identifier ? "Cannot demote yourself" : "Toggle admin role"}
                >
                  {u.is_admin ? "Demote" : "Promote Admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ACHIEVEMENTS & BADGES MODAL COMPONENT
   ========================================================================= */
function AchievementsModal({
  isOpen,
  onClose,
  stats = {},
  unlockedBadges = {},
}) {
  if (!isOpen) return null;

  const totalBadges = BADGE_DEFINITIONS.length;
  const unlockedCount = BADGE_DEFINITIONS.filter((b) => !!unlockedBadges[b.id]).length;
  const percentComplete = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: 680, maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#C08A2E1C", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MinimalIcon name="trophy" size={20} color="#C08A2E" />
            </div>
            <div>
              <h2 style={styles.modalTitle}>Milestones & Badges</h2>
              <div style={{ fontSize: 12, color: "#8A8371", marginTop: 2 }}>
                Celebrate your steady dedication and mindful growth.
              </div>
            </div>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Global Progress Bar */}
        <div style={{ background: "#FAF7F1", border: "1px solid #E8E3D6", borderRadius: 10, padding: "14px 16px", marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#22301F" }}>
              🏆 {unlockedCount} of {totalBadges} Badges Unlocked
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7C9473" }}>
              {percentComplete}%
            </span>
          </div>
          <div style={{ height: 8, background: "#E8E3D6", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${percentComplete}%`, background: "#7C9473", borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Badges Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = !!unlockedBadges[badge.id];
            const prog = badge.progress(stats);
            const current = badge.currentVal ? badge.currentVal(stats) : 0;

            return (
              <div
                key={badge.id}
                style={{
                  background: isUnlocked ? "#FFFFFF" : "#F9F8F5",
                  border: isUnlocked ? `1.5px solid ${badge.badgeColor}` : "1px solid #E8E3D6",
                  borderRadius: 10,
                  padding: "14px 14px",
                  display: "flex",
                  gap: 12,
                  opacity: isUnlocked ? 1 : 0.8,
                  boxShadow: isUnlocked ? `0 2px 8px ${badge.badgeColor}18` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isUnlocked ? `${badge.badgeColor}18` : "#E8E3D6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MinimalIcon
                    name={badge.icon}
                    size={22}
                    color={isUnlocked ? badge.badgeColor : "#8A8371"}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: isUnlocked ? "#22301F" : "#5B5545" }}>
                      {badge.title}
                    </h4>
                    {isUnlocked ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", background: "#2E7D5B18", padding: "1px 6px", borderRadius: 4 }}>
                        Unlocked ✓
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#8A8371" }}>
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#5B5545", lineHeight: 1.35 }}>
                    {badge.description}
                  </p>
                  
                  {/* Progress tracker */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8371", marginBottom: 3 }}>
                      <span>Progress: {current} / {badge.targetText}</span>
                      <span>{prog}%</span>
                    </div>
                    <div style={{ height: 5, background: "#E8E3D6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog}%`, background: isUnlocked ? badge.badgeColor : "#A59E8D", borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   DATA EXPORT MODAL COMPONENT (JSON Backup & CSV Spreadsheet)
   ========================================================================= */
function ExportModal({
  isOpen,
  onClose,
  currentUser,
  habits = [],
  completions = {},
  todos = [],
  journal = {},
  timerSessions = [],
  challenges = [],
}) {
  if (!isOpen) return null;

  const [downloadSuccess, setDownloadSuccess] = useState(null);

  function handleExportJSON() {
    exportDataAsJSON({ currentUser, habits, completions, todos, journal, timerSessions, challenges });
    setDownloadSuccess("Complete JSON backup downloaded successfully!");
    setTimeout(() => setDownloadSuccess(null), 4000);
  }

  function handleExportCSV() {
    exportHabitsAsCSV({ habits, completions, currentUser });
    setDownloadSuccess("Habits & streaks CSV spreadsheet downloaded successfully!");
    setTimeout(() => setDownloadSuccess(null), 4000);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#5B7A8C18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MinimalIcon name="download" size={18} color="#5B7A8C" />
            </div>
            <div>
              <h2 style={styles.modalTitle}>Export & Backup Data</h2>
              <div style={{ fontSize: 12, color: "#8A8371", marginTop: 2 }}>
                Your data is stored locally. Download backups anytime.
              </div>
            </div>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {downloadSuccess && (
          <div style={{ ...styles.journalSavedAlert, margin: "14px 0 0" }}>
            ✓ {downloadSuccess}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
          {/* JSON Full Backup Option */}
          <div style={{ background: "#FAF7F1", border: "1px solid #E8E3D6", borderRadius: 10, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#22301F" }}>
                  Complete Data Backup (.JSON)
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#5B5545", lineHeight: 1.4 }}>
                  Includes all habits, completion history, todos, daily journal reflections, timer focus logs, and streak battles.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJSON}
                style={{
                  ...styles.todoNewBtn,
                  background: "#22301F",
                  color: "#FAF7F1",
                  flexShrink: 0,
                  fontSize: 12,
                }}
              >
                Download JSON
              </button>
            </div>
          </div>

          {/* CSV Spreadsheet Option */}
          <div style={{ background: "#FAF7F1", border: "1px solid #E8E3D6", borderRadius: 10, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#22301F" }}>
                  Habits & Streaks Table (.CSV)
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#5B5545", lineHeight: 1.4 }}>
                  Spreadsheet-compatible export with habit names, categories, frequencies, current streaks, and total completion counts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  ...styles.todoNewBtn,
                  background: "#7C9473",
                  color: "#FAF7F1",
                  flexShrink: 0,
                  fontSize: 12,
                }}
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button type="button" onClick={onClose} style={styles.modalCancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   SUPABASE CONNECT & CLOUD SYNC MODAL COMPONENT
   ========================================================================= */
function SupabaseConnectModal({
  isOpen,
  onClose,
  currentUser,
  isSupabaseConnected,
  onConnectedChange,
}) {
  if (!isOpen) return null;

  const creds = getSupabaseCredentials();
  const [url, setUrl] = useState(creds.url || "");
  const [anonKey, setAnonKey] = useState(creds.anonKey || "");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showSchemaView, setShowSchemaView] = useState(false);

  const connected = isSupabaseConfigured() && isSupabaseConnected;

  async function handleSaveAndConnect(e) {
    if (e) e.preventDefault();
    setTestResult(null);
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, error: "Please enter both the Project URL and Anon Public Key." });
      return;
    }

    setIsTesting(true);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseCredentials(url.trim(), anonKey.trim());
      if (onConnectedChange) onConnectedChange(true);
    }
  }

  async function handleTest() {
    setTestResult(null);
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, error: "Please enter your Project URL and Anon Key first." });
      return;
    }
    setIsTesting(true);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(res);
  }

  function handleDisconnect() {
    clearSupabaseCredentials();
    setUrl("");
    setAnonKey("");
    setTestResult(null);
    setMigrationResult(null);
    if (onConnectedChange) onConnectedChange(false);
  }

  async function handleMigrateData() {
    if (!window.supabaseClient) {
      setMigrationResult({ success: false, error: "Please connect to Supabase first before migrating." });
      return;
    }
    setIsMigrating(true);
    setMigrationResult(null);
    const res = await migrateLocalStorageToSupabase();
    setIsMigrating(false);
    setMigrationResult(res);
  }

  function handleCopySchema() {
    const schemaSql = `-- HABIT TRACKER SUPABASE SCHEMA
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS app_kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  email TEXT PRIMARY KEY,
  username TEXT,
  code TEXT UNIQUE,
  password TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  avatar TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  frequency_type TEXT DEFAULT 'everyday',
  color TEXT,
  icon TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_completions (
  user_email TEXT NOT NULL,
  date TEXT NOT NULL,
  habit_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_email, date, habit_id)
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  due_date TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entries (
  user_email TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT,
  mood TEXT,
  word_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_email, date)
);

CREATE TABLE IF NOT EXISTS timer_sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  mode TEXT,
  linked_type TEXT,
  linked_id TEXT,
  linked_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  habit_name TEXT,
  category TEXT,
  duration_days INT DEFAULT 7,
  creator_email TEXT NOT NULL,
  creator_username TEXT,
  creator_code TEXT,
  target_email TEXT,
  target_username TEXT,
  target_code TEXT,
  status TEXT DEFAULT 'pending',
  start_date TEXT,
  end_date TEXT,
  winner TEXT,
  completions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_email TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_email, badge_id)
);

ALTER TABLE app_kv_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to app_kv_store" ON app_kv_store FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to habit_completions" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to todos" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to journal_entries" ON journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to timer_sessions" ON timer_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to challenges" ON challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to user_badges" ON user_badges FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE challenges; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profiles; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_kv_store; EXCEPTION WHEN others THEN NULL; END;
END $$;`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(schemaSql);
    }
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modalContent,
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: connected ? "#2E7D5B18" : "#5B7A8C18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MinimalIcon name="database" size={20} color={connected ? "#2E7D5B" : "#5B7A8C"} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={styles.modalTitle}>Supabase Cloud Database</h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: connected ? "#2E7D5B18" : "#FAF0E6",
                    color: connected ? "#2E7D5B" : "#B0654A",
                    border: `1px solid ${connected ? "#2E7D5B44" : "#B0654A44"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: connected ? "#2E7D5B" : "#C46243",
                      display: "inline-block",
                    }}
                  />
                  {connected ? "Cloud Connected" : "Local Storage Mode"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#8A8371", marginTop: 2 }}>
                Connect PostgreSQL & Realtime to enable multiplayer battles, cross-device sync & cloud backup.
              </div>
            </div>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveAndConnect} style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#22301F", marginBottom: 5 }}>
              Project URL
            </label>
            <input
              type="text"
              placeholder="https://your-project-ref.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ ...styles.inputField, width: "100%", fontFamily: "monospace", fontSize: 12.5 }}
            />
            <div style={{ fontSize: 11, color: "#8A8371", marginTop: 4 }}>
              Found in your Supabase Dashboard: <strong>Project Settings → API → Project URL</strong>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#22301F", marginBottom: 5 }}>
              Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              style={{ ...styles.inputField, width: "100%", fontFamily: "monospace", fontSize: 12.5 }}
            />
            <div style={{ fontSize: 11, color: "#8A8371", marginTop: 4 }}>
              Found in your Supabase Dashboard: <strong>Project Settings → API → Project API keys → anon (public)</strong>
            </div>
          </div>

          {/* Test & Status Message */}
          {testResult && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                lineHeight: 1.4,
                background: testResult.success ? (testResult.tableMissing ? "#FAF0E6" : "#2E7D5B18") : "#B0654A18",
                color: testResult.success ? (testResult.tableMissing ? "#B0654A" : "#2E7D5B") : "#B0654A",
                border: `1px solid ${testResult.success ? (testResult.tableMissing ? "#B0654A44" : "#2E7D5B44") : "#B0654A44"}`,
              }}
            >
              {testResult.success ? (
                <>
                  ✓ {testResult.message}
                  {testResult.tableMissing && (
                    <div style={{ marginTop: 6, fontWeight: 600 }}>
                      👉 Please click <strong>"Copy SQL Schema"</strong> below and execute it in Supabase SQL Editor.
                    </div>
                  )}
                </>
              ) : (
                <>✕ Error: {testResult.error}</>
              )}
            </div>
          )}

          {/* Connect & Test Action Buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="submit"
              disabled={isTesting}
              style={{
                ...styles.todoNewBtn,
                background: "#22301F",
                color: "#FAF7F1",
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                opacity: isTesting ? 0.7 : 1,
              }}
            >
              {isTesting ? "Connecting..." : (connected ? "Update Connection" : "Save & Connect Cloud")}
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              style={{
                ...styles.todoNewBtn,
                background: "#FAF7F1",
                color: "#22301F",
                border: "1px solid #DED8C8",
                padding: "8px 14px",
                fontSize: 13,
              }}
            >
              Test Connection
            </button>

            {connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                style={{
                  ...styles.todoNewBtn,
                  background: "transparent",
                  color: "#B0654A",
                  border: "1px solid #B0654A55",
                  padding: "8px 14px",
                  fontSize: 12,
                  marginLeft: "auto",
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        {/* 1-Click Migration Card */}
        <div style={{ background: "#FAF7F1", border: "1px solid #E8E3D6", borderRadius: 10, padding: "16px", marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MinimalIcon name="cloud" size={16} color="#2E7D5B" />
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#22301F" }}>
                  1-Click Migrate Local Data to Supabase
                </h4>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5B5545", lineHeight: 1.4 }}>
                Seamlessly upload your current habits, checkmarks, todos, reflections, streak battles, and badges from your browser into Supabase cloud tables.
              </p>
            </div>
            <button
              type="button"
              onClick={handleMigrateData}
              disabled={isMigrating || !connected}
              style={{
                ...styles.todoNewBtn,
                background: connected ? "#2E7D5B" : "#A59E8D",
                color: "#FAF7F1",
                flexShrink: 0,
                fontSize: 12,
                cursor: connected ? "pointer" : "not-allowed",
              }}
              title={!connected ? "Connect to Supabase first" : "Upload local data to Supabase"}
            >
              {isMigrating ? "Migrating..." : "🚀 Migrate Now"}
            </button>
          </div>

          {migrationResult && (
            <div style={{ marginTop: 12 }}>
              {migrationResult.success ? (
                <div style={{ ...styles.journalSavedAlert, margin: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    ✓ Data Migration Succeeded!
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      👥 {migrationResult.counts.accounts} Profiles
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      🌿 {migrationResult.counts.habits} Habits
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      ✓ {migrationResult.counts.completions} Completions
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      📝 {migrationResult.counts.todos} Todos
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      📖 {migrationResult.counts.journals} Journals
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      ⚔️ {migrationResult.counts.challenges} Battles
                    </span>
                    <span style={{ ...styles.metaBadge, background: "#FFFFFF" }}>
                      🏆 {migrationResult.counts.badges} Badges
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ ...styles.journalSavedAlert, margin: 0, background: "#B0654A18", color: "#B0654A", border: "1px solid #B0654A44" }}>
                  ✕ Migration Error: {migrationResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SQL Schema Setup Assistant */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E3D6", borderRadius: 10, padding: "16px", marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#22301F" }}>
                Database Schema (schema.sql)
              </h4>
              <div style={{ fontSize: 12, color: "#8A8371", marginTop: 2 }}>
                Run once in Supabase SQL Editor to create all 8 tables and realtime channels.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowSchemaView(!showSchemaView)}
                style={{
                  background: "transparent",
                  border: "1px solid #DED8C8",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  cursor: "pointer",
                  color: "#5B5545",
                }}
              >
                {showSchemaView ? "Hide SQL" : "View SQL"}
              </button>
              <button
                type="button"
                onClick={handleCopySchema}
                style={{
                  ...styles.todoNewBtn,
                  background: "#7C9473",
                  color: "#FAF7F1",
                  fontSize: 11.5,
                  padding: "5px 12px",
                }}
              >
                {copiedSchema ? "✓ Copied!" : "📋 Copy SQL Schema"}
              </button>
            </div>
          </div>

          {showSchemaView && (
            <div style={{ marginTop: 12 }}>
              <ol style={{ margin: "0 0 10px 20px", padding: 0, fontSize: 12, color: "#5B5545", lineHeight: 1.5 }}>
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2E7D5B", fontWeight: 600 }}>supabase.com</a></li>
                <li>Go to the <strong>SQL Editor</strong> tab on the left navigation.</li>
                <li>Paste the schema code below and click <strong>Run</strong>.</li>
              </ol>
              <pre
                style={{
                  background: "#1E1E1E",
                  color: "#D4D4D4",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "monospace",
                  maxHeight: 180,
                  overflowY: "auto",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
{`-- HABIT TRACKER SUPABASE SCHEMA (schema.sql)
-- Tables: app_kv_store, profiles, habits, habit_completions, todos, journal_entries, timer_sessions, challenges, user_badges
-- View the complete schema file in your workspace: schema.sql`}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={styles.modalCancelBtn}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CHARTS MODAL COMPONENT (SVG Donut & Trends)
   ========================================================================= */
function ChartsModal({
  isOpen,
  onClose,
  habits = [],
  completions = {},
  todos = [],
}) {
  if (!isOpen) return null;

  const todayStr = todayKey();
  const todayComps = completions[todayStr] || {};

  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => todayComps[h.id]).length;
  const pendingHabits = totalHabits - completedHabits;

  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  const totalItems = totalHabits + totalTodos;
  const totalDone = completedHabits + completedTodos;
  const completionRate = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * completionRate) / 100;

  const historyDays = lastNDays(14).reverse();
  const trendData = historyDays.map((dateStr) => {
    const dayComps = completions[dateStr] || {};
    const habitDoneCount = Object.values(dayComps).filter(Boolean).length;
    const parts = dateStr.split("-");
    const label = `${parts[1]}/${parts[2]}`;
    return { date: dateStr, label, count: habitDoneCount };
  });

  const maxCount = Math.max(...trendData.map((d) => d.count), 4);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Analytics & Progress Trends</h2>
          <button style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 12 }}>
          {/* Donut Chart: Completion Breakdown */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartCardTitle}>Today's Completion Breakdown</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r={r} fill="transparent" stroke="#E8E3D6" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r={r}
                    fill="transparent"
                    stroke="#7C9473"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div style={styles.chartDonutCenter}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#22301F" }}>{completionRate}%</div>
                  <div style={{ fontSize: 10, color: "#8A8371" }}>Done</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "#7C9473" }} />
                  <span>Habits: <strong>{completedHabits}/{totalHabits}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "#557A95" }} />
                  <span>Todos: <strong>{completedTodos}/{totalTodos}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E8E3D6" }} />
                  <span>Pending: <strong>{pendingHabits + pendingTodos}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart: 14-Day Consistency Trends */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartCardTitle}>14-Day Consistency Trends</h3>
            <div style={{ display: "flex", alignItems: "flex-end", height: 130, gap: 8, padding: "10px 4px 0" }}>
              {trendData.map((d) => {
                const barHeight = Math.max(8, Math.round((d.count / maxCount) * 100));
                const isToday = d.date === todayStr;
                return (
                  <div
                    key={d.date}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                    title={`${d.date}: ${d.count} completed`}
                  >
                    <span style={{ fontSize: 10, color: "#8A8371" }}>{d.count > 0 ? d.count : ""}</span>
                    <div
                      style={{
                        width: "100%",
                        height: `${barHeight}%`,
                        background: isToday ? "#B0654A" : "#7C9473",
                        borderRadius: 3,
                        transition: "height 0.3s ease",
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: isToday ? "#B0654A" : "#8A8371", fontWeight: isToday ? 700 : 400 }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <button style={styles.ghostBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   QUICK ADD MODAL COMPONENT
   ========================================================================= */
function QuickAddModal({
  isOpen,
  onClose,
  onOpenCreateHabit,
  onOpenCreateTodo,
  onOpenCreateChallenge,
}) {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Quick Add</h2>
          <button style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: "#5B5545", margin: "4px 0 16px" }}>
          What would you like to create right now?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            style={styles.quickAddChoiceBtn}
            onClick={() => {
              onClose();
              onOpenCreateHabit();
            }}
          >
            <div style={{ ...styles.habitIconBadge, backgroundColor: "#7C947318" }}>
              <MinimalIcon name="sparkle" size={20} color="#7C9473" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#22301F" }}>Recurring Habit</div>
              <div style={{ fontSize: 12, color: "#8A8371" }}>Track everyday or weekly consistency</div>
            </div>
          </button>

          <button
            type="button"
            style={styles.quickAddChoiceBtn}
            onClick={() => {
              onClose();
              onOpenCreateTodo();
            }}
          >
            <div style={{ ...styles.habitIconBadge, backgroundColor: "#B0654A18" }}>
              <MinimalIcon name="list" size={20} color="#B0654A" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#22301F" }}>Actionable Todo</div>
              <div style={{ fontSize: 12, color: "#8A8371" }}>One-off task with due date & priority</div>
            </div>
          </button>

          <button
            type="button"
            style={styles.quickAddChoiceBtn}
            onClick={() => {
              onClose();
              if (onOpenCreateChallenge) onOpenCreateChallenge();
            }}
          >
            <div style={{ ...styles.habitIconBadge, backgroundColor: "#C08A2E18" }}>
              <MinimalIcon name="swords" size={20} color="#C08A2E" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#22301F" }}>Streak Challenge</div>
              <div style={{ fontSize: 12, color: "#8A8371" }}>Challenge a friend to a streak duel</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   SETTINGS & ACCOUNT POPUP MODAL (Clean, unified gear menu)
   ========================================================================= */
function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  unseenBadgesCount = 0,
  unlockedBadgesCount = 0,
  totalMailboxBadgeCount = 0,
  isSupabaseConnected = false,
  currentTheme = "warm",
  onSelectTheme,
  soundEnabled = true,
  onToggleSound,
  streakShields = 1,
  onOpenAchievements,
  onOpenMailbox,
  onOpenExport,
  onOpenCharts,
  onOpenSupabase,
  onLogout,
}) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  function handleCopyCode() {
    if (!currentUser?.code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`#${currentUser.code}`);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const initials = (() => {
    const name = (currentUser?.username || currentUser?.identifier || "HT").trim();
    const parts = name.replace(/@.+/, "").split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  })();

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modalContent,
          maxWidth: 440,
          padding: "22px 20px 18px",
          borderRadius: 14,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: User Profile Card */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid #E8E3D6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...styles.navAvatarCircle, width: 42, height: 42, fontSize: 16 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#22301F" }}>
                {currentUser?.username || "Account"}
                {currentUser?.is_admin && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: "#22301F", color: "#FAF7F1", padding: "1px 5px", borderRadius: 4 }}>
                    Admin
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#8A8371", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{currentUser?.identifier || ""}</span>
                <span
                  style={{
                    fontSize: 10,
                    background: "#E7EDE3",
                    color: "#3B5A33",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                  title="Age verified (13+ compliance)"
                >
                  ✓ 13+ Verified
                </span>
              </div>
            </div>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Friend Code Banner */}
        {currentUser?.code && (
          <div
            onClick={handleCopyCode}
            style={{
              margin: "14px 0 10px",
              background: "#F4EFE6",
              border: "1px dashed #DED8C8",
              borderRadius: 8,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            title="Click to copy your unique friend challenge code"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8371", textTransform: "uppercase" }}>Your Code:</span>
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#22301F" }}>#{currentUser.code}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: copiedCode ? "#2E7D5B" : "#7C9473" }}>
              {copiedCode ? "✓ Copied" : "Copy Code"}
            </span>
          </div>
        )}

        {/* Appearance & Themes */}
        <div style={{ margin: "12px 0 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8A8371", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Theme & Palette
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { id: "warm", name: "Warm Sand", icon: "🏜️", desc: "Cozy & natural", bg: "#FAF7F1", color: "#22301F", border: "#DED8C8" },
              { id: "midnight", name: "Midnight", icon: "🌌", desc: "Pure dark OLED", bg: "#1A1E24", color: "#F0EDE6", border: "#2F363D" },
              { id: "forest", name: "Forest Moss", icon: "🌲", desc: "Earthy deep green", bg: "#15241C", color: "#E8F5E9", border: "#254B3A" },
              { id: "twilight", name: "Twilight", icon: "🔮", desc: "Rich royal violet", bg: "#1D192B", color: "#F3E8FF", border: "#3B3353" },
            ].map((t) => {
              const active = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTheme && onSelectTheme(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: active ? "2px solid #7C9473" : `1px solid ${t.border}`,
                    background: t.bg,
                    color: t.color,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.12s ease",
                    boxShadow: active ? "0 0 0 1px #7C9473" : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.75 }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Delights & Streak Shields Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0 12px" }}>
          {/* Audio FX Toggle */}
          <div
            onClick={onToggleSound}
            style={{
              background: "#F4EFE6",
              border: "1px solid #E8E3D6",
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22301F" }}>🎵 Sound FX</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: soundEnabled ? "#7C9473" : "#DED8C8", color: soundEnabled ? "#FAF7F1" : "#5B5545" }}>
                {soundEnabled ? "ON" : "OFF"}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "#8A8371" }}>
              Rewarding audio pops on habit checks
            </div>
          </div>

          {/* Streak Shields Status */}
          <div
            style={{
              background: "#F4EFE6",
              border: "1px solid #E8E3D6",
              borderRadius: 8,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
            title="Streak Shields protect your habit streaks if you miss a scheduled day. Earn 1 shield every 7-day streak (max 3)."
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22301F" }}>🛡️ Shields</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#2E7D5B", color: "#FAF7F1" }}>
                {streakShields} / 3 Ready
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "#8A8371" }}>
              Protects streak on missed days
            </div>
          </div>
        </div>

        {/* Navigation List Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {/* Milestones & Badges */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAchievements) onOpenAchievements();
            }}
            style={styles.settingsMenuItem}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#C08A2E18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MinimalIcon name="trophy" size={17} color="#C08A2E" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>Milestones & Badges</div>
                <div style={{ fontSize: 11.5, color: "#8A8371" }}>
                  {unlockedBadgesCount > 0 ? `${unlockedBadgesCount} unlocked milestones` : "View achievements"}
                </div>
              </div>
            </div>
            {unseenBadgesCount > 0 && (
              <span style={{ background: "#C08A2E", color: "#FAF7F1", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {unseenBadgesCount} New
              </span>
            )}
          </button>

          {/* Mailbox & Notifications */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenMailbox) onOpenMailbox();
            }}
            style={styles.settingsMenuItem}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#B0654A18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MinimalIcon name="inbox" size={17} color="#B0654A" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>Mailbox & Notifications</div>
                <div style={{ fontSize: 11.5, color: "#8A8371" }}>Streak battles and leftover habits</div>
              </div>
            </div>
            {totalMailboxBadgeCount > 0 && (
              <span style={{ background: "#B0654A", color: "#FAF7F1", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {totalMailboxBadgeCount}
              </span>
            )}
          </button>

          {/* Visuals & Charts */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenCharts) onOpenCharts();
            }}
            style={styles.settingsMenuItem}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#2E7D5B18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MinimalIcon name="pieChart" size={17} color="#2E7D5B" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>Visuals & Charts</div>
                <div style={{ fontSize: 11.5, color: "#8A8371" }}>Trends, category breakdown, consistency</div>
              </div>
            </div>
          </button>

          {/* Export & Backup */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenExport) onOpenExport();
            }}
            style={styles.settingsMenuItem}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#5B7A8C18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MinimalIcon name="download" size={17} color="#5B7A8C" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>Export & Backup Data</div>
                <div style={{ fontSize: 11.5, color: "#8A8371" }}>Download full backup as JSON or CSV</div>
              </div>
            </div>
          </button>

          {/* Cloud Database Setting */}
          {onOpenSupabase && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupabase();
              }}
              style={styles.settingsMenuItem}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: isSupabaseConnected ? "#2E7D5B18" : "#EDE7DA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MinimalIcon name="database" size={17} color={isSupabaseConnected ? "#2E7D5B" : "#8A8371"} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#22301F" }}>Cloud Database (Supabase)</div>
                  <div style={{ fontSize: 11.5, color: "#8A8371" }}>
                    {isSupabaseConnected ? "Connected & Synchronized" : "Connect cloud database"}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: isSupabaseConnected ? "#2E7D5B" : "#8A8371" }}>
                {isSupabaseConnected ? "● Online" : "Configure →"}
              </span>
            </button>
          )}

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            style={{
              ...styles.settingsMenuItem,
              marginTop: 6,
              borderTop: "1px solid #E8E3D6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#B0654A14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MinimalIcon name="signOut" size={17} color="#B0654A" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#B0654A" }}>Sign Out</div>
                <div style={{ fontSize: 11.5, color: "#8A8371" }}>End current session safely</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   HABIT TRACKER COMPONENT (Isolated Per-User Progress)
   ========================================================================= */
function HabitTracker({ currentUser, onLogout }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeReminderAlert, setActiveReminderAlert] = useState(null);

  // Tab & Challenges State with URL Hash deep-linking
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.location.hash) {
        const h = window.location.hash.replace(/^#\/?/, "");
        if (["dashboard", "habits", "ranks", "challenges", "todos", "timer", "journal", "admin"].includes(h)) {
          return h;
        }
      }
    } catch (e) {}
    return "dashboard";
  });

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    try {
      if (typeof window !== "undefined" && window.location.hash.replace(/^#\/?/, "") !== tab) {
        window.history.replaceState(null, "", `#${tab}`);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const h = window.location.hash.replace(/^#\/?/, "");
        if (["dashboard", "habits", "ranks", "challenges", "todos", "timer", "journal", "admin"].includes(h)) {
          setActiveTabState(h);
        }
      } catch (e) {}
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const [challenges, setChallenges] = useState([]);
  const [todos, setTodos] = useState([]);
  const [journal, setJournal] = useState({});
  const [timerSessions, setTimerSessions] = useState([]);
  const [dismissedLeftovers, setDismissedLeftovers] = useState([]);
  const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [timerPrefillTask, setTimerPrefillTask] = useState("");
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(() => isSupabaseConfigured());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState({});
  const [newBadgeUnlockedNotice, setNewBadgeUnlockedNotice] = useState(null);

  // 1. Theme Engine State
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("habit_theme") || "warm";
      }
    } catch (e) {}
    return "warm";
  });

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("habit_theme", currentTheme);
      }
      const theme = THEMES[currentTheme] || THEMES.warm;
      if (typeof document !== "undefined") {
        if (theme.id === "warm") {
          document.body.classList.remove("theme-dark");
          document.body.style.backgroundColor = theme.bg;
          document.body.style.color = theme.text;
        } else {
          document.body.classList.add("theme-dark");
          document.body.style.backgroundColor = theme.bg;
          document.body.style.color = theme.text;
        }
      }
    } catch (e) {}
  }, [currentTheme]);

  // 2. Sound Micro-Delight State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("habit_sound_enabled") !== "false";
      }
    } catch (e) {}
    return true;
  });

  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("habit_sound_enabled", String(next));
      }
    } catch (e) {}
    if (next) {
      playHabitPopSound();
    }
  }

  // 3. Streak Shield & Freeze Mechanic State
  const streakShieldStorageKey = useMemo(() => {
    const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
    return `habit_streak_shields_${encodeURIComponent(cleanId)}`;
  }, [currentUser]);

  const [streakShields, setStreakShields] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
        const raw = localStorage.getItem(`habit_streak_shields_${encodeURIComponent(cleanId)}`);
        if (raw !== null) return parseInt(raw, 10);
      }
    } catch (e) {}
    return 1; // 1 complimentary starter shield
  });

  const shieldedDatesStorageKey = useMemo(() => {
    const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
    return `habit_shielded_dates_${encodeURIComponent(cleanId)}`;
  }, [currentUser]);

  const [shieldedDates, setShieldedDates] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
        const raw = localStorage.getItem(`habit_shielded_dates_${encodeURIComponent(cleanId)}`);
        if (raw) return new Set(JSON.parse(raw));
      }
    } catch (e) {}
    return new Set();
  });

  // Auto-protect streak if yesterday was missed and user has shields
  useEffect(() => {
    if (!loaded || habits.length === 0 || streakShields <= 0) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = keyFromDate(y);
    const yesterdayDay = y.getDay();
    const yComps = completions[yesterdayStr] || {};

    const scheduledYesterday = habits.filter((h) => {
      if (h.archived) return false;
      if (h.frequencyType === "specific_days" && Array.isArray(h.daysOfWeek)) {
        return h.daysOfWeek.includes(yesterdayDay);
      }
      return true;
    });

    if (scheduledYesterday.length > 0) {
      const anyCompleted = scheduledYesterday.some((h) => yComps[h.id]);
      if (!anyCompleted && !shieldedDates.has(yesterdayStr)) {
        const nextSet = new Set(shieldedDates);
        nextSet.add(yesterdayStr);
        setShieldedDates(nextSet);
        const nextShields = Math.max(0, streakShields - 1);
        setStreakShields(nextShields);
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(shieldedDatesStorageKey, JSON.stringify(Array.from(nextSet)));
            localStorage.setItem(streakShieldStorageKey, String(nextShields));
          }
        } catch (e) {}
      }
    }
  }, [loaded, habits, completions]);

  // Award streak shield for achieving 7-day streak (max 3 shields)
  useEffect(() => {
    if (!loaded || habits.length === 0 || streakShields >= 3) return;
    const maxStreak = Math.max(0, ...habits.map((h) => computeStreak(completions, h, shieldedDates)));
    if (maxStreak >= 7 && streakShields < 3) {
      const lastAwardedKey = `habit_last_shield_award_${encodeURIComponent(currentUser?.identifier || "guest")}`;
      const lastAwarded = parseInt(localStorage?.getItem(lastAwardedKey) || "0", 10);
      if (maxStreak > lastAwarded) {
        const nextCount = Math.min(3, streakShields + 1);
        setStreakShields(nextCount);
        try {
          localStorage.setItem(streakShieldStorageKey, String(nextCount));
          localStorage.setItem(lastAwardedKey, String(maxStreak));
        } catch (e) {}
      }
    }
  }, [habits, completions, shieldedDates]);

  // Keep the user's real account streak in sync for the real-time leaderboard
  useEffect(() => {
    if (!loaded || !currentUser?.identifier) return;
    const cleanEmail = currentUser.identifier.trim().toLowerCase();
    const maxActiveStreak = Math.max(0, ...habits.map((h) => computeStreak(completions, h, shieldedDates)));
    (async () => {
      try {
        const accounts = await getRegisteredAccounts();
        const existing = accounts[cleanEmail];
        if (existing) {
          const prevLongest = existing.longestStreak || 0;
          const nextLongest = Math.max(prevLongest, maxActiveStreak);
          if (existing.currentStreak !== maxActiveStreak || existing.longestStreak !== nextLongest) {
            existing.currentStreak = maxActiveStreak;
            existing.longestStreak = nextLongest;
            accounts[cleanEmail] = existing;
            await storage.set(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
            if (window.supabaseClient && !window.__supabaseOffline) {
              window.supabaseClient
                .from("profiles")
                .update({ current_streak: maxActiveStreak, longest_streak: nextLongest })
                .eq("email", cleanEmail)
                .then(() => {})
                .catch(() => {});
            }
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("habit_streak_updated"));
            }
          }
        }
      } catch (e) {}
    })();
  }, [loaded, currentUser, habits, completions, shieldedDates]);

  // Track seen badges so the notification badge clears when the user views achievements
  const seenBadgesStorageKey = useMemo(() => {
    const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
    return `habit_seen_badges_${encodeURIComponent(cleanId)}`;
  }, [currentUser]);

  const [seenBadgeIds, setSeenBadgeIds] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
        const raw = localStorage.getItem(`habit_seen_badges_${encodeURIComponent(cleanId)}`);
        if (raw) return new Set(JSON.parse(raw));
      }
    } catch (e) {}
    return new Set();
  });

  const unseenBadgesCount = useMemo(() => {
    const unlockedList = Object.keys(unlockedBadges || {});
    return unlockedList.filter((id) => !seenBadgeIds.has(id)).length;
  }, [unlockedBadges, seenBadgeIds]);

  function handleOpenAchievements() {
    const allUnlockedIds = Object.keys(unlockedBadges || {});
    const nextSeen = new Set([...seenBadgeIds, ...allUnlockedIds]);
    setSeenBadgeIds(nextSeen);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(seenBadgesStorageKey, JSON.stringify(Array.from(nextSeen)));
      }
    } catch (e) {}
    setIsAchievementsModalOpen(true);
  }

  const [habitFilter, setHabitFilter] = useState("active"); // 'active' | 'archived'
  const [prefillChallengeHabit, setPrefillChallengeHabit] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [copiedHeaderCode, setCopiedHeaderCode] = useState(false);

  function handleCopyHeaderCode() {
    if (!currentUser?.code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`#${currentUser.code}`);
    }
    setCopiedHeaderCode(true);
    setTimeout(() => setCopiedHeaderCode(false), 2000);
  }

  const today = todayKey();
  const days = useMemo(() => lastNDays(84), []); // 12 weeks
  const lastTriggeredReminders = useRef(new Set());

  // Unique storage key scoped to THIS specific user
  const userStorageKey = useMemo(() => {
    const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
    return `habit_user_data_${encodeURIComponent(cleanId)}`;
  }, [currentUser]);

  // Load challenges with real-time cross-tab synchronization and polling
  const loadChallenges = async () => {
    const data = await getStoredChallenges();
    setChallenges(data);
  };

  useEffect(() => {
    loadChallenges();

    // Listen for storage events across tabs/windows
    const handleStorageChange = (e) => {
      if (!e || e.key === CHALLENGES_STORAGE_KEY || !e.key) {
        loadChallenges();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 2-second polling fallback to ensure incoming challenges and progress update
    const pollInterval = setInterval(() => {
      loadChallenges();
    }, 2000);

    // Supabase Realtime subscription for instant multi-device challenge updates
    let realtimeChannel = null;
    if (window.supabaseClient) {
      try {
        realtimeChannel = window.supabaseClient
          .channel("public:challenges")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "challenges" },
            () => {
              loadChallenges();
            }
          )
          .subscribe();
      } catch (rtErr) {
        console.warn("Supabase Realtime challenges channel subscription warning:", rtErr);
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
      if (realtimeChannel && window.supabaseClient) {
        try {
          window.supabaseClient.removeChannel(realtimeChannel);
        } catch (e) {}
      }
    };
  }, [currentUser, isSupabaseConnected]);

  // Check URL query parameter ?challenge=ID
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const chalId = params.get("challenge");
        if (chalId) {
          setActiveTab("challenges");
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoaded(false);

    (async () => {
      try {
        const loadPromise = Promise.all([
          storage.get(userStorageKey),
          getStoredTodos(currentUser?.identifier),
          getStoredJournal(currentUser?.identifier),
          getStoredTimerSessions(currentUser?.identifier),
          getStoredDismissedLeftovers(currentUser?.identifier),
        ]);

        // Fast 3-second fallback
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );

        const [res, loadedTodos, loadedJournal, loadedTimer, loadedDismissed] = await Promise.race([
          loadPromise,
          timeoutPromise
        ]);

        if (isMounted) {
          if (res && res.value) {
            const parsed = JSON.parse(res.value);
            setHabits(parsed.habits || []);
            setCompletions(parsed.completions || {});
          } else {
            setHabits([]);
            setCompletions({});
          }
          setTodos(loadedTodos || []);
          setJournal(loadedJournal || {});
          setTimerSessions(loadedTimer || []);
          setDismissedLeftovers(loadedDismissed || []);
          setError(null);
        }
      } catch (e) {
        // Fallback silently to local cache without showing error banner
        if (isMounted) {
          try {
            if (typeof localStorage !== "undefined") {
              const localHabits = localStorage.getItem(userStorageKey);
              if (localHabits) {
                const parsed = JSON.parse(localHabits);
                setHabits(parsed.habits || []);
                setCompletions(parsed.completions || {});
              }
            }
          } catch (err) {}
          setError(null);
        }
      } finally {
        if (isMounted) setLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userStorageKey, currentUser]);

  // Save changes directly under this user's account
  async function persist(nextHabits, nextCompletions) {
    try {
      const payload = {
        user: currentUser?.identifier,
        lastSaved: new Date().toISOString(),
        habits: nextHabits,
        completions: nextCompletions,
      };

      const result = await storage.set(userStorageKey, JSON.stringify(payload));
      if (!result) setError("Couldn't save — your changes may not stick.");
      else setError(null);
    } catch (e) {
      setError("Couldn't save progress.");
    }
  }

  function handleSaveNewHabit(newHabit) {
    const next = [...habits, newHabit];
    setHabits(next);
    persist(next, completions);
  }

  function removeHabit(id) {
    const next = habits.filter((h) => h.id !== id);
    setHabits(next);
    persist(next, completions);
  }

  function handleArchiveHabit(id) {
    const next = habits.map((h) => (h.id === id ? { ...h, archived: true } : h));
    setHabits(next);
    persist(next, completions);
  }

  function handleUnarchiveHabit(id) {
    const next = habits.map((h) => (h.id === id ? { ...h, archived: false } : h));
    setHabits(next);
    persist(next, completions);
  }

  function handleCompleteLinkedHabit(habitId) {
    const todayStr = todayKey();
    const currentComps = completions[todayStr] || {};
    if (!currentComps[habitId]) {
      toggleToday(habitId);
    }
  }

  function handleCompleteLinkedTodo(todoId) {
    const next = todos.map((t) => (t.id === todoId ? { ...t, completed: true } : t));
    setTodos(next);
    saveStoredTodos(currentUser?.identifier, next);
  }

  // Real-time calculation of all achievement badge statistics
  const badgeStats = useMemo(() => {
    return computeBadgeStats({
      habits,
      completions,
      todos,
      journal,
      timerSessions,
      challenges,
      currentUser,
    });
  }, [habits, completions, todos, journal, timerSessions, challenges, currentUser]);

  const badgesStorageKey = useMemo(() => {
    const cleanId = (currentUser?.identifier || "guest").trim().toLowerCase();
    return `habit_badges_${encodeURIComponent(cleanId)}`;
  }, [currentUser]);

  // Sync unlocked badges and trigger celebration notice when milestones are met
  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.get(badgesStorageKey);
        let currentUnlocked = {};
        if (stored && stored.value) {
          try {
            currentUnlocked = JSON.parse(stored.value) || {};
          } catch (err) {}
        }

        let updated = false;
        let newlyUnlocked = null;

        BADGE_DEFINITIONS.forEach((b) => {
          if (!currentUnlocked[b.id] && b.check(badgeStats)) {
            currentUnlocked[b.id] = { unlockedAt: new Date().toISOString() };
            updated = true;
            if (!newlyUnlocked) newlyUnlocked = b;
          }
        });

        if (updated) {
          await storage.set(badgesStorageKey, JSON.stringify(currentUnlocked));
          if (newlyUnlocked && loaded) {
            setNewBadgeUnlockedNotice(newlyUnlocked);
            setTimeout(() => setNewBadgeUnlockedNotice(null), 6000);
          }
        }
        setUnlockedBadges(currentUnlocked);
      } catch (e) {}
    })();
  }, [badgeStats, badgesStorageKey, loaded]);

  // Todos Handlers
  async function handleAddTodo(newTodo) {
    const next = [newTodo, ...todos];
    setTodos(next);
    await saveStoredTodos(currentUser?.identifier, next);
  }

  async function handleToggleTodo(todoId) {
    const target = todos.find((t) => t.id === todoId);
    if (target && !target.completed) {
      playHabitPopSound();
    }
    const next = todos.map((t) => (t.id === todoId ? { ...t, completed: !t.completed } : t));
    setTodos(next);
    await saveStoredTodos(currentUser?.identifier, next);
  }

  async function handleDeleteTodo(todoId) {
    const next = todos.filter((t) => t.id !== todoId);
    setTodos(next);
    await saveStoredTodos(currentUser?.identifier, next);
  }

  function handleStartFocusOnTodo(todo) {
    setTimerPrefillTask(`Todo: ${todo.title}`);
    setActiveTab("timer");
  }

  // Journal Handler
  async function handleSaveJournalEntry(dateKey, entry) {
    const next = { ...journal, [dateKey]: entry };
    setJournal(next);
    await saveStoredJournal(currentUser?.identifier, next);
  }

  // Timer Session Handler
  async function handleAddTimerSession(session) {
    const next = [...timerSessions, session];
    setTimerSessions(next);
    await saveStoredTimerSessions(currentUser?.identifier, next);
  }

  // Leftover Handlers
  async function handleMarkLeftoverDone(item) {
    playHabitPopSound();
    if (item.type === "habit") {
      const dateComps = { ...(completions[item.targetDate] || {}) };
      dateComps[item.rawId] = true;
      const nextComps = { ...completions, [item.targetDate]: dateComps };
      setCompletions(nextComps);
      persist(habits, nextComps);
      syncHabitCompletionToChallenges(item.title, true);
    } else if (item.type === "todo") {
      await handleToggleTodo(item.rawId);
    }
  }

  async function handleCarryOverLeftover(item) {
    if (item.type === "habit") {
      toggleToday(item.rawId);
    } else if (item.type === "todo") {
      const next = todos.map((t) => (t.id === item.rawId ? { ...t, dueDate: today } : t));
      setTodos(next);
      await saveStoredTodos(currentUser?.identifier, next);
    }
    await handleDismissLeftover(item);
  }

  async function handleDismissLeftover(item) {
    const nextDismissed = [...dismissedLeftovers, item.id];
    setDismissedLeftovers(nextDismissed);
    await saveStoredDismissedLeftovers(currentUser?.identifier, nextDismissed);
  }

  // Leftovers computed list
  const leftoverItems = useMemo(() => {
    return computeLeftoverItems(habits, completions, todos, dismissedLeftovers);
  }, [habits, completions, todos, dismissedLeftovers]);

  const cleanCurrentId = (currentUser?.identifier || "").trim().toLowerCase();
  const cleanCurrentUsername = (currentUser?.username || "").trim().toLowerCase();
  const cleanCurrentCode = (currentUser?.code || "").replace(/^#/, "").trim().toUpperCase();

  const todayDayOfWeek = new Date().getDay();

  // Incoming pending challenges addressed to this user (and not created by this user)
  const incomingChallenges = useMemo(() => {
    return challenges.filter(
      (c) => c.status === "pending" && isChallengeForUser(c, currentUser) && !isChallengeFromUser(c, currentUser)
    );
  }, [challenges, currentUser]);

  const pendingIncomingCount = incomingChallenges.length;

  // Habits that apply to today
  const dueTodayHabits = useMemo(() => {
    return habits.filter((h) => {
      if (h.frequencyType === "specific_days" && h.daysOfWeek?.length > 0) {
        return h.daysOfWeek.includes(todayDayOfWeek);
      }
      return true;
    });
  }, [habits, todayDayOfWeek]);

  // Daily tasks not yet completed today
  const uncompletedTasksCount = useMemo(() => {
    const todayCompletions = completions[today] || {};
    return dueTodayHabits.filter((h) => !todayCompletions[h.id]).length;
  }, [dueTodayHabits, completions, today]);

  // Combined Mailbox badge count (challenges waiting + uncompleted daily tasks)
  const totalMailboxBadgeCount = incomingChallenges.length + uncompletedTasksCount;

  // Sync habit completion to any active matching challenges
  function syncHabitCompletionToChallenges(habitName, willBeDone, currentChallenges = challenges) {
    let hasChanges = false;
    const nextChallenges = currentChallenges.map((c) => {
      if (c.status !== "active") return c;
      if (c.habitName.toLowerCase() !== habitName.toLowerCase()) return c;

      const comps = { ...(c.completions || {}) };
      const userComps = { ...(comps[cleanCurrentId] || {}) };
      if (willBeDone) {
        userComps[today] = true;
      } else {
        delete userComps[today];
      }
      comps[cleanCurrentId] = userComps;

      let updatedChallenge = { ...c, completions: comps };
      if (willBeDone && c.goalType === "target_days" && c.targetDays) {
        const streak = computeChallengeStreak(userComps);
        if (streak >= c.targetDays) {
          updatedChallenge.status = "completed";
          updatedChallenge.winner = cleanCurrentId;
        }
      }
      hasChanges = true;
      return updatedChallenge;
    });

    if (hasChanges) {
      setChallenges(nextChallenges);
      saveStoredChallenges(nextChallenges);
    }
  }

  function toggleToday(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    const dayMap = { ...(completions[today] || {}) };
    const willBeDone = !dayMap[habitId];
    if (dayMap[habitId]) delete dayMap[habitId];
    else dayMap[habitId] = true;
    const next = { ...completions, [today]: dayMap };
    setCompletions(next);
    persist(habits, next);

    if (willBeDone) {
      playHabitPopSound();
      // Check if all today's scheduled habits are now fulfilled
      const todayDay = new Date().getDay();
      const dueToday = habits.filter((h) => {
        if (h.archived) return false;
        if (h.frequencyType === "specific_days" && Array.isArray(h.daysOfWeek)) {
          return h.daysOfWeek.includes(todayDay);
        }
        return true;
      });
      const allDone = dueToday.length > 0 && dueToday.every((h) => (h.id === habitId ? willBeDone : !!dayMap[h.id]));
      if (allDone) {
        setTimeout(() => {
          playDayCelebrationChime();
          triggerConfetti();
        }, 150);
      }
    }

    if (habit) {
      syncHabitCompletionToChallenges(habit.name, willBeDone);
    }
  }

  async function handleChallengeCreated(newChallenge) {
    const next = [newChallenge, ...challenges];
    setChallenges(next);
    await saveStoredChallenges(next);
    setActiveTab("challenges");
  }

  async function handleAcceptChallenge(challenge) {
    const next = challenges.map((c) => {
      if (c.id === challenge.id) {
        return {
          ...c,
          status: "active",
          acceptedAt: new Date().toISOString(),
          participant: {
            identifier: cleanCurrentId,
            username: currentUser?.username || cleanCurrentId.split("@")[0],
            code: currentUser?.code || "",
          },
          completions: {
            ...(c.completions || {}),
            [cleanCurrentId]: (c.completions || {})[cleanCurrentId] || {},
          },
        };
      }
      return c;
    });
    setChallenges(next);
    await saveStoredChallenges(next);

    // If user doesn't already have this habit, add it automatically
    const existingHabit = habits.find((h) => h.name.toLowerCase() === challenge.habitName.toLowerCase());
    if (!existingHabit) {
      const newHabit = {
        id: "h_" + Date.now(),
        name: challenge.habitName,
        icon: challenge.habitIcon || "sparkle",
        color: challenge.habitColor || "#7C9473",
        category: "Health & Fitness",
        frequencyType: "everyday",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        periodType: "ongoing",
        createdAt: todayKey(),
      };
      const nextHabits = [...habits, newHabit];
      setHabits(nextHabits);
      persist(nextHabits, completions);
    }
  }

  async function handleDeclineChallenge(challenge) {
    const next = challenges.filter((c) => c.id !== challenge.id);
    setChallenges(next);
    await saveStoredChallenges(next);
  }

  async function handleCancelChallenge(challenge) {
    const next = challenges.filter((c) => c.id !== challenge.id);
    setChallenges(next);
    await saveStoredChallenges(next);
  }

  async function handleChallengeCheckIn(challenge) {
    const comps = { ...(challenge.completions || {}) };
    const userComps = { ...(comps[cleanCurrentId] || {}) };
    const isDone = !!userComps[today];

    if (isDone) {
      delete userComps[today];
    } else {
      userComps[today] = true;
    }
    comps[cleanCurrentId] = userComps;

    let updatedChallenge = { ...challenge, completions: comps };
    if (!isDone && challenge.goalType === "target_days" && challenge.targetDays) {
      const newStreak = computeChallengeStreak(userComps);
      if (newStreak >= challenge.targetDays) {
        updatedChallenge.status = "completed";
        updatedChallenge.winner = cleanCurrentId;
      }
    }

    const next = challenges.map((c) => (c.id === challenge.id ? updatedChallenge : c));
    setChallenges(next);
    await saveStoredChallenges(next);

    // Sync to personal habit
    const existingHabit = habits.find((h) => h.name.toLowerCase() === challenge.habitName.toLowerCase());
    if (existingHabit) {
      const dayMap = { ...(completions[today] || {}) };
      if (isDone) {
        delete dayMap[existingHabit.id];
      } else {
        dayMap[existingHabit.id] = true;
      }
      const nextCompletions = { ...completions, [today]: dayMap };
      setCompletions(nextCompletions);
      persist(habits, nextCompletions);
    } else if (!isDone) {
      const newHabit = {
        id: "h_" + Date.now(),
        name: challenge.habitName,
        icon: challenge.habitIcon || "sparkle",
        color: challenge.habitColor || "#7C9473",
        category: "Health & Fitness",
        frequencyType: "everyday",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        periodType: "ongoing",
        createdAt: todayKey(),
      };
      const nextHabits = [...habits, newHabit];
      const nextCompletions = {
        ...completions,
        [today]: { ...(completions[today] || {}), [newHabit.id]: true },
      };
      setHabits(nextHabits);
      setCompletions(nextCompletions);
      persist(nextHabits, nextCompletions);
    }
  }

  function handleCopyInviteLink(challenge) {
    try {
      const url = `${window.location.origin}${window.location.pathname}?challenge=${encodeURIComponent(challenge.id)}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      }
      setCopyFeedback("Invite link copied to clipboard! Send it to your friend.");
      setTimeout(() => setCopyFeedback(null), 4000);
    } catch (e) {
      setCopyFeedback("Challenge ID: " + challenge.id);
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  }

  // Active Reminder Check (runs every 15 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHH = String(now.getHours()).padStart(2, "0");
      const currentMM = String(now.getMinutes()).padStart(2, "0");
      const currentHHMM = `${currentHH}:${currentMM}`;
      const todayDateKey = todayKey();
      const dayOfWeek = now.getDay();

      habits.forEach((habit) => {
        if (!habit.reminderTime) return;
        if (habit.reminderTime !== currentHHMM) return;

        // Verify if today is an active day for this habit
        if (habit.frequencyType === "specific_days" && habit.daysOfWeek && !habit.daysOfWeek.includes(dayOfWeek)) {
          return;
        }

        const reminderKey = `${habit.id}_${todayDateKey}_${currentHHMM}`;
        if (lastTriggeredReminders.current.has(reminderKey)) return;
        lastTriggeredReminders.current.add(reminderKey);

        // Sound alert
        playNotificationChime();

        // In-app alert
        setActiveReminderAlert({
          habitId: habit.id,
          name: habit.name,
          icon: habit.icon || "✨",
          description: habit.description,
          time: habit.reminderTime,
        });

        // Browser system notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(`Time for your habit: ${habit.name}`, {
              body: habit.description || "Time to complete your habit for today!",
              icon: "favicon.ico",
            });
          } catch (e) {}
        }
      });
    };

    const interval = setInterval(checkReminders, 15000);
    checkReminders();
    return () => clearInterval(interval);
  }, [habits]);

  if (!loaded) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Restoring your habits…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
        .habit-row:hover .delete-btn { opacity: 1; }

        :root {
          --theme-bg: ${(THEMES[currentTheme] || THEMES.warm).bg};
          --theme-card: ${(THEMES[currentTheme] || THEMES.warm).cardBg};
          --theme-surface: ${(THEMES[currentTheme] || THEMES.warm).surface};
          --theme-text: ${(THEMES[currentTheme] || THEMES.warm).text};
          --theme-text-muted: ${(THEMES[currentTheme] || THEMES.warm).textMuted};
          --theme-border: ${(THEMES[currentTheme] || THEMES.warm).border};
          --theme-accent: ${(THEMES[currentTheme] || THEMES.warm).accent};
        }
        body, html {
          background-color: ${(THEMES[currentTheme] || THEMES.warm).bg} !important;
          color: ${(THEMES[currentTheme] || THEMES.warm).text} !important;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        ${currentTheme !== "warm" ? `
          body.theme-dark *[style*="background: #FAF7F1"],
          body.theme-dark *[style*="background: rgb(250, 247, 241)"],
          body.theme-dark *[style*="background-color: #FAF7F1"] {
            background-color: ${(THEMES[currentTheme] || THEMES.warm).bg} !important;
          }
          body.theme-dark *[style*="background: #F4EFE6"],
          body.theme-dark *[style*="background: rgb(244, 239, 230)"],
          body.theme-dark *[style*="background-color: #F4EFE6"],
          body.theme-dark *[style*="background: #EDE7DA"],
          body.theme-dark *[style*="background: #FFFFFF"],
          body.theme-dark *[style*="background-color: rgb(255, 255, 255)"] {
            background-color: ${(THEMES[currentTheme] || THEMES.warm).cardBg} !important;
          }
          body.theme-dark *[style*="color: #22301F"],
          body.theme-dark *[style*="color: rgb(34, 48, 31)"] {
            color: ${(THEMES[currentTheme] || THEMES.warm).text} !important;
          }
          body.theme-dark *[style*="color: #8A8371"],
          body.theme-dark *[style*="color: #5B5545"],
          body.theme-dark *[style*="color: rgb(138, 131, 113)"],
          body.theme-dark *[style*="color: rgb(91, 85, 69)"] {
            color: ${(THEMES[currentTheme] || THEMES.warm).textMuted} !important;
          }
          body.theme-dark *[style*="border-color: #E2DCCE"],
          body.theme-dark *[style*="border-color: #DED8C8"],
          body.theme-dark *[style*="border-color: #E8E3D6"],
          body.theme-dark *[style*="border: 1px solid #E2DCCE"],
          body.theme-dark *[style*="border: 1px solid #DED8C8"],
          body.theme-dark *[style*="border: 1px solid #E8E3D6"],
          body.theme-dark *[style*="border-bottom: 1px solid #E8E3D6"],
          body.theme-dark *[style*="border-bottom: 1px solid #E2DCCE"],
          body.theme-dark *[style*="border-bottom: 1px solid #DED8C8"] {
            border-color: ${(THEMES[currentTheme] || THEMES.warm).border} !important;
          }
          body.theme-dark input,
          body.theme-dark textarea,
          body.theme-dark select {
            background-color: ${(THEMES[currentTheme] || THEMES.warm).surface} !important;
            color: ${(THEMES[currentTheme] || THEMES.warm).text} !important;
            border-color: ${(THEMES[currentTheme] || THEMES.warm).border} !important;
          }
        ` : ""}
      `}</style>

      {/* Reminder Alert Banner */}
      {activeReminderAlert && (
        <div style={styles.reminderToast}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "rgba(250,247,241,0.12)" }}>
              <MinimalIcon name="bell" size={18} color="#FAF7F1" />
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <MinimalIcon name={activeReminderAlert.icon} size={15} color="#FAF7F1" />
                Time for {activeReminderAlert.name}!
              </div>
              {activeReminderAlert.description && (
                <div style={{ fontSize: 12, opacity: 0.85 }}>{activeReminderAlert.description}</div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={styles.reminderDoneBtn}
              onClick={() => {
                toggleToday(activeReminderAlert.habitId);
                setActiveReminderAlert(null);
              }}
            >
              Mark Done ✓
            </button>
            <button
              style={styles.reminderDismissBtn}
              onClick={() => setActiveReminderAlert(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Unified Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        totalMailboxBadgeCount={totalMailboxBadgeCount}
        unseenBadgesCount={unseenBadgesCount}
        onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Settings & Account Popup Menu Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        unseenBadgesCount={unseenBadgesCount}
        unlockedBadgesCount={Object.keys(unlockedBadges || {}).length}
        totalMailboxBadgeCount={totalMailboxBadgeCount}
        isSupabaseConnected={isSupabaseConnected}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        streakShields={streakShields}
        onOpenAchievements={handleOpenAchievements}
        onOpenMailbox={() => setIsMailboxOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenCharts={() => setIsChartsModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        onLogout={onLogout}
      />

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* 1. Dashboard View */}
      {activeTab === "dashboard" && (
        <DailyDashboardView
          currentUser={currentUser}
          habits={habits}
          completions={completions}
          todos={todos}
          leftovers={leftoverItems}
          challenges={challenges}
          streakShields={streakShields}
          onToggleHabit={toggleToday}
          onToggleTodo={handleToggleTodo}
          onMarkLeftoverDone={handleMarkLeftoverDone}
          onCarryOverLeftover={handleCarryOverLeftover}
          onDismissLeftover={handleDismissLeftover}
          onOpenCharts={() => setIsChartsModalOpen(true)}
          onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
          onOpenCreateChallenge={() => {
            setPrefillChallengeHabit(null);
            setIsChallengeModalOpen(true);
          }}
          onNavigateTab={setActiveTab}
        />
      )}

      {/* 2. Todos View */}
      {activeTab === "todos" && (
        <TodosView
          todos={todos}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
          onStartFocusOnTodo={handleStartFocusOnTodo}
        />
      )}

      {/* 3. Focus Timer View */}
      {activeTab === "timer" && (
        <FocusTimerView
          currentUser={currentUser}
          habits={habits}
          todos={todos}
          timerSessions={timerSessions}
          onAddSession={handleAddTimerSession}
          onCompleteLinkedHabit={handleCompleteLinkedHabit}
          onCompleteLinkedTodo={handleCompleteLinkedTodo}
          prefillTask={timerPrefillTask}
        />
      )}

      {/* 4. Daily Journal View */}
      {activeTab === "journal" && (
        <DailyJournalView
          currentUser={currentUser}
          journal={journal}
          onSaveJournalEntry={handleSaveJournalEntry}
        />
      )}

      {/* 5. Real-Time Authentic Leaderboard View */}
      {activeTab === "ranks" && (
        <LeaderboardView
          currentUser={currentUser}
          habits={habits}
          completions={completions}
          shieldedDates={shieldedDates}
          challenges={challenges}
          onOpenChallengeModal={(targetUser) => {
            setPrefillChallengeHabit(null);
            setIsChallengeModalOpen(true);
          }}
        />
      )}

      {/* 6. Admin Panel View */}
      {activeTab === "admin" && currentUser?.is_admin === true && (
        <AdminPanelView
          currentUser={currentUser}
          onBroadcastNotice={() => {}}
        />
      )}
      {activeTab === "admin" && !currentUser?.is_admin && (
        <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
          <MinimalIcon name="shield" size={48} color="#B0654A" />
          <h3 style={{ fontSize: 20, color: "#22301F", margin: "16px 0 8px" }}>Access Restricted</h3>
          <p style={{ fontSize: 14, color: "#8A8371", lineHeight: 1.5 }}>
            You must have administrator privileges to access the platform directory and control panel.
          </p>
        </div>
      )}

      {/* 7. Friend Challenges View */}
      {activeTab === "challenges" && (
        <FriendChallengesView
          currentUser={currentUser}
          challenges={challenges}
          today={today}
          onAcceptChallenge={handleAcceptChallenge}
          onDeclineChallenge={handleDeclineChallenge}
          onCancelChallenge={handleCancelChallenge}
          onCheckIn={handleChallengeCheckIn}
          onOpenCreateModal={() => {
            setPrefillChallengeHabit(null);
            setIsChallengeModalOpen(true);
          }}
          onCopyInviteLink={handleCopyInviteLink}
          copyFeedback={copyFeedback}
        />
      )}

      {/* 8. Recurring Habits View */}
      {activeTab === "habits" && (() => {
        const activeHabitsList = habits.filter((h) => !h.archived);
        const archivedHabitsList = habits.filter((h) => h.archived);
        const displayedHabits = habitFilter === "archived" ? archivedHabitsList : activeHabitsList;

        return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={styles.viewMainTitle}>Recurring Habits</h2>
                <p style={styles.viewSubTitle}>Nurture steady consistency day by day.</p>
              </div>
              <button
                type="button"
                style={styles.todoNewBtn}
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Create Habit
              </button>
            </div>

            {/* Active / Archived Filter Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setHabitFilter("active")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: habitFilter === "active" ? "#22301F" : "#DED8C8",
                  background: habitFilter === "active" ? "#22301F" : "#FAF7F1",
                  color: habitFilter === "active" ? "#FAF7F1" : "#5B5545",
                  cursor: "pointer",
                }}
              >
                Active Habits ({activeHabitsList.length})
              </button>
              <button
                type="button"
                onClick={() => setHabitFilter("archived")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: habitFilter === "archived" ? "#22301F" : "#DED8C8",
                  background: habitFilter === "archived" ? "#22301F" : "#FAF7F1",
                  color: habitFilter === "archived" ? "#FAF7F1" : "#5B5545",
                  cursor: "pointer",
                }}
              >
                📦 Archived ({archivedHabitsList.length})
              </button>
            </div>

            {displayedHabits.length === 0 && (
              <div style={styles.empty}>
                <p style={styles.emptyText}>
                  {habitFilter === "archived"
                    ? "No habits are currently archived."
                    : "Nothing tracked yet for this account."}
                </p>
                {habitFilter === "active" && (
                  <button
                    type="button"
                    style={styles.createHabitBigBtn}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <span style={{ fontSize: 15, marginRight: 6, lineHeight: 1 }}>+</span>
                    Create a Habit
                  </button>
                )}
              </div>
            )}

            <div style={styles.list}>
              {displayedHabits.map((h) => {
                const doneToday = !!(completions[today] || {})[h.id];
                const streak = computeStreak(completions, h);
                const habitColor = h.color || "#7C9473";
                const habitIcon = h.icon || "✨";

                return (
                  <div key={h.id} className="habit-row" style={styles.habitRow}>
                    <div
                      style={{
                        ...styles.habitIconBadge,
                        backgroundColor: `${habitColor}14`,
                        borderColor: `${habitColor}33`,
                      }}
                      title={h.category || "Habit"}
                    >
                      <MinimalIcon name={habitIcon} size={18} color={habitColor} />
                    </div>

                    <button
                      onClick={() => toggleToday(h.id)}
                      style={{
                        ...styles.checkCircle,
                        background: doneToday ? habitColor : "transparent",
                        borderColor: habitColor,
                      }}
                      aria-label={doneToday ? `Mark ${h.name} not done today` : `Mark ${h.name} done today`}
                    >
                      {doneToday && <span style={styles.checkMark}>✓</span>}
                    </button>

                    <div style={styles.habitMain}>
                      <div style={styles.habitTopRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={styles.habitName}>{h.name}</span>
                          <span style={styles.streakBadge}>
                            <MinimalIcon name="flame" size={12} color="#B0654A" style={{ marginRight: 4 }} />
                            {streak > 0 ? `${streak} ${streak === 1 ? "day" : "days"} streak` : "0 days"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {h.archived ? (
                            <button
                              type="button"
                              onClick={() => handleUnarchiveHabit(h.id)}
                              style={{
                                padding: "3px 8px",
                                borderRadius: 5,
                                border: "1px solid #7C9473",
                                background: "#7C947318",
                                color: "#2E7D5B",
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                              title="Restore back to active routine"
                            >
                              ↺ Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleArchiveHabit(h.id)}
                              style={{
                                padding: "3px 8px",
                                borderRadius: 5,
                                border: "1px solid #DED8C8",
                                background: "#FAF7F1",
                                color: "#5B5545",
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                              title="Archive habit (hide from dashboard without deleting)"
                            >
                              📦 Archive
                            </button>
                          )}
                          <button
                            className="delete-btn"
                            onClick={() => removeHabit(h.id)}
                            style={styles.deleteBtn}
                            aria-label={`Delete ${h.name}`}
                            title="Delete permanently"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {h.description && (
                        <p style={styles.habitDescription}>{h.description}</p>
                      )}

                      <div style={styles.habitMetaRow}>
                        {h.category && (
                          <span style={styles.metaBadge}>
                            <MinimalIcon name="tag" size={11} color="#5B5545" style={{ marginRight: 4 }} />
                            {h.category}
                          </span>
                        )}

                        <span style={styles.metaBadge}>
                          <MinimalIcon name="calendar" size={11} color="#5B5545" style={{ marginRight: 4 }} />
                          {h.frequencyType === "specific_days" && h.daysOfWeek?.length
                            ? h.daysOfWeek.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
                            : "Everyday"}
                        </span>

                        {h.periodType === "month" && (
                          <span style={{ ...styles.metaBadge, backgroundColor: "#FAF0E6", color: "#B0654A" }}>
                            <MinimalIcon name="target" size={11} color="#B0654A" style={{ marginRight: 4 }} />
                            30-Day Goal
                          </span>
                        )}

                        {h.periodType === "custom_period" && h.endDate && (
                          <span style={{ ...styles.metaBadge, backgroundColor: "#FAF0E6", color: "#B0654A" }}>
                            <MinimalIcon name="target" size={11} color="#B0654A" style={{ marginRight: 4 }} />
                            Until {h.endDate}
                          </span>
                        )}

                        {h.reminderTime && (
                          <span style={{ ...styles.metaBadge, backgroundColor: "#EBF3FA", color: "#3A506B" }}>
                            <MinimalIcon name="bell" size={11} color="#3A506B" style={{ marginRight: 4 }} />
                            {formatTime12h(h.reminderTime)}
                          </span>
                        )}

                        <button
                          type="button"
                          style={styles.challengeHabitActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrefillChallengeHabit(h);
                            setIsChallengeModalOpen(true);
                          }}
                          title="Challenge a friend on this habit"
                        >
                          <MinimalIcon name="swords" size={11} color="#B0654A" style={{ marginRight: 4 }} />
                          Challenge Friend
                        </button>
                      </div>

                      <Heatmap days={days} completions={completions} habitId={h.id} color={habitColor} />
                    </div>
                  </div>
                );
              })}
            </div>

            {habits.length > 0 && habitFilter === "active" && (
              <div style={styles.createBtnWrapper}>
                <button
                  type="button"
                  style={styles.createHabitBigBtn}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <span style={{ fontSize: 15, marginRight: 6, lineHeight: 1 }}>+</span>
                  Create a Habit
                </button>
              </div>
            )}
          </>
        );
      })()}

      {/* Habit Creation Modal */}
      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveHabit={handleSaveNewHabit}
      />

      {/* Friend Challenge Modal */}
      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => {
          setIsChallengeModalOpen(false);
          setPrefillChallengeHabit(null);
        }}
        currentUser={currentUser}
        existingHabits={habits}
        prefillHabit={prefillChallengeHabit}
        onChallengeCreated={handleChallengeCreated}
      />

      {/* Mailbox Modal (Unified Challenges & Daily Reminders) */}
      <MailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        currentUser={currentUser}
        challenges={challenges}
        habits={habits}
        completions={completions}
        today={today}
        onAcceptChallenge={handleAcceptChallenge}
        onRejectChallenge={handleDeclineChallenge}
        onCancelChallenge={handleCancelChallenge}
        onCopyInviteLink={handleCopyInviteLink}
        onToggleHabit={toggleToday}
        onOpenCreateChallenge={() => {
          setIsMailboxOpen(false);
          setPrefillChallengeHabit(null);
          setIsChallengeModalOpen(true);
        }}
        onNavigateToChallenges={() => {
          setIsMailboxOpen(false);
          setActiveTab("challenges");
        }}
      />

      {/* Analytics & Charts Modal */}
      <ChartsModal
        isOpen={isChartsModalOpen}
        onClose={() => setIsChartsModalOpen(false)}
        habits={habits}
        completions={completions}
        todos={todos}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onOpenCreateHabit={() => setIsCreateModalOpen(true)}
        onOpenCreateTodo={() => {
          setActiveTab("todos");
        }}
        onOpenCreateChallenge={() => {
          setPrefillChallengeHabit(null);
          setIsChallengeModalOpen(true);
        }}
      />

      {/* Achievements / Milestones Modal */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        stats={badgeStats}
        unlockedBadges={unlockedBadges}
      />

      {/* Data Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentUser={currentUser}
        habits={habits}
        completions={completions}
        todos={todos}
        journal={journal}
        timerSessions={timerSessions}
        challenges={challenges}
      />

      {/* Supabase Connect & Cloud Sync Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        currentUser={currentUser}
        isSupabaseConnected={isSupabaseConnected}
        onConnectedChange={(connected) => setIsSupabaseConnected(connected)}
      />

      {/* Celebration Toast for Milestone Badges */}
      {newBadgeUnlockedNotice && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#22301F",
            color: "#FAF7F1",
            padding: "16px 20px",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 14,
            maxWidth: 380,
            border: "1px solid #C08A2E",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#C08A2E33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MinimalIcon name={newBadgeUnlockedNotice.icon} size={22} color="#C08A2E" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#C08A2E" }}>
              🏆 Milestone Unlocked!
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, margin: "2px 0 3px" }}>
              {newBadgeUnlockedNotice.title}
            </div>
            <div style={{ fontSize: 12, color: "#DED8C8" }}>
              {newBadgeUnlockedNotice.description}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewBadgeUnlockedNotice(null)}
            style={{ background: "transparent", border: "none", color: "#FAF7F1", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function Heatmap({ days, completions, habitId, color }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((dayKey) => {
              const done = !!(completions[dayKey] || {})[habitId];
              return (
                <div
                  key={dayKey}
                  onMouseEnter={() => setHoveredCell({ dayKey, done })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    background: done ? color : "#E8E3D6",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {hoveredCell && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "#5B5545",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#FAF7F1",
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid #E8E3D6",
          }}
        >
          <span style={{ fontWeight: 600 }}>{hoveredCell.dayKey}</span>
          <span>•</span>
          <span style={{ color: hoveredCell.done ? "#2E7D5B" : "#B0654A", fontWeight: 600 }}>
            {hoveredCell.done ? "Fulfilled ✓" : "Missed"}
          </span>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STYLES (Preserved layout & aesthetic)
   ========================================================================= */
const styles = {
  page: {
    minHeight: "100%",
    background: "#FAF7F1",
    color: "#22301F",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "24px 20px 80px",
    maxWidth: 1040,
    margin: "0 auto",
  },
  loading: {
    padding: "60px 0",
    textAlign: "center",
    color: "#8A8371",
    fontSize: 15,
  },
  header: { marginBottom: 32 },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 34,
    fontWeight: 400,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#8A8371",
    fontSize: 14,
  },
  userSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  userLabel: {
    fontSize: 14,
    color: "#22301F",
    fontWeight: 600,
  },
  userSubLabel: {
    fontSize: 12,
    color: "#8A8371",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#B0654A",
    fontSize: 13,
  },
  errorBanner: {
    background: "#F3E4DC",
    color: "#7A4430",
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 20,
  },
  infoBanner: {
    background: "#E7EDE3",
    color: "#3B5A33",
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#8A8371",
    marginBottom: -4,
  },
  helperText: {
    fontSize: 12,
    color: "#8A8371",
    margin: "4px 0 0",
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    border: "1px dashed #DED8C8",
    borderRadius: 8,
  },
  emptyText: { color: "#8A8371", marginBottom: 16, fontSize: 15 },
  list: { display: "flex", flexDirection: "column" },
  habitRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "16px 0",
    borderBottom: "1px solid #EDE8DC",
  },
  checkCircle: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    transition: "background 0.15s ease",
  },
  checkMark: { color: "#FAF7F1", fontSize: 14, fontWeight: 700 },
  habitMain: { flex: 1, minWidth: 0 },
  habitTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  habitName: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 17,
  },
  streak: { fontSize: 13, color: "#8A8371", whiteSpace: "nowrap" },
  deleteBtn: {
    opacity: 0,
    transition: "opacity 0.15s ease",
    background: "none",
    border: "none",
    color: "#B0654A",
    fontSize: 20,
    lineHeight: 1,
    padding: 4,
    marginTop: 2,
  },
  addLink: {
    marginTop: 0,
    background: "none",
    border: "none",
    color: "#7C9473",
    fontSize: 14,
    padding: 0,
  },
  ghostLink: {
    background: "none",
    border: "none",
    color: "#8A8371",
    fontSize: 13,
    padding: 0,
  },
  addForm: {
    marginTop: 10,
    padding: 20,
    border: "1px solid #DED8C8",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "transparent",
  },
  input: {
    fontSize: 15,
    padding: "10px 12px",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#22301F",
    outline: "none",
  },
  otpContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
  },
  otpInput: {
    width: "100%",
    maxWidth: 48,
    height: 52,
    fontSize: 22,
    textAlign: "center",
    fontFamily: "Georgia, 'Times New Roman', serif",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#22301F",
    outline: "none",
  },
  resendRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
  },
  timerText: {
    color: "#8A8371",
    fontSize: 13,
  },
  swatches: { display: "flex", gap: 10 },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "none",
  },
  formActions: { display: "flex", gap: 10 },
  primaryBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "10px 18px",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s ease",
  },
  ghostBtn: {
    background: "none",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    padding: "9px 18px",
    fontSize: 14,
    color: "#22301F",
  },
  authToggle: {
    display: "flex",
    background: "#EDE8DC",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  authTab: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    color: "#8A8371",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "center",
  },
  authTabActive: {
    background: "#FFFFFF",
    color: "#22301F",
    fontWeight: 600,
    boxShadow: "0 1px 3px rgba(34,48,31,0.1)",
  },
  inlineLink: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#7C9473",
    fontWeight: 600,
    fontSize: 13,
    textDecoration: "underline",
    cursor: "pointer",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: 12,
    color: "#8A8371",
    cursor: "pointer",
    fontWeight: 600,
    padding: "4px 6px",
  },
  habitIconBadge: {
    flexShrink: 0,
    width: 38,
    height: 38,
    borderRadius: 8,
    border: "1.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    marginTop: 2,
  },
  streakBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 12,
    background: "#FFF2EA",
    border: "1px solid #F5D0B5",
    color: "#B0654A",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  habitDescription: {
    margin: "4px 0 6px",
    fontSize: 13,
    color: "#6B6555",
    lineHeight: 1.4,
  },
  habitMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 4,
  },
  metaBadge: {
    fontSize: 11,
    padding: "2px 7px",
    borderRadius: 4,
    background: "#EDE8DC",
    color: "#5B5545",
    fontWeight: 500,
  },
  createBtnWrapper: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
  },
  createHabitBigBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "8px 18px",
    fontSize: 13.5,
    fontWeight: 500,
    letterSpacing: "0.01em",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(34, 48, 31, 0.12)",
    transition: "all 0.15s ease",
    width: "auto",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(34, 48, 31, 0.45)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modalContent: {
    background: "#FAF7F1",
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    border: "1px solid #DED8C8",
    padding: 24,
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "1px solid #EDE8DC",
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 24,
    fontWeight: 400,
    color: "#22301F",
    margin: 0,
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#8A8371",
    cursor: "pointer",
    padding: 4,
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  modalField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#22301F",
  },
  modalInput: {
    fontSize: 14,
    padding: "9px 12px",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#22301F",
    outline: "none",
    fontFamily: "inherit",
  },
  iconScrollGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    maxHeight: 110,
    overflowY: "auto",
    padding: 6,
    background: "#EDE8DC33",
    borderRadius: 8,
    border: "1px solid #EDE8DC",
  },
  iconPickerBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    border: "1px solid #DED8C8",
    background: "#FFFFFF",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  chipBtn: {
    padding: "5px 11px",
    borderRadius: 16,
    fontSize: 12,
    border: "1px solid #DED8C8",
    background: "#FFFFFF",
    color: "#5B5545",
    cursor: "pointer",
    fontWeight: 500,
  },
  chipBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    borderColor: "#22301F",
  },
  radioGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pillBtn: {
    padding: "7px 14px",
    borderRadius: 6,
    fontSize: 13,
    border: "1px solid #DED8C8",
    background: "#FFFFFF",
    color: "#22301F",
    cursor: "pointer",
  },
  pillBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    borderColor: "#22301F",
    fontWeight: 600,
  },
  daysSelectorRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  dayCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  notifPermBtn: {
    background: "none",
    border: "1px dashed #3A506B",
    borderRadius: 6,
    padding: "4px 10px",
    color: "#3A506B",
    fontSize: 12,
    cursor: "pointer",
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  reminderToast: {
    background: "#22301F",
    color: "#FAF7F1",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
  },
  reminderDoneBtn: {
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  reminderDismissBtn: {
    background: "none",
    border: "1px solid #FAF7F166",
    color: "#FAF7F1",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  tabNav: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    borderBottom: "1px solid #E8E3D6",
    paddingBottom: 8,
  },
  tabActive: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  },
  tabInactive: {
    background: "transparent",
    color: "#8A8371",
    border: "none",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabBadge: {
    background: "#B0654A",
    color: "#FAF7F1",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 10,
    padding: "1px 6px",
    marginLeft: 6,
  },
  challengeHabitActionBtn: {
    background: "none",
    border: "1px solid #E8E3D6",
    borderRadius: 12,
    padding: "2px 8px",
    fontSize: 11,
    color: "#B0654A",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
  challengeHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  challengeViewTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    color: "#22301F",
  },
  challengeViewSubtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#8A8371",
    lineHeight: 1.4,
  },
  challengeCreateBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  challengeSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#22301F",
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 0,
  },
  inviteNoticeCard: {
    background: "#FFFFFF",
    border: "1px solid #E8E3D6",
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(34, 48, 31, 0.04)",
    flexWrap: "wrap",
    gap: 12,
  },
  acceptChallengeBtn: {
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  declineChallengeBtn: {
    background: "none",
    border: "1px solid #DED8C8",
    color: "#8A8371",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12.5,
    cursor: "pointer",
  },
  challengeEmptyBox: {
    background: "#FFFFFF",
    border: "1px dashed #DED8C8",
    borderRadius: 8,
    padding: "40px 20px",
    textAlign: "center",
  },
  challengeCard: {
    background: "#FFFFFF",
    border: "1px solid #E8E3D6",
    borderRadius: 8,
    padding: "16px",
    boxShadow: "0 1px 4px rgba(34, 48, 31, 0.04)",
  },
  challengeCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  shareBtn: {
    background: "none",
    border: "1px solid #E8E3D6",
    borderRadius: 6,
    padding: "5px 9px",
    fontSize: 11.5,
    color: "#5B5545",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  duelArena: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#FAF7F1",
    borderRadius: 8,
    padding: "16px 12px",
    border: "1px solid #EDE8DC",
  },
  duelPlayerCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  duelPlayerName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#22301F",
    marginBottom: 6,
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  duelStreakBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  duelStreakNumber: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "Georgia, serif",
    color: "#22301F",
    lineHeight: 1,
  },
  duelStreakLabel: {
    fontSize: 11,
    color: "#8A8371",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  duelDoneBadge: {
    background: "#E7EDE3",
    color: "#3B5A33",
    borderRadius: 12,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    display: "inline-block",
  },
  duelWaitingBadge: {
    background: "#EDE8DC",
    color: "#8A8371",
    borderRadius: 12,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 500,
    display: "inline-block",
  },
  duelCheckInBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  duelVsDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
  },
  duelVsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    background: "#EDE8DC",
    color: "#8A8371",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.04em",
  },
  duelMomentumBar: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 500,
    textAlign: "center",
    padding: "6px 10px",
    borderRadius: 6,
    background: "#FAF7F1",
  },
  sentInviteCard: {
    background: "#FFFFFF",
    border: "1px solid #E8E3D6",
    borderRadius: 6,
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelInviteBtn: {
    background: "none",
    border: "none",
    color: "#B0654A",
    fontSize: 13,
    cursor: "pointer",
    padding: "4px 8px",
  },
  challengeSummaryBox: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 6,
    padding: "10px 12px",
    marginBottom: 16,
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  userCodeChip: {
    background: "#EDE8DC",
    border: "1px solid #D8D2C2",
    borderRadius: 4,
    padding: "2px 6px",
    fontSize: 11,
    color: "#22301F",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  friendCodeCard: {
    background: "#FAF7F1",
    border: "1px dashed #D8D2C2",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 24,
  },
  friendCodeBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    background: "#E7EDE3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  copyCodeBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  challengerCodeSnippet: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 6,
    padding: "6px 10px",
    marginBottom: 14,
  },
  copySmallLink: {
    background: "none",
    border: "none",
    color: "#7C9473",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginLeft: 2,
    textDecoration: "underline",
  },
  friendPickChip: {
    background: "#EDE8DC",
    border: "1px solid #D8D2C2",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 11,
    color: "#22301F",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  mailboxHeaderBtn: {
    background: "#F4EFE6",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    color: "#22301F",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  mailboxHeaderBadge: {
    background: "#B0654A",
    color: "#FAF7F1",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 10,
    padding: "1px 5px",
    minWidth: 16,
    textAlign: "center",
    lineHeight: 1.2,
  },
  mailboxModalBadge: {
    background: "#B0654A",
    color: "#FAF7F1",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 10,
    padding: "2px 8px",
  },
  mailboxAllClearBadge: {
    background: "#E7EDE3",
    color: "#2E7D5B",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 10,
    padding: "2px 8px",
  },
  mailboxSubNav: {
    display: "flex",
    gap: 6,
    marginBottom: 16,
    borderBottom: "1px solid #E8E3D6",
    paddingBottom: 10,
  },
  mailboxTabActive: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  mailboxTabInactive: {
    background: "transparent",
    color: "#5B5545",
    border: "1px solid #E8E3D6",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 11.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  mailboxSectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: "1px solid #F0ECE1",
  },
  mailboxEmptyCard: {
    background: "#FAF7F1",
    border: "1px dashed #DDD7C7",
    borderRadius: 6,
    padding: "16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  mailboxChallengeCard: {
    background: "#FFFFFF",
    border: "1px solid #E8E3D6",
    borderRadius: 8,
    padding: "12px 14px",
    boxShadow: "0 1px 3px rgba(34, 48, 31, 0.03)",
  },
  mailboxAcceptBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  mailboxRejectBtn: {
    background: "none",
    border: "1px solid #D8D2C2",
    color: "#B0654A",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  mailboxTaskCard: {
    background: "#FFFFFF",
    border: "1px solid #E8E3D6",
    borderRadius: 6,
    padding: "9px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.15s ease",
  },
  mailboxCheckInBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 5,
    padding: "5px 10px",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mailboxDoneBadge: {
    background: "#E7EDE3",
    color: "#2E7D5B",
    border: "1px solid #CFDEC9",
    borderRadius: 5,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mailboxFeedbackBanner: {
    background: "#E7EDE3",
    color: "#22301F",
    border: "1px solid #C5D6BF",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 12,
    textAlign: "center",
  },

  /* =========================================================================
     NEW MODULES STYLES
     ========================================================================= */
  // Unified Navbar
  navbar: {
    borderBottom: "1px solid #E8E3D6",
    paddingBottom: 16,
    marginBottom: 28,
  },
  navInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  navBrandCol: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  navBrandBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    userSelect: "none",
  },
  navLogoIcon: {
    background: "#22301F",
    color: "#FAF7F1",
    fontWeight: 800,
    fontSize: 12,
    borderRadius: 6,
    padding: "4px 7px",
    letterSpacing: "0.05em",
  },
  navBrandText: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 19,
    fontWeight: 700,
    color: "#22301F",
    letterSpacing: "-0.01em",
  },
  navBreadcrumbDivider: {
    color: "#C5BFB0",
    fontSize: 15,
  },
  navSectionBreadcrumb: {
    fontSize: 14,
    color: "#8A8371",
    fontWeight: 500,
  },
  navPillsWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#EDE7DA",
    padding: "3px 4px",
    borderRadius: 8,
    flexWrap: "wrap",
  },
  navPillBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    background: "transparent",
    color: "#5B5545",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  navPillBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    fontWeight: 600,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  navRightCol: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  navQuickAddBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  navMailboxBtn: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    padding: "6px 9px",
    cursor: "pointer",
  },
  navMailboxBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    background: "#B0654A",
    color: "#FAF7F1",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 5px",
    minWidth: 16,
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
  },
  navUserCodePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#EDE7DA",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    padding: "5px 8px",
    fontSize: 11.5,
    color: "#22301F",
    cursor: "pointer",
  },
  navAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#22301F",
    color: "#FAF7F1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  navSignOutBtn: {
    background: "none",
    border: "1px solid #E0DAD0",
    borderRadius: 6,
    padding: "6px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Leftover Tracking Styles
  leftoverCaughtUpBanner: {
    background: "#EAF1E7",
    border: "1px solid #CDE0C8",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
  },
  caughtUpIconCircle: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#CFDEC9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  leftoverWarningCard: {
    background: "#FDF5EE",
    border: "1px solid #F0DAC8",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 20,
  },
  leftoverWarnIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#FCE5D6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  leftoverToggleBtn: {
    background: "#FAF7F1",
    border: "1px solid #E3C5AF",
    borderRadius: 5,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#7A4430",
    cursor: "pointer",
  },
  leftoverItemRow: {
    background: "#FAF7F1",
    border: "1px solid #F0DAC8",
    borderRadius: 6,
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  leftoverActionBtnDone: {
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 5,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  leftoverActionBtnCarry: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 5,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  leftoverActionBtnDismiss: {
    background: "none",
    border: "1px solid #DED8C8",
    borderRadius: 5,
    padding: "4px 8px",
    fontSize: 12,
    color: "#8A8371",
    cursor: "pointer",
  },

  // Dashboard Styles
  dashboardHeroCard: {
    background: "#F4EFE6",
    border: "1px solid #E2DCCE",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 24,
  },
  dashboardHeroTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 22,
    fontWeight: 400,
    color: "#22301F",
    margin: "6px 0 0",
  },
  heroActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 6,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#22301F",
    cursor: "pointer",
  },
  dashboardProgressBarTrack: {
    width: "100%",
    height: 8,
    background: "#E4DED1",
    borderRadius: 4,
    overflow: "hidden",
  },
  dashboardProgressBarFill: {
    height: "100%",
    background: "#7C9473",
    borderRadius: 4,
    transition: "width 0.5s ease",
  },
  dashboardTwoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  dashboardCard: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 10,
    padding: "18px 20px",
  },
  dashboardSectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#22301F",
  },
  dashboardSubLink: {
    background: "none",
    border: "none",
    padding: 0,
    fontSize: 12,
    color: "#7C9473",
    fontWeight: 600,
    cursor: "pointer",
  },
  dashboardItemRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #F5F1E9",
  },
  dashboardEmptyBox: {
    textAlign: "center",
    padding: "24px 12px",
    color: "#8A8371",
    fontSize: 13,
    border: "1px dashed #E2DDD0",
    borderRadius: 6,
  },

  // Common View Titles
  viewMainTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 26,
    fontWeight: 400,
    margin: "0 0 4px",
    color: "#22301F",
  },
  viewSubTitle: {
    margin: 0,
    fontSize: 13.5,
    color: "#8A8371",
  },

  // Todos View Styles
  todosHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  todoNewBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  todoAddCard: {
    background: "#F4EFE6",
    border: "1px solid #E0DACE",
    borderRadius: 8,
    padding: "16px",
    marginBottom: 20,
  },
  todoInput: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 6,
    border: "1px solid #DED8C8",
    fontSize: 14,
    background: "#FAF7F1",
  },
  todoSelect: {
    padding: "5px 8px",
    borderRadius: 5,
    border: "1px solid #DED8C8",
    fontSize: 12,
    background: "#FAF7F1",
  },
  todoDateInput: {
    padding: "4px 8px",
    borderRadius: 5,
    border: "1px solid #DED8C8",
    fontSize: 12,
    background: "#FAF7F1",
  },
  todoSaveBtn: {
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 5,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  todoFilterTabs: {
    display: "flex",
    gap: 6,
    borderBottom: "1px solid #E8E3D6",
    paddingBottom: 8,
    marginBottom: 16,
    overflowX: "auto",
  },
  todoFilterBtn: {
    background: "none",
    border: "none",
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 500,
    color: "#8A8371",
    cursor: "pointer",
    borderRadius: 5,
  },
  todoFilterBtnActive: {
    background: "#EDE7DA",
    color: "#22301F",
    fontWeight: 600,
  },
  todoListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  todoEmptyState: {
    textAlign: "center",
    padding: "36px 16px",
    border: "1px dashed #DED8C8",
    borderRadius: 8,
  },
  todoRowItem: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 8,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "all 0.15s ease",
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    border: "1.5px solid #DED8C8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    background: "transparent",
  },
  todoCategoryBadge: {
    fontSize: 11,
    background: "#EDE7DA",
    color: "#5B5545",
    padding: "2px 7px",
    borderRadius: 4,
    fontWeight: 500,
  },
  priorityHigh: {
    fontSize: 10.5,
    background: "#FCE5D6",
    color: "#B0654A",
    padding: "2px 6px",
    borderRadius: 4,
    fontWeight: 600,
  },
  priorityMed: {
    fontSize: 10.5,
    background: "#FAF0D7",
    color: "#856404",
    padding: "2px 6px",
    borderRadius: 4,
    fontWeight: 600,
  },
  priorityLow: {
    fontSize: 10.5,
    background: "#E2F0D9",
    color: "#385723",
    padding: "2px 6px",
    borderRadius: 4,
    fontWeight: 600,
  },
  todoFocusBtn: {
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 5,
    padding: "4px 8px",
    fontSize: 11.5,
    color: "#22301F",
    fontWeight: 600,
    cursor: "pointer",
  },
  todoDeleteBtn: {
    background: "none",
    border: "none",
    color: "#B0654A",
    fontSize: 15,
    cursor: "pointer",
    padding: "4px 6px",
  },

  // Focus Timer Styles
  timerNoticeBanner: {
    background: "#E7EDE3",
    color: "#2E7D5B",
    border: "1px solid #CDE0C8",
    borderRadius: 6,
    padding: "10px 14px",
    textAlign: "center",
    fontSize: 13.5,
    fontWeight: 600,
    marginBottom: 20,
  },
  timerMainCard: {
    background: "#F4EFE6",
    border: "1px solid #E2DCCE",
    borderRadius: 12,
    padding: "28px 24px",
    textAlign: "center",
    marginBottom: 24,
  },
  timerModePills: {
    display: "inline-flex",
    gap: 6,
    background: "#E8E3D6",
    padding: "4px",
    borderRadius: 8,
    marginBottom: 20,
  },
  timerModeBtn: {
    background: "transparent",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#5B5545",
    cursor: "pointer",
    fontWeight: 500,
  },
  timerModeBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    fontWeight: 600,
  },
  timerCircleContainer: {
    position: "relative",
    width: 240,
    height: 240,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  timerCenterContent: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timerDigits: {
    fontFamily: "monospace",
    fontSize: 44,
    fontWeight: 700,
    color: "#22301F",
    letterSpacing: "-0.02em",
  },
  timerModeLabel: {
    fontSize: 12.5,
    color: "#8A8371",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginTop: 2,
  },
  timerTaskSelect: {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid #DED8C8",
    fontSize: 12.5,
    background: "#FAF7F1",
    marginTop: 6,
  },
  timerControlRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  timerPrimaryBtn: {
    color: "#FAF7F1",
    border: "none",
    borderRadius: 7,
    padding: "10px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  timerResetBtn: {
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 7,
    padding: "10px 16px",
    fontSize: 13.5,
    fontWeight: 500,
    color: "#5B5545",
    cursor: "pointer",
  },
  timerSoundToggle: {
    background: "none",
    border: "1px solid #DED8C8",
    borderRadius: 7,
    padding: "10px 14px",
    fontSize: 12.5,
    color: "#5B5545",
    cursor: "pointer",
  },
  timerHistoryCard: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 10,
    padding: "18px 20px",
  },
  timerTotalPill: {
    fontSize: 12,
    fontWeight: 600,
    background: "#EDE7DA",
    color: "#5B5545",
    padding: "4px 9px",
    borderRadius: 5,
  },
  timerSessionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #F5F1E9",
  },

  // Daily Journal Styles (Screenshot 2)
  journalDateBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  journalNavBtn: {
    background: "#EDE7DA",
    border: "none",
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 13,
    color: "#22301F",
  },
  journalCurrentDateDisplay: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13.5,
    color: "#22301F",
  },
  journalSavedAlert: {
    background: "#E7EDE3",
    color: "#2E7D5B",
    border: "1px solid #CDE0C8",
    borderRadius: 6,
    padding: "8px 12px",
    textAlign: "center",
    fontSize: 12.5,
    fontWeight: 500,
    marginBottom: 14,
  },
  journalCard: {
    background: "#FAF7F1",
    border: "1px solid #E2DCCE",
    borderRadius: 12,
    padding: "24px 22px",
  },
  journalCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  journalTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    color: "#22301F",
  },
  journalSubtitle: {
    fontSize: 13,
    color: "#8A8371",
    margin: "4px 0 0",
  },
  journalMoodGroup: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
  },
  journalMoodBtn: {
    background: "#F4EFE6",
    border: "1px solid #E8E3D6",
    borderRadius: 5,
    padding: "4px 8px",
    fontSize: 11.5,
    color: "#5B5545",
    cursor: "pointer",
  },
  journalMoodBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    borderColor: "#22301F",
  },
  journalSparksBar: {
    background: "#F4EFE6",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 14,
  },
  journalSparkChip: {
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 5,
    padding: "4px 9px",
    fontSize: 11.5,
    color: "#22301F",
    cursor: "pointer",
  },
  journalTextarea: {
    width: "100%",
    padding: "14px",
    borderRadius: 8,
    border: "1px solid #DED8C8",
    fontSize: 14,
    lineHeight: 1.6,
    background: "#FAF7F1",
    color: "#22301F",
    resize: "vertical",
  },
  journalCardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  journalWordCounter: {
    fontSize: 12,
    color: "#8A8371",
  },
  journalSaveBtn: {
    background: "#7C9473",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  journalHistoryTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#22301F",
    margin: 0,
  },
  journalHistoryItem: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 8,
    padding: "12px 14px",
    cursor: "pointer",
  },
  journalHistoryMood: {
    fontSize: 11,
    color: "#7C9473",
    fontWeight: 600,
  },

  // Leaderboard Styles (Screenshots 1 & 3)
  leaderboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  leaderboardTabs: {
    display: "inline-flex",
    background: "#EDE7DA",
    padding: "3px",
    borderRadius: 8,
  },
  leaderboardTabBtn: {
    background: "transparent",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12.5,
    color: "#5B5545",
    fontWeight: 500,
    cursor: "pointer",
  },
  leaderboardTabBtnActive: {
    background: "#22301F",
    color: "#FAF7F1",
    fontWeight: 600,
  },
  podiumContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 32,
    paddingTop: 24,
  },
  podiumCol1: {
    width: 200,
    background: "#FAF4E6",
    border: "2px solid #E6AF2E",
    borderRadius: 12,
    padding: "24px 14px 20px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 4px 12px rgba(230, 175, 46, 0.15)",
    transform: "translateY(-12px)",
  },
  podiumCol2: {
    width: 170,
    background: "#F4EFE6",
    border: "1.5px solid #A8B2C1",
    borderRadius: 12,
    padding: "18px 12px 16px",
    textAlign: "center",
    position: "relative",
  },
  podiumCol3: {
    width: 170,
    background: "#F4EFE6",
    border: "1.5px solid #CD7F32",
    borderRadius: 12,
    padding: "18px 12px 16px",
    textAlign: "center",
    position: "relative",
  },
  podiumCrownIcon: {
    position: "absolute",
    top: -24,
    left: "50%",
    transform: "translateX(-50%)",
  },
  podiumRankBadgeGold: {
    position: "absolute",
    top: -10,
    right: 12,
    background: "#E6AF2E",
    color: "#FAF7F1",
    width: 20,
    height: 20,
    borderRadius: "50%",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRankBadgeSilver: {
    position: "absolute",
    top: -8,
    right: 10,
    background: "#A8B2C1",
    color: "#FAF7F1",
    width: 18,
    height: 18,
    borderRadius: "50%",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRankBadgeBronze: {
    position: "absolute",
    top: -8,
    right: 10,
    background: "#CD7F32",
    color: "#FAF7F1",
    width: 18,
    height: 18,
    borderRadius: "50%",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  podiumAvatarGold: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#22301F",
    color: "#FAF7F1",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    border: "2.5px solid #E6AF2E",
  },
  podiumAvatarSilver: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#22301F",
    color: "#FAF7F1",
    margin: "0 auto 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    border: "2px solid #A8B2C1",
  },
  podiumAvatarBronze: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#22301F",
    color: "#FAF7F1",
    margin: "0 auto 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    border: "2px solid #CD7F32",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#22301F",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  podiumCode: {
    fontSize: 11,
    color: "#8A8371",
    fontFamily: "monospace",
    marginTop: 2,
    cursor: "pointer",
  },
  podiumStreakBadge: {
    marginTop: 8,
    display: "inline-block",
    background: "#EDE7DA",
    color: "#B0654A",
    fontWeight: 700,
    fontSize: 12,
    padding: "3px 8px",
    borderRadius: 5,
  },
  podiumStreakBadgeGold: {
    marginTop: 8,
    display: "inline-block",
    background: "#E6AF2E",
    color: "#FAF7F1",
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 6,
  },
  leaderboardTableCard: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 10,
    overflow: "hidden",
  },
  leaderboardTableHeader: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    background: "#F4EFE6",
    borderBottom: "1px solid #E2DCCE",
    fontSize: 12,
    fontWeight: 600,
    color: "#8A8371",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  leaderboardTableRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #F2EEE5",
  },
  leaderboardRowMe: {
    background: "#F4F7F2",
  },
  tableAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#22301F",
    color: "#FAF7F1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  mePill: {
    fontSize: 10.5,
    background: "#7C9473",
    color: "#FAF7F1",
    padding: "1px 6px",
    borderRadius: 4,
    fontWeight: 700,
  },
  adminPill: {
    fontSize: 10.5,
    background: "#22301F",
    color: "#FAF7F1",
    padding: "1px 6px",
    borderRadius: 4,
    fontWeight: 700,
  },
  tableCodeChip: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#5B5545",
    background: "#EDE7DA",
    border: "1px solid #DED8C8",
    padding: "3px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  challengeMiniBtn: {
    background: "#22301F",
    color: "#FAF7F1",
    border: "none",
    borderRadius: 5,
    padding: "4px 10px",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
  },

  // Admin Panel Styles
  adminStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  adminStatCard: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 8,
    padding: "16px 18px",
  },
  adminStatNum: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#22301F",
  },
  adminStatLabel: {
    fontSize: 12,
    color: "#8A8371",
    marginTop: 2,
  },
  adminTableCard: {
    background: "#FAF7F1",
    border: "1px solid #EDE8DC",
    borderRadius: 10,
    overflow: "hidden",
  },
  adminSearchRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 18px",
    borderBottom: "1px solid #E8E3D6",
    flexWrap: "wrap",
    gap: 12,
  },
  adminSearchInput: {
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid #DED8C8",
    fontSize: 13,
    width: 260,
    background: "#FAF7F1",
  },
  adminTableHeader: {
    display: "flex",
    alignItems: "center",
    padding: "10px 18px",
    background: "#F4EFE6",
    borderBottom: "1px solid #E2DCCE",
    fontSize: 11.5,
    fontWeight: 600,
    color: "#8A8371",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  adminTableRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 18px",
    borderBottom: "1px solid #F2EEE5",
  },
  adminBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: "#E7EDE3",
    color: "#2E7D5B",
    padding: "2px 7px",
    borderRadius: 4,
  },
  memberBadge: {
    fontSize: 11,
    fontWeight: 500,
    background: "#EDE7DA",
    color: "#5B5545",
    padding: "2px 7px",
    borderRadius: 4,
  },
  adminToggleRoleBtn: {
    background: "#FAF7F1",
    border: "1px solid #DED8C8",
    borderRadius: 5,
    padding: "5px 10px",
    fontSize: 11.5,
    color: "#22301F",
    fontWeight: 600,
    cursor: "pointer",
  },

  // Charts Modal Styles
  chartCard: {
    background: "#F4EFE6",
    border: "1px solid #E2DCCE",
    borderRadius: 8,
    padding: "18px 20px",
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#22301F",
    margin: "0 0 14px",
  },
  chartDonutCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  quickAddChoiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#F4EFE6",
    border: "1px solid #E2DCCE",
    borderRadius: 8,
    padding: "14px 16px",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.15s ease",
  },
  settingsMenuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "#FAF7F1",
    border: "1px solid #E8E3D6",
    borderRadius: 8,
    cursor: "pointer",
    width: "100%",
    transition: "all 0.12s ease",
  },
};

// Mount the React app to the root DOM container
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);