'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MaterialIcon from '@/components/MaterialIcon';
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
          <img src="/admin/prologic-logo.png" alt="ProLogic" className="h-8 object-contain" />
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

const navItems = [
  { href: '/dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', key: 'sidebar.dashboard' },
  { href: '/parking-records',  icon: 'M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z',                                                                             key: 'sidebar.parkingRecords' },
  { href: '/user-management',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',                                    key: 'sidebar.userManagement' },
  { href: '/admin-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'sidebar.adminManagement', active: true },
  { href: '/spot-management',  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', key: 'sidebar.spotManagement' },
  { href: '/gate-controlling', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',    key: 'sidebar.gateControlling' },
];

export default function AdminManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admins, setAdmins]           = useState<Admin[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [adminName, setAdminName]     = useState('Admin');
  const [adminId, setAdminId]         = useState<number | null>(null);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editForm, setEditForm]       = useState({ fullName: '', username: '', email: '', phoneNumber: '', password: '' });
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [modal, setModal]             = useState<ModalState | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  const showModal = (m: ModalState) => setModal(m);
  const closeModal = () => setModal(null);

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
        const res = await fetch('/api/admin/admins', { credentials: 'include', cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to load admins');
        setAdmins(body.admins || body.data || []);
        setError('');
      } catch (err) {
        setError((err as Error).message || 'Failed to load admins');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEditing = (admin: Admin) => {
    setEditingId(admin.id);
    setEditForm({ fullName: admin.fullName, username: admin.username, email: admin.email, phoneNumber: admin.phoneNumber, password: '' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ fullName: '', username: '', email: '', phoneNumber: '', password: '' });
    setSaving(false);
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const saveAdmin = async () => {
    if (editingId === null) return;
    if (!editForm.fullName.trim() || !editForm.username.trim() || !editForm.email.trim() || !editForm.phoneNumber.trim()) {
      showModal({ message: t('admin.error') || 'Please fill in all required fields', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors', onConfirm: closeModal });
      return;
    }
    showModal({
      message: t('admin.saveConfirm') || 'Save changes?',
      confirmLabel: 'Save',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        setSaving(true);
        const payload: Record<string, string | number> = { id: editingId!, fullName: editForm.fullName.trim(), username: editForm.username.trim(), email: editForm.email.trim(), phoneNumber: editForm.phoneNumber.trim() };
        if (editForm.password.trim()) payload.password = editForm.password.trim();
        try {
          const res = await fetch('/api/admin/admins', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update admin');
          setAdmins((prev) => prev.map((a) => (a.id === editingId ? data.admin : a)));
          cancelEditing();
        } catch (err) {
          showModal({ message: (err as Error).message || 'Failed to update admin', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleDelete = async (id: number) => {
    showModal({
      message: t('admin.deleteConfirm') || 'Delete this admin?',
      warning: '*** This cannot be undone. ***',
      confirmLabel: 'Delete',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        setDeletingId(id);
        try {
          const res = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
          setAdmins((prev) => prev.filter((a) => a.id !== id));
          if (editingId === id) cancelEditing();
        } catch (err) {
          showModal({ message: (err as Error).message || 'Failed to delete admin', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

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
              <Link key={item.href} href={item.href} className={`flex items-center space-x-3 p-3 rounded-lg ${item.active ? 'text-white bg-green-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
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
            <div className="p-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{t('admin.title')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /><p className="mt-4 text-gray-600">{t('admin.loading')}</p></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-600">
                    <p className="text-lg font-semibold">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{t('common.retry')}</button>
                  </div>
                </div>
              ) : admins.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-lg font-semibold text-gray-500">{t('admin.noAdmins')}</p></div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {['admin.fullName','admin.username','admin.email','admin.phone','admin.password','admin.joinDate','admin.actions'].map((k) => (
                        <th key={k} className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-300 last:border-r-0">{t(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {admins.map((admin, idx) => (
                      <tr key={admin.id ?? idx} className={`border-b border-gray-200 hover:bg-gray-50 ${editingId === admin.id ? 'bg-green-50' : ''}`}>
                        {(['fullName','username','email','phoneNumber'] as const).map((field) => (
                          <td key={field} className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                            {editingId === admin.id ? (
                              <input type={field === 'email' ? 'email' : 'text'} value={editForm[field]} onChange={(e) => handleEditChange(field, e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" />
                            ) : admin[field]}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <input type="password" value={editForm.password} placeholder={t('admin.passwordPlaceholder') || 'New password (optional)'} onChange={(e) => handleEditChange('password', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 py-1 text-sm focus:border-green-500 focus:outline-none" />
                          ) : admin.password}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{admin.joinDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editingId === admin.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveAdmin}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                <MaterialIcon name="check" size="small" className="text-emerald-700" />
                                <span>{saving ? `${t('common.save')}...` : t('common.save')}</span>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <MaterialIcon name="close" size="small" className="text-gray-700" />
                                <span>{t('common.cancel')}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditing(admin)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg hover:bg-sky-100 transition-colors"
                              >
                                <MaterialIcon name="edit" size="small" className="text-sky-700" />
                                <span>{t('common.edit')}</span>
                              </button>
                              <button
                                onClick={() => handleDelete(admin.id)}
                                disabled={deletingId === admin.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {deletingId === admin.id ? (
                                  <span>...</span>
                                ) : (
                                  <>
                                    <MaterialIcon name="delete" size="small" className="text-red-700" />
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

      {modal && <ConfirmModal {...modal} onCancel={closeModal} />}
    </div>
  );
}
