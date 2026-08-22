import React, { useState } from 'react';
import { Appointment } from '../types';
import confetti from 'canvas-confetti';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (appointment: Appointment) => void;
  studentName: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirmBooking,
  studentName,
}) => {
  const [date, setDate] = useState('2026-08-25');
  const [time, setTime] = useState('11:00 AM');
  const [topic, setTopic] = useState('Course Selection & Capstone Guidance');
  const [format, setFormat] = useState<'In-person' | 'Virtual (Google Meet)' | 'Phone Call'>('In-person');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      studentId: 'usr_student_01',
      studentName: studentName,
      adviserName: 'Dr. Sarah Jenkins',
      date,
      time,
      topic,
      format,
      status: 'Confirmed',
      notes,
    };
    onConfirmBooking(newAppointment);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      // ignore
    }

    onClose();
  };

  const timeSlots = ['09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:15 PM'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">
              calendar_month
            </span>
            <h3 className="text-base font-bold text-slate-900">Book Advising Slot</h3>
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
            <label className="block font-semibold text-slate-700 mb-1">Adviser</label>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium flex items-center justify-between">
              <span>Dr. Sarah Jenkins (300L Adviser)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Available
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Session Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="In-person">In-person (Room 304)</option>
                <option value="Virtual (Google Meet)">Virtual (Google Meet)</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Available Time Slot</label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setTime(slot)}
                  className={`py-1.5 rounded-lg text-center font-mono font-medium transition-all text-xs ${
                    time === slot
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Consultation Topic</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Course waiver, CGPA Target, Capstone"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for adviser..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 resize-none focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
