import React, { useState } from 'react';
import { ChatMessage, MessageContact, UserProfile } from '../types';

interface DirectMessagingViewProps {
  profile: UserProfile;
  contacts: MessageContact[];
  threads: Record<string, ChatMessage[]>;
  selectedEmail: string;
  onSelectContact: (email: string) => void;
  onSendMessage: (email: string, text: string) => void;
}

export const DirectMessagingView: React.FC<DirectMessagingViewProps> = ({
  profile,
  contacts,
  threads,
  selectedEmail,
  onSelectContact,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState('');
  const contact = contacts.find((item) => item.email === selectedEmail) || null;
  const messages = threads[selectedEmail] || [];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contact || !draft.trim()) return;
    onSendMessage(contact.email, draft.trim());
    setDraft('');
  };

  return (
    <section aria-label={`Messages for ${profile.name}`} className="w-full min-w-0 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] flex overflow-hidden bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <aside className={`${contact ? 'hidden md:flex w-full md:w-72 lg:w-80 border-r' : 'flex w-full'} shrink-0 flex-col border-slate-200 dark:border-slate-800`}>
        <header className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">LASU Advisor</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">People you can contact in your faculty.</p>
        </header>
        <div className="flex-1 overflow-y-auto">
          {contacts.length ? contacts.map((person) => {
            const thread = threads[person.email] || [];
            const unreadCount = thread.filter((message) => message.sender !== 'adviser' && !message.isRead).length;
            return (
              <button key={person.email} type="button" onClick={() => onSelectContact(person.email)} className={`w-full px-5 py-4 flex items-center gap-3 text-left border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedEmail === person.email ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 grid place-items-center font-bold shrink-0">{person.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{person.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{thread.at(-1)?.text || `${person.role.toUpperCase()} · ${person.department}`}</span>
                </span>
                {unreadCount > 0 && <span className="min-w-5 h-5 rounded-full px-1 bg-emerald-600 text-white grid place-items-center text-[10px] font-bold">{unreadCount}</span>}
              </button>
            );
          }) : <p className="px-5 py-8 text-sm text-slate-500">No faculty contacts are available for this account.</p>}
        </div>
      </aside>

      {contact && <div className="flex min-w-0 flex-1 flex-col">
        <header className="h-[68px] shrink-0 px-3 sm:px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => onSelectContact('')} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back to contacts"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 grid place-items-center font-bold shrink-0">{contact.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
          <div className="min-w-0"><h2 className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{contact.name}</h2><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.role.toUpperCase()} · {contact.department}</p></div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/30">
          {messages.length === 0 ? <div className="h-full min-h-32 grid place-items-center text-center text-sm text-slate-500">Start a conversation with {contact.name}.</div> : messages.map((message) => {
            const isMine = message.sender === 'adviser';
            return <div key={message.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[min(82%,42rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words [overflow-wrap:anywhere] ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'}`}>{message.text}</div>
              <span className="mt-1 px-1 text-[10px] text-slate-400">{isMine ? 'You' : contact.name} · {message.timestamp}</span>
            </div>;
          })}
        </div>
        <form onSubmit={submit} className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} rows={1} placeholder={`Message ${contact.name}`} className="min-w-0 flex-1 resize-y max-h-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-emerald-600 break-words [overflow-wrap:anywhere]" />
          <button type="submit" disabled={!draft.trim()} className="self-end rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-3" aria-label="Send message"><span className="material-symbols-outlined text-[18px]">send</span></button>
        </form>
      </div>}
    </section>
  );
};
