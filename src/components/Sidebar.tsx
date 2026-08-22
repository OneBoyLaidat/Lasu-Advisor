import React from 'react';
import { OFFICIAL_LOGO_URL } from '../data/mockData';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  // Strict Role-Based Navigation Items for authenticated userRole:
  // - Student: Academic Overview, Analytics & Projections, Settings & Security
  // - Lecturer: Adviser Oversight, Cohort & Result Audit, Analytics & Projections, Settings & Security
  // - HOD: Departmental Control, Cohort & Result Audit, Analytics & Projections, Settings & Security
  // - Dean: Executive Overview, Departmental Control, Cohort & Result Audit, Analytics & Projections, Settings & Security
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
      roles: ['hod', 'dean'],
    },
    {
      id: 'executive',
      label: 'Executive Overview',
      icon: 'monitoring',
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
              Portal:
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
              </button>
            );
          })}
        </div>

        {/* Institutional Authentication Footer Notice */}
        <div className="px-5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="flex items-center gap-2 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Authenticated Session Active
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};
