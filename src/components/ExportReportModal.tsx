import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  title = 'Official Academic Audit Report',
}) => {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const [includeAdvisers, setIncludeAdvisers] = useState(true);
  const [includeAtRisk, setIncludeAtRisk] = useState(true);
  const [includeNucMetrics, setIncludeNucMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // ignore
      }

      // Generate downloadable client data file
      const content = `LASU ADVISOR - ACADEMIC AUDIT REPORT\nGenerated: ${new Date().toLocaleString()}\nFormat: ${format.toUpperCase()}\n\n-- Metrics Summary --\nTotal Enrollment: 14,250\nRetention Rate: 92.8%\nComputer Science Avg CGPA: 3.72\nAt-Risk Flagged Students: 3\nAccreditation Compliance: 98.4%\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LASU_Academic_Report_${Date.now()}.${format === 'pdf' ? 'txt' : format}`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    }, 1000);
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
              file_download
            </span>
            <h3 className="text-base font-bold text-slate-900">Export Academic Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`py-2 rounded-lg font-semibold flex flex-col items-center gap-1 border transition-all ${
                  format === 'pdf'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-600">picture_as_pdf</span>
                PDF Report
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-2 rounded-lg font-semibold flex flex-col items-center gap-1 border transition-all ${
                  format === 'csv'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-600">csv</span>
                CSV Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`py-2 rounded-lg font-semibold flex flex-col items-center gap-1 border transition-all ${
                  format === 'xlsx'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-600">table_view</span>
                Excel Workbook
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1">Include Modules</label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={includeAdvisers}
                onChange={(e) => setIncludeAdvisers(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Adviser Matrix &amp; Student Load Balance</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={includeAtRisk}
                onChange={(e) => setIncludeAtRisk(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Early Warning At-Risk Student Registry</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={includeNucMetrics}
                onChange={(e) => setIncludeNucMetrics(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>NUC 5.0 Accreditation Benchmark Tables</span>
            </label>
          </div>

          <div className="pt-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Generate &amp; Download {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
