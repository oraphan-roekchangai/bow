'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ViewMode = 'days' | 'months' | 'years';

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const ref = useRef<HTMLDivElement>(null);

  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.getMonth();
  });
  // Year range for year picker (shows 12 years at a time)
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return Math.floor(d.getFullYear() / 12) * 12;
  });

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setYearRangeStart(Math.floor(d.getFullYear() / 12) * 12);
      }
    }
  }, [value]);

  // Reset view mode when opening
  useEffect(() => {
    if (open) { setViewMode('days'); }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) { document.addEventListener('mousedown', handler); }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Day view helpers ──
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  const selectDate = (cell: typeof cells[0]) => {
    const mm = String(cell.month + 1).padStart(2, '0');
    const dd = String(cell.day).padStart(2, '0');
    onChange(`${cell.year}-${mm}-${dd}`);
    setOpen(false);
  };

  const selectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setViewMode('days');
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setYearRangeStart(Math.floor(year / 12) * 12);
    setViewMode('months');
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setYearRangeStart(Math.floor(now.getFullYear() / 12) * 12);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    onChange(`${now.getFullYear()}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (cell: typeof cells[0]) => {
    if (!selectedDate) { return false; }
    return selectedDate.getFullYear() === cell.year && selectedDate.getMonth() === cell.month && selectedDate.getDate() === cell.day;
  };

  const isToday = (cell: typeof cells[0]) => {
    return today.getFullYear() === cell.year && today.getMonth() === cell.month && today.getDate() === cell.day;
  };

  const displayValue = value
    ? (() => {
        const d = new Date(value + 'T00:00:00');
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      })()
    : 'Select date';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg transition-colors focus:outline-none ${open ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
      >
        {label && <span className="text-sm font-medium text-gray-500">{label}</span>}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">{displayValue}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[300px]">

          {/* ── DAYS VIEW ── */}
          {viewMode === 'days' && (
            <>
              {/* Month/Year navigation */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button type="button" onClick={() => setViewMode('months')}
                  className="text-sm font-bold text-gray-800 hover:text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                  {MONTHS[viewMonth]} {viewYear}
                </button>
                <button onClick={nextMonth} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const selected = isSelected(cell);
                  const todayCell = isToday(cell);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDate(cell)}
                      className={`
                        h-9 w-full flex items-center justify-center text-xs font-medium rounded-lg transition-all
                        ${!cell.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${selected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${todayCell && !selected ? 'border-2 border-blue-500 text-blue-700 font-bold' : ''}
                        ${!selected && cell.isCurrentMonth ? 'hover:bg-blue-100' : ''}
                        ${!selected && !cell.isCurrentMonth ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── MONTHS VIEW ── */}
          {viewMode === 'months' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setViewYear(y => y - 1)} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button type="button" onClick={() => setViewMode('years')}
                  className="text-sm font-bold text-gray-800 hover:text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                  {viewYear}
                </button>
                <button onClick={() => setViewYear(y => y + 1)} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((m, i) => {
                  const isCurrentMonth = viewYear === today.getFullYear() && i === today.getMonth();
                  const isSelectedMonth = selectedDate && viewYear === selectedDate.getFullYear() && i === selectedDate.getMonth();
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMonth(i)}
                      className={`
                        py-2.5 text-xs font-semibold rounded-lg transition-all
                        ${isSelectedMonth ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${isCurrentMonth && !isSelectedMonth ? 'border-2 border-blue-500 text-blue-700' : ''}
                        ${!isSelectedMonth && !isCurrentMonth ? 'text-gray-700 hover:bg-blue-100' : ''}
                      `}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── YEARS VIEW ── */}
          {viewMode === 'years' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setYearRangeStart(y => y - 12)} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-gray-800">
                  {yearRangeStart} – {yearRangeStart + 11}
                </span>
                <button onClick={() => setYearRangeStart(y => y + 12)} type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => {
                  const isCurrentYear = year === today.getFullYear();
                  const isSelectedYear = selectedDate && year === selectedDate.getFullYear();
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => selectYear(year)}
                      className={`
                        py-2.5 text-xs font-semibold rounded-lg transition-all
                        ${isSelectedYear ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${isCurrentYear && !isSelectedYear ? 'border-2 border-blue-500 text-blue-700' : ''}
                        ${!isSelectedYear && !isCurrentYear ? 'text-gray-700 hover:bg-blue-100' : ''}
                      `}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => { if (viewMode === 'days') { setOpen(false); } else if (viewMode === 'months') { setViewMode('days'); } else { setViewMode('months'); } }} type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              {viewMode === 'days' ? 'Close' : 'Back'}
            </button>
            <button onClick={goToday} type="button"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
