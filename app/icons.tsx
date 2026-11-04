export function ArrowIcon() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M2.5 8h10.5M9 3.5 13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="heart" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 20.25s-7.6-4.55-9.35-9.2C1.4 7.7 3.5 4.25 7.05 4.25c2 0 3.55 1.05 4.95 2.95 1.4-1.9 2.95-2.95 4.95-2.95 3.55 0 5.65 3.45 4.4 6.8-1.75 4.65-9.35 9.2-9.35 9.2Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
