import React, { useState } from 'react';
import { UserProfile, ChatMessage, ArchivedChatThread } from '../types';
import { ADVISER_AVATAR } from '../data/mockData';

interface StudentMessagingViewProps {
  studentProfile: UserProfile;
  messages: ChatMessage[];
  archivedThreads?: ArchivedChatThread[];
  onSendMessage: (text: string) => void;
  onOpenBookAppointment: () => void;
  onOpenTranscriptModal: () => void;
}

export const StudentMessagingView: React.FC<StudentMessagingViewProps> = ({
  studentProfile,
  messages,
  archivedThreads = [],
  onSendMessage,
  onOpenBookAppointment,
  onOpenTranscriptModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedArchivedThread, setSelectedArchivedThread] = useState<ArchivedChatThread | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const adviserName = studentProfile.assignedAdviserName || 'Dr. Sarah Jenkins';
  const adviserTitle = studentProfile.assignedAdviserTitle || 'Assoc. Prof, Computer Science';
  const adviserEmail = studentProfile.assignedAdviserEmail || 's.jenkins@lasu.edu.ng';
  const adviserAvatar = studentProfile.assignedAdviserAvatar || ADVISER_AVATAR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const sampleStudentTemplates = [
    'Requesting prerequisite review for CSC418 and CSC402 standing',
    'Inquiry regarding departmental course waiver submission deadline',
    'Follow-up regarding uploaded Fall 2024 academic result slip',
    'Clarification on elective unit allocations for current semester',
  ];

  const handleSelectTemplate = (tmpl: string) => {
    setInputText(tmpl);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Messages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct Peer-to-Peer Academic Messaging • Level Adviser Line • Human Responses Only
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Official Academic Channel
          </div>
          {archivedThreads.length > 0 && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">inventory_2</span>
              <span>Past Adviser Archives ({archivedThreads.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Full-Page, Full-Width Chat View (Assigned Level Advisor and Advising Protocol removed) */}
      <div className="w-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-[calc(100vh-13rem)] min-h-[520px]">
        {/* Active Adviser Channel Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={adviserAvatar}
                alt={adviserName}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {adviserName}
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Level Adviser
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {adviserTitle} • {studentProfile.level || '300 Level'} Cohort • {adviserEmail}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onOpenTranscriptModal}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">document_scanner</span>
              Upload Result Slip
            </button>
            <button
              onClick={onOpenBookAppointment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">event</span>
              Book Appointment
            </button>
          </div>
        </div>

        {/* Peer-to-Peer Academic Verification Notice */}
        <div className="bg-slate-100/90 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">security</span>
            <span>Encrypted Academic Advisory Channel • Manual reply by adviser</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Consultation Hours: Mon &amp; Wed 10:00 AM - 2:00 PM
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/40 dark:bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-emerald-600/60">forum</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Direct Line with {adviserName}
              </p>
              <p className="text-[11px] max-w-sm">
                Send an inquiry regarding course registration, academic standing, grade audit, or graduation requirements.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isStudent = msg.sender === 'student';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="my-3 mx-auto max-w-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-0.5">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Institutional Notice
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {isStudent ? 'You (Student)' : msg.senderName || adviserName}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isStudent
                        ? 'bg-emerald-600 text-white font-medium rounded-br-none shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Inquiry Templates */}
        <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex gap-1.5 overflow-x-auto text-[11px]">
          {sampleStudentTemplates.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTemplate(template)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-600 text-[10px] font-medium transition-colors shadow-2xs cursor-pointer"
            >
              {template}
            </button>
          ))}
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Send message to ${adviserName}...`}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>
      </div>

      {/* Archived Conversations Modal / Slide-out */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-[24px]">inventory_2</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Archived Level Adviser Conversations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Historical record of advising sessions with former level advisers
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setSelectedArchivedThread(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {!selectedArchivedThread ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Select a previous adviser archive to view historical transcripts:
                  </p>
                  {archivedThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedArchivedThread(thread)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                          {thread.adviserName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {thread.adviserName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cohort: {thread.cohortLevel} • Archived on {thread.archivedAt}
                          </p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                            Reason: {thread.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <span>{thread.messages.length} Messages</span>
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Archive with {selectedArchivedThread.adviserName}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {selectedArchivedThread.cohortLevel} • Archived on {selectedArchivedThread.archivedAt}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedArchivedThread(null)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      ← Back to list
                    </button>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                    {selectedArchivedThread.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[9px] text-slate-400 mb-0.5">
                          {m.sender === 'student' ? 'You' : selectedArchivedThread.adviserName} • {m.timestamp}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                            m.sender === 'student'
                              ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
