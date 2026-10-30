import React from 'react';

interface ProfileMonogramProps {
  name: string;
  sizeClassName?: string;
  className?: string;
}

export const getProfileInitials = (name: string): string => {
  const clean = (name || '').trim().replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Engr\.)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'LA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // Return initials: First letter of first name and first letter of last name
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Institutional Signature Profile Monogram / Branding
 * LASU green branding with elegant calligraphy cursive monogram typography.
 * Kept strictly uniform across Settings, Security, Background, Sidebar, and Header.
 */
export const ProfileMonogram: React.FC<ProfileMonogramProps> = ({
  name,
  sizeClassName = 'h-10 w-10',
  className = '',
}) => {
  const initials = getProfileInitials(name);

  return (
    <div
      aria-label={`${name || 'LASU Advisor'} profile`}
      title={name || 'LASU Advisor'}
      className={`${sizeClassName} shrink-0 rounded-full bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border border-emerald-200/40 ring-1 ring-white/20 shadow-md flex items-center justify-center text-white select-none transition-transform duration-150 ${className}`}
    >
      <span
        className="font-normal italic tracking-wider leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        style={{
          fontFamily: "'Segoe Script', 'Alex Brush', 'Brush Script MT', 'Great Vibes', 'Dancing Script', cursive, serif",
        }}
      >
        {initials}
      </span>
    </div>
  );
};
