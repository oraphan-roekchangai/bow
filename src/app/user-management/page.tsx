'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MaterialIcon from '@/components/MaterialIcon';
import { useLanguage } from '@/contexts/LanguageContext';

interface User {
  id: number;
  fullName: string;
  username: string | null;
  email: string | null;
  phone: string;
  licensePlate: string;
  joinDate: string;
  status: 'regular' | 'vip';
}

const navItems = [
  { href: '/dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'sidebar.dashboard' },
  { href: '/parking-records',  icon: 'M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z',                                                                             key: 'sidebar.parkingRecords' },
  { href: '/user-management',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',                                    key: 'sidebar.userManagement', active: true },
  { href: '/admin-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'sidebar.adminManagement' },
  { href: '/gate-controlling', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',    key: 'sidebar.gateControlling' },
];

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName]     = useState('Admin');
  const [adminId, setAdminId]         = useState<number | null>(null);
  const [users, setUsers]             = useState<User[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [saving, setSaving]           = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [editForm, setEditForm]       = useState({ fullName: '', username: '', email: '', phone: '', licensePlate: '', status: 'regular' as 'regular' | 'vip', password: '' });
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || 'FETCH_ERROR');
        const parsed: User[] = (body.data || []).map((u: any) => ({
          id: u.id, fullName: u.full_name || '', username: u.username ?? null,
          email: u.email ?? null, phone: u.phone || '', licensePlate: u.license_plate || '',
          joinDate: u.join_date || '', status: u.status?.toLowerCase() === 'vip' ? 'vip' : 'regular',
        }));
        setUsers(parsed);
        setError('');
      } catch (err) {
        setError((err as Error).message || 'FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditForm({ fullName: user.fullName, username: user.username || '', email: user.email || '', phone: user.phone, licensePlate: user.licensePlate, status: user.status, password: '' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ fullName: '', username: '', email: '', phone: '', licensePlate: '', status: 'regular', password: '' });
    setSaving(false);
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const saveUser = async () => {
    if (editingId === null) return;
    if (!editForm.fullName.trim() || !editForm.phone.trim() || !editForm.licensePlate.trim()) {
      alert(t('user.validationError') || 'Please fill in required fields');
      return;
    }
    if (!confirm(t('user.saveConfirm') || 'Save changes?')) return;
    setSaving(true);
    const payload: Record<string, string | number> = {
      id: editingId,
      full_name: editForm.fullName.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      license_plate: editForm.licensePlate.trim(),
      status: editForm.status,
    };
    if (editForm.password.trim()) payload.password = editForm.password.trim();
    try {
      const res  = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update user');
      const updated: User = {
        id: data.data.id, fullName: data.data.full_name || '', username: data.data.username ?? null,
        email: data.data.email ?? null, phone: data.data.phone || '', licensePlate: data.data.license_plate || '',
        joinDate: data.data.join_date || '', status: data.data.status?.toLowerCase() === 'vip' ? 'vip' : 'regular',
      };
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      cancelEditing();
    } catch (err) {
      alert((err as Error).message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('user.deleteConfirm') || 'Delete this user?')) return;
    setDeletingId(id);
    try {
      const res  = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (editingId === id) cancelEditing();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.fullName, u.username || '', u.email || '', u.phone, u.licensePlate, u.joinDate, u.status].join(' ').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const resolvedError = error === 'FETCH_ERROR' ? (t('user.error') || 'Error loading users') : error;

  return (
    <div className="h-screen bg-green-50 overflow-hidden">
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
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <div className="w-full h-screen flex flex-col">
        <Header adminName={adminName} adminId={adminId} />

        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            <div className="p-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800">{t('user.title')}</h2>
                <div className="relative w-full max-w-lg">
                  <span className="absolute inset-y-0 left-3 flex items-center"><MaterialIcon name="search" size="small" className="text-gray-400" /></span>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('common.search') || 'Search'}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /><p className="mt-4 text-gray-600">{t('user.loading')}</p></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-600">
                    <p className="text-lg font-semibold">{resolvedError}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{t('common.retry')}</button>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-lg font-semibold text-gray-500">{t('user.noUsers')}</p></div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {['user.fullName','user.username','user.email','user.phone','user.licensePlate','user.password','user.joinDate','user.status','user.actions'].map((k) => (
                        <th key={k} className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300 last:border-r-0">{t(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 ${editingId === user.id ? 'bg-green-50' : ''}`}>
                        {/* fullName */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="text" value={editForm.fullName} onChange={(e) => handleEditChange('fullName', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" /> : user.fullName}
                        </td>
                        {/* username */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="text" value={editForm.username} onChange={(e) => handleEditChange('username', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" />
                            : user.username ? user.username : <span className="text-gray-400">--</span>}
                        </td>
                        {/* email */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="email" value={editForm.email} onChange={(e) => handleEditChange('email', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" />
                            : user.email ? user.email : <span className="text-gray-400">--</span>}
                        </td>
                        {/* phone */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="text" value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" /> : user.phone}
                        </td>
                        {/* licensePlate */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="text" value={editForm.licensePlate} onChange={(e) => handleEditChange('licensePlate', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" /> : user.licensePlate}
                        </td>
                        {/* password */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? <input type="password" value={editForm.password} placeholder={t('user.passwordPlaceholder') || 'New password (optional)'} onChange={(e) => handleEditChange('password', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" /> : '******'}
                        </td>
                        {/* joinDate */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{user.joinDate}</td>
                        {/* status */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === user.id ? (
                            <select value={editForm.status} onChange={(e) => handleEditChange('status', e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none">
                              <option value="regular">{t('user.regular')}</option>
                              <option value="vip">{t('user.vip')}</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 text-sm font-medium rounded ${user.status === 'vip' ? 'text-red-800' : 'text-gray-800'}`}>
                              {user.status === 'vip' ? t('user.vip') : t('user.regular')}
                            </span>
                          )}
                        </td>
                        {/* actions */}
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editingId === user.id ? (
                            <div className="flex items-center space-x-3">
                              <button onClick={saveUser} disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{t('common.save')}</button>
                              <button onClick={cancelEditing} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <button onClick={() => startEditing(user)} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-1">
                                <MaterialIcon name="edit" size="small" className="text-white" /><span>{t('common.edit')}</span>
                              </button>
                              <button onClick={() => handleDelete(user.id)} disabled={deletingId === user.id} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center space-x-1">
                                {deletingId === user.id ? <span>...</span> : <><MaterialIcon name="delete" size="small" className="text-white" /><span>{t('common.delete')}</span></>}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
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
