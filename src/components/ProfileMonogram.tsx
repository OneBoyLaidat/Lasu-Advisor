import React from 'react';

interface ProfileMonogramProps {
  name: string;
  sizeClassName?: string;
}

export const getProfileInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'LA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[parts.length - 1][0]}${parts[0][0]}`.toUpperCase();
};

export const ProfileMonogram: React.FC<ProfileMonogramProps> = ({ name, sizeClassName = 'h-10 w-10' }) => (
  <div
    aria-label={`${name || 'LASU Advisor'} profile`}
    title={name || 'LASU Advisor'}
    className={`${sizeClassName} shrink-0 rounded-full border border-white/30 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 shadow-sm grid place-items-center text-white`}
  >
    <span
      className="font-semibold italic leading-none"
      style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
    >
      {getProfileInitials(name)}
    </span>
  </div>
);
