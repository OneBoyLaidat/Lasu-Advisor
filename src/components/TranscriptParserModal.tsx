import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CourseResult } from '../types';
import {
  ParsedTranscriptData,
  ParsedTranscriptCourse,
  calculateGradeAndPoints,
  getDegreeClass,
  parseTranscriptText,
  extractTextFromFile,
} from '../lib/ocrTranscriptParser';

interface TranscriptParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptParsed: (
    courses: CourseResult[],
    cgpa: number,
    totalUnits: number,
    passedUnits: number,
    carryoverUnits: number,
    fileName: string
  ) => void;
}

export const TranscriptParserModal: React.FC<TranscriptParserModalProps> = ({
  isOpen,
  onClose,
  onTranscriptParsed,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedTranscriptData | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'extracted'>('upload');
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setIsScanning(true);
    setValidationError(null);
    setScanStep('Initializing Optical Character Recognition on uploaded document...');

    setTimeout(() => {
      setScanStep('Analyzing document structure and extracting text streams...');
    }, 500);

    setTimeout(() => {
      setScanStep('Extracting course codes, unit values, and official scores...');
    }, 1100);

    // Extract actual file text
    const extractedText = await extractTextFromFile(file);

    setTimeout(() => {
      setIsScanning(false);
      // Strictly parse only text present in the document
      const result = parseTranscriptText(extractedText, file.name);
      setParsedData(result);
      setActiveTab('extracted');

      if (result.courses.length > 0 && !result.hasMissingFields) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (err) {
          // ignore
        }
      }
    }, 1700);
  };

  const handleAddCourseManually = () => {
    if (!parsedData) {
      const initialData: ParsedTranscriptData = {
        courses: [],
        totalUnits: 0,
        passedUnits: 0,
        carryoverUnits: 0,
        totalGradePoints: 0,
        gpa: 0,
        cgpa: 0,
        degreeClass: 'Pending Complete Data Entry',
        fileName: uploadedFileName || 'Manual_Entry_Transcript.pdf',
        hasMissingFields: true,
        missingFieldCount: 3,
        ocrConfidence: 'low',
        extractionMessage: 'Manual grade record entry mode.',
      };
      setParsedData(initialData);
    }

    const newCourse: ParsedTranscriptCourse = {
      code: '',
      title: '',
      units: 3,
      grade: '-',
      score: '',
      status: 'In Progress',
      semester: 'Fall 2024',
      academicYear: '2024/2025',
      gpPoints: 0,
      isMissingCode: true,
      isMissingScore: true,
      isMissingUnits: false,
      isManuallyAdded: true,
    };

    setParsedData((prev) => {
      if (!prev) return null;
      const updated = [newCourse, ...prev.courses];
      return recalculateData(updated, prev.fileName);
    });
    setValidationError(null);
  };

  const handleDeleteCourse = (index: number) => {
    if (!parsedData) return;
    const updated = parsedData.courses.filter((_, idx) => idx !== index);
    setParsedData(recalculateData(updated, parsedData.fileName));
    setValidationError(null);
  };

  const handleUpdateCourse = (index: number, field: keyof ParsedTranscriptCourse, value: any) => {
    if (!parsedData) return;
    const updatedCourses = [...parsedData.courses];
    const current = { ...updatedCourses[index], [field]: value };

    if (field === 'code') {
      current.code = String(value).toUpperCase();
      current.isMissingCode = !current.code.trim();
    } else if (field === 'title') {
      current.title = String(value);
      current.isMissingTitle = false;
    } else if (field === 'units') {
      const numUnits = Number(value);
      current.units = isNaN(numUnits) ? 0 : Math.max(0, Math.min(6, numUnits));
      current.isMissingUnits = current.units <= 0;
    } else if (field === 'score') {
      if (value === '') {
        current.score = '';
        current.grade = '-';
        current.status = 'In Progress';
        current.gpPoints = 0;
        current.isMissingScore = true;
      } else {
        const numScore = Number(value);
        const validScore = isNaN(numScore) ? 0 : Math.max(0, Math.min(100, numScore));
        current.score = validScore;
        const { grade, gp, status } = calculateGradeAndPoints(validScore);
        current.grade = grade;
        current.status = status;
        current.gpPoints = current.units * gp;
        current.isMissingScore = false;
      }
    }

    if (!current.isMissingScore && typeof current.score === 'number' && current.units > 0) {
      const { grade, gp, status } = calculateGradeAndPoints(current.score);
      current.grade = grade;
      current.status = status;
      current.gpPoints = current.units * gp;
    }

    updatedCourses[index] = current;
    setParsedData(recalculateData(updatedCourses, parsedData.fileName));
    setValidationError(null);
  };

  const recalculateData = (courses: ParsedTranscriptCourse[], fileName?: string): ParsedTranscriptData => {
    let missingCount = 0;
    courses.forEach((c) => {
      if (!c.code.trim()) missingCount++;
      if (c.units <= 0) missingCount++;
      if (c.score === '' || c.grade === '-') missingCount++;
    });

    const validCourses = courses.filter((c) => c.code.trim() && c.units > 0 && c.score !== '' && c.grade !== '-');
    const totalUnits = validCourses.reduce((acc, c) => acc + c.units, 0);
    const passedUnits = validCourses.filter((c) => c.status === 'Passed').reduce((acc, c) => acc + c.units, 0);
    const carryoverUnits = totalUnits - passedUnits;
    const totalGradePoints = validCourses.reduce((acc, c) => acc + c.gpPoints, 0);
    const gpa = totalUnits > 0 ? parseFloat((totalGradePoints / totalUnits).toFixed(2)) : 0;

    return {
      courses,
      totalUnits,
      passedUnits,
      carryoverUnits,
      totalGradePoints,
      gpa,
      cgpa: gpa,
      degreeClass: totalUnits > 0 ? getDegreeClass(gpa) : 'Pending Complete Data Entry',
      fileName: fileName || uploadedFileName,
      hasMissingFields: missingCount > 0 || courses.length === 0,
      missingFieldCount: missingCount,
      ocrConfidence: missingCount === 0 && courses.length > 0 ? 'high' : 'partial',
      extractionMessage:
        missingCount > 0
          ? `${missingCount} field(s) require manual user input.`
          : 'All course records complete and verified.',
    };
  };

  const handleApplyToProfile = () => {
    if (!parsedData) return;

    if (parsedData.courses.length === 0) {
      setValidationError('Please add at least one course record before saving.');
      return;
    }

    // Check for incomplete courses
    const invalidItems = parsedData.courses.filter(
      (c) => !c.code.trim() || c.units <= 0 || c.score === '' || c.grade === '-'
    );

    if (invalidItems.length > 0) {
      setValidationError(
        `Incomplete Course Records: ${invalidItems.length} course(s) have missing Course Codes, Units, or Scores. Please fill in the highlighted missing fields before saving.`
      );
      return;
    }

    const cleanCourses: CourseResult[] = parsedData.courses.map((c) => ({
      code: c.code.trim().toUpperCase(),
      title: c.title.trim() || `${c.code.trim().toUpperCase()} Course Unit`,
      units: c.units,
      grade: c.grade,
      score: c.score,
      status: c.status,
      semester: c.semester,
      academicYear: c.academicYear,
      gpPoints: c.gpPoints,
    }));

    onTranscriptParsed(
      cleanCourses,
      parsedData.cgpa,
      parsedData.totalUnits,
      parsedData.passedUnits,
      parsedData.carryoverUnits,
      parsedData.fileName || uploadedFileName || 'LASU_Transcript_OCR.pdf'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">document_scanner</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Official Transcript &amp; Result Slip OCR Scanner
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct extraction from uploaded document. Missing or unreadable data prompts manual entry.
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

        {/* Modal Navigation Tabs (if data parsed) */}
        {parsedData && !isScanning && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 gap-4 shrink-0 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('extracted')}
              className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'extracted'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              Extracted Results ({parsedData.courses.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upload</span>
              Upload Different File
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Scanning In Progress State */}
          {isScanning && (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/30 flex items-center justify-center shadow-inner relative overflow-hidden">
                  <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400 animate-pulse">
                    picture_as_pdf
                  </span>
                  {/* Laser scan animation line */}
                  <div className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] animate-spin">refresh</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Scanning Document with OCR Engine
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 animate-pulse">
                  {scanStep}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Strictly extracting character sequences and grade points from {uploadedFileName}
                </p>
              </div>
            </div>
          )}

          {/* Upload Tab State */}
          {!isScanning && activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {/* Drag & drop upload box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">upload_file</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Select or Drag &amp; Drop LASU Transcript PDF / Image
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  Upload your genuine PDF transcript or portal result screenshot (.PDF, .PNG, .JPG, .TXT).
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">search</span>
                  Browse Computer Files
                </div>
              </div>

              {/* Strict OCR Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                  fact_check
                </span>
                <div className="leading-relaxed">
                  <span className="font-bold block text-slate-900 dark:text-slate-100 mb-0.5">
                    Strict Document Extraction Guarantee
                  </span>
                  Data is extracted exclusively from the text and tables detected in your uploaded file. No synthetic or placeholder grades will be generated. If document sections are unreadable, you can enter missing courses manually.
                </div>
              </div>
            </div>
          )}

          {/* Extracted Course Results Review Tab */}
          {!isScanning && parsedData && activeTab === 'extracted' && (
            <div className="space-y-4">
              {/* Validation / Missing data warning banner */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
                    error
                  </span>
                  <div className="leading-snug">
                    <span className="font-bold block mb-0.5">Action Required</span>
                    {validationError}
                  </div>
                </div>
              )}

              {/* Missing data prompt banner if OCR could not read everything */}
              {parsedData.hasMissingFields && !validationError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="leading-snug">
                    <span className="font-bold block mb-0.5">Manual Input Needed</span>
                    {parsedData.courses.length === 0
                      ? 'No legible course records could be detected from this document. Please click "+ Add Course Record" below to manually input your grades.'
                      : 'Some fields (Course Code, Units, or Score) could not be clearly resolved from the document. Please input the missing values in the highlighted fields below before saving.'}
                  </div>
                </div>
              )}

              {/* Top OCR Extraction Summary Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                      fact_check
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Document Extraction Summary
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                      {parsedData.courses.length} Record(s)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    File: <span className="font-semibold font-mono">{parsedData.fileName}</span> • Standing:{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{parsedData.degreeClass}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Calculated CGPA
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {parsedData.totalUnits > 0 ? parsedData.cgpa.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Passed Units
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                      {parsedData.passedUnits} / {parsedData.totalUnits}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table actions bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Course Results ({parsedData.courses.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddCourseManually}
                  className="bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Add Course Manually
                </button>
              </div>

              {/* Editable Results Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[580px]">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Course Code</th>
                        <th className="py-2.5 px-3 font-semibold">Course Title</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Units</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Grade</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Points</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {parsedData.courses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                            <span className="material-symbols-outlined text-3xl block mb-1">
                              table_rows_narrow
                            </span>
                            No course records extracted. Click &quot;Add Course Manually&quot; above to enter your grades.
                          </td>
                        </tr>
                      ) : (
                        parsedData.courses.map((course, idx) => {
                          const hasMissingCode = !course.code.trim();
                          const hasMissingUnits = course.units <= 0;
                          const hasMissingScore = course.score === '' || course.grade === '-';

                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                                hasMissingCode || hasMissingUnits || hasMissingScore
                                  ? 'bg-amber-50/30 dark:bg-amber-950/10'
                                  : ''
                              }`}
                            >
                              {/* Course Code */}
                              <td className="py-2 px-3 font-bold">
                                <input
                                  type="text"
                                  value={course.code}
                                  onChange={(e) => handleUpdateCourse(idx, 'code', e.target.value)}
                                  placeholder="e.g. CSC301"
                                  className={`border rounded px-1.5 py-1 text-xs font-mono font-bold w-24 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                    hasMissingCode
                                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400'
                                  }`}
                                />
                              </td>

                              {/* Course Title */}
                              <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-medium">
                                <input
                                  type="text"
                                  value={course.title}
                                  onChange={(e) => handleUpdateCourse(idx, 'title', e.target.value)}
                                  placeholder="Course Title (Optional)"
                                  className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                                />
                              </td>

                              {/* Units */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max="6"
                                  value={course.units || ''}
                                  onChange={(e) => handleUpdateCourse(idx, 'units', e.target.value)}
                                  placeholder="Units"
                                  className={`w-14 text-center border rounded px-1 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                    hasMissingUnits
                                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  }`}
                                />
                              </td>

                              {/* Score */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={course.score}
                                  onChange={(e) => handleUpdateCourse(idx, 'score', e.target.value)}
                                  placeholder="0-100"
                                  className={`w-16 text-center border rounded px-1 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                    hasMissingScore
                                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  }`}
                                />
                              </td>

                              {/* Grade */}
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                                    course.grade === 'A'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : course.grade === 'B'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                      : course.grade === 'C'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : course.grade === '-'
                                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {course.grade}
                                </span>
                              </td>

                              {/* Quality Points */}
                              <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400 font-semibold">
                                {course.gpPoints} QP
                              </td>

                              {/* Action: Delete row */}
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCourse(idx)}
                                  title="Delete Course Record"
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
            LASU NUC 5.0 Grade Point Scale
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {parsedData && (
              <button
                id="apply-transcript-results-btn"
                onClick={handleApplyToProfile}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
                Save &amp; Populate Student Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
