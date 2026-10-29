import React, { useMemo, useState } from 'react';
import { Adviser, UserProfile, ChatMessage, ArchivedChatThread } from '../types';
import { ADVISER_AVATAR } from '../data/mockData';

interface StudentMessagingViewProps {
  studentProfile: UserProfile;
  advisers: Adviser[];
  messages: ChatMessage[];
  selectedAdviserEmail: string;
  archivedThreads?: ArchivedChatThread[];
  onSelectAdviser: (email: string) => void;
  onSendMessage: (adviserEmail: string, text: string) => void;
}

export const StudentMessagingView: React.FC<StudentMessagingViewProps> = ({
  studentProfile,
  advisers,
  messages,
  selectedAdviserEmail,
  archivedThreads = [],
  onSelectAdviser,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showArchives, setShowArchives] = useState(false);
  const selectedAdviser = advisers.find((adviser) => adviser.email === selectedAdviserEmail) || null;
  const lastMessageByAdviser = useMemo(() => new Map(advisers.map((adviser) => [
    adviser.email,
    selectedAdviserEmail === adviser.email ? messages[messages.length - 1]?.text : '',
  ])), [advisers, messages, selectedAdviserEmail]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !selectedAdviser) return;
    onSendMessage(selectedAdviser.email, inputText.trim());
    setInputText('');
  };

  return (
    <section aria-label={`Messages for ${studentProfile.name}`} className="w-full min-w-0 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] min-h-0 flex overflow-hidden bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <aside className={`${selectedAdviser ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800`}>
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your academic contacts</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {advisers.length ? advisers.map((adviser) => {
            const isActive = adviser.email === selectedAdviserEmail;
            return (
              <button key={adviser.email} type="button" onClick={() => onSelectAdviser(adviser.email)} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800/80 transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                <img src={adviser.avatarUrl || ADVISER_AVATAR} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{adviser.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{lastMessageByAdviser.get(adviser.email) || adviser.title}</span>
                </span>
              </button>
            );
          }) : <p className="px-4 py-6 text-sm text-slate-500">No academic contacts are available yet.</p>}
          {archivedThreads.length > 0 && <button onClick={() => setShowArchives((value) => !value)} className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Past adviser conversations ({archivedThreads.length})</button>}
          {showArchives && archivedThreads.map((thread) => <div key={thread.id} className="px-4 py-3 border-t border-slate-100 dark:border-slate-800"><div className="text-xs font-semibold">{thread.adviserName}</div><div className="text-[11px] text-slate-500">{thread.cohortLevel} · {thread.archivedAt}</div><div className="mt-1 space-y-1">{thread.messages.slice(-2).map((message) => <p key={message.id} className="text-[11px] text-slate-500 break-words [overflow-wrap:anywhere]">{message.text}</p>)}</div></div>)}
        </div>
      </aside>

      <div className={`${selectedAdviser ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {selectedAdviser ? <>
          <header className="h-[68px] shrink-0 px-3 sm:px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => onSelectAdviser('')} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back to contacts"><span className="material-symbols-outlined">arrow_back</span></button>
            <img src={selectedAdviser.avatarUrl || ADVISER_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800" />
            <div className="min-w-0"><h2 className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{selectedAdviser.name}</h2><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedAdviser.title} · {selectedAdviser.department}</p></div>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/30">
            {messages.length === 0 ? <div className="h-full min-h-32 grid place-items-center text-center text-sm text-slate-500">Start a conversation with {selectedAdviser.name}.</div> : messages.map((message) => {
              const isStudent = message.sender === 'student';
              return <div key={message.id} className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[min(82%,42rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words [overflow-wrap:anywhere] ${isStudent ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'}`}>{message.text}</div>
                <span className="mt-1 px-1 text-[10px] text-slate-400">{isStudent ? 'You' : message.senderName} · {message.timestamp}</span>
              </div>;
            })}
          </div>
          <form onSubmit={handleSubmit} className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event); } }} rows={1} placeholder={`Message ${selectedAdviser.name}`} className="min-w-0 flex-1 resize-y max-h-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-emerald-600 break-words [overflow-wrap:anywhere]" />
            <button type="submit" disabled={!inputText.trim()} className="self-end rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3" aria-label="Send message"><span className="material-symbols-outlined text-[18px]">send</span></button>
          </form>
        </> : <div className="m-auto hidden md:block text-sm text-slate-500">Select a person to open your chat.</div>}
      </div>
    </section>
  );
};
