import React, { useState } from 'react';
import { Adviser } from '../types';
import { STANDARD_ACADEMIC_SESSIONS } from '../lib/academicUtils';

interface AssignAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisers: Adviser[];
  onSaveAssignment: (
    adviserId: string,
    level: string,
    session: string,
    notes?: string
  ) => void | Promise<void>;
  selectedAdviser?: Adviser;
}

export const AssignAdvisorModal: React.FC<AssignAdvisorModalProps> = ({
  isOpen,
  onClose,
  advisers,
  onSaveAssignment,
  selectedAdviser,
}) => {
  const [adviserId, setAdviserId] = useState(selectedAdviser?.id || advisers[0]?.id || '');
  const [level, setLevel] = useState(selectedAdviser?.assignedLevel || '300 Level');
  const [session, setSession] = useState(selectedAdviser?.assignedSession || '2025/2026');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!isOpen) return null;

  const currentAdv = advisers.find((a) => a.id === adviserId) || advisers[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      await onSaveAssignment(adviserId, level, session, adminNotes);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the adviser assignment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Session Adviser Allocation &amp; Assignment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrative Control • Super Admin (HOD / Dean)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Global Propagation Alert Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3.5 flex items-start gap-3">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px] shrink-0 mt-0.5">
            hub
          </span>
          <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-0.5">
            <p className="font-bold">Cohort-Wide Allocation per Academic Session</p>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
              Once an advisor is assigned for a session (e.g., {session}), that advisor is assigned to the entire cohort for that session. If reallocated mid-session, all previous messages are safely archived.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Academic Staff Member (Level Adviser)
            </label>
            <div className="relative">
              <select
                value={adviserId}
                onChange={(e) => setAdviserId(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-3 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer"
              >
                {advisers.map((adv) => (
                  <option key={adv.id} value={adv.id} className="dark:bg-slate-800">
                    {adv.name} ({adv.title}) • {adv.department}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Academic Session
              </label>
              <div className="relative">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-3 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer"
                >
                  {STANDARD_ACADEMIC_SESSIONS.map((sess) => (
                    <option key={sess} value={sess} className="dark:bg-slate-800">
                      {sess} Session
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Level
              </label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-3 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 appearance-none cursor-pointer"
                >
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Administrative Assignment Note (Optional)
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Session cohort lead / Academic board appointment"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Designated Level Adviser:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {currentAdv?.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1.5">
              <span className="text-slate-600 dark:text-slate-400">Assigned Cohort:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {session} Session ({level})
              </span>
            </div>
          </div>

          <div className="pt-2">
            {saveError && <p role="alert" className="mb-2 text-xs text-rose-700 dark:text-rose-300">{saveError}</p>}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              {isSaving ? 'Saving assignment…' : `Assign Adviser to ${session} Cohort`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
