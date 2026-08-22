import React, { useState } from 'react';
import { OFFICIAL_LOGO_URL } from '../data/mockData';
import { UserProfile, UserRole, LASU_DEPARTMENTS } from '../types';
import { authenticateUser, registerNewUser, getRegisteredAccounts } from '../lib/authService';
import confetti from 'canvas-confetti';

interface AuthViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, isDark, onToggleDark }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [matricOrStaffId, setMatricOrStaffId] = useState<string>('');
  const [department, setDepartment] = useState<string>(LASU_DEPARTMENTS[4]); // Computer Science
  const [faculty, setFaculty] = useState<string>('Faculty of Computing & Information Technology');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(false);

  const handleRoleTabClick = (role: UserRole) => {
    setSelectedRoleTab(role);
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Strictly authenticate against registered users registry
      const result = authenticateUser(identifier, password, selectedRoleTab);

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Access Denied: Unregistered user details.');
        return;
      }

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }

      onLoginSuccess(result.profile);
    }, 450);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = registerNewUser({
        name,
        email: identifier,
        password,
        role: selectedRoleTab,
        department,
        faculty,
        matricNo: selectedRoleTab === 'student' ? matricOrStaffId : undefined,
        staffId: selectedRoleTab !== 'student' ? matricOrStaffId : undefined,
      });

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Registration failed. Please check your submitted details.');
        return;
      }

      setSuccessMessage('Account registered successfully! Signing you into your authorized portal...');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }

      setTimeout(() => {
        if (result.profile) {
          onLoginSuccess(result.profile);
        }
      }, 700);
    }, 550);
  };

  const registeredAccounts = getRegisteredAccounts();

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
              ? 'Sign in to access your registered academic records & advising portal'
              : 'Register your LASU Academic Account'}
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-700/60">
          {(['student', 'lecturer', 'hod', 'dean'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleTabClick(r)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                selectedRoleTab === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
              error
            </span>
            <div className="leading-snug">
              <span className="font-bold block mb-0.5">Access Denied</span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Success Notification Banner */}
        {successMessage && (
          <div
            id="auth-success-banner"
            className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
              check_circle
            </span>
            <div className="leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email / Matric / Staff ID
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                  badge
                </span>
                <input
                  id="login-identifier-input"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter email, Matric No, or Staff ID"
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
                    alert('Password reset link will be dispatched to your registered institutional email.');
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
                  id="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter password"
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
                  Remember verified credentials
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
                  <span>Sign In as {selectedRoleTab.toUpperCase()}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign Up Mode */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                id="signup-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {selectedRoleTab === 'student' ? 'Matriculation Number' : 'Staff ID Number'}
              </label>
              <input
                id="signup-id-input"
                type="text"
                required
                value={matricOrStaffId}
                onChange={(e) => setMatricOrStaffId(e.target.value)}
                placeholder={selectedRoleTab === 'student' ? 'Enter Matriculation Number' : 'Enter Staff ID'}
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
                id="signup-email-input"
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Create Password
              </label>
              <input
                id="signup-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min. 5 characters)"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <button
              id="submit-signup-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span>Register &amp; Access Portal</span>
              )}
            </button>
          </form>
        )}

        {/* Switch Between Modes */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          {authMode === 'login' ? (
            <p>
              Not yet registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Register New Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Registered Demo Credentials Helper Drawer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
              Pre-Registered Institutional Accounts
            </span>
            <span className="material-symbols-outlined text-[16px]">
              {showDemoCredentials ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showDemoCredentials && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                Click any account to populate verified credentials:
              </p>
              {registeredAccounts.slice(0, 4).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleTab(acc.role);
                    setIdentifier(acc.email);
                    setPassword(acc.password);
                    setErrorMessage(null);
                  }}
                  className="w-full text-left p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {acc.name}{' '}
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-1">
                        {acc.role}
                      </span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      {acc.email} • Pass: {acc.password}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-500">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
