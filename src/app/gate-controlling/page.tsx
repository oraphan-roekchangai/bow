'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { href: '/dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'sidebar.dashboard' },
  { href: '/parking-records',  icon: 'M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z',                                                                             key: 'sidebar.parkingRecords' },
  { href: '/user-management',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',                                    key: 'sidebar.userManagement' },
  { href: '/admin-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'sidebar.adminManagement' },
  { href: '/gate-controlling', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',    key: 'sidebar.gateControlling', active: true },
];

export default function GateControlling() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName]     = useState('Admin');
  const [adminId, setAdminId]         = useState<number | null>(null);
  const [gateStatus, setGateStatus]   = useState({ main: 'CLOSED', vip: 'CLOSED', exit: 'CLOSED' });
  const [systemStatus, setSystemStatus] = useState({ camera: 'ONLINE', operation: 'ON' });
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { router.replace('/pop'); return; }
        const { admin = {} } = await res.json();
        setAdminName(admin.fullName || admin.username || 'Admin');
        setAdminId(admin.admin_id || admin.id || null);
      } catch { router.replace('/pop'); }
    })();
  }, [router]);

  const toggleGate   = (g: keyof typeof gateStatus)   => setGateStatus((p)   => ({ ...p, [g]: p[g] === 'OPEN' ? 'CLOSED' : 'OPEN' }));
  const toggleSystem = (s: keyof typeof systemStatus)  => setSystemStatus((p) => ({ ...p, [s]: s === 'operation' ? (p[s] === 'ON' ? 'OFF' : 'ON') : (p[s] === 'ONLINE' ? 'OFFLINE' : 'ONLINE') }));
  const resetSystem  = () => { setGateStatus({ main: 'CLOSED', vip: 'CLOSED', exit: 'CLOSED' }); setSystemStatus({ camera: 'ONLINE', operation: 'ON' }); };

  return (
    <div className="min-h-screen bg-green-50">
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
              <Link key={item.href} href={item.href} className={`flex items-center space-x-3 p-3 rounded-lg ${item.active ? 'text-white bg-green-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span>{t(item.key)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {!sidebarOpen && (
        <button aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-lg hover:bg-gray-50 flex items-center justify-center rounded-r-lg px-1 py-6">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <div className="flex flex-col h-screen w-full">
        <Header adminName={adminName} adminId={adminId} />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto p-8 max-w-6xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Main Operation Control</h1>

            {/* Live Video Feed */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Live Video Feed</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${systemStatus.camera === 'ONLINE' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">Live</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${systemStatus.operation === 'ON' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                </div>
              </div>
              <div className="relative bg-gray-300 rounded-lg aspect-video shadow-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <p className="text-gray-600 font-medium">Camera Feed</p>
                    <p className="text-sm text-gray-500">Live video stream will appear here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Operation */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Operation Control</h3>
                <div className="flex justify-center space-x-4">
                  {(['ON','OFF'] as const).map((val) => (
                    <button key={val} onClick={() => toggleSystem('operation')}
                      className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${systemStatus.operation === val ? (val === 'ON' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}>
                      {val}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${systemStatus.operation === 'ON' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>System: {systemStatus.operation}</span>
                </div>
              </div>

              {/* VIP Gate */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">VIP Gate Control</h3>
                <div className="flex justify-center space-x-4">
                  {(['OPEN','CLOSE'] as const).map((val) => {
                    const active = val === 'OPEN' ? gateStatus.vip === 'OPEN' : gateStatus.vip === 'CLOSED';
                    return (
                      <button key={val} onClick={() => toggleGate('vip')}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${active ? (val === 'OPEN' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${gateStatus.vip === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>VIP Gate: {gateStatus.vip}</span>
                </div>
              </div>

              {/* Main Gate */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Gate Control</h3>
                <div className="flex justify-center space-x-4">
                  {(['OPEN','CLOSE'] as const).map((val) => {
                    const active = val === 'OPEN' ? gateStatus.main === 'OPEN' : gateStatus.main === 'CLOSED';
                    return (
                      <button key={val} onClick={() => toggleGate('main')}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${active ? (val === 'OPEN' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${gateStatus.main === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Main Gate: {gateStatus.main}</span>
                </div>
              </div>
            </div>

            {/* System Status Overview */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">System Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Camera',    value: systemStatus.camera,    on: systemStatus.camera === 'ONLINE' },
                  { label: 'Operation', value: systemStatus.operation,  on: systemStatus.operation === 'ON' },
                  { label: 'Main Gate', value: gateStatus.main,        on: gateStatus.main === 'OPEN' },
                  { label: 'VIP Gate',  value: gateStatus.vip,         on: gateStatus.vip === 'OPEN' },
                  { label: 'System',    value: 'ACTIVE',               on: true, fixed: true },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${s.fixed ? 'bg-blue-500' : s.on ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-gray-600">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
