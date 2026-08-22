import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  StudentStats,
  CourseResult,
  Adviser,
  Advisee,
  AgendaItem,
  CourseSuccessRate,
  Appointment,
  ChatMessage,
  NotificationItem,
  ThemeMode,
} from './types';
import {
  INITIAL_USER_PROFILES,
  INITIAL_STUDENT_STATS,
  INITIAL_COURSE_RESULTS,
  ADVISERS_LIST,
  ADVISEES_LIST,
  AGENDA_ITEMS,
  COURSE_SUCCESS_RATES,
  INITIAL_CHAT_MESSAGES,
  INITIAL_APPOINTMENTS,
} from './data/mockData';

// Component imports
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StudentDashboard } from './components/StudentDashboard';
import { LecturerDashboard } from './components/LecturerDashboard';
import { DepartmentalControl } from './components/DepartmentalControl';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthView } from './components/AuthView';
import { SettingsView } from './components/SettingsView';

// Modal imports
import { AdvisorChatModal } from './components/AdvisorChatModal';
import { BookAppointmentModal } from './components/BookAppointmentModal';
import { InterventionModal } from './components/InterventionModal';
import { AssignAdvisorModal } from './components/AssignAdvisorModal';
import { ExportReportModal } from './components/ExportReportModal';
import { DeepFilterModal } from './components/DeepFilterModal';
import { TranscriptParserModal } from './components/TranscriptParserModal';

interface ToastNotice {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export function App() {
  // Global State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [hasNudgeNotice, setHasNudgeNotice] = useState<boolean>(true);

  // Dark Mode / Theme state with local persistence (default: dark)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lasu_theme_mode') : null;
    return (saved as ThemeMode) || 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    try {
      localStorage.setItem('lasu_theme_mode', themeMode);
    } catch (e) {
      // ignore local storage errors
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [themeMode, isDark]);

