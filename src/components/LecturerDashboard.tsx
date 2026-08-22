import React, { useState } from 'react';
import { Advisee, AgendaItem } from '../types';

interface LecturerDashboardProps {
  advisees: Advisee[];
  agendaItems: AgendaItem[];
  onOpenIntervention: (studentName?: string) => void;
  onOpenEmailModal: (targetStudents?: string[]) => void;
  onViewStudentDetails: (advisee: Advisee) => void;
  onToggleAgendaReminder: (id: string) => void;
  onAddAgendaItem: () => void;
  onNudgeStudent: (adviseeId: string, studentName: string) => void;
  onNudgeAllMissing: (missingCount: number) => void;
  onViewStudentTranscript?: (advisee: Advisee) => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  advisees,
  agendaItems,
  onOpenIntervention,
  onOpenEmailModal,
  onViewStudentDetails,
  onToggleAgendaReminder,
  onAddAgendaItem,
  onNudgeStudent,
  onNudgeAllMissing,
  onViewStudentTranscript,
}) => {
  const [filterRoster, setFilterRoster] = useState<string>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [complianceTab, setComplianceTab] = useState<'all' | 'uploaded' | 'missing'>('all');

  const strugglingStudents = advisees.filter((a) => a.status === 'At Risk');
  const uploadedCount = advisees.filter((a) => a.hasUploadedResult).length;
  const missingAdvisees = advisees.filter((a) => !a.hasUploadedResult);
  const complianceRate = Math.round((uploadedCount / Math.max(advisees.length, 1)) * 100);

  const filteredAdvisees = advisees.filter((a) => {
    // Check compliance tab filter
    if (complianceTab === 'uploaded' && !a.hasUploadedResult) return false;
    if (complianceTab === 'missing' && a.hasUploadedResult) return false;

    // Check status dropdown filter
    const matchesFilter = filterRoster === 'all' || a.status.toLowerCase() === filterRoster.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      a.matricNo.toLowerCase().includes(rosterSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Student Oversight &amp; Advising
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Level Adviser Dashboard • Level 300 Computer Science • Semester Result Audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {missingAdvisees.length > 0 && (
            <button
              id="nudge-all-missing-btn"
              onClick={() => onNudgeAllMissing(missingAdvisees.length)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Nudge All Missing ({missingAdvisees.length})
            </button>
          )}
        </div>
      </div>

      {/* Result Upload Compliance & Early Warning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Transcript Upload Compliance Tracker (Spans 7 cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:col-span-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Result &amp; Transcript Upload Compliance
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Audit of student OCR submissions for current academic session
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  complianceRate >= 70
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {complianceRate}% Compliance
              </span>
            </div>

            {/* Compliance Progress Bar */}
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {uploadedCount} Uploaded &amp; OCR Scanned
                </span>
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {missingAdvisees.length} Pending / Missing
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${complianceRate}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${100 - complianceRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComplianceTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  complianceTab === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Advisees ({advisees.length})
              </button>
              <button
                onClick={() => setComplianceTab('uploaded')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  complianceTab === 'uploaded'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                Uploaded ({uploadedCount})
              </button>
              <button
                onClick={() => setComplianceTab('missing')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  complianceTab === 'missing'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
              >
                Missing ({missingAdvisees.length})
              </button>
            </div>

            {missingAdvisees.length > 0 && (
              <button
                onClick={() => onNudgeAllMissing(missingAdvisees.length)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 hover:underline underline-offset-4"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                Nudge All Missing Students
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Early Warning Banner (Spans 5 cols) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-5 lg:col-span-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px]">warning</span>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">Early Warning System</h3>
              </div>
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                {strugglingStudents.length} At-Risk
              </span>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Students flagged with CGPA &lt; 2.50 or carryover deficiencies. Scheduled intervention
              recommended prior to end-of-semester board review.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2">
            <button
              onClick={() => onOpenEmailModal(strugglingStudents.map((s) => s.name))}
              className="flex-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-950 dark:text-amber-200 py-1.5 px-3 rounded-lg hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">mail</span>
              Email At-Risk
            </button>
            <button
              onClick={() => onOpenIntervention()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              Intervene
            </button>
          </div>
        </div>
      </div>

      {/* Hero Metrics Grid: 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Metric 1: Advisee Average CGPA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Advisee Average CGPA
            </h4>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-[34px] font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight">
                3.12
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center mb-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                +0.15 vs Dept
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              Cohort: 142 Active Advisees
            </p>
          </div>
        </div>

        {/* Metric 2: Verified Result Slips */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Result Slips
            </h4>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">verified</span>
            </div>
          </div>
          <div>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-[34px] font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight">
                {uploadedCount}
              </span>
              <span className="text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center mb-1 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {complianceRate}% of cohort
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              {missingAdvisees.length} Pending upload submissions
            </p>
          </div>
        </div>

        {/* Metric 3: Academic Standing Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Academic Standing
            </h4>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">142 Students</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Good Standing (&gt;3.0)</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">65%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">At-Risk / Remedial (&lt;2.5)</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold">35%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Today's Agenda & Advisee Roster with Result Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Agenda Widget (Spans 4 cols on lg) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 col-span-1 lg:col-span-4 flex flex-col min-h-[420px] shadow-xs">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">event</span>
              Today&apos;s Agenda
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Oct 24, 2024</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {agendaItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                  item.isUrgent
                    ? 'border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h5>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      item.isUrgent
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {item.time}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{item.description}</p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex -space-x-1.5 items-center">
                    {item.studentAvatar ? (
                      <img
                        src={item.studentAvatar}
                        alt="student"
                        className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      />
                    ) : (
                      item.attendees.map((att, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-700 dark:text-slate-300 font-bold"
                        >
                          {att}
                        </div>
                      ))
                    )}
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.reminder}
                      onChange={() => onToggleAgendaReminder(item.id)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-3.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 relative" />
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                      Reminder
                    </span>
                  </label>
                </div>
              </div>
            ))}

            {/* Quick Add Agenda Button */}
            <button
              id="add-agenda-btn"
              onClick={onAddAgendaItem}
              className="w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">add_circle</span>
              Schedule Advising Session
            </button>
          </div>
        </div>

        {/* Advisee Roster with Result Upload Status & Nudge Action (Spans 8 cols on lg) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 col-span-1 lg:col-span-8 flex flex-col min-h-[420px] shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Advisee Roster &amp; Result Compliance
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Level 300 Computer Science • {filteredAdvisees.length} matching students
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search student / matric..."
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 w-full sm:w-36 focus:w-44 focus:border-emerald-600 focus:outline-none transition-all shadow-2xs"
              />
              <select
                value={filterRoster}
                onChange={(e) => setFilterRoster(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 shadow-2xs font-medium"
              >
                <option value="all">All Standings</option>
                <option value="good standing">Good Standing</option>
                <option value="at risk">At Risk</option>
                <option value="average">Average</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Matric No.</th>
                  <th className="py-2.5 px-3 font-semibold text-center">CGPA</th>
                  <th className="py-2.5 px-3 font-semibold">Result Upload</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Adviser Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                {filteredAdvisees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No students found for current filter.
                    </td>
                  </tr>
                ) : (
                  filteredAdvisees.map((advisee) => (
                    <tr
                      key={advisee.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        advisee.status === 'At Risk' ? 'bg-amber-50/20 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        {advisee.avatarUrl ? (
                          <img
                            src={advisee.avatarUrl}
                            alt={advisee.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            {advisee.initials}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">{advisee.name}</span>
                          <span className="text-[10px] text-slate-400">{advisee.level}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {advisee.matricNo}
                      </td>

                      <td
                        className={`py-3 px-3 text-center font-bold font-mono ${
                          advisee.cgpa >= 3.5
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : advisee.cgpa < 2.5
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {advisee.cgpa.toFixed(2)}
                      </td>

                      {/* Result Upload Status Badge */}
                      <td className="py-3 px-3">
                        {advisee.hasUploadedResult ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600 dark:text-emerald-400">
                                check_circle
                              </span>
                              Uploaded
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {advisee.resultUploadedDate || 'Verified'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                              <span className="material-symbols-outlined text-[14px] text-amber-600 dark:text-amber-400">
                                pending
                              </span>
                              Missing PDF
                            </span>
                            {advisee.lastNudgedAt && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                Nudged {advisee.lastNudgedAt}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action buttons (Nudge or View) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!advisee.hasUploadedResult ? (
                            <button
                              id={`nudge-student-${advisee.id}`}
                              onClick={() => onNudgeStudent(advisee.id, advisee.name)}
                              className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                              title="Send Official Result Slip Reminder"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                notifications_active
                              </span>
                              Nudge
                            </button>
                          ) : (
                            <button
                              onClick={() => onViewStudentDetails(advisee)}
                              className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="View OCR Transcript Records"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              View
                            </button>
                          )}

                          <button
                            onClick={() => onViewStudentDetails(advisee)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Full Academic Dossier"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Table: Struggling Students Intervention */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col shadow-xs">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">report_problem</span>
            Struggling Students &amp; Carryover Deficiencies
          </h4>
          <span className="text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            {strugglingStudents.length} Active Interventions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <th className="py-2.5 px-4 font-semibold">Student Name</th>
                <th className="py-2.5 px-4 font-semibold">Current CGPA</th>
                <th className="py-2.5 px-4 font-semibold">Carryover Deficiencies</th>
                <th className="py-2.5 px-4 font-semibold">Result Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {strugglingStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {s.name}
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {s.cgpa.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                    {s.carryovers} Courses {s.failedCourses ? `(${s.failedCourses.join(', ')})` : ''}
                  </td>
                  <td className="py-3 px-4">
                    {s.hasUploadedResult ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check</span> Uploaded
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">close</span> Missing PDF
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenIntervention(s.name)}
                      className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold underline underline-offset-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded transition-colors"
                    >
                      Review &amp; Intervene
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
