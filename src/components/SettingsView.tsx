import React, { useState } from 'react';
import { UserProfile, ThemeMode } from '../types';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  isDark,
  onToggleDark,
  themeMode = 'dark',
  onThemeModeChange,
}) => {
  const [name, setName] = useState(userProfile.name);
  const email = userProfile.email;
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name,
      email,
      phone,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Profile &amp; Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Manage your profile, appearance, and notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 items-stretch">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center text-center shadow-xs">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-600 dark:border-emerald-500 p-1 mb-3 bg-slate-50 dark:bg-slate-800">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{userProfile.name}</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-mono font-bold mt-0.5">
            {userProfile.role} • {userProfile.level || 'Staff'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{userProfile.department}</p>

          <div className="mt-4 w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Matric / ID:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {userProfile.matricNo || userProfile.staffId || '—'}
              </span>
            </div>
            {userProfile.role === 'student' && userProfile.admissionSession && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-medium">Admission Session:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.admissionSession}</span></div>}
            {userProfile.role === 'student' && userProfile.level && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-medium">Academic Level:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.level}</span></div>}
            {userProfile.role !== 'student' && userProfile.staffId && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-medium">Staff ID:</span><span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{userProfile.staffId}</span></div>}
            {userProfile.role !== 'student' && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400 font-medium">Faculty:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.faculty || '—'}</span></div>}
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">person</span>
              Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div><label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label><div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-700 dark:text-slate-300">{userProfile.department}</div></div>
            </div>

            {/* Appearance / Dark Mode Section */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                palette
              </span>
              Appearance &amp; Dark Mode
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onThemeModeChange && onThemeModeChange('light')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-2 ${
                  themeMode === 'light'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] text-amber-500">light_mode</span>
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeModeChange && onThemeModeChange('dark')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-2 ${
                  themeMode === 'dark'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] text-indigo-400">dark_mode</span>
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeModeChange && onThemeModeChange('system')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-2 ${
                  themeMode === 'system'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] text-emerald-600">settings_brightness</span>
                <span>System Sync</span>
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                notifications
              </span>
              Notifications &amp; Alerts
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">Email Advising Digests</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Receive weekly performance summaries and scheduled meeting reminders.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            <div className="pt-3 flex justify-between items-center">
              {isSaved ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Settings Saved!
                </span>
              ) : (
                <div />
              )}
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
