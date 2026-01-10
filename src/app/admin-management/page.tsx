'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MaterialIcon from '@/components/MaterialIcon';
import { useLanguage } from '@/contexts/LanguageContext';

interface Admin {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  joinDate: string;
  role?: string;
}

export default function AdminManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminName, setAdminName] = useState("Admin");
  const [adminId, setAdminId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  // Load admin info via authenticated endpoint
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

        setAdminName(admin.fullName || admin.username || "Admin");
        setAdminId(admin.admin_id || admin.id || null);
      } catch (err) {
        console.error('Failed to load admin session:', err);
        router.replace('/pop');
      }
    };

    loadAdmin();
  }, [router]);

  const handleLogout = async () => {
    if (!confirm(t('sidebar.confirmLogout') || 'Are you sure you want to log out?')) {
      return;
    }

    try {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.replace('/pop');
    }
  };

  // Fetch admins data from API
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admins', {
          credentials: 'include',
          cache: 'no-store',
        });
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const body = isJson ? await response.json() : await response.text();

        if (!response.ok) {
          const msg = isJson ? body?.error || body?.message || 'Failed to load admins' : body?.slice(0, 300) || 'Failed to load admins';
          throw new Error(msg);
        }

        if (isJson && body?.success && Array.isArray(body.admins)) {
          setAdmins(body.admins);
          setError('');
        } else if (isJson && body?.success && Array.isArray(body.data)) {
          // fallback if API uses `data` instead of `admins`
          setAdmins(body.data);
          setError('');
        } else {
          throw new Error((isJson && (body?.error || 'Failed to load admins')) || 'Failed to load admins');
        }
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError((err as Error).message || 'Failed to load admins data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const startEditing = (admin: Admin) => {
    setEditingId(admin.id);
    setEditForm({
      fullName: admin.fullName,
      username: admin.username,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      password: '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      fullName: '',
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
    });
    setSaving(false);
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveAdmin = async () => {
    if (editingId === null) return;

    if (!editForm.fullName.trim() || !editForm.username.trim() || !editForm.email.trim() || !editForm.phoneNumber.trim()) {
      alert(t('admin.error') || 'Please fill in all required fields');
      return;
    }

    if (!confirm(t('admin.saveConfirm') || 'Do you want to save these changes?')) {
      return;
    }

    setSaving(true);

    const payload: Record<string, string | number> = {
      id: editingId,
      fullName: editForm.fullName.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    try {
      const response = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update admin');
      }

      setAdmins((prev) => prev.map((admin) => (admin.id === editingId ? data.admin : admin)));
      cancelEditing();
    } catch (err) {
      console.error('Save admin error:', err);
      alert((err as Error).message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.deleteConfirm') || 'Are you sure you want to delete this admin?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch('/api/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete admin');
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      if (editingId === id) {
        cancelEditing();
      }
    } catch (err) {
      console.error('Delete admin error:', err);
      alert((err as Error).message || 'Failed to delete admin');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-screen bg-green-50 overflow-hidden">
      {/* Sidebar Menu */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
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
            <a href="/user-management" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{t('sidebar.userManagement')}</span>
            </a>
            <a href="/admin-management" className="flex items-center space-x-3 text-white bg-green-600 p-3 rounded-lg">
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

      {/* Left edge arrow button - only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          aria-label="Open sidebar"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center rounded-r-lg px-1 py-6"
          type="button"
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            className="w-5 h-5 text-gray-600" 
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className="w-full h-screen flex flex-col">
        {/* Header */}
        <Header adminName={adminName} adminId={adminId} />

        {/* Admin Table */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            <div className="p-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{t('admin.title')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-600">{t('admin.loading')}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-600">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {t('common.retry')}
                    </button>
                  </div>
                </div>
              ) : admins.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-lg font-semibold">{t('admin.noAdmins')}</p>
                  </div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.fullName')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.username')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.email')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.phone')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.password')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300">
                        {t('admin.joinDate')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">
                        {t('admin.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {admins.map((admin, index) => (
                      <tr key={admin.id || index} className={`border-b border-gray-200 hover:bg-gray-50 ${editingId === admin.id ? 'bg-green-50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input
                              type="text"
                              value={editForm.fullName}
                              onChange={(e) => handleEditChange('fullName', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none"
                            />
                          ) : (
                            admin.fullName
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => handleEditChange('username', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none"
                            />
                          ) : (
                            admin.username
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => handleEditChange('email', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none"
                            />
                          ) : (
                            admin.email
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input
                              type="text"
                              value={editForm.phoneNumber}
                              onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none"
                            />
                          ) : (
                            admin.phoneNumber
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input
                              type="password"
                              value={editForm.password}
                              placeholder={t('admin.passwordPlaceholder') || 'New password (optional)'}
                              onChange={(e) => handleEditChange('password', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none"
                            />
                          ) : (
                            admin.password
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {admin.joinDate}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editingId === admin.id ? (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={saveAdmin}
                                disabled={saving}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                {t('common.save')}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => startEditing(admin)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-1"
                              >
                                <MaterialIcon name="edit" size="small" className="text-white" />
                                <span>{t('common.edit')}</span>
                              </button>
                              <button
                                onClick={() => handleDelete(admin.id)}
                                disabled={deletingId === admin.id}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center space-x-1"
                              >
                                {deletingId === admin.id ? (
                                  <span>{t('common.loading') || '...'}</span>
                                ) : (
                                  <>
                                    <MaterialIcon name="delete" size="small" className="text-white" />
                                    <span>{t('common.delete')}</span>
                                  </>
                                )}
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
