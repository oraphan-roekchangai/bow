'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (entryTime: string, exitTime: string | null) => {
  const start = new Date(entryTime).getTime();
  const end = exitTime ? new Date(exitTime).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return '-';
  }

  const totalMinutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

export default function ParkingRecordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminId, setAdminId] = useState<number | null>(null);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          router.replace('/pop');
          return;
        }

        const data = await response.json();
        const admin = data.admin || {};
        setAdminName(admin.fullName || admin.username || 'Admin');
        setAdminId(admin.admin_id || admin.id || null);
      } catch (loadError) {
        console.error('Failed to load admin session:', loadError);
        router.replace('/pop');
      }
    };

    loadAdmin();
  }, [router]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/parking?limit=500', {
          credentials: 'include',
          cache: 'no-store',
        });

        const body = await response.json();

        if (!response.ok || !body?.success) {
          throw new Error(body?.error || 'Failed to fetch parking records');
        }

        setRecords(body.data || []);
        setError('');
      } catch (fetchError) {
        console.error('Parking records fetch error:', fetchError);
        setError((fetchError as Error).message || 'Failed to fetch parking records');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include',
          cache: 'no-store',
        });

        const body = await response.json();

        if (!response.ok || !body?.success) {
          throw new Error(body?.error || 'Failed to fetch users');
        }

        const parsed: Member[] = (body.data || []).map((user: any) => ({
          licensePlate: (user.license_plate || '').trim().toLowerCase(),
          status: user.status?.toLowerCase() === 'vip' ? 'vip' : 'regular',
        }));

        setMembers(parsed.filter((m) => m.licensePlate));
      } catch (fetchError) {
        console.error('Members fetch error:', fetchError);
        setMembers([]);
      }
    };

    fetchMembers();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;

    return records.filter((record) => {
      const status = record.exit_time ? 'exited' : 'parked';
      const feeText = record.parking_fee != null ? String(record.parking_fee) : '';

      return [
        record.detected_plate || '',
        status,
        record.entry_time || '',
        record.exit_time || '',
        feeText,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [records, searchTerm]);

  const memberStatusByPlate = useMemo(() => {
    const map = new Map<string, 'regular' | 'vip'>();
    members.forEach((member) => {
      if (member.licensePlate) {
        map.set(member.licensePlate, member.status);
      }
    });
    return map;
  }, [members]);

  return (
    <div className="h-screen bg-green-50 overflow-hidden">
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">{t('Parking')}</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <nav className="space-y-4">
            <a href="/dashboard" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{t('sidebar.dashboard')}</span>
            </a>
            <a href="/parking-records" className="flex items-center space-x-3 text-white bg-green-600 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z" />
              </svg>
              <span>{t('sidebar.parkingRecords')}</span>
            </a>
            <a href="/user-management" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{t('sidebar.userManagement')}</span>
            </a>
            <a href="/admin-management" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{t('sidebar.adminManagement')}</span>
            </a>
            <a href="/gate-controlling" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{t('sidebar.gateControlling')}</span>
            </a>
          </nav>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          aria-label="Open sidebar"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center rounded-r-lg px-1 py-6"
          type="button"
          onClick={() => setSidebarOpen(true)}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="w-full h-screen flex flex-col">
        <Header adminName={adminName} adminId={adminId} />

        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            <div className="p-3 flex-shrink-0 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800">Vehicle Parking Records</h2>
                <div className="relative w-full max-w-lg">
                  <span className="absolute inset-y-0 left-3 flex items-center">
                    <MaterialIcon name="search" size="small" className="text-gray-400" />
                  </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('common.search') || 'Search'}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-gray-600">{t('common.loading')}</div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-red-600 font-medium">{error}</div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">License plate</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">Member Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">Entry Time</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">Exit Time</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">Parking Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Total parking fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const isExited = Boolean(record.exit_time);
                        const plateKey = (record.detected_plate || '').trim().toLowerCase();
                        const memberStatus = memberStatusByPlate.get(plateKey) || null;
                        return (
                          <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{record.detected_plate || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                              {memberStatus ? (
                                <span className={`px-3 py-1 text-sm font-medium rounded ${memberStatus === 'vip' ? 'text-red-800' : 'text-gray-800'}`}>
                                  {memberStatus === 'vip' ? t('user.vip') : t('user.regular')}
                                </span>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  isExited ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {isExited ? 'Exited' : 'Parked'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.entry_time)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDateTime(record.exit_time)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{formatDuration(record.entry_time, record.exit_time)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {record.parking_fee != null ? `฿${Number(record.parking_fee).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-sm text-center text-gray-500">
                          {t('table.noRecords')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
