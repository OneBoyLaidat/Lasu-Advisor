import React, { useState } from 'react';
import { Adviser } from '../types';

interface AssignAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisers: Adviser[];
  onSaveAssignment: (adviserId: string, level: string, load: number) => void;
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
  const [studentLoad, setStudentLoad] = useState(selectedAdviser?.studentLoad || 85);
  const [maxCapacity, setMaxCapacity] = useState(selectedAdviser?.maxLoad || 100);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAssignment(adviserId, level, studentLoad);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">
              manage_accounts
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Adviser Load Allocation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Staff Member</label>
            <select
              value={adviserId}
              onChange={(e) => setAdviserId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              {advisers.map((adv) => (
                <option key={adv.id} value={adv.id} className="bg-white text-slate-900">
                  {adv.name} ({adv.assignedLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Cohort Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="100 Level">100 Level</option>
              <option value="200 Level">200 Level</option>
              <option value="300 Level">300 Level</option>
              <option value="400 Level">400 Level</option>
              <option value="500 Level">500 Level</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Student Load</label>
              <input
                type="number"
                min="0"
                max="300"
                value={studentLoad}
                onChange={(e) => setStudentLoad(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Cap Threshold</label>
              <input
                type="number"
                min="50"
                max="250"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 100)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Computed Load Factor:</span>
              <span
                className={`font-mono font-bold ${
                  studentLoad > maxCapacity
                    ? 'text-rose-600'
                    : studentLoad > maxCapacity * 0.8
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}
              >
                {studentLoad > maxCapacity
                  ? 'Overloaded'
                  : studentLoad > maxCapacity * 0.8
                  ? 'Optimal'
                  : 'Available Capacity'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Save Load Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
