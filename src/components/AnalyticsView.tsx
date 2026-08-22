import React, { useState } from 'react';

export const AnalyticsView: React.FC = () => {
  // GPA Target Calculator state
  const [currentCgpa, setCurrentCgpa] = useState<number>(3.82);
  const [completedUnits, setCompletedUnits] = useState<number>(112);
  const [targetCgpa, setTargetCgpa] = useState<number>(4.5);
  const [remainingUnits, setRemainingUnits] = useState<number>(28);

  // Required GPA calculation
  const totalTargetPoints = targetCgpa * (completedUnits + remainingUnits);
  const currentPoints = currentCgpa * completedUnits;
  const neededPoints = totalTargetPoints - currentPoints;
  const requiredGpa = remainingUnits > 0 ? neededPoints / remainingUnits : 0;
  const isPossible = requiredGpa <= 5.0 && requiredGpa >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Academic Analytics &amp; Projections
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Predictive performance modeling, cohort benchmarking, and target analysis.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Target Projector (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 md:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                calculate
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Cumulative GPA Target Calculator
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Simulate required semester GPAs needed to achieve desired honors degree classification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current CGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={currentCgpa}
                  onChange={(e) => setCurrentCgpa(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Units Completed
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={completedUnits}
                  onChange={(e) => setCompletedUnits(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target CGPA
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-mono"
                  />
                  <button
                    onClick={() => setTargetCgpa(4.5)}
                    className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold whitespace-nowrap hover:bg-emerald-100 transition-colors"
                  >
                    1st Class
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remaining Units
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={remainingUnits}
                  onChange={(e) => setRemainingUnits(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Calculator Output */}
          <div
            className={`p-4 rounded-xl border ${
              isPossible
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  Required GPA per Remaining Unit
                </span>
                <div className={`text-3xl font-bold font-mono mt-1 ${isPossible ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {isPossible ? requiredGpa.toFixed(2) : 'Exceeds 5.00 Maximum'}
                </div>
              </div>
              <div
                className={`p-3 rounded-full ${
                  isPossible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {isPossible ? 'verified' : 'cancel'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-2">
              {isPossible
                ? `Maintain an average of ${requiredGpa.toFixed(2)} across your final ${remainingUnits} credit units to graduate with a ${targetCgpa.toFixed(2)} CGPA.`
                : `Achieving ${targetCgpa.toFixed(2)} requires a mathematically unfeasible GPA score. Consider setting a target of ${(
                    (currentPoints + 5.0 * remainingUnits) /
                    (completedUnits + remainingUnits)
                  ).toFixed(2)}.`}
            </p>
          </div>
        </div>

        {/* Right Column: Historical Trends & Risk Heatmap (Spans 6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cohort Progression */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                  trending_up
                </span>
                Cohort GPA Progression Trajectory
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold font-mono">100L - 400L</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                  <span>Year 1 (100L) - Foundation</span>
                  <span className="text-slate-900 font-mono font-bold">3.65 GPA</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-300 rounded-full" style={{ width: '73%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                  <span>Year 2 (200L) - Intermediate Core</span>
                  <span className="text-slate-900 font-mono font-bold">3.74 GPA</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                  <span>Year 3 (300L) - Advanced Specialization</span>
                  <span className="text-emerald-700 font-mono font-bold">3.82 GPA (Current)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: '76.4%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Risk Factors Identified by Early Warning */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">
                  security
                </span>
                Institutional Risk Factors
              </h3>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">
                Audit Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900">Mathematical Prereqs</div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  MTH301 Discrete Maths has the highest correlation with overall 300L drops.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900">Attendance Drop-offs</div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Absence in &gt;3 lab sessions flags high probability of course retake.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
