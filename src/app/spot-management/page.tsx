'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Confirmation Modal ────────────────────────────────────────────────────────
interface ModalState {
  message: string;
  warning?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
}

function ConfirmModal({ message, warning, confirmLabel = 'OK', confirmClassName, hideCancel, onConfirm, onCancel }: ModalState & { onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-8 pt-7 pb-2 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold text-lg">Dashboard</h2>
          <img src="/admin/prologic-logo.png" alt="ProLogic" className="h-8 object-contain mt-[3px]" />
        </div>
        <div className="mx-[15px] border-t border-gray-200" />
        <div className="px-8 pt-4 pb-7 space-y-2">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
          {warning && <p className="text-red-600 text-base font-semibold">{warning}</p>}
        </div>
        <div className="px-8 pb-7 flex justify-end gap-3">
          {!hideCancel && <button ref={cancelRef} onClick={onCancel} className="px-7 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>}
          <button onClick={onConfirm} className={confirmClassName || 'px-7 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors'}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

interface Spot {
  spotId: number;
  spotNumber: string;
  status: 'available' | 'occupied';
}

interface ParkingLot {
  lotId: number;
  lotCode: string;
  lotName: string;
  lotType: 'vip' | 'regular';
  totalSpots: number;
  spots: Spot[];
  occupied: number;
  available: number;
}

const navItems = [
  { href: '/dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'sidebar.dashboard' },
  { href: '/parking-records',  icon: 'M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z',                                                                             key: 'sidebar.parkingRecords' },
  { href: '/user-management',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',                                    key: 'sidebar.userManagement' },
  { href: '/admin-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'sidebar.adminManagement' },
  { href: '/spot-management',  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', key: 'sidebar.spotManagement', active: true },
  { href: '/gate-controlling', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',    key: 'sidebar.gateControlling' },
];

// Sort spot numbers naturally: A1, A2, ..., A10, A11, ...
function naturalSort(a: string, b: string): number {
  const re = /([A-Za-z]+)(\d+)/;
  const ma = a.match(re);
  const mb = b.match(re);
  if (!ma || !mb) return a.localeCompare(b);
  if (ma[1] !== mb[1]) return ma[1].localeCompare(mb[1]);
  return Number(ma[2]) - Number(mb[2]);
}

export default function SpotManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminId, setAdminId] = useState<number | null>(null);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<Set<number>>(new Set());
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  // Auth check
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

  // Fetch spots
  const fetchSpots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/parking-spots', { credentials: 'include', cache: 'no-store' });
      const body = await res.json();
      if (!res.ok || !body.success) { throw new Error(body.error || 'Failed to fetch spots'); }
      setLots(body.data || []);
      // Default to first floor
      if (selectedFloor === null && body.data?.length > 0) {
        setSelectedFloor(body.data[0].lotId);
      }
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpots(); }, []);

  // Toggle single spot
  const handleToggle = async (spot: Spot, lotId: number) => {
    const newStatus = spot.status === 'available' ? 'occupied' : 'available';
    setToggling(prev => new Set(prev).add(spot.spotId));
    try {
      const res = await fetch('/api/admin/parking-spots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ spotId: spot.spotId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.error || 'Failed'); }

      // Update local state
      setLots(prev => prev.map(lot => {
        if (lot.lotId !== lotId) { return lot; }
        const updatedSpots = lot.spots.map(s =>
          s.spotId === spot.spotId ? { ...s, status: newStatus as 'available' | 'occupied' } : s
        );
        return {
          ...lot,
          spots: updatedSpots,
          occupied: updatedSpots.filter(s => s.status === 'occupied').length,
          available: updatedSpots.filter(s => s.status === 'available').length,
        };
      }));
    } catch (err) {
      setModal({
        message: (err as Error).message || 'Failed to update spot',
        confirmLabel: 'OK',
        hideCancel: true,
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
        onConfirm: () => setModal(null),
      });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(spot.spotId); return n; });
    }
  };

  // Bulk set all spots in a lot
  const handleBulk = (lotId: number, lotName: string, lotType: string, status: 'available' | 'occupied') => {
    const label = lotType === 'vip' ? `${lotName} (VIP)` : lotName;
    setModal({
      message: `Set all spots in ${label} to "${status}"?`,
      confirmLabel: status === 'available' ? 'Set All Available' : 'Set All Occupied',
      confirmClassName: status === 'available'
        ? 'px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors'
        : 'px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
      onConfirm: async () => {
        setModal(null);
        setBulkLoading(prev => new Set(prev).add(lotId));
        try {
          const res = await fetch('/api/admin/parking-spots/bulk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lotId, status }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) { throw new Error(data.error || 'Failed'); }

          // Update local state
          setLots(prev => prev.map(lot => {
            if (lot.lotId !== lotId) { return lot; }
            const updatedSpots = lot.spots.map(s => ({ ...s, status }));
            return {
              ...lot,
              spots: updatedSpots,
              occupied: status === 'occupied' ? updatedSpots.length : 0,
              available: status === 'available' ? updatedSpots.length : 0,
            };
          }));
        } catch (err) {
          setModal({
            message: (err as Error).message || 'Failed to bulk update',
            confirmLabel: 'OK',
            hideCancel: true,
            confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
            onConfirm: () => setModal(null),
          });
        } finally {
          setBulkLoading(prev => { const n = new Set(prev); n.delete(lotId); return n; });
        }
      },
    });
  };

  // Compute totals
  const totalSpots = lots.reduce((sum, l) => sum + l.spots.length, 0);
  const totalOccupied = lots.reduce((sum, l) => sum + l.occupied, 0);
  const totalAvailable = lots.reduce((sum, l) => sum + l.available, 0);
  const occupancyPct = totalSpots > 0 ? Math.round((totalOccupied / totalSpots) * 100) : 0;

  // Get the selected lot(s) — group by lotCode for same-floor lots (Floor 1 has VIP + Regular)
  const selectedLots = selectedFloor !== null
    ? lots.filter(l => l.lotId === selectedFloor)
    : [];

  // Group lots by floor for tab display
  const floorGroups = lots.reduce<{ lotCode: string; lotName: string; lotIds: number[]; lots: ParkingLot[] }[]>((acc, lot) => {
    const existing = acc.find(g => g.lotCode === lot.lotCode);
    if (existing) {
      existing.lotIds.push(lot.lotId);
      existing.lots.push(lot);
    } else {
      acc.push({ lotCode: lot.lotCode, lotName: lot.lotName, lotIds: [lot.lotId], lots: [lot] });
    }
    return acc;
  }, []);

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

        <div className="flex-1 p-4 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="text-base text-gray-500">Total Spots</div>
              <div className="text-2xl font-bold text-gray-800">{totalSpots}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="text-base text-gray-500">Occupied</div>
              <div className="text-2xl font-bold text-red-600">{totalOccupied}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="text-base text-gray-500">Available</div>
              <div className="text-2xl font-bold text-green-600">{totalAvailable}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
              <div className="text-base text-gray-500">Occupancy</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{occupancyPct}%</div>
                <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${occupancyPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                <p className="mt-4 text-gray-600">Loading parking spots...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-600">
                <p className="text-lg font-semibold">{error}</p>
                <button onClick={fetchSpots} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Retry</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Floor Tabs */}
              <div className="border-b border-gray-200 px-4 pt-3">
                <div className="flex gap-1">
                  {floorGroups.map((group) => {
                    const isSelected = group.lotIds.includes(selectedFloor ?? -1);
                    const groupOccupied = group.lots.reduce((s, l) => s + l.occupied, 0);
                    const groupTotal = group.lots.reduce((s, l) => s + l.spots.length, 0);
                    return (
                      <button
                        key={group.lotCode}
                        onClick={() => setSelectedFloor(group.lotIds[0])}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                          isSelected
                            ? 'bg-white text-green-700 border border-gray-200 border-b-white -mb-px z-10'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{group.lotName}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          (() => {
                            const pct = groupTotal > 0 ? Math.round((groupOccupied / groupTotal) * 100) : 0;
                            if (pct >= 100) return 'bg-red-100 text-red-700';
                            if (pct >= 60) return 'bg-amber-100 text-amber-700';
                            return 'bg-green-100 text-green-700';
                          })()
                        }`}>
                          {groupOccupied}/{groupTotal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Floor Content */}
              <div className="p-6">
                {floorGroups.filter(g => g.lotIds.includes(selectedFloor ?? -1)).map((group) => (
                  <div key={group.lotCode}>
                    {group.lots.map((lot) => {
                      const isVip = lot.lotType === 'vip';
                      const sortedSpots = [...lot.spots].sort((a, b) => naturalSort(a.spotNumber, b.spotNumber));
                      const isBulk = bulkLoading.has(lot.lotId);

                      return (
                        <div key={lot.lotId} className={`mb-8 last:mb-0 rounded-xl border-2 p-5 ${isVip ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                          {/* Lot Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-800">
                                {isVip && (
                                  <span className="inline-flex items-center gap-1 mr-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    VIP
                                  </span>
                                )}
                                {lot.lotName} — {isVip ? 'VIP Section' : 'Regular Section'}
                              </h3>
                              <span className="text-sm text-gray-500">
                                {lot.occupied}/{lot.spots.length} occupied
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleBulk(lot.lotId, lot.lotName, lot.lotType, 'available')}
                                disabled={isBulk}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {isBulk ? '...' : 'Set All Available'}
                              </button>
                              <button
                                onClick={() => handleBulk(lot.lotId, lot.lotName, lot.lotType, 'occupied')}
                                disabled={isBulk}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {isBulk ? '...' : 'Set All Occupied'}
                              </button>
                            </div>
                          </div>

                          {/* Occupancy Bar */}
                          <div className="mb-4">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${(() => { const pct = lot.spots.length > 0 ? Math.round((lot.occupied / lot.spots.length) * 100) : 0; return pct >= 100 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-green-500'; })()}`}
                                style={{ width: `${lot.spots.length > 0 ? (lot.occupied / lot.spots.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Spot Grid — parking lot style with aisle */}
                          <div className="flex flex-col items-center gap-2">
                            {/* Top row */}
                            <div className="flex flex-wrap gap-2 justify-center">
                              {sortedSpots.slice(0, Math.ceil(sortedSpots.length / 2)).map((spot) => {
                                const isOccupied = spot.status === 'occupied';
                                const isLoading = toggling.has(spot.spotId);
                                return (
                                  <button
                                    key={spot.spotId}
                                    onClick={() => handleToggle(spot, lot.lotId)}
                                    disabled={isLoading}
                                    title={`${spot.spotNumber} — ${spot.status}`}
                                    className={`
                                      relative w-16 h-12 rounded-lg text-xs font-bold transition-all duration-200
                                      flex items-center justify-center
                                      border-2 shadow-sm
                                      ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}
                                      ${isOccupied
                                        ? (isVip ? 'bg-red-500 border-red-600 text-white' : 'bg-red-500 border-red-600 text-white')
                                        : (isVip ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-green-50 border-green-400 text-green-700')
                                      }
                                    `}
                                  >
                                    {isLoading ? (
                                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <span>{spot.spotNumber}</span>
                                        {isOccupied && (
                                          <svg className="w-3 h-3 absolute top-1 right-1 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                                          </svg>
                                        )}
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Aisle separator */}
                            <div className="w-full flex items-center gap-3 my-1">
                              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                              <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Aisle</span>
                              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                            </div>

                            {/* Bottom row */}
                            <div className="flex flex-wrap gap-2 justify-center">
                              {sortedSpots.slice(Math.ceil(sortedSpots.length / 2)).map((spot) => {
                                const isOccupied = spot.status === 'occupied';
                                const isLoading = toggling.has(spot.spotId);
                                return (
                                  <button
                                    key={spot.spotId}
                                    onClick={() => handleToggle(spot, lot.lotId)}
                                    disabled={isLoading}
                                    title={`${spot.spotNumber} — ${spot.status}`}
                                    className={`
                                      relative w-16 h-12 rounded-lg text-xs font-bold transition-all duration-200
                                      flex items-center justify-center
                                      border-2 shadow-sm
                                      ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}
                                      ${isOccupied
                                        ? (isVip ? 'bg-red-500 border-red-600 text-white' : 'bg-red-500 border-red-600 text-white')
                                        : (isVip ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-green-50 border-green-400 text-green-700')
                                      }
                                    `}
                                  >
                                    {isLoading ? (
                                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <span>{spot.spotNumber}</span>
                                        {isOccupied && (
                                          <svg className="w-3 h-3 absolute top-1 right-1 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                                          </svg>
                                        )}
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200/60">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-4 h-3 rounded border-2 ${isVip ? 'bg-amber-50 border-amber-400' : 'bg-green-50 border-green-400'}`} />
                              <span className="text-xs text-gray-500">Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-3 rounded border-2 bg-red-500 border-red-600" />
                              <span className="text-xs text-gray-500">Occupied</span>
                            </div>
                            <span className="text-xs text-gray-400 ml-auto">Click a spot to toggle</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}
    </div>
  );
}
