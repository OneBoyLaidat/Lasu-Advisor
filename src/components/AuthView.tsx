import React, { useState } from 'react';
import { OFFICIAL_LOGO_URL } from '../data/mockData';
import { UserProfile, UserRole, LASU_DEPARTMENTS } from '../types';
import confetti from 'canvas-confetti';

interface AuthViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, isDark, onToggleDark }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [matricNo, setMatricNo] = useState<string>('');
  const [department, setDepartment] = useState<string>(LASU_DEPARTMENTS[0]);
  const [faculty, setFaculty] = useState<string>('Faculty of Computing & Information Technology');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Construct fresh user profile from submitted credentials
      const profileName = name.trim() || (email ? email.split('@')[0].replace('.', ' ').toUpperCase() : 'LASU User');
      const profileEmail = email.trim() || `${role}@lasu.edu.ng`;
      const profileMatric = matricNo.trim() || (role === 'student' ? 'CSC/2024/001' : undefined);
      const profileStaff = role !== 'student' ? (matricNo.trim() || 'STAFF/CIT/001') : undefined;

      const profile: UserProfile = {
        id: `usr_${Date.now()}`,
        name: profileName,
        email: profileEmail,
        role: role,
        department: department,
        faculty: faculty,
        matricNo: profileMatric,
        staffId: profileStaff,
        avatarUrl:
          role === 'student'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        hasUploadedTranscript: false, // Fresh test user starts without uploaded transcript so user can test OCR / upload flow
      };

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }

      onLoginSuccess(profile);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top right theme toggle button */}
      {onToggleDark && (
        <button
          type="button"
          onClick={onToggleDark}
          aria-label="Toggle Dark Mode"
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      )}

      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-200/40 dark:bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
        {/* LASU Crest & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center">
            <img
              src={OFFICIAL_LOGO_URL}
              alt="LASU Advisor"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            LASU Advisor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {authMode === 'login'
              ? 'Sign in to access your academic records & advising portal'
              : 'Create your LASU Academic Enterprise account'}
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-200 dark:border-slate-700/60">
          {(['student', 'lecturer', 'hod', 'dean'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                role === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions will be sent to your email address.');
                  }}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Remember on this device
                </span>
              </label>
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span>Sign In as {role.toUpperCase()}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign Up Mode */}
        {authMode === 'signup' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Babatunde Fashola"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {role === 'student' ? 'Matric Number' : 'Staff ID'}
              </label>
              <input
                type="text"
                required
                value={matricNo}
                onChange={(e) => setMatricNo(e.target.value)}
                placeholder={role === 'student' ? 'e.g. CSC/21/0045' : 'e.g. STAFF/CSC/088'}
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  id="signup-department-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs appearance-none cursor-pointer"
                >
                  {LASU_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="dark:bg-slate-800">
                      {dept}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all shadow-sm"
            >
              Create Account
            </button>
          </form>
        )}

        {/* Switch Between Modes */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          {authMode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                onClick={() => setAuthMode('login')}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

