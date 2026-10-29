import React, { useState } from 'react';
import { StudentConversation, UserProfile } from '../types';

interface AdviserMessagingViewProps {
  conversations: StudentConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onSendReply: (conversationId: string, text: string) => void;
  userProfile: UserProfile | null;
  onOpenIntervention?: (studentName?: string) => void;
  onNudgeStudent?: (studentId: string, studentName: string) => void;
}

export const AdviserMessagingView: React.FC<AdviserMessagingViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendReply,
  userProfile,
  onOpenIntervention,
  onNudgeStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'unread' | 'at_risk'>('all');
  const [replyText, setReplyText] = useState('');
  const [showDossier, setShowDossier] = useState(true);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.matricNo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'unread') return conv.unreadCount > 0;
    if (filterCategory === 'at_risk') return conv.status === 'At Risk';
    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;
    onSendReply(activeConv.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Direct Peer-to-Peer Academic Inbox • Manual Human Replies (No AI Bots) • Level 300 Cohort
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Peer-to-Peer Channel
          </div>
          {totalUnread > 0 && (
            <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs">
              {totalUnread} Unread {totalUnread === 1 ? 'Inquiry' : 'Inquiries'}
            </span>
          )}
        </div>
      </div>

      {/* Main Messaging Interface Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-7rem)] min-h-[640px]">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/60">
          {/* Search and Category Filter */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or matric..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('unread')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterCategory === 'unread'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Unread</span>
                {totalUnread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('at_risk')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterCategory === 'at_risk'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                At Risk
              </button>
            </div>
          </div>

          {/* Conversations Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-3xl block mb-1 opacity-60">
                  inbox
                </span>
                No conversations found matching filter.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800/90 border-l-4 border-l-emerald-600 shadow-2xs'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Student Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={conv.avatarUrl}
                        alt={conv.studentName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          conv.status === 'At Risk'
                            ? 'bg-rose-500'
                            : conv.status === 'Average'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        title={conv.status}
                      />
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {conv.studentName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mb-1">
                        <span>{conv.matricNo}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            conv.cgpa < 2.5
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          CGPA {conv.cgpa.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 leading-snug">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {/* Unread Counter */}
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs mt-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Main: Active Message Thread */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/40 min-w-0">
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={activeConv.avatarUrl}
                    alt={activeConv.studentName}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-300 dark:border-emerald-600 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {activeConv.studentName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeConv.status === 'At Risk'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {activeConv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {activeConv.matricNo} • {activeConv.department} ({activeConv.level})
                    </p>
                  </div>
                </div>

                {/* Header Action Shortcuts */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenIntervention && (
                    <button
                      type="button"
                      onClick={() => onOpenIntervention(activeConv.studentName)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Schedule Appointment or Intervention"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">
                        calendar_month
                      </span>
                      <span className="hidden sm:inline">Schedule Slot</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowDossier(!showDossier)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={showDossier ? 'Hide Academic Dossier' : 'Show Academic Dossier'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showDossier ? 'vertical_split' : 'info'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Verified Peer-to-Peer Security Ribbon */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-1.5 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">
                    verified_user
                  </span>
                  Authenticated Academic Channel • Direct Manual human response required
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  No automated AI intervention
                </span>
              </div>

              {/* Messages Thread Display */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {activeConv.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                    <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                    <p className="text-xs font-semibold">No messages in this thread yet.</p>
                    <p className="text-[11px] max-w-xs mt-0.5">
                      Type your advising notes or guidance below to begin direct communication with {activeConv.studentName}.
                    </p>
                  </div>
                ) : (
                  activeConv.messages.map((m) => {
                    const isFromAdviser = m.sender === 'adviser';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isFromAdviser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>{isFromAdviser ? `You (${userProfile?.name || 'Level Adviser'})` : m.senderName}</span>
                          <span>•</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isFromAdviser
                              ? 'bg-emerald-600 text-white font-medium rounded-br-none shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-2xs'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0"
              >
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder={`Write official advising reply to ${activeConv.studentName}... (Press Enter to send)`}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all resize-none"
                />
                <button
                  id="adviser-send-reply-btn"
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer self-stretch"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span className="hidden sm:inline">Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400">
              Select a student conversation from the left to view messages.
            </div>
          )}
        </div>

        {/* Right Sidebar: Selected Student Dossier (Collapsible) */}
        {showDossier && activeConv && (
          <div className="w-full md:w-72 lg:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 space-y-4">
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Advisee Profile
                </h4>
                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={activeConv.avatarUrl}
                    alt={activeConv.studentName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {activeConv.studentName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {activeConv.matricNo}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeConv.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">CGPA</div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      activeConv.cgpa < 2.5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {activeConv.cgpa.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Level</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {activeConv.level}
                  </div>
                </div>
              </div>

              {/* Upload Status */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Result Slip Status:
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      activeConv.hasUploadedResult
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {activeConv.hasUploadedResult ? 'Uploaded & Verified' : 'Missing Result Slip'}
                  </span>
                </div>

                {!activeConv.hasUploadedResult && onNudgeStudent && (
                  <button
                    type="button"
                    onClick={() => onNudgeStudent(activeConv.studentId, activeConv.studentName)}
                    className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                    Send Upload Nudge
                  </button>
                )}
              </div>
            </div>

            {/* Quick Consultation Trigger */}
            {onOpenIntervention && (
              <button
                type="button"
                onClick={() => onOpenIntervention(activeConv.studentName)}
                className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                Book Advising Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
