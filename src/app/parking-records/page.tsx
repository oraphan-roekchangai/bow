'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MaterialIcon from '@/components/MaterialIcon';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Confirmation Modal ────────────────────────────────────────────────────────
interface ConfirmModalProps {
  message: string;
  warning?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ message, warning, confirmLabel = 'OK', confirmClassName, hideCancel, onConfirm, onCancel }: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-2 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold text-lg">Dashboard</h2>
          <img src="/admin/prologic-logo.png" alt="ProLogic" className="h-8 object-contain mt-[3px]" />
        </div>
        {/* Divider with 5px gap from each side */}
        <div className="mx-[15px] border-t border-gray-200" />
        {/* Body */}
        <div className="px-8 pt-4 pb-7 space-y-2">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
          {warning && <p className="text-red-600 text-base font-semibold">{warning}</p>}
        </div>
        {/* Actions */}
        <div className="px-8 pb-7 flex justify-end gap-3">
          {!hideCancel && (
            <button ref={cancelRef} onClick={onCancel}
              className="px-7 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          <button onClick={onConfirm}
            className={confirmClassName || 'px-7 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ParkingRecord {
  id: number;
  detected_plate: string;
  entry_time: string;
  exit_time: string | null;
  parking_fee: number | null;
  payment_status: 'UNPAID' | 'PENDING' | 'PAID';
  member_status: 'vip' | 'regular' | 'non-member';
  extra_free_minutes: number;
  public_url: string | null;
}

interface ParkingRates {
  rate_per_hour: number;
  minimum_fee: number;
}

const navItems = [
  { href: '/dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'sidebar.dashboard' },
  { href: '/parking-records',  icon: 'M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z',                                                                             key: 'sidebar.parkingRecords', active: true },
  { href: '/user-management',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',                                    key: 'sidebar.userManagement' },
  { href: '/admin-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'sidebar.adminManagement' },
  { href: '/gate-controlling', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',    key: 'sidebar.gateControlling' },
];

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (entry: string, exit: string | null) => {
  const start = new Date(entry).getTime();
  const end   = exit ? new Date(exit).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return '-';
  const mins = Math.floor((end - start) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
};

function getFreeMinutes(memberStatus: string | null): number {
  if (memberStatus === 'vip' || memberStatus === 'regular') return 120;
  return 60;
}

function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b);
}

function calculateFee(checkIn: string, checkOut: string | null, rates: ParkingRates, memberStatus: string | null, extraFreeMinutes = 0): number {
  const start = new Date(checkIn).getTime();
  const end   = checkOut ? new Date(checkOut).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  const durationMinutes = Math.floor((end - start) / 60000);
  const billableMinutes = Math.max(0, durationMinutes - getFreeMinutes(memberStatus) - extraFreeMinutes);
  if (billableMinutes === 0) return 0;
  const billableHours = ceilDiv(billableMinutes, 60);
  const fee = billableHours * Number(rates.rate_per_hour);
  return Number(Math.max(fee, Number(rates.minimum_fee)).toFixed(2));
}

type SortCol = 'plate' | 'member' | 'parking' | 'payment' | 'entry' | 'exit' | 'duration' | 'fee';
type SortDir = 'asc' | 'desc';

export default function ParkingRecordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName]     = useState('Admin');
  const [adminId, setAdminId]         = useState<number | null>(null);
  const [records, setRecords]         = useState<ParkingRecord[]>([]);
  const [rates, setRates]             = useState<ParkingRates | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [searchTerm, setSearchTerm]   = useState('');
  const [now, setNow]                 = useState(Date.now());
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [freeMinInput, setFreeMinInput]   = useState<{[id: number]: string}>({});
  const [modal, setModal] = useState<{ message: string; warning?: string; confirmLabel?: string; confirmClassName?: string; hideCancel?: boolean; onConfirm: () => void } | null>(null);
  const [sortCol, setSortCol]             = useState<SortCol | null>(null);
  const [sortDir, setSortDir]             = useState<SortDir>('desc');
  const [memberSortIdx, setMemberSortIdx] = useState(0);
  const [page, setPage]                   = useState(1);
  const [totalRecords, setTotalRecords]   = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const LIMIT = 50;

  // Debounce search — wait 400ms after user stops typing before fetching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search or sort changes
  useEffect(() => { setPage(1); }, [debouncedSearch, sortCol, sortDir, memberSortIdx]); // 0=non-member first, 1=regular first, 2=vip first
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { router.replace('/login'); return; }
        const { admin = {} } = await res.json();
        setAdminName(admin.fullName || admin.username || 'Admin');
        setAdminId(admin.admin_id || admin.id || null);
      } catch { router.replace('/login'); }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
        if (debouncedSearch.trim()) params.set('plate', debouncedSearch.trim());
        if (sortCol) {
          params.set('sortCol', sortCol);
          params.set('sortDir', sortDir);
          if (sortCol === 'member') params.set('memberIdx', String(memberSortIdx));
        }
        const res  = await fetch(`/api/admin/parking?${params}`, { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to fetch parking records');
        setRecords(body.data || []);
        setTotalRecords(body.total || 0);
        setError('');
      } catch (err) {
        setError((err as Error).message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, debouncedSearch, sortCol, sortDir, memberSortIdx]);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/admin/parking-rates', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (res.ok && body.success) setRates(body.data);
      } catch { /* rates stay null */ }
    })();
  }, []);

  const handleSort = (col: SortCol) => {
    if (col === 'member') {
      // cycle: null → idx0 → idx1 → idx2 → null
      if (sortCol !== 'member') {
        setSortCol('member');
        setMemberSortIdx(0);
      } else {
        const next = (memberSortIdx + 1) % 4;
        if (next === 3) { setSortCol(null); setMemberSortIdx(0); }
        else setMemberSortIdx(next);
      }
      return;
    }
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortDir('asc');
    } else {
      setSortCol(null);
      setSortDir('desc');
    }
  };

  // Sorting is server-side — records are already sorted by the API
  const sortedRecords = records;

  const sortIcon = (col: SortCol) => {
    if (sortCol !== col) return <span className="text-gray-300 group-hover:text-gray-400">↕</span>;
    if (col === 'member') {
      const labels = ['N→R→V', 'R→V→N', 'V→N→R'];
      return <span className="text-green-600 text-[10px]">{labels[memberSortIdx]}</span>;
    }
    return <span className="text-green-600">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const setActionState = (key: string, val: boolean) =>
    setActionLoading(prev => ({ ...prev, [key]: val }));

  const handleForceExit = async (id: number) => {
    setModal({
      message: 'Force this car to exit now?',
      warning: '*** This cannot be undone. ***',
      confirmLabel: 'Force Exit',
      confirmClassName: 'px-5 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors',
      onConfirm: async () => {
        setModal(null);
        setActionState(`exit-${id}`, true);
        try {
          const res  = await fetch('/api/admin/parking/force-exit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
          setRecords(prev => prev.map(r => r.id === id ? { ...r, exit_time: new Date().toISOString() } : r));
        } catch (err) { setModal({ message: (err as Error).message || 'Failed to force exit', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: () => setModal(null) }); }
        finally { setActionState(`exit-${id}`, false); }
      },
    });
  };

  const handleAddFreeMinutes = async (id: number) => {
    const mins = parseInt(freeMinInput[id] || '');
    if (isNaN(mins) || mins <= 0) {
      setModal({
        message: 'Enter a valid number of minutes.',
        confirmLabel: 'OK',
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
        hideCancel: true,
        onConfirm: () => setModal(null),
      });
      return;
    }
    setModal({
      message: `Add ${mins} free minute${mins === 1 ? '' : 's'} to this record?`,
      confirmLabel: 'Add Minutes',
      confirmClassName: 'px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
      onConfirm: async () => {
        setModal(null);
        setActionState(`free-${id}`, true);
        try {
          const res  = await fetch('/api/admin/parking/free-minutes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, minutes: mins }) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
          setRecords(prev => prev.map(r => r.id === id ? { ...r, extra_free_minutes: data.extra_free_minutes } : r));
          setFreeMinInput(prev => ({ ...prev, [id]: '' }));
        } catch (err) { setModal({ message: (err as Error).message || 'Failed to add free minutes', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: () => setModal(null) }); }
        finally { setActionState(`free-${id}`, false); }
      },
    });
  };

  const handleDelete = async (id: number) => {
    setModal({
      message: 'Permanently delete this parking record?',
      warning: '*** This cannot be undone. ***',
      confirmLabel: 'Delete',
      confirmClassName: 'px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
      onConfirm: async () => {
        setModal(null);
        setActionState(`del-${id}`, true);
        try {
          const res  = await fetch('/api/admin/parking', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
          setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err) { setModal({ message: (err as Error).message || 'Failed to delete record', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: () => setModal(null) }); }
        finally { setActionState(`del-${id}`, false); }
      },
    });
  };

  const columns: { label: string; col: SortCol | null }[] = [
    { label: 'License Plate',    col: 'plate'    },
    { label: 'Member Status',    col: 'member'   },
    { label: 'Parking Status',   col: 'parking'  },
    { label: 'Payment Status',   col: 'payment'  },
    { label: 'Entry Time',       col: 'entry'    },
    { label: 'Exit Time',        col: 'exit'     },
    { label: 'Parking Duration', col: 'duration' },
    { label: 'Total Parking Fee',col: 'fee'      },
    { label: 'Actions',          col: null       },
  ];

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800"><img src="/admin/prologic-logo.png" alt="ProLogic" className="h-8 object-contain mt-[3px]" /></h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`flex items-center space-x-3 p-3 rounded-lg ${(item as any).active ? 'text-white bg-green-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span>{t(item.key)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="w-full h-screen flex flex-col">
        <Header adminName={adminName} adminId={adminId} showMenuButton={true} onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            <div className="p-3 flex-shrink-0 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800">Vehicle Parking Records</h2>
                <div className="flex items-center gap-3">
                  {searchTerm.trim() && (
                    <span className={`text-sm font-medium whitespace-nowrap ${totalRecords > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {totalRecords > 0 ? `${totalRecords.toLocaleString()} result${totalRecords === 1 ? '' : 's'} found` : 'No records found'}
                    </span>
                  )}
                  <div className="relative w-full max-w-lg">
                    <span className="absolute inset-y-0 left-3 flex items-center"><MaterialIcon name="search" size="small" className="text-gray-400" /></span>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="License plate search"
                      className={`w-full pl-10 pr-3 py-2 border rounded-xl text-sm text-gray-900 caret-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                        !searchTerm.trim() ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : totalRecords > 0  ? 'border-green-400 ring-1 ring-green-400'
                        : 'border-red-400 ring-1 ring-red-400'
                      }`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="text-gray-600">{t('common.loading')}</div></div>
              ) : error ? (
                <div className="h-full flex items-center justify-center"><div className="text-red-600 font-medium">{error}</div></div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr>
                      {columns.map(({ label, col }) => (
                        <th key={label} className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300 last:border-r-0">
                          {col ? (
                            <button onClick={() => handleSort(col)} className="flex items-center gap-1 hover:text-green-600 transition-colors group whitespace-nowrap">
                              {label}
                              <span className="text-xs">{sortIcon(col)}</span>
                            </button>
                          ) : label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.length > 0 ? sortedRecords.map((record) => {
                      const isExited        = Boolean(record.exit_time);
                      const memberStatus    = record.member_status || 'non-member';
                      const extraMins       = record.extra_free_minutes || 0;
                      const isExitLoading   = !!actionLoading[`exit-${record.id}`];
                      const isFreeLoading   = !!actionLoading[`free-${record.id}`];
                      const isDeleteLoading = !!actionLoading[`del-${record.id}`];

                      let displayFee: string;
                      if (record.parking_fee != null && record.payment_status === 'PAID') {
                        displayFee = `฿${Number(record.parking_fee).toFixed(2)}`;
                      } else if (rates) {
                        const liveFee = calculateFee(record.entry_time, record.exit_time, rates, memberStatus, extraMins);
                        displayFee = `฿${liveFee.toFixed(2)}`;
                      } else {
                        displayFee = record.parking_fee != null ? `฿${Number(record.parking_fee).toFixed(2)}` : '-';
                      }

                      let memberLabel: React.ReactNode;
                      if (memberStatus === 'vip') {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-red-800">{t('user.vip')}</span>;
                      } else if (memberStatus === 'regular') {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-blue-800">{t('user.regular')}</span>;
                      } else {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-gray-500">Non-member</span>;
                      }

                      const paymentLabel = {
                        PAID:    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Paid</span>,
                        PENDING: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">Pending</span>,
                        UNPAID:  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">Unpaid</span>,
                      }[record.payment_status] ?? <span className="text-gray-400">-</span>;

                      return (
                        <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{record.detected_plate || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{memberLabel}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isExited ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {isExited ? 'Exited' : 'Parked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{paymentLabel}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.entry_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.exit_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDuration(record.entry_time, record.exit_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium border-r border-gray-200">{displayFee}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="min-w-[220px] space-y-2.5">
                              {!isExited && (
                                <div className="grid grid-cols-2 gap-2">
                                  {record.public_url && (
                                    <a href={record.public_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg hover:bg-sky-100 transition-colors">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                      View Page
                                    </a>
                                  )}
                                  <button onClick={() => handleForceExit(record.id)} disabled={isExitLoading}
                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-orange-200 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 ${record.public_url ? '' : 'col-span-2'}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    {isExitLoading ? 'Processing...' : 'Force Exit'}
                                  </button>
                                </div>
                              )}

                              {!isExited && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2">
                                  <p className="text-[11px] font-semibold text-emerald-700 mb-1">Add free minutes</p>
                                  <div className="flex items-center gap-2">
                                    <input type="number" min="1" placeholder="mins"
                                      value={freeMinInput[record.id] || ''}
                                      onChange={(e) => setFreeMinInput(prev => ({ ...prev, [record.id]: e.target.value }))}
                                      className="w-20 px-2 py-1.5 border border-emerald-300 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                    <button onClick={() => handleAddFreeMinutes(record.id)} disabled={isFreeLoading}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      {isFreeLoading ? 'Adding...' : 'Apply'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {extraMins > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">+{extraMins} free min</span>
                              )}

                              <button onClick={() => handleDelete(record.id)} disabled={isDeleteLoading}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                {isDeleteLoading ? 'Deleting...' : 'Delete Record'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={9} className="px-6 py-8 text-sm text-center text-gray-500">
                        {searchTerm.trim() ? `No parking records found for "${searchTerm.trim()}"` : t('table.noRecords')}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer: rates note + pagination */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-gray-400">
                {rates && <>Estimated fee updates every minute — Rate: ฿{rates.rate_per_hour}/hr · Min fee: ฿{rates.minimum_fee} · Free: 60 min (120 min for members)</>}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{((page - 1) * LIMIT) + 1} – {Math.min(page * LIMIT, totalRecords)} of {totalRecords.toLocaleString()}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / LIMIT), p + 1))} disabled={page >= Math.ceil(totalRecords / LIMIT)}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <ConfirmModal
          message={modal.message}
          warning={modal.warning}
          confirmLabel={modal.confirmLabel}
          confirmClassName={modal.confirmClassName}
          hideCancel={modal.hideCancel}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
