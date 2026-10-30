import React from 'react';
import { UserProfile, UserRole } from '../types';
import { ProfileMonogram } from './ProfileMonogram';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  userProfile: UserProfile;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isExpanded: boolean;
  onHoverChange: (expanded: boolean) => void;
  unreadMessagesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  userProfile,
  isOpenMobile,
  setIsOpenMobile,
  isExpanded,
  onHoverChange,
  unreadMessagesCount = 0,
}) => {
  // Strict Role-Based Navigation Items for authenticated userRole:
  // Navigation is filtered by role so each user only sees authorized modules.
  const allNavItems = [
    {
      id: 'dashboard',
      label: userRole === 'student' ? 'Academic Overview' : 'Academic Oversight & Result Audit',
      icon: userRole === 'student' ? 'school' : 'fact_check',
      roles: ['student', 'lecturer'],
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'forum',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      roles: ['student', 'lecturer', 'hod', 'dean'],
    },
    {
      id: 'departmental',
      label: 'Departmental Control and Academic Oversight',
      icon: 'admin_panel_settings',
      roles: ['hod'],
    },
    {
      id: 'executive',
      label: 'Executive Overview',
      icon: 'monitoring',
      roles: ['dean'],
    },
    {
      id: 'admin',
      label: 'Admin Portal',
      icon: 'shield_person',
      roles: ['hod', 'lecturer', 'dean', 'admin'],
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
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onFocus={() => onHoverChange(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHoverChange(false);
        }}
        className={`fixed left-0 top-0 h-screen ${isOpenMobile || isExpanded ? 'w-60' : 'w-20'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm flex flex-col py-4 z-50 transition-[width,transform] duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Main navigation"
      >
        {/* Header / Logo Area */}
        <div className={`mb-4 flex flex-col items-center text-center ${isExpanded || isOpenMobile ? 'px-5' : 'px-2'}`}>
          <ProfileMonogram name={userProfile.name} sizeClassName="h-11 w-11" />
          {(isExpanded || isOpenMobile) && (
            <>
              <h1 className="mt-2 text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">LASU Advisor</h1>
              <p className="max-w-full truncate text-xs text-slate-500 dark:text-slate-400">{userProfile.name}</p>
            </>
          )}
        </div>

        {/* Navigation Items (Strictly filtered by RBAC) */}
        <div className="flex flex-col gap-0.5 px-2.5 flex-grow overflow-y-auto">
          {(isExpanded || isOpenMobile) && <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
            Menu Navigation
          </span>}
          {visibleNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={!isExpanded && !isOpenMobile ? item.label : undefined}
                aria-label={item.label}
                className={`flex items-center ${isExpanded || isOpenMobile ? 'justify-start gap-2.5 px-3' : 'justify-center px-2'} py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                {(isExpanded || isOpenMobile) && <span className="truncate flex-1">{item.label}</span>}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Institutional Authentication Footer Notice */}
        <div className={`${isExpanded || isOpenMobile ? 'px-5' : 'px-2'} pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto`}>
          <div className="flex items-center gap-2 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            {(isExpanded || isOpenMobile) && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Authenticated Session Active
            </p>}
          </div>
        </div>
      </nav>
    </>
  );
};
