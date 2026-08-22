import React, { useState } from 'react';
import { ADVISER_AVATAR } from '../data/mockData';
import { ChatMessage } from '../types';

interface AdvisorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const AdvisorChatModal: React.FC<AdvisorChatModalProps> = ({
  isOpen,
  onClose,
  studentName,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const sampleQuickPrompts = [
    'How do I register for CSC418 Cloud Security?',
    'What is the minimum grade needed in CSC499 Project?',
    'Can I apply for a course unit waiver?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[560px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={ADVISER_AVATAR}
                alt="Dr. Sarah Jenkins"
                className="w-10 h-10 rounded-full object-cover border border-emerald-300 shadow-sm"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dr. Sarah Jenkins</h3>
              <p className="text-[11px] text-emerald-700 font-medium">Level 300 Academic Adviser • Online</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.map((m) => {
            const isStudent = m.sender === 'student';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] text-slate-500 font-semibold">{m.senderName}</span>
                  <span className="text-[9px] text-slate-400">{m.timestamp}</span>
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isStudent
                      ? 'bg-emerald-600 text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
          {sampleQuickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(prompt)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-[10px] font-medium transition-colors shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your academic inquiry..."
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
