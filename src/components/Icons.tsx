interface IconProps {
  className?: string;
  size?: number;
}

const defaults = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconDashboard({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconTransactions({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

export function IconCategories({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path d="M12 3v9l6.36 3.64" />
    </svg>
  );
}

export function IconSettings({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconPlus({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMenu({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconX({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconSearch({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconArrowUp({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconArrowDown({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function IconTrendUp({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M22 7l-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </svg>
  );
}

export function IconTrendDown({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M22 17l-8.5-8.5-5 5L2 7" />
      <path d="M16 17h6v-6" />
    </svg>
  );
}

export function IconWallet({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z" />
      <path d="M16 12h.01" strokeWidth="2.5" />
    </svg>
  );
}

export function IconClock({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconChevronRight({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function IconChevronLeft({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconTrash({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export function IconEdit({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconCopy({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16V5a2 2 0 012-2h11" />
    </svg>
  );
}

export function IconDownload({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconBell({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function IconCheck({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconCalendar({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconUser({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconLogout({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function IconBarChart({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

export function IconShield({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function IconMail({ className, size }: IconProps) {
  return (
    <svg {...defaults(size)} className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}
