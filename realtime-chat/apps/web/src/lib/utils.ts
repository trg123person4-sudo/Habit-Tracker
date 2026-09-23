import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserColor(username: string): string {
  const colors = [
    'text-red-400 dark:text-red-300',
    'text-orange-400 dark:text-orange-300',
    'text-amber-400 dark:text-amber-300',
    'text-emerald-400 dark:text-emerald-300',
    'text-teal-400 dark:text-teal-300',
    'text-cyan-400 dark:text-cyan-300',
    'text-sky-400 dark:text-sky-300',
    'text-blue-400 dark:text-blue-300',
    'text-indigo-400 dark:text-indigo-300',
    'text-violet-400 dark:text-violet-300',
    'text-purple-400 dark:text-purple-300',
    'text-pink-400 dark:text-pink-300',
    'text-rose-400 dark:text-rose-300',
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function formatMessageTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDividerDate(dateString: string): string {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
