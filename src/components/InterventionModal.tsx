import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudentName?: string;
  initialMode?: 'schedule' | 'email';
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  targetStudentName,
  initialMode = 'schedule',
}) => {
  const [mode, setMode] = useState<'schedule' | 'email'>(initialMode);
  const [selectedStudent, setSelectedStudent] = useState<string>(
    targetStudentName || 'Sarah Connor (CSC/21/0102)'
  );
  const [sessionDate, setSessionDate] = useState<string>('2026-08-26');
  const [interventionPlan, setInterventionPlan] = useState<string>(
    'Provide structured weekly tutoring in MAT301 and CSC201 with mandatory office-hour attendance check.'
  );
  const [emailSubject, setEmailSubject] = useState<string>(
    'Urgent Academic Advising Consultation - LASU Computer Science'
  );
  const [emailBody, setEmailBody] = useState<string>(
    `Dear Student,\n\nOur continuous assessment monitoring has flagged concerns regarding your academic trajectory for the current semester. Please meet with your level adviser immediately to formulate a remediation plan.\n\nBest regards,\nDr. Sarah Jenkins\nLevel 300 Adviser`
  );
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      // ignore
    }

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[22px]">
              warning
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Academic Intervention Protocol
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('schedule')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'schedule'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600">calendar_month</span>
            Schedule Intervention
          </button>
          <button
            type="button"
            onClick={() => setMode('email')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'email'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">mail</span>
            Dispatch Email Notice
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-emerald-600 animate-bounce">
              task_alt
            </span>
            <h4 className="text-lg font-bold text-slate-900">
              {mode === 'schedule' ? 'Intervention Scheduled!' : 'Official Notice Sent!'}
            </h4>
            <p className="text-xs text-slate-600">
              Student file updated and notification recorded in department audit log.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Student</label>
              <input
                type="text"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {mode === 'schedule' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                    <input
                      type="text"
                      defaultValue="Adviser Office Room 304"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Action Plan &amp; Remediation Terms
                  </label>
                  <textarea
                    rows={4}
                    value={interventionPlan}
                    onChange={(e) => setInterventionPlan(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 resize-none focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 resize-none font-sans focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                  mode === 'schedule'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {mode === 'schedule' ? 'save' : 'send'}
                </span>
                {mode === 'schedule' ? 'Confirm Intervention Session' : 'Send Academic Notice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
