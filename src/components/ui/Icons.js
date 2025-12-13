"use client";

export function UserIcon({ width = 22, height = 22, color = "#5B5B5B" }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.6" />
      <path
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockIcon({ width = 22, height = 22, color = "#5B5B5B" }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none">
      <rect x="4" y="10" width="16" height="10" rx="3" stroke={color} strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
