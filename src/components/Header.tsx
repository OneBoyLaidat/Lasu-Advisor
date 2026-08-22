import React, { useState } from 'react';
import { UserProfile, UserRole, NotificationItem } from '../types';

interface HeaderProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onOpenMobileNav: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onOpenTranscriptModal?: () => void;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  userRole,
  setUserRole,
  onOpenMobileNav,
  searchQuery,
  setSearchQuery,
  onOpenSettings,
  onSignOut,
  notifications,
  onClearNotifications,
  onOpenTranscriptModal,
  isDark,
  onToggleDark,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.length;

  return (
    <header
      id="top-header"
      className="fixed top-0 right-0 w-full md:w-[calc(100%-18rem)] h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center px-4 md:px-8 z-40 transition-colors duration-200"
    >
      {/* Left side: Hamburger + Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          id="mobile-nav-toggle"
          onClick={onOpenMobileNav}
          className="md:hidden text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div>
          <h2 className="text-[16px] md:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden sm:block">
            {userRole === 'student'
              ? 'Student Academic Portal'
              : userRole === 'lecturer'
              ? 'Level Adviser Oversight Dashboard'
              : userRole === 'hod'
              ? 'Departmental Academic Management'
              : 'Faculty Executive Dashboard'}
          </h2>
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">LASU Advisor</span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
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
      </div>

      {/* Right side: Search + Dark Mode + Notification + Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Bar */}
        <div className="relative group hidden lg:block w-52 xl:w-60">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, courses..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-1.5 pl-9 pr-4 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 transition-all focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-4 relative">
          {/* Dark Mode Toggle Button */}
          {onToggleDark && (
            <button
              id="theme-toggle-btn"
              onClick={onToggleDark}
              className="text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[21px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}

          {/* Notifications button */}
          <div className="relative">
            <button
              id="notifications-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div
                id="notifications-popover"
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-xl z-50 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                      notifications_active
                    </span>
                    Institutional Alerts
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {notifications.length} Active
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No unread alerts at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-2.5 px-2 rounded-lg transition-colors ${
                          n.type === 'nudge'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-semibold flex items-center gap-1 ${
                              n.urgent ? 'text-amber-800 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {n.type === 'nudge' && (
                              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[15px]">
                                notifications_active
                              </span>
                            )}
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium font-mono">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                        {n.type === 'nudge' && onOpenTranscriptModal && (
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              onOpenTranscriptModal();
                            }}
                            className="mt-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">upload_file</span>
                            Upload Result Now
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      onClearNotifications();
                      setShowNotifications(false);
                    }}
                    className="w-full mt-3 py-1.5 text-center text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold border-t border-slate-100 dark:border-slate-800 pt-2"
                  >
                    Clear all alerts
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Profile dropdown button */}
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              aria-label="User Menu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[16px] hidden sm:block pr-1">
                expand_more
              </span>
            </button>

            {/* User Menu Popover */}
            {showUserMenu && (
              <div
                id="user-menu-popover"
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-xl z-50 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center gap-3 p-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {userProfile.name}
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold tracking-wider">
                      {userProfile.role} • {userProfile.department}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">{userProfile.email}</p>
                  </div>
                </div>

                <div className="py-2 flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-left transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      manage_accounts
                    </span>
                    Account Settings
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold px-2 py-1">
                    Role Hierarchy Switcher
                  </p>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    <button
                      onClick={() => {
                        setUserRole('student');
                        setShowUserMenu(false);
                      }}
                      className={`text-[11px] p-1.5 rounded-md text-left font-medium transition-colors ${
                        userRole === 'student'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🎓 Student
                    </button>
                    <button
                      onClick={() => {
                        setUserRole('lecturer');
                        setShowUserMenu(false);
                      }}
                      className={`text-[11px] p-1.5 rounded-md text-left font-medium transition-colors ${
                        userRole === 'lecturer'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      👨‍🏫 Lecturer
                    </button>
                    <button
                      onClick={() => {
                        setUserRole('hod');
                        setShowUserMenu(false);
                      }}
                      className={`text-[11px] p-1.5 rounded-md text-left font-medium transition-colors ${
                        userRole === 'hod'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🏛️ HOD
                    </button>
                    <button
                      onClick={() => {
                        setUserRole('dean');
                        setShowUserMenu(false);
                      }}
                      className={`text-[11px] p-1.5 rounded-md text-left font-medium transition-colors ${
                        userRole === 'dean'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      👑 Dean
                    </button>
                  </div>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      onSignOut();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left transition-colors font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
