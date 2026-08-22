import React, { useState } from 'react';
import {
  DEPARTMENT_PERFORMANCE_LIST,
  FACULTY_PERFORMANCE_LIST,
} from '../data/mockData';

interface ExecutiveOverviewProps {
  onOpenExportReportModal: () => void;
  onOpenDeepFilterModal: () => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  onOpenExportReportModal,
  onOpenDeepFilterModal,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All Faculties');

  const distribution = [
    { label: '1st Class', value: '18%', height: '42%' },
    { label: '2:1', value: '42%', height: '90%' },
    { label: '2:2', value: '25%', height: '58%' },
    { label: '3rd Class', value: '10%', height: '24%' },
    { label: 'Fail/W', value: '5%', height: '12%', isAlert: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Faculty Executive Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Macro-level performance distribution across all academic departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="exec-export-report-btn"
            onClick={onOpenExportReportModal}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">download</span>
            Export Report
          </button>
          <button
            id="exec-deep-filter-btn"
            onClick={onOpenDeepFilterModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Deep Filter
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Macro Distribution Chart (Spans 8 cols on desktop) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 md:col-span-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Institutional Classification Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Current Academic Year (YTD)</p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">
              bar_chart
            </span>
          </div>

          <div className="h-60 w-full flex items-end justify-around border-b border-slate-100 dark:border-slate-800 pb-8 relative px-2">
            {distribution.map((bar, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-end h-full w-[15%] relative group"
              >
                {/* Floating tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs px-2 py-0.5 rounded shadow-sm">
                  {bar.value}
                </div>

                {/* Fill bar */}
                <div
                  className="w-full rounded-t transition-all duration-700 ease-out"
                  style={{
                    height: bar.height,
                    background: bar.isAlert
                      ? 'linear-gradient(180deg, #f43f5e 0%, #ffe4e6 100%)'
                      : 'linear-gradient(180deg, #059669 0%, #d1fae5 100%)',
                  }}
                />

                {/* Bottom Label */}
                <span className="absolute -bottom-6 text-xs text-slate-600 dark:text-slate-400 font-medium text-center w-full whitespace-nowrap">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Cards (Spans 4 cols on desktop) */}
        <div className="md:col-span-4 flex flex-col gap-5">
          {/* KPI 1: Total Enrollment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex-1 flex flex-col justify-center relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Total Enrollment
            </h4>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                14,250
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              Across 8 Accredited Academic Faculties
            </p>
          </div>

          {/* KPI 2: Retention Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex-1 flex flex-col justify-center relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Retention Rate
            </h4>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                92.8%
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 0.5%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              Institutional Benchmark: 90.0% Target
            </p>
          </div>
        </div>

        {/* Data Table: Faculty Performance Breakdown (Spans 12 cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl md:col-span-12 overflow-hidden shadow-xs">
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Faculty Performance Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Variance Against NUC Accreditation Thresholds</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Faculty / Department
                  </th>
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dean
                  </th>
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target Variance
                  </th>
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                {FACULTY_PERFORMANCE_LIST.map((fac, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg ${fac.bgColor} flex items-center justify-center ${fac.textColor} border border-slate-200 dark:border-slate-700`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{fac.icon}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{fac.faculty}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {fac.studentCount.toLocaleString()} Students
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{fac.dean}</td>
                    <td
                      className={`p-4 font-mono font-bold ${
                        fac.isPositiveVariance ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {fac.targetVariance}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          fac.status === 'Exceeding'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : fac.status === 'On Track'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {fac.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Table: Faculty Departmental Performance (Spans 12 cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl md:col-span-12 overflow-hidden shadow-xs">
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Faculty Departmental Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Departmental Cumulative GPA Indicators</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Department
                  </th>
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Head of Department (HOD)
                  </th>
                  <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Avg. CGPA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                {DEPARTMENT_PERFORMANCE_LIST.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{dept.department}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{dept.hod}</td>
                    <td className="p-4 text-right">
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm">
                        {dept.avgCgpa.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
