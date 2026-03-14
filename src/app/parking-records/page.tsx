'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MaterialIcon from '@/components/MaterialIcon';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParkingRecord {
  id: number;
  detected_plate: string;
  entry_time: string;
  exit_time: string | null;
  parking_fee: number | null;
}

interface Member {
  licensePlate: string;
  status: 'regular' | 'vip';
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

// Mirror of server's fee.js
function getFreeMinutes(memberStatus: string | null): number {
  if (memberStatus === 'vip' || memberStatus === 'regular') return 120;
  return 60;
}

function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b);
}

function calculateFee(
  checkIn: string,
  checkOut: string | null,
  memberStatus: string | null,
  rates: ParkingRates
): number {
  const start = new Date(checkIn).getTime();
  const end   = checkOut ? new Date(checkOut).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  const durationMinutes = Math.floor((end - start) / 60000);
  const freeMinutes     = getFreeMinutes(memberStatus);
  const billableMinutes = Math.max(0, durationMinutes - freeMinutes);
  if (billableMinutes === 0) return 0;
  const billableHours = ceilDiv(billableMinutes, 60);
  const fee = billableHours * Number(rates.rate_per_hour);
  return Number(Math.max(fee, Number(rates.minimum_fee)).toFixed(2));
}

export default function ParkingRecordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName]     = useState('Admin');
  const [adminId, setAdminId]         = useState<number | null>(null);
  const [records, setRecords]         = useState<ParkingRecord[]>([]);
  const [members, setMembers]         = useState<Member[]>([]);
  const [rates, setRates]             = useState<ParkingRates | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [searchTerm, setSearchTerm]   = useState('');
  const [now, setNow]                 = useState(Date.now());
  const { t } = useLanguage();
  const router = useRouter();

  // Tick every 60s to update live fees for parked cars
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
        const res  = await fetch('/api/admin/parking?limit=500', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to fetch parking records');
        setRecords(body.data || []);
        setError('');
      } catch (err) {
        setError((err as Error).message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body.success) return;
        const parsed: Member[] = (body.data || []).map((u: any) => ({
          licensePlate: (u.license_plate || '').trim().toLowerCase(),
          status: u.status?.toLowerCase() === 'vip' ? 'vip' : 'regular',
        }));
        setMembers(parsed.filter((m) => m.licensePlate));
      } catch { setMembers([]); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/admin/parking-rates', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (res.ok && body.success) setRates(body.data);
      } catch { /* fall back to DB fee value */ }
    })();
  }, []);

  const memberStatusByPlate = useMemo(() => {
    const map = new Map<string, 'regular' | 'vip'>();
    members.forEach((m) => map.set(m.licensePlate, m.status));
    return map;
  }, [members]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((r) =>
      [r.detected_plate, r.exit_time ? 'exited' : 'parked', r.entry_time, r.exit_time || '']
        .join(' ').toLowerCase().includes(term)
    );
  // now in deps so live fee rows re-render every minute
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, searchTerm, now]);

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">{t('Parking')}</h2>
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
                <div className="relative w-full max-w-lg">
                  <span className="absolute inset-y-0 left-3 flex items-center"><MaterialIcon name="search" size="small" className="text-gray-400" /></span>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('common.search') || 'Search'}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
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
                      {['License plate','Member Status','Status','Entry Time','Exit Time','Parking Duration','Total parking fee'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300 last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                      const isExited     = Boolean(record.exit_time);
                      const plateKey     = (record.detected_plate || '').trim().toLowerCase();
                      const memberStatus = memberStatusByPlate.get(plateKey) || null;

                      // Fee display logic:
                      // - Exited + fee in DB → show settled amount
                      // - Otherwise → calculate live from formula
                      let displayFee: string;
                      if (isExited && record.parking_fee != null) {
                        displayFee = `฿${Number(record.parking_fee).toFixed(2)}`;
                      } else if (rates) {
                        const liveFee = calculateFee(record.entry_time, record.exit_time, memberStatus, rates);
                        displayFee = `฿${liveFee.toFixed(2)}${!isExited ? ' *' : ''}`;
                      } else {
                        displayFee = record.parking_fee != null ? `฿${Number(record.parking_fee).toFixed(2)}` : '-';
                      }

                      // Member status label
                      let memberLabel: React.ReactNode;
                      if (memberStatus === 'vip') {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-red-800">{t('user.vip')}</span>;
                      } else if (memberStatus === 'regular') {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-gray-800">{t('user.regular')}</span>;
                      } else {
                        memberLabel = <span className="px-3 py-1 text-sm font-medium rounded text-gray-500">Non-member</span>;
                      }

                      return (
                        <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{record.detected_plate || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{memberLabel}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isExited ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {isExited ? 'Exited' : 'Parked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.entry_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.exit_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDuration(record.entry_time, record.exit_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{displayFee}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={7} className="px-6 py-8 text-sm text-center text-gray-500">{t('table.noRecords')}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer note */}
            {rates && (
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                * Estimated fee, updates every minute — Rate: ฿{rates.rate_per_hour}/hr · Min fee: ฿{rates.minimum_fee} · Free: 60 min (120 min for members)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