  const handleToggleDark = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // Data states
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILES.student);
  const [studentStats, setStudentStats] = useState<StudentStats>(INITIAL_STUDENT_STATS);
  const [courseResults, setCourseResults] = useState<CourseResult[]>(INITIAL_COURSE_RESULTS);
  const [advisers, setAdvisers] = useState<Adviser[]>(ADVISERS_LIST);
  const [advisees, setAdvisees] = useState<Advisee[]>(ADVISEES_LIST);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(AGENDA_ITEMS);
  const [courseRates, setCourseRates] = useState<CourseSuccessRate[]>(COURSE_SUCCESS_RATES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Result Verification Required',
      desc: 'Level Adviser Dr. Sarah Jenkins requested your official Fall 2024 result slip.',
      time: '15m ago',
      urgent: true,
      type: 'nudge',
    },
    {
      id: 'n2',
      title: 'Early Warning Audit Alert',
      desc: '3 students flagged for academic performance review in Computer Science.',
      time: '1h ago',
      urgent: true,
      type: 'alert',
    },
    {
      id: 'n3',
      title: 'Course Registration Deadline',
      desc: 'Late registration penalty waiver window closes on Nov 15.',
      time: '4h ago',
      urgent: false,
      type: 'deadline',
    },
  ]);

  // Modal Control States
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState(false);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const [interventionTargetStudent, setInterventionTargetStudent] = useState<string>('');
  const [interventionInitialMode, setInterventionInitialMode] = useState<'schedule' | 'email'>('schedule');
  const [isAssignAdvisorOpen, setIsAssignAdvisorOpen] = useState(false);
  const [selectedAdviserToEdit, setSelectedAdviserToEdit] = useState<Adviser | undefined>(undefined);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isDeepFilterOpen, setIsDeepFilterOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedAdviseeDetail, setSelectedAdviseeDetail] = useState<Advisee | null>(null);

  // Helper: Trigger Toast
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Strict Role-Based Access Control (RBAC) Validation:
  // - student: cannot access 'advising', 'departmental', 'executive'
  // - lecturer: cannot access 'departmental', 'executive'
  // - hod: cannot access 'executive'
  // - dean: full access
  const isTabAllowedForRole = (tab: string, role: UserRole): boolean => {
    if (role === 'student') {
      return ['dashboard', 'analytics', 'settings'].includes(tab);
    }
    if (role === 'lecturer') {
      return ['dashboard', 'advising', 'analytics', 'settings'].includes(tab);
    }
    if (role === 'hod') {
      return ['dashboard', 'departmental', 'advising', 'analytics', 'settings'].includes(tab);
    }
    if (role === 'dean') {
      return ['dashboard', 'executive', 'departmental', 'advising', 'analytics', 'settings'].includes(tab);
    }
    return true;
  };

  // Sync profile & enforce RBAC when role changes
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    if (INITIAL_USER_PROFILES[newRole]) {
      setUserProfile(INITIAL_USER_PROFILES[newRole]);
    }
    // Set appropriate landing tab
    if (newRole === 'student') {
      setCurrentTab('dashboard');
    } else if (newRole === 'lecturer') {
      setCurrentTab('dashboard');
    } else if (newRole === 'hod') {
      setCurrentTab('departmental');
    } else if (newRole === 'dean') {
      setCurrentTab('executive');
    }
  };

  // Guard currentTab against active role
  useEffect(() => {
    if (!isTabAllowedForRole(currentTab, userRole)) {
      if (userRole === 'student' || userRole === 'lecturer') {
        setCurrentTab('dashboard');
      } else if (userRole === 'hod') {
        setCurrentTab('departmental');
      } else {
        setCurrentTab('executive');
      }
    }
  }, [userRole, currentTab]);

  // Nudge individual student handler
  const handleNudgeStudent = (adviseeId: string, studentName: string) => {
    setAdvisees((prev) =>
      prev.map((a) =>
        a.id === adviseeId
          ? {
              ...a,
              lastNudgedAt: 'Just now',
              nudgeCount: (a.nudgeCount || 0) + 1,
            }
          : a
      )
    );

    // If student nudged is Michael Adebayo, turn on banner in student portal
    if (adviseeId === 'advisee_1' || studentName.toLowerCase().includes('michael')) {
      setHasNudgeNotice(true);
    }

    const newAlert: NotificationItem = {
      id: `nudge_${Date.now()}`,
      title: 'Result Slip Reminder Sent',
      desc: `Official OCR upload reminder broadcast to ${studentName} via LASU Portal & SMS.`,
      time: 'Just now',
      urgent: true,
      type: 'nudge',
    };
    setNotifications((prev) => [newAlert, ...prev]);

    showToast(
      'Nudge Notification Sent',
      `Official reminder dispatched to ${studentName} (via Email & Student Portal Notification).`,
      'info'
    );
  };

  // Nudge all missing advisees in batch
  const handleNudgeAllMissing = (missingCount: number) => {
    setAdvisees((prev) =>
      prev.map((a) =>
        !a.hasUploadedResult
          ? {
              ...a,
              lastNudgedAt: 'Just now',
              nudgeCount: (a.nudgeCount || 0) + 1,
            }
          : a
      )
    );

    setHasNudgeNotice(true);

    const batchAlert: NotificationItem = {
      id: `batch_nudge_${Date.now()}`,
      title: 'Batch Nudge Sent',
      desc: `Broadcast result submission notices to all ${missingCount} missing students in 300L Computer Science.`,
      time: 'Just now',
      urgent: true,
      type: 'nudge',
    };
    setNotifications((prev) => [batchAlert, ...prev]);

    showToast(
      'Batch Nudge Broadcast Completed',
      `Automated reminders sent to ${missingCount} students with missing transcripts.`,
      'warning'
    );
  };

  // Agenda item toggle reminder
  const handleToggleAgendaReminder = (id: string) => {
    setAgendaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reminder: !item.reminder } : item))
    );
  };

  // Quick add agenda item
  const handleAddAgendaItem = () => {
    const newItem: AgendaItem = {
      id: `ag_${Date.now()}`,
      title: 'Advising Consultation Session',
      description: 'Review course registration and academic standing.',
      time: '02:00 PM',
      date: 'Today',
      attendees: ['MA', 'SC'],
      reminder: true,
    };
    setAgendaItems((prev) => [newItem, ...prev]);
    showToast('Agenda Scheduled', 'Advising session added to today\'s schedule.', 'success');
  };

  // Send chat message
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      senderName: userProfile.name,
      text,
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      let replyText =
        'Thank you for reaching out Michael. I will review your record and confirm your request.';
      if (text.toLowerCase().includes('cloud security') || text.toLowerCase().includes('csc418')) {
        replyText =
          'CSC418 Cloud Security is highly recommended! It aligns well with your Distributed Systems prerequisite and has a 94% pass rate.';
      } else if (text.toLowerCase().includes('waiver') || text.toLowerCase().includes('unit')) {
        replyText =
          'Course unit waiver requests can be submitted directly through the HOD approval portal. You need a minimum 3.50 CGPA to qualify.';
      } else if (text.toLowerCase().includes('project') || text.toLowerCase().includes('csc499')) {
        replyText =
          'For CSC499 Final Year Project, ensure your synopsis is signed by your supervisor before the Faculty Board deadline next month.';
      }

      const replyMsg: ChatMessage = {
        id: `msg_rep_${Date.now()}`,
        sender: 'adviser',
        senderName: 'Dr. Sarah Jenkins',
        text: replyText,
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, replyMsg]);
    }, 900);
  };

  // Confirm booking
  const handleConfirmBooking = (appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
    showToast('Appointment Booked', `Session confirmed with ${appointment.adviserName} on ${appointment.date}.`, 'success');
  };

  // Save Adviser Assignment
  const handleSaveAdvisorAssignment = (advId: string, level: string, load: number) => {
    setAdvisers((prev) =>
      prev.map((adv) =>
        adv.id === advId
          ? {
              ...adv,
              assignedLevel: level,
              studentLoad: load,
              status:
                load > adv.maxLoad
                  ? 'Overloaded'
                  : load > adv.maxLoad * 0.8
                  ? 'Optimal'
                  : 'Available',
            }
          : adv
      )
    );
    showToast('Advisor Assigned', `Advisor load updated to ${load} students (${level}).`, 'success');
  };

  // OCR Transcript Parsed handler: Populates student results and synchronizes with Adviser roster!
  const handleTranscriptParsed = (
    courses: CourseResult[],
    newCgpa: number,
    totalUnits: number,
    passedUnits: number,
    carryoverUnits: number,
    fileName: string
  ) => {
    // 1. Update Student's courses & stats
    if (courses.length > 0) {
      setCourseResults(courses);
    }
    setStudentStats((prev) => ({
      ...prev,
      cgpa: newCgpa,
      totalUnits: totalUnits,
      passedUnits: passedUnits,
      carryoverUnits: carryoverUnits,
    }));

    // 2. Update Student Profile
    setUserProfile((prev) => ({
      ...prev,
      hasUploadedTranscript: true,
      transcriptUploadDate: 'Today',
      transcriptFileName: fileName,
    }));

    // 3. Update Advisee record in Adviser Roster so Adviser sees immediate compliance!
    setAdvisees((prev) =>
      prev.map((a) =>
        a.id === 'advisee_1' || a.matricNo === userProfile.matricNo
          ? {
              ...a,
              hasUploadedResult: true,
              resultUploadedDate: 'Today',
              uploadedFileName: fileName,
              cgpa: newCgpa,
              parsedCoursesCount: courses.length,
              status: newCgpa >= 3.5 ? 'Good Standing' : newCgpa < 2.5 ? 'At Risk' : 'Average',
            }
          : a
      )
    );

    // 4. Remove active nudge notice
    setHasNudgeNotice(false);

    // 5. Add notification
    const ocrAlert: NotificationItem = {
      id: `ocr_${Date.now()}`,
      title: 'Result Slip Verified via OCR',
      desc: `Extracted ${courses.length} courses from ${fileName}. Calculated CGPA: ${newCgpa.toFixed(2)}.`,
      time: 'Just now',
      urgent: false,
      type: 'system',
    };
    setNotifications((prev) => [ocrAlert, ...prev]);

    showToast(
      'Results Verified & Profile Synced',
      `OCR extracted ${courses.length} course results. Academic standing updated to ${newCgpa.toFixed(2)} CGPA.`,
      'success'
    );
  };

  if (!isAuthenticated) {
    return (
      <AuthView
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onLoginSuccess={(profile) => {
          setUserProfile(profile);
          setUserRole(profile.role);
          if (profile.role === 'student' || profile.role === 'lecturer') {
            setCurrentTab('dashboard');
          } else if (profile.role === 'hod') {
            setCurrentTab('departmental');
          } else if (profile.role === 'dean') {
            setCurrentTab('executive');
          }
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Check RBAC permission for current tab
  const canAccessCurrentTab = isTabAllowedForRole(currentTab, userRole);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-lg border pointer-events-auto flex items-start gap-3 transition-all animate-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 text-emerald-300">
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Fixed Navigation Sidebar with Strict RBAC Filtering */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        isOpenMobile={isMobileNavOpen}
        setIsOpenMobile={setIsMobileNavOpen}
      />

      {/* Top Header Bar */}
      <Header
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        userRole={userRole}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        onOpenSettings={() => setCurrentTab('settings')}
        onSignOut={() => setIsAuthenticated(false)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onOpenTranscriptModal={() => setIsTranscriptModalOpen(true)}
        isDark={isDark}
        onToggleDark={handleToggleDark}
      />

      {/* Main Workspace Body */}
      <main className="md:ml-72 pt-20 sm:pt-24 pb-16 px-3 sm:px-6 md:px-10 max-w-7xl w-full mx-auto flex-1">
        {/* Strict RBAC Access Guard */}
        {!canAccessCurrentTab ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Restricted Administrative View</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your active account role (<span className="font-bold uppercase text-slate-900 dark:text-slate-100">{userRole}</span>) does
              not have institutional clearance to view this module.
            </p>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              Return to Authorized Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Tab: Dashboard */}
            {currentTab === 'dashboard' && (
              <>
                {userRole === 'student' ? (
                  <StudentDashboard
                    studentProfile={userProfile}
                    stats={studentStats}
                    courseResults={courseResults}
                    onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
                    onOpenBookAppointment={() => setIsBookAppointmentOpen(true)}
                    onOpenTranscriptModal={() => setIsTranscriptModalOpen(true)}
                    hasNudgeNotice={hasNudgeNotice}
                  />
                ) : userRole === 'lecturer' ? (
                  <LecturerDashboard
                    advisees={advisees}
                    agendaItems={agendaItems}
                    onOpenIntervention={(studentName) => {
                      setInterventionTargetStudent(studentName || 'Sarah Connor');
                      setInterventionInitialMode('schedule');
                      setIsInterventionOpen(true);
                    }}
                    onOpenEmailModal={(targetStudents) => {
                      setInterventionTargetStudent(targetStudents?.[0] || 'At-Risk Students');
                      setInterventionInitialMode('email');
                      setIsInterventionOpen(true);
                    }}
                    onViewStudentDetails={(advisee) => {
                      setSelectedAdviseeDetail(advisee);
                    }}
                    onToggleAgendaReminder={handleToggleAgendaReminder}
                    onAddAgendaItem={handleAddAgendaItem}
                    onNudgeStudent={handleNudgeStudent}
                    onNudgeAllMissing={handleNudgeAllMissing}
                  />
                ) : userRole === 'hod' ? (
                  <DepartmentalControl
                    advisers={advisers}
                    courseRates={courseRates}
                    onOpenAssignAdvisorModal={(adv) => {
                      setSelectedAdviserToEdit(adv);
                      setIsAssignAdvisorOpen(true);
                    }}
                    onOpenExportReportModal={() => setIsExportReportOpen(true)}
                  />
                ) : (
                  <ExecutiveOverview
                    onOpenExportReportModal={() => setIsExportReportOpen(true)}
                    onOpenDeepFilterModal={() => setIsDeepFilterOpen(true)}
                  />
                )}
              </>
            )}

            {/* Tab: Advising (Lecturer, HOD, Dean only) */}
            {currentTab === 'advising' && (userRole === 'lecturer' || userRole === 'hod' || userRole === 'dean') && (
              <LecturerDashboard
                advisees={advisees}
                agendaItems={agendaItems}
                onOpenIntervention={(studentName) => {
                  setInterventionTargetStudent(studentName || 'Sarah Connor');
                  setInterventionInitialMode('schedule');
                  setIsInterventionOpen(true);
                }}
                onOpenEmailModal={(targetStudents) => {
                  setInterventionTargetStudent(targetStudents?.[0] || 'At-Risk Students');
                  setInterventionInitialMode('email');
                  setIsInterventionOpen(true);
                }}
                onViewStudentDetails={(advisee) => {
                  setSelectedAdviseeDetail(advisee);
                }}
                onToggleAgendaReminder={handleToggleAgendaReminder}
                onAddAgendaItem={handleAddAgendaItem}
                onNudgeStudent={handleNudgeStudent}
                onNudgeAllMissing={handleNudgeAllMissing}
              />
            )}

            {/* Tab: Departmental (HOD, Dean only) */}
            {currentTab === 'departmental' && (userRole === 'hod' || userRole === 'dean') && (
              <DepartmentalControl
                advisers={advisers}
                courseRates={courseRates}
                onOpenAssignAdvisorModal={(adv) => {
                  setSelectedAdviserToEdit(adv);
                  setIsAssignAdvisorOpen(true);
                }}
                onOpenExportReportModal={() => setIsExportReportOpen(true)}
              />
            )}

            {/* Tab: Executive (Dean only) */}
            {currentTab === 'executive' && userRole === 'dean' && (
              <ExecutiveOverview
                onOpenExportReportModal={() => setIsExportReportOpen(true)}
                onOpenDeepFilterModal={() => setIsDeepFilterOpen(true)}
              />
            )}

            {/* Tab: Analytics */}
            {currentTab === 'analytics' && <AnalyticsView />}

            {/* Tab: Settings */}
            {currentTab === 'settings' && (
              <SettingsView
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
                isDark={isDark}
                onToggleDark={handleToggleDark}
                themeMode={themeMode}
                onThemeModeChange={setThemeMode}
              />
            )}
          </>
        )}
      </main>

      {/* Interactive Modals */}
      <AdvisorChatModal
        isOpen={isAdvisorChatOpen}
        onClose={() => setIsAdvisorChatOpen(false)}
        studentName={userProfile.name}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      <BookAppointmentModal
        isOpen={isBookAppointmentOpen}
        onClose={() => setIsBookAppointmentOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        studentName={userProfile.name}
      />

      <InterventionModal
        isOpen={isInterventionOpen}
        onClose={() => setIsInterventionOpen(false)}
        targetStudentName={interventionTargetStudent}
        initialMode={interventionInitialMode}
      />

      <AssignAdvisorModal
        isOpen={isAssignAdvisorOpen}
        onClose={() => setIsAssignAdvisorOpen(false)}
        advisers={advisers}
        onSaveAssignment={handleSaveAdvisorAssignment}
        selectedAdviser={selectedAdviserToEdit}
      />

      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
      />

      <DeepFilterModal
        isOpen={isDeepFilterOpen}
        onClose={() => setIsDeepFilterOpen(false)}
        onApplyFilter={(filter) => {
          console.log('Applied Filter:', filter);
        }}
      />

      {/* OCR Transcript Parser & Result Scanner Modal */}
      <TranscriptParserModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        onTranscriptParsed={handleTranscriptParsed}
      />

      {/* Advisee Detail Inspection Drawer */}
      {selectedAdviseeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800">
                  {selectedAdviseeDetail.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedAdviseeDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedAdviseeDetail.matricNo} • {selectedAdviseeDetail.level}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdviseeDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                    Cumulative GPA
                  </span>
                  <div
                    className={`text-xl font-bold font-mono mt-0.5 ${
                      selectedAdviseeDetail.cgpa >= 3.5
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : selectedAdviseeDetail.cgpa < 2.5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {selectedAdviseeDetail.cgpa.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                    Carryovers
                  </span>
                  <div
                    className={`text-xl font-bold font-mono mt-0.5 ${
                      selectedAdviseeDetail.carryovers > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {selectedAdviseeDetail.carryovers}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                    Result Slip
                  </span>
                  <div className="mt-1">
                    {selectedAdviseeDetail.hasUploadedResult ? (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        Missing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedAdviseeDetail.uploadedFileName && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                      picture_as_pdf
                    </span>
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-200 block">Verified Transcript PDF</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {selectedAdviseeDetail.uploadedFileName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                    {selectedAdviseeDetail.parsedCoursesCount || 8} Courses
                  </span>
                </div>
              )}

              {selectedAdviseeDetail.failedCourses && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    Failed / Deficient Courses:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-mono">
                    {selectedAdviseeDetail.failedCourses.join(', ')}
                  </p>
                </div>
              )}

              {selectedAdviseeDetail.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Adviser Clinical Notes:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedAdviseeDetail.notes}</p>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {!selectedAdviseeDetail.hasUploadedResult && (
                  <button
                    onClick={() => {
                      const id = selectedAdviseeDetail.id;
                      const name = selectedAdviseeDetail.name;
                      setSelectedAdviseeDetail(null);
                      handleNudgeStudent(id, name);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                    Send Nudge Reminder
                  </button>
                )}

                <button
                  onClick={() => {
                    const student = selectedAdviseeDetail.name;
                    setSelectedAdviseeDetail(null);
                    setInterventionTargetStudent(student);
                    setInterventionInitialMode('schedule');
                    setIsInterventionOpen(true);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  Schedule Intervention
                </button>

                <button
                  onClick={() => {
                    const student = selectedAdviseeDetail.name;
                    setSelectedAdviseeDetail(null);
                    setInterventionTargetStudent(student);
                    setInterventionInitialMode('email');
                    setIsInterventionOpen(true);
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Direct Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
