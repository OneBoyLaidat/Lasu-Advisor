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
  const [signupCategory, setSignupCategory] = useState<'student' | 'staff'>('student');

  // Unified Login fields (strictly empty by default)
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Registration fields
  const [fullName, setFullName] = useState<string>('');
  const [matricNumber, setMatricNumber] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [studentLevel, setStudentLevel] = useState<string>('100 Level');
  const [staffRole, setStaffRole] = useState<'lecturer' | 'hod' | 'dean'>('lecturer');
  const [department, setDepartment] = useState<string>(LASU_DEPARTMENTS[4]); // Computer Science
  const [faculty, setFaculty] = useState<string>('Faculty of Computing & Information Technology');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(false);

  // 1. Unified Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Strictly authenticate against registered users database without requiring role preselection
      const result = authenticateUser(identifier, password);

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Access Denied: Unregistered credentials.');
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

  // 2. Student Registration Submission
  const handleStudentSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = registerNewUser({
        name: fullName,
        email: signupEmail,
        password: signupPassword,
        role: 'student',
        department,
        faculty,
        matricNo: matricNumber,
        level: studentLevel,
        hasUploadedTranscript: !!uploadedFileName,
        transcriptFileName: uploadedFileName || undefined,
      });

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Registration failed. Please verify your submitted details.');
        return;
      }

      setSuccessMessage('Student account registered successfully! Redirecting to student dashboard...');
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

  // 3. Staff Registration Submission
  const handleStaffSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = registerNewUser({
        name: fullName,
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

      setTimeout(() => {
        if (result.profile) {
          onLoginSuccess(result.profile);
        }
      }, 700);
    }, 550);
  };

  // File upload simulator handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setErrorMessage(null);
    }
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
              ? 'Sign in to access your registered academic & advising portal'
              : 'Create your verified LASU Academic Account'}
          </p>
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

        {/* ========================================================= */}
        {/* 1. UNIFIED LOGIN FORM (NO ROLE TABS)                     */}
        {/* ========================================================= */}
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
                    alert('Password reset instructions have been sent to your registered institutional address.');
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
                  Remember session
                </span>
              </label>
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
        )}

        {/* ========================================================= */}
        {/* 2. DUAL-PATH REGISTRATION FLOW                            */}
        {/* ========================================================= */}
        {authMode === 'signup' && (
          <div className="space-y-4">
            {/* Choose Registration Path Selector */}
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 text-center">
                Select Registration Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="signup-student-category-btn"
                  onClick={() => {
                    setSignupCategory('student');
                    setErrorMessage(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    signupCategory === 'student'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">school</span>
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  id="signup-staff-category-btn"
                  onClick={() => {
                    setSignupCategory('staff');
                    setErrorMessage(null);
                  }}
                  className={`py-2.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    signupCategory === 'staff'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                  <span className="text-xs">Staff</span>
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 3. STUDENT REGISTRATION FORM                             */}
            {/* --------------------------------------------------------- */}
            {signupCategory === 'student' && (
              <form onSubmit={handleStudentSignupSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="student-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name (e.g. Babatunde Fashola)"
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                      Academic Level
                    </label>
                    <div className="relative">
                      <select
                        id="student-level-select"
                        value={studentLevel}
                        onChange={(e) => setStudentLevel(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs appearance-none cursor-pointer"
                      >
                        <option value="100 Level">100 Level</option>
                        <option value="200 Level">200 Level</option>
                        <option value="300 Level">300 Level</option>
                        <option value="400 Level">400 Level</option>
                        <option value="500 Level">500 Level</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[18px]">
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
                    id="student-email-input"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Enter email address"
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
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Enter password (min. 5 characters)"
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* Results Upload Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Results / Transcript Slip (Optional)
                  </label>
                  <label
                    htmlFor="student-transcript-file"
                    className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer"
                  >
                    <input
                      id="student-transcript-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploadedFileName ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="material-symbols-outlined text-[20px]">task</span>
                        <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadedFileName(null);
                          }}
                          className="text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[20px] text-slate-400">upload_file</span>
                        <span>Click or drop portal result slip (PDF or image)</span>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  id="submit-student-signup-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  ) : (
                    <span>Complete Student Registration</span>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------------------------- */}
            {/* 4. STAFF REGISTRATION FORM                               */}
            {/* --------------------------------------------------------- */}
            {signupCategory === 'staff' && (
              <form onSubmit={handleStaffSignupSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name & Title
                  </label>
                  <input
                    id="staff-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name (e.g. Dr. Sarah Jenkins)"
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Position / Role
                    </label>
                    <div className="relative">
                      <select
                        id="staff-role-select"
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as 'lecturer' | 'hod' | 'dean')}
                        className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 shadow-2xs appearance-none cursor-pointer"
                      >
                        <option value="lecturer">Lecturer (Level Adviser)</option>
                        <option value="hod">Head of Department (HOD)</option>
                        <option value="dean">Dean of Faculty</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[18px]">
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
                    Institutional Email Address
                  </label>
                  <input
                    id="staff-email-input"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. s.jenkins@lasu.edu.ng"
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
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
                    placeholder="Enter password (min. 5 characters)"
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <span>
                    Staff account permissions are strictly bound to your registered position ({staffRole.toUpperCase()}) upon authentication.
                  </span>
                </div>

                <button
                  id="submit-staff-signup-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  ) : (
                    <span>Complete Staff Registration</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Switch Between Login & Registration Modes */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          {authMode === 'login' ? (
            <p>
              Not yet registered?{' '}
              <button
                type="button"
                id="switch-to-signup-btn"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Register New Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                id="switch-to-login-btn"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
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
              {registeredAccounts.slice(0, 4).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
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
        </div>
      </div>
    </div>
  );
};
