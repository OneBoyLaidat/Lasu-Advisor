import React from 'react';
import { OFFICIAL_LOGO_URL } from '../data/mockData';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  // Strict Role-Based Access Control for Navigation Items:
  // - Student: Dashboard, Analytics, Settings (Cannot see Advising, Departmental, Executive)
  // - Lecturer: Dashboard/Advising, Analytics, Settings (Cannot see Departmental, Executive)
  // - HOD: Departmental Control, Advising, Analytics, Settings (Cannot see Executive)
  // - Dean: Executive Overview, Departmental Control, Advising, Analytics, Settings
  const allNavItems = [
    {
      id: 'dashboard',
      label: userRole === 'student' ? 'Academic Overview' : 'Adviser Oversight',
      icon: userRole === 'student' ? 'school' : 'dashboard',
      roles: ['student', 'lecturer'],
    },
    {
      id: 'departmental',
      label: 'Departmental Control',
      icon: 'admin_panel_settings',
      badge: 'HOD',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      roles: ['hod', 'dean'],
    },
    {
      id: 'executive',
      label: 'Executive Overview',
      icon: 'monitoring',
      badge: 'DEAN',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      roles: ['dean'],
    },
    {
      id: 'advising',
      label: 'Cohort & Result Audit',
      icon: 'group',
      roles: ['lecturer', 'hod', 'dean'],
    },
    {
      id: 'analytics',
      label: 'Analytics & Projections',
      icon: 'analytics',
      roles: ['student', 'lecturer', 'hod', 'dean'],
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      icon: 'settings',
      roles: ['student', 'lecturer', 'hod', 'dean'],
    },
  ];

  // Filter navigation strictly to allowed items for current userRole
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Sidebar */}
      <nav
        id="sidebar-nav"
        className={`fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm flex flex-col py-6 z-50 transition-all duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Logo Area */}
        <div className="px-6 mb-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden mb-3 border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center">
            <img
              src={OFFICIAL_LOGO_URL}
              alt="LASU Advisor Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            LASU Advisor
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
              Role:
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                userRole === 'student'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : userRole === 'lecturer'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : userRole === 'hod'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {userRole}
            </span>
          </div>
        </div>

        {/* Navigation Items (Strictly filtered by RBAC) */}
        <div className="flex flex-col gap-1 px-3.5 flex-grow overflow-y-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
            Menu Navigation
          </span>
          {visibleNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Role Switcher Sandbox at bottom for demo and role testing */}
        <div className="px-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500">lock</span>
                Role Access Level
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold capitalize">
                {userRole}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                id="role-btn-student"
                onClick={() => {
                  setUserRole('student');
                  setCurrentTab('dashboard');
                  setIsOpenMobile(false);
                }}
                className={`px-2 py-1.5 rounded-lg text-center font-medium transition-all ${
                  userRole === 'student'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                🎓 Student
              </button>
              <button
                id="role-btn-lecturer"
                onClick={() => {
                  setUserRole('lecturer');
                  setCurrentTab('dashboard');
                  setIsOpenMobile(false);
                }}
                className={`px-2 py-1.5 rounded-lg text-center font-medium transition-all ${
                  userRole === 'lecturer'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                👨‍🏫 Lecturer
              </button>
              <button
                id="role-btn-hod"
                onClick={() => {
                  setUserRole('hod');
                  setCurrentTab('departmental');
                  setIsOpenMobile(false);
                }}
                className={`px-2 py-1.5 rounded-lg text-center font-medium transition-all ${
                  userRole === 'hod'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                🏛️ HOD
              </button>
              <button
                id="role-btn-dean"
                onClick={() => {
                  setUserRole('dean');
                  setCurrentTab('executive');
                  setIsOpenMobile(false);
                }}
                className={`px-2 py-1.5 rounded-lg text-center font-medium transition-all ${
                  userRole === 'dean'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                👑 Dean
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Strict view barriers active per institutional hierarchy
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};
