import React, { useState } from 'react';
import { LASU_DEPARTMENTS } from '../types';

interface DeepFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filter: any) => void;
}

export const DeepFilterModal: React.FC<DeepFilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilter,
}) => {
  const [session, setSession] = useState('2024/2025');
  const [faculty, setFaculty] = useState('All Faculties');
  const [department, setDepartment] = useState('All Departments');
  const [level, setLevel] = useState('All Levels');
  const [cgpaBracket, setCgpaBracket] = useState('All Brackets');

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({ session, faculty, department, level, cgpaBracket });
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
              filter_alt
            </span>
            <h3 className="text-base font-bold text-slate-900">Institutional Deep Filter</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="2024/2025">2024/2025 (Current)</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Faculty</label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="All Faculties">All Faculties</option>
              <option value="Sciences & Engineering">Sciences &amp; Engineering</option>
              <option value="Business & Law">Business &amp; Law</option>
              <option value="Arts & Humanities">Arts &amp; Humanities</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="All Departments">All Departments</option>
              {LASU_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="All Levels">All Levels</option>
                <option value="100L">100L</option>
                <option value="200L">200L</option>
                <option value="300L">300L</option>
                <option value="400L">400L</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">CGPA Bracket</label>
              <select
                value={cgpaBracket}
                onChange={(e) => setCgpaBracket(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="All Brackets">All Brackets</option>
                <option value="First Class (4.50 - 5.00)">First Class (&gt;=4.50)</option>
                <option value="Second Class Upper (3.50 - 4.49)">Second Upper (3.50 - 4.49)</option>
                <option value="At Risk (< 2.50)">At Risk (&lt; 2.50)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 py-2.5 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-all"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow-sm transition-all"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
