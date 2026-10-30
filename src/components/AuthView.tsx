import React, { useState, useEffect } from 'react';
import { OFFICIAL_LOGO_URL } from '../data/mockData';
import { UserProfile, LASU_DEPARTMENTS, EntryMode } from '../types';
import { getRegisteredAccounts } from '../lib/authService';
import { resendSignupConfirmation, resetPasswordDirectly, sendPasswordReset, signInAccount, signUpAccount } from '../lib/liveDataService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  computeAcademicLevel,
  STANDARD_ACADEMIC_SESSIONS,
  getCurrentAcademicSession,
  getStudentCohortSession,
} from '../lib/academicUtils';
import confetti from 'canvas-confetti';

export type AuthPageMode = 'login' | 'register-select' | 'register-student' | 'register-staff';

interface AuthViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  initialPage?: AuthPageMode;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  isDark,
  onToggleDark,
  initialPage = 'login',
}) => {
  // Page mode state (synchronized with URL hash for dedicated page navigation)
  const [currentPage, setCurrentPage] = useState<AuthPageMode>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'register' || hash === 'create-account') return 'register-select';
      if (hash === 'register-student' || hash === 'student-signup') return 'register-student';
      if (hash === 'register-staff' || hash === 'staff-signup') return 'register-staff';
      if (hash === 'login' || hash === 'signin') return 'login';
    }
    return initialPage;
  });

  // Navigate to a dedicated page and sync hash
  const navigateTo = (page: AuthPageMode) => {
    setCurrentPage(page);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined') {
      window.location.hash = page === 'login' ? 'login' : page;
    }
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'register' || hash === 'create-account') setCurrentPage('register-select');
      else if (hash === 'register-student' || hash === 'student-signup') setCurrentPage('register-student');
      else if (hash === 'register-staff' || hash === 'staff-signup') setCurrentPage('register-staff');
      else if (hash === 'login' || hash === 'signin' || !hash) setCurrentPage('login');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Unified Login fields
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Student Registration fields
  const [fullName, setFullName] = useState<string>('');
  const [matricNumber, setMatricNumber] = useState<string>('');
  const [entryMode, setEntryMode] = useState<EntryMode>('utme');
  const [admissionSession, setAdmissionSession] = useState<string>(STANDARD_ACADEMIC_SESSIONS[0] || '2026/2027');
  const [studentLevel, setStudentLevel] = useState<string>('100 Level');

  // Staff Registration fields
  const [staffName, setStaffName] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [staffRole, setStaffRole] = useState<'lecturer' | 'hod' | 'dean'>('lecturer');
  const [department, setDepartment] = useState<string>(LASU_DEPARTMENTS[4] || 'Computer Science');
  const [faculty, setFaculty] = useState<string>('Faculty of Computing & Information Technology');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [confirmSignupPassword, setConfirmSignupPassword] = useState<string>('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(false);

  // Independent Reset Password Modal state for Students & Staff
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetAccountType, setResetAccountType] = useState<'student' | 'staff'>('student');
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetModalSuccess, setResetModalSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Auto-recalculate Academic Level whenever entryMode or admissionSession updates
  useEffect(() => {
    const computed = computeAcademicLevel(admissionSession, entryMode);
    setStudentLevel(computed.level);
  }, [admissionSession, entryMode]);

  const handleEntryModeChange = (mode: EntryMode) => {
    setEntryMode(mode);
  };

  const handleAdmissionSessionChange = (sess: string) => {
    setAdmissionSession(sess);
  };

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await resendSignupConfirmation(confirmationEmail);
      if (!result.success) {
        setErrorMessage(result.error || 'Could not resend the confirmation email. Please try again.');
        return;
      }
      setSuccessMessage(`A new confirmation link has been sent to ${confirmationEmail}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetModalError(null);
    setResetModalSuccess(null);

    const cleanTargetId = resetIdentifier.trim();
    if (!cleanTargetId) {
      setResetModalError(
        resetAccountType === 'student'
          ? 'Please enter your Matriculation Number or student email address.'
          : 'Please enter your Staff ID or staff email address.'
      );
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 5) {
      setResetModalError('Password must contain at least 5 characters.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetModalError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordDirectly(cleanTargetId, resetNewPassword);
      if (!res.success) {
        setResetModalError(res.error || 'Failed to reset password. Please check your details.');
      } else {
        setResetModalSuccess(res.message || 'Password successfully reset!');
        setIdentifier(cleanTargetId);
        setPassword(resetNewPassword);
        setTimeout(() => {
          setShowResetModal(false);
          setSuccessMessage('Password reset successfully. You may now sign in with your new password.');
          setResetNewPassword('');
          setResetConfirmPassword('');
        }, 1200);
      }
    } catch (err: unknown) {
      setResetModalError(err instanceof Error ? err.message : 'An error occurred while resetting password.');
    } finally {
      setIsResetting(false);
    }
  };

  // 1. Unified Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmationEmail(null);
    setIsLoading(true);

    try {
      const result = await signInAccount(identifier, password);
      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Access denied. Check your email and password.');
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Student Registration Handler (Without Results/Transcript Upload Requirement)
  const handleStudentSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmationEmail(null);
    if (signupPassword.length < 8) {
      setErrorMessage('Choose a password with at least 8 characters.');
      return;
    }
    if (signupPassword !== confirmSignupPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signUpAccount({
        name: fullName,
        email: signupEmail,
        password: signupPassword,
        role: 'student',
        department,
        faculty,
        matricNo: matricNumber,
        level: studentLevel,
        admissionSession: admissionSession,
        entryMode: entryMode,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Please verify your submitted details.');
        return;
      }

      if (result.confirmationRequired) {
        setConfirmationEmail(signupEmail.trim().toLowerCase());
        setSuccessMessage('Check your email to confirm your account.');
        return;
      }
      if (!result.profile) {
        setErrorMessage('Your account was created, but the profile could not be loaded. Please sign in.');
        return;
      }

      setSuccessMessage('Student account registered successfully! Entering student dashboard...');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }

      onLoginSuccess(result.profile);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Staff Registration Handler
  const handleStaffSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signUpAccount({
        name: staffName,
        email: signupEmail,
        password: signupPassword,
        role: staffRole,
        department,
        faculty,
        staffId: staffId,
      });

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Staff registration failed. Please verify your submitted details.');
        return;
      }

      setSuccessMessage(`Staff account registered as ${staffRole.toUpperCase()}! Redirecting to institutional portal...`);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore
      }

      onLoginSuccess(result.profile);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Staff registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const registeredAccounts = getRegisteredAccounts();
  const currentAcademicSession = getCurrentAcademicSession();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
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

      {/* ========================================================================= */}
      {/* PAGE 1: DEDICATED UNIFIED LOGIN PAGE                                      */}
      {/* ========================================================================= */}
      {currentPage === 'login' && (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <aside className="hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 text-white min-h-[680px]">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg"><img src={OFFICIAL_LOGO_URL} alt="LASU" className="w-full h-full object-contain" /></div>
              <p className="mt-10 text-xs uppercase tracking-[0.22em] text-emerald-100">Lagos State University</p>
              <h1 className="mt-3 text-4xl xl:text-5xl font-bold leading-tight">Your academic journey, clearly guided.</h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/90">One secure space for advising conversations, course progress, and result verification.</p>
            </div>
            <div className="space-y-3 text-sm text-emerald-50">
              <p className="flex items-center gap-3"><span className="material-symbols-outlined">verified_user</span>Private, role-based access</p>
              <p className="flex items-center gap-3"><span className="material-symbols-outlined">forum</span>Direct academic support</p>
              <p className="flex items-center gap-3"><span className="material-symbols-outlined">school</span>Progress built around your cohort</p>
            </div>
          </aside>
          <div className="p-6 sm:p-9 lg:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="lg:hidden w-14 h-14 rounded-2xl overflow-hidden mb-3 border border-slate-200 dark:border-slate-800 bg-white p-1.5 shadow-sm"><img src={OFFICIAL_LOGO_URL} alt="LASU Advisor" className="w-full h-full object-contain" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">LASU Advisor</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to continue to your academic portal.</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Session: {currentAcademicSession}
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
                error
              </span>
              <div className="leading-snug">
                <span className="font-bold block mb-0.5">Authentication Error</span>
                {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div
              id="auth-success-banner"
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isSupabaseConfigured ? 'Email Address' : 'Institutional Identifier'}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                  badge
                </span>
                <input
                  id="login-identifier-input"
                  type={isSupabaseConfigured ? 'email' : 'text'}
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder={isSupabaseConfigured ? 'name@lasu.edu.ng' : 'Email, Matric No, or Staff ID'}
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setResetModalError(null);
                    setResetModalSuccess(null);
                    setResetIdentifier(identifier);
                    setShowResetModal(true);
                  }}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Reset / Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
                  lock
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  autoComplete="current-password"
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

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">New to LASU Advisor?</p>
            <a href="#register-student" onClick={(e) => { e.preventDefault(); navigateTo('register-student'); }} className="mt-3 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors">
              <span className="material-symbols-outlined text-[18px]">school</span>
              Create a student account
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
              {!isSupabaseConfigured && <><span>•</span><a
                href="#register-staff"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('register-staff');
                }}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">badge</span>
                Staff Registration
              </a></>}
            </div>
          </div>

          {/* Registered Accounts Helper Drawer */}
          {!isSupabaseConfigured && <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
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
                {registeredAccounts.slice(0, 5).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setIdentifier(acc.email);
                      setPassword(acc.password);
                      setErrorMessage(null);
                    }}
                    className="w-full text-left p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {acc.name}{' '}
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-1">
                          {acc.role === 'lecturer' ? 'Lecturer / Adviser' : acc.role}
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
          </div>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: DEDICATED ACCOUNT REGISTRATION PORTAL SELECTION PAGE               */}
      {/* ========================================================================= */}
      {currentPage === 'register-select' && (
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
          {/* Breadcrumb Navigation: Back to Login */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <a
              href="#login"
              id="back-to-login-from-select"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('login');
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Login
            </a>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Account Setup
            </span>
          </div>
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden mb-3 border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center">
              <img
                src={OFFICIAL_LOGO_URL}
                alt="LASU Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Create New Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Select your institutional portal category to continue to your dedicated registration page.
            </p>
          </div>

          {/* Registration Category Cards with Direct Links */}
          <div className={`grid grid-cols-1 ${isSupabaseConfigured ? '' : 'sm:grid-cols-2'} gap-4 my-6`}>
            {/* Student Portal Card */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">school</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Student Registration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  For undergraduate students (UTME and Direct Entry). Dynamic cohort progression and level adviser assignment.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <a
                  href="#register-student"
                  id="link-to-student-registration"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('register-student');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Proceed to Student Registration</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Staff & Faculty Portal Card */}
            {!isSupabaseConfigured && <>
            <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">badge</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Staff &amp; Faculty Registration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  For Lecturers (Level Advisers), Heads of Department (HODs), and Deans of Faculty.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <a
                  href="#register-staff"
                  id="link-to-staff-registration"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('register-staff');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Proceed to Staff Registration</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
            </>}
          </div>

          {/* Return to Login link */}
          <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('login');
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Sign in to your portal</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: DEDICATED STUDENT REGISTRATION PAGE                                */}
      {/* ========================================================================= */}
      {currentPage === 'register-student' && (
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <a
              href="#login" onClick={(e) => { e.preventDefault(); navigateTo('login'); }} className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Login
            </a>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Student Registration
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2" aria-label="Registration progress">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">Step 1</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">Create your account</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Step 2</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Open your student portal</p>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Student Account Registration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create your verified LASU student profile for advising &amp; CGPA tracking
              </p>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
                error
              </span>
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {confirmationEmail ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300">
                <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Check your email to confirm</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                We sent a confirmation link to <strong className="break-all text-slate-800 dark:text-slate-100">{confirmationEmail}</strong>.
                Open it to verify your account. If it is not in your inbox, check your spam folder.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The link returns you to this app. After confirmation, sign in with your email and password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIdentifier(confirmationEmail);
                  navigateTo('login');
                }}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Continue to sign in
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isLoading}
                className="mt-3 block w-full text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline disabled:opacity-60 dark:text-emerald-300"
              >
                {isLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            </div>
          ) : (
          /* Registration Form (Strictly without result/transcript upload field) */
          <form onSubmit={handleStudentSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                id="student-name-input"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Babatunde Fashola"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* Mode of Entry: Are you a Direct Entry (DE) Student? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Are you a Direct Entry (DE) Student?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleEntryModeChange('utme')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    entryMode === 'utme'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    {entryMode === 'utme' ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <div>
                    <p className="text-xs leading-none">No (UTME Entry)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard entry at 100 Level</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleEntryModeChange('direct_entry')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    entryMode === 'direct_entry'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    {entryMode === 'direct_entry' ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <div>
                    <p className="text-xs leading-none">Yes (Direct Entry - DE)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Starts at 200 Level</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matriculation Number
                </label>
                <input
                  id="student-matric-input"
                  type="text"
                  required
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  placeholder="e.g. CSC/21/0045"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admission Year / Session
                </label>
                <div className="relative">
                  <select
                    id="student-session-select"
                    value={admissionSession}
                    onChange={(e) => handleAdmissionSessionChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs appearance-none cursor-pointer"
                  >
                    {STANDARD_ACADEMIC_SESSIONS.map((sess) => (
                      <option key={sess} value={sess} className="dark:bg-slate-800">
                        {sess} Session
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Academic Level & Assigned Cohort Set Preview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Assigned Cohort / Set:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {getStudentCohortSession(admissionSession, entryMode)} Cohort
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Current Academic Level:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {studentLevel}
                  </span>
                  {entryMode === 'direct_entry' && (
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                      Direct Entry
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                {entryMode === 'direct_entry'
                  ? `Direct Entry students admitted in ${admissionSession} join the existing ${getStudentCohortSession(admissionSession, entryMode)} cohort/set at 200 Level.`
                  : `UTME students admitted in ${admissionSession} are assigned to the ${admissionSession} cohort starting at 100 Level.`}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  id="student-department-select"
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
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="student-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@lasu.edu.ng"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="student-password-input"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <input id="student-confirm-password-input" type="password" required minLength={8} value={confirmSignupPassword} onChange={(e) => setConfirmSignupPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs" />
            </div>

            <button
              id="submit-student-signup-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-3 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
          )}

          {/* Navigation Links */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              Already have an account?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('login');
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Sign In
              </a>
            </div>
            <div>
              Staff member?{' '}
              {!isSupabaseConfigured ? <a
                href="#register-staff"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('register-staff');
                }}
                className="text-slate-700 dark:text-slate-300 font-semibold hover:underline"
              >
                Staff Registration →
              </a> : <span className="font-medium text-slate-500">Staff accounts are issued by your faculty administrator.</span>}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 4: DEDICATED STAFF & FACULTY REGISTRATION PAGE                       */}
      {/* ========================================================================= */}
      {currentPage === 'register-staff' && (
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <a
              href="#login" onClick={(e) => { e.preventDefault(); navigateTo('login'); }} className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Login
            </a>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Staff Registration
            </span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
              <span className="material-symbols-outlined text-[24px]">badge</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Academic Staff Registration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register as Level Adviser, Head of Department, or Dean of Faculty
              </p>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
                error
              </span>
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Staff Form */}
          <form onSubmit={handleStaffSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name &amp; Academic Title
              </label>
              <input
                id="staff-name-input"
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff ID Number
                </label>
                <input
                  id="staff-id-input"
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STAFF/CSC/088"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Position / Role
                </label>
                <div className="relative">
                  <select
                    id="staff-role-select"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as 'lecturer' | 'hod' | 'dean')}
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="lecturer">Lecturer (Level Adviser)</option>
                    <option value="hod">Head of Department (HOD)</option>
                    <option value="dean">Dean of Faculty</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  id="staff-department-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-2xs appearance-none cursor-pointer"
                >
                  {LASU_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="dark:bg-slate-800">
                      {dept}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email Address
                </label>
                <input
                  id="staff-email-input"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="s.jenkins@lasu.edu.ng"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create Password
                </label>
                <input
                  id="staff-password-input"
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 5 characters"
                  className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
                verified_user
              </span>
              <span>
                Staff permissions and advising rosters will be configured according to your chosen role (<strong>{staffRole.toUpperCase()}</strong>).
              </span>
            </div>

            <button
              id="submit-staff-signup-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-3 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span>Complete Staff Registration</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              Already have an account?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('login');
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Sign In
              </a>
            </div>
            <div>
              Are you a student?{' '}
              <a
                href="#register-student"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('register-student');
                }}
                className="text-slate-700 dark:text-slate-300 font-semibold hover:underline"
              >
                Student Registration →
              </a>
            </div>
          </div>
        </div>
      )}
    
      {/* ========================================================================= */}
      {/* RESET PASSWORD / PASSPORT RECOVERY MODAL (STUDENTS & STAFF)               */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Reset Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recover your credentials for Student or Academic Staff account.
                  </p>
                </div>
              </div>

              {/* Account Type Toggle */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResetAccountType('student')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-semibold ${
                      resetAccountType === 'student'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Student Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetAccountType('staff')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-semibold ${
                      resetAccountType === 'staff'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Academic Staff
                  </button>
                </div>
              </div>

              {resetModalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                  {resetModalError}
                </div>
              )}

              {resetModalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{resetModalSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {resetAccountType === 'student' ? 'Student Email or Matric Number' : 'Staff Email or Staff ID'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={resetAccountType === 'student' ? 'e.g. m.adebayo@lasu.edu.ng or CSC/21/0045' : 'e.g. s.jenkins@lasu.edu.ng or STAFF/CSC/088'}
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 5 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isResetting ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
