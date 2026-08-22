import React, { useState } from 'react';
import { ADVISER_AVATAR, STUDENT_AVATAR } from '../data/mockData';
import { ChatMessage, UserProfile } from '../types';

interface AdvisorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  targetPersonName?: string;
  targetPersonRole?: string;
}

export const AdvisorChatModal: React.FC<AdvisorChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  messages,
  onSendMessage,
  targetPersonName,
  targetPersonRole,
}) => {
  const [inputText, setInputText] = useState('');
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Enforce User Validation: Only authenticated users can access messaging
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Authentication Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direct peer-to-peer institutional messaging is restricted to authenticated student and staff accounts.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const isStudent = currentUser.role === 'student';
  const partnerName =
    targetPersonName || (isStudent ? 'Dr. Sarah Jenkins' : 'Michael Adebayo');
  const partnerRole =
    targetPersonRole ||
    (isStudent
      ? 'Level 300 Academic Adviser'
      : 'Level 300 Student (CSC/21/0045)');
  const partnerAvatar = isStudent ? ADVISER_AVATAR : STUDENT_AVATAR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setDraftNotice(null);
  };

  const sampleDraftTemplates = isStudent
    ? [
        'Request review of CSC418 prerequisite standing',
        'Inquiry regarding course waiver submission',
        'Academic advising calendar consultation',
      ]
    : [
        'I have reviewed your academic record and prerequisites.',
        'Please schedule an advising slot to finalize elective choices.',
        'Ensure your course registration slip is uploaded before the deadline.',
      ];

  const handleSelectTemplate = (template: string) => {
    setInputText(template);
    setDraftNotice('Template inserted into draft. Edit and press Send to deliver.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[580px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover border border-emerald-300 dark:border-emerald-600 shadow-2xs"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{partnerName}</h3>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                  Direct Line
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{partnerRole}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Peer-to-Peer Integrity Notice */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
            Peer-to-Peer Encrypted Academic Channel
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Manual human replies only
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-6 space-y-2">
              <span className="material-symbols-outlined text-4xl">forum</span>
              <p className="text-xs font-semibold">No messages yet</p>
              <p className="text-[11px] max-w-xs">
                Start a direct conversation. Messages are held securely for {partnerName} to review and reply.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              // Message is from current user if sender matches their role
              const isMine =
                (isStudent && m.sender === 'student') ||
                (!isStudent && m.sender === 'adviser');

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {isMine ? 'You' : m.senderName}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{m.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMine
                        ? 'bg-emerald-600 text-white font-medium rounded-br-none shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Draft Notice if template clicked */}
        {draftNotice && (
          <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
            <span>{draftNotice}</span>
            <button
              onClick={() => setDraftNotice(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:underline text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Draft Prompts */}
        <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex gap-1.5 overflow-x-auto text-[11px]">
          {sampleDraftTemplates.map((template, idx) => (
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

        {/* Input Footer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partnerName} directly...`}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
