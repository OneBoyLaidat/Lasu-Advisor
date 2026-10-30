import React, { useState } from 'react';
import { UserProfile, ThemeMode } from '../types';
import { ProfileMonogram } from './ProfileMonogram';
import { resetPasswordDirectly } from '../lib/liveDataService';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
}

type SettingsSection = 'settings' | 'security' | 'background';

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  isDark,
  onToggleDark,
  themeMode = 'dark',
  onThemeModeChange,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('settings');

  // Profile fields
  const [name, setName] = useState(userProfile.name);
  const email = userProfile.email;
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Password / Security fields (Independent password management for student & staff)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name,
      email,
      phone,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || newPassword.length < 5) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 5 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match. Please verify.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await resetPasswordDirectly(userProfile.email, newPassword);
      if (res.success) {
        setPasswordStatus({
          type: 'success',
          message: 'Password successfully updated! Your account credentials have been securely refreshed.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ type: 'error', message: res.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'An error occurred while updating password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Profile, Security &amp; Background
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, independent credential &amp; password resets, and view your institutional academic background.
        </p>
      </div>

      {/* Navigation Tabs for Settings, Security, and Background */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
            activeSection === 'settings'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>General Settings &amp; Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
            activeSection === 'security'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
          <span>Security &amp; Password Reset</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('background')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
            activeSection === 'background'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Institutional Background</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Consistent Profile Hero Card across All Sections (Calligraphy on Black Background) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-xs">
          {/* Uniform Signature Calligraphy Monogram on Black Background */}
          <div className="p-1.5 rounded-full border-2 border-emerald-500/50 dark:border-emerald-500/30 mb-3 bg-black">
            <ProfileMonogram name={userProfile.name} sizeClassName="w-20 h-20 text-2xl" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{userProfile.name}</h3>
          
          <div className="mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
              {userProfile.role === 'student' ? 'Student' : userProfile.role === 'hod' ? 'Head of Department' : userProfile.role === 'dean' ? 'Dean of Faculty' : 'Lecturer / 1AD Adviser'}
            </span>
            {userProfile.level && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {userProfile.level}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{userProfile.department}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{userProfile.faculty}</p>

          <div className="mt-5 w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Identifier:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                {userProfile.matricNo || userProfile.staffId || '—'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Institutional Email:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[170px]" title={userProfile.email}>
                {userProfile.email}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Branding Style:</span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-black inline-block border border-slate-600" />
                Calligraphy on Black
              </span>
            </div>
          </div>
        </div>

        {/* Section Content (2 Columns) */}
        <div className="lg:col-span-2">
          {/* ========================================================================= */}
          {/* SECTION 1: GENERAL SETTINGS & APPEARANCE                                  */}
          {/* ========================================================================= */}
          {activeSection === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <ProfileMonogram name={userProfile.name} sizeClassName="w-8 h-8 text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Profile Details &amp; Contact Preferences
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update personal display name and contact phone number.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      aria-readonly="true"
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Contact
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Department
                    </label>
                    <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-700 dark:text-slate-300">
                      {userProfile.department}
                    </div>
                  </div>
                </div>

                {/* Appearance Theme Selector */}
                <div className="pt-3">
                  <label className="block font-bold text-slate-900 dark:text-slate-100 mb-2">
                    System Appearance &amp; Color Scheme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => onThemeModeChange && onThemeModeChange('light')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        themeMode === 'light'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px] text-amber-500">light_mode</span>
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onThemeModeChange && onThemeModeChange('dark')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        themeMode === 'dark'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px] text-indigo-400">dark_mode</span>
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onThemeModeChange && onThemeModeChange('system')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        themeMode === 'system'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px] text-emerald-600">settings_brightness</span>
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        Institutional Advising Alerts
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Receive immediate messages, result audit notifications, and advising appointment updates.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  {isSaved ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Settings successfully saved!
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: SECURITY & PASSWORD RESET                                      */}
          {/* ========================================================================= */}
          {activeSection === 'security' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <ProfileMonogram name={userProfile.name} sizeClassName="w-8 h-8 text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Credential Security &amp; Independent Password Reset
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Students and staff members can independently update their password and manage security.
                  </p>
                </div>
              </div>

              {passwordStatus && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {passwordStatus.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password (if known)"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 5 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified_user</span>
                    Independent Credential Management Policy
                  </div>
                  <p>
                    Resetting your password updates your account in both live database sessions and local authenticators. Both students (using Matric No) and staff (using Staff ID or Email) can authenticate immediately with the new password.
                  </p>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: INSTITUTIONAL BACKGROUND                                       */}
          {/* ========================================================================= */}
          {activeSection === 'background' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <ProfileMonogram name={userProfile.name} sizeClassName="w-8 h-8 text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Institutional Background &amp; Cohort Records
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official LASU academic registration, cohort level, and advising allocations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Institution
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Lagos State University (LASU)</p>
                  <p className="text-[11px] text-slate-500">Ojo Campus, Lagos, Nigeria</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Faculty Entity
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{userProfile.faculty}</p>
                  <p className="text-[11px] text-slate-500">Dept of {userProfile.department}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {userProfile.role === 'student' ? 'Matriculation Number' : 'Staff ID'}
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {userProfile.matricNo || userProfile.staffId || 'Pending Assignment'}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Officially Verified Record
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Cohort &amp; 1AD Allocation
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {userProfile.level || '100 Level (1AD)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Session: {userProfile.admissionSession || userProfile.session || '2026/2027'}
                  </p>
                </div>
              </div>

              {/* Advising or Oversight Relationship Card */}
              {userProfile.role === 'student' ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileMonogram name={userProfile.assignedAdviserName || 'Adviser'} sizeClassName="w-10 h-10 text-xs" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                        Assigned Level Adviser (1AD)
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {userProfile.assignedAdviserName || 'Dr. Sarah Jenkins'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {userProfile.assignedAdviserEmail || 's.jenkins@lasu.edu.ng'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/40">
                    Active Advisory
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileMonogram name={userProfile.name} sizeClassName="w-10 h-10 text-xs" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                        Academic Administrative Designation
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {userProfile.assignedAdviserTitle || `${userProfile.role.toUpperCase()} • ${userProfile.department}`}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Staff ID: {userProfile.staffId}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/40">
                    Authorized Staff
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
