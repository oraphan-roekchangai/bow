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
  onCancel?: () => void;
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

// ── Eye toggle icon ───────────────────────────────────────────────────────────
function EyeIcon({ visible, size = 'w-4 h-4' }: { visible: boolean; size?: string }) {
  return (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {visible ? (
        <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      )}
    </svg>
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
  role: string;
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
  const [adminRole, setAdminRole]     = useState('admin');
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editForm, setEditForm]       = useState({ fullName: '', username: '', email: '', phoneNumber: '', password: '', role: 'admin' });
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [modal, setModal]             = useState<ModalState | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState({ username: '', fullName: '', email: '', phoneNumber: '', password: '' });
  const [addSaving, setAddSaving]     = useState(false);
  const [showAddPassword, setShowAddPassword]   = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  const isSuperAdmin = adminRole === 'superadmin';
  const isRootAdmin = adminId === 1;

  const showModal = (m: ModalState) => setModal(m);
  const closeModal = () => setModal(null);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { router.replace('/login'); return; }
        const { admin = {} } = await res.json();
        setAdminName(admin.fullName || admin.username || 'Admin');
        setAdminId(admin.admin_id || admin.id || null);
        setAdminRole(admin.role || 'admin');
      } catch { router.replace('/login'); }
    })();
  }, [router]);

  // ── Fetch admins ────────────────────────────────────────────────────────────
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

  // ── Editing helpers ─────────────────────────────────────────────────────────
  const resetEditState = () => {
    setEditingId(null);
    setEditForm({ fullName: '', username: '', email: '', phoneNumber: '', password: '', role: 'admin' });
    setSaving(false);
    setShowEditPassword(false);
  };

  const switchToEditing = (admin: Admin) => {
    setEditingId(admin.id);
    setEditForm({ fullName: admin.fullName, username: admin.username, email: admin.email, phoneNumber: admin.phoneNumber, password: '', role: admin.role || 'admin' });
    setShowEditPassword(false);
  };

  const buildSavePayload = (): Record<string, string | number> => {
    const payload: Record<string, string | number> = { id: editingId!, fullName: editForm.fullName.trim(), username: editForm.username.trim(), email: editForm.email.trim(), phoneNumber: editForm.phoneNumber.trim() };
    if (editForm.password.trim()) { payload.password = editForm.password.trim(); }
    if (isRootAdmin) {
      const targetAdmin = admins.find(a => a.id === editingId);
      if (targetAdmin && targetAdmin.id !== 1) { payload.role = editForm.role; }
    }
    return payload;
  };

  const saveAndApply = async (): Promise<boolean> => {
    const payload = buildSavePayload();
    try {
      const res = await fetch('/api/admin/admins', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update admin');
      setAdmins((prev) => prev.map((a) => (a.id === editingId ? data.admin : a)));
      return true;
    } catch (err) {
      showModal({ message: (err as Error).message || 'Failed to save', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
      return false;
    }
  };

  const hasUnsavedChanges = () => {
    const currentAdmin = admins.find(a => a.id === editingId);
    return currentAdmin && (
      editForm.fullName !== currentAdmin.fullName ||
      editForm.username !== currentAdmin.username ||
      editForm.email !== currentAdmin.email ||
      editForm.phoneNumber !== currentAdmin.phoneNumber ||
      editForm.password.trim() !== '' ||
      editForm.role !== (currentAdmin.role || 'admin')
    );
  };

  const startEditing = (admin: Admin) => {
    if (editingId !== null && editingId !== admin.id && hasUnsavedChanges()) {
      showModal({
        message: 'You have unsaved changes. Would you like to save them before editing another admin?',
        confirmLabel: 'Save',
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
        onCancel: () => { closeModal(); switchToEditing(admin); },
        onConfirm: async () => {
          closeModal();
          setSaving(true);
          const ok = await saveAndApply();
          setSaving(false);
          if (ok) { switchToEditing(admin); }
        },
      });
      return;
    }
    switchToEditing(admin);
  };

  const cancelEditing = () => {
    if (hasUnsavedChanges()) {
      showModal({
        message: 'You have unsaved changes. Would you like to save them before cancelling?',
        confirmLabel: 'Save',
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
        onCancel: () => { closeModal(); resetEditState(); },
        onConfirm: async () => {
          closeModal();
          setSaving(true);
          const ok = await saveAndApply();
          setSaving(false);
          if (ok) { resetEditState(); }
        },
      });
      return;
    }
    resetEditState();
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  // ── Permission helpers ──────────────────────────────────────────────────────
  const canEditAdmin = (targetAdmin: Admin) => isSuperAdmin || targetAdmin.id === adminId;
  const canDeleteAdmin = (targetAdmin: Admin) => isSuperAdmin && targetAdmin.id !== adminId && targetAdmin.id !== 1;
  const canEditRole = (targetAdmin: Admin) => isRootAdmin && targetAdmin.id !== 1;

  // ── Inline validation (Add) ─────────────────────────────────────────────────
  const addFormErrors = (() => {
    const e: Record<string, string> = {};
    const u = addForm.username.trim();
    const f = addForm.fullName.trim();
    const em = addForm.email.trim();
    const ph = addForm.phoneNumber.trim();
    const pw = addForm.password.trim();

    if (!u) { e.username = 'Username is required'; }
    else if (admins.some(a => a.username.toLowerCase() === u.toLowerCase())) { e.username = 'Username already exists'; }

    if (!f) { e.fullName = 'Full name is required'; }
    else if (admins.some(a => a.fullName.toLowerCase() === f.toLowerCase())) { e.fullName = 'Full name already exists'; }

    if (!em) { e.email = 'Email is required'; }
    else if (!/\S+@\S+\.\S+/.test(em)) { e.email = 'Invalid email format'; }
    else if (admins.some(a => a.email.toLowerCase() === em.toLowerCase())) { e.email = 'Email already exists'; }

    if (!ph) { e.phone = 'Phone number is required'; }
    else if (!/^\d{10}$/.test(ph)) { e.phone = 'Must be exactly 10 digits'; }
    else if (admins.some(a => a.phoneNumber === ph)) { e.phone = 'Phone number already exists'; }

    if (!pw) { e.password = 'Password is required'; }
    else if (pw.length < 6 || pw.length > 20) { e.password = 'Must be 6–20 characters'; }
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) { e.password = 'Must contain a special character'; }

    return e;
  })();

  const addFormValid = Object.keys(addFormErrors).length === 0;

  // ── Inline validation (Edit) ────────────────────────────────────────────────
  const editFormErrors = (() => {
    if (editingId === null) return {};
    const e: Record<string, string> = {};
    const u = editForm.username.trim();
    const f = editForm.fullName.trim();
    const em = editForm.email.trim();
    const ph = editForm.phoneNumber.trim();
    const pw = editForm.password.trim();

    if (!u) { e.username = 'Username is required'; }
    else if (admins.some(a => a.id !== editingId && a.username.toLowerCase() === u.toLowerCase())) { e.username = 'Username already exists'; }

    if (!f) { e.fullName = 'Full name is required'; }
    else if (admins.some(a => a.id !== editingId && a.fullName.toLowerCase() === f.toLowerCase())) { e.fullName = 'Full name already exists'; }

    if (!em) { e.email = 'Email is required'; }
    else if (!/\S+@\S+\.\S+/.test(em)) { e.email = 'Invalid email format'; }
    else if (admins.some(a => a.id !== editingId && a.email.toLowerCase() === em.toLowerCase())) { e.email = 'Email already exists'; }

    if (!ph) { e.phone = 'Phone number is required'; }
    else if (!/^\d{10}$/.test(ph)) { e.phone = 'Must be exactly 10 digits'; }
    else if (admins.some(a => a.id !== editingId && a.phoneNumber === ph)) { e.phone = 'Phone number already exists'; }

    if (pw) {
      if (pw.length < 6 || pw.length > 20) { e.password = 'Must be 6–20 characters'; }
      else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) { e.password = 'Must contain a special character'; }
    }

    return e;
  })();

  const editFormValid = Object.keys(editFormErrors).length === 0;

  // ── Save admin ──────────────────────────────────────────────────────────────
  const saveAdmin = async () => {
    if (editingId === null || !editFormValid) return;
    showModal({
      message: t('admin.saveConfirm') || 'Save changes?',
      confirmLabel: 'Save',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        setSaving(true);
        const ok = await saveAndApply();
        setSaving(false);
        if (ok) { resetEditState(); }
      },
    });
  };

  // ── Delete admin ────────────────────────────────────────────────────────────
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
          const res = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
          setAdmins((prev) => prev.filter((a) => a.id !== id));
          if (editingId === id) { resetEditState(); }
        } catch (err) {
          showModal({ message: (err as Error).message || 'Failed to delete admin', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // ── Add admin ───────────────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    if (!addFormValid) return;
    showModal({
      message: `Create new admin "${addForm.username.trim()}"?`,
      confirmLabel: 'Create',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        setAddSaving(true);
        try {
          const res = await fetch('/api/admin/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              username: addForm.username.trim(),
              fullName: addForm.fullName.trim(),
              email: addForm.email.trim(),
              phoneNumber: addForm.phoneNumber.trim(),
              password: addForm.password.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create admin');
          setAdmins((prev) => [data.admin, ...prev]);
          setAddForm({ username: '', fullName: '', email: '', phoneNumber: '', password: '' });
          setShowAddForm(false);
          setShowAddPassword(false);
          showModal({ message: `Admin "${addForm.username.trim()}" created successfully`, confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors', onConfirm: closeModal });
        } catch (err) {
          showModal({ message: (err as Error).message || 'Failed to create admin', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        } finally {
          setAddSaving(false);
        }
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
        <Header adminName={adminName} adminId={adminId} adminRole={adminRole} showMenuButton={true} onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">{t('admin.title')}</h2>
                {isSuperAdmin && (
                  <button onClick={() => { setShowAddForm(!showAddForm); setShowAddPassword(false); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                    <MaterialIcon name={showAddForm ? 'close' : 'person_add'} size="small" className="text-white" />
                    <span>{showAddForm ? 'Cancel' : 'Add Admin'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Add Admin Form */}
            {showAddForm && isSuperAdmin && (
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-emerald-800 mb-3">Create New Admin</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <input type="text" placeholder="Full Name" value={addForm.fullName} onChange={(e) => setAddForm(p => ({ ...p, fullName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                          addForm.fullName.trim() && addFormErrors.fullName
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                        }`} />
                      {addForm.fullName.trim() && addFormErrors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{addFormErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <input type="email" placeholder="Email" value={addForm.email} onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                          addForm.email.trim() && addFormErrors.email
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                        }`} />
                      {addForm.email.trim() && addFormErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{addFormErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <input type="text" placeholder="Phone (10 digits)" value={addForm.phoneNumber} onChange={(e) => setAddForm(p => ({ ...p, phoneNumber: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                          addForm.phoneNumber.trim() && addFormErrors.phone
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                        }`} />
                      {addForm.phoneNumber.trim() && addFormErrors.phone && (
                        <p className="mt-1 text-xs text-red-600">{addFormErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <input type="text" placeholder="Username" value={addForm.username}
                        readOnly onFocus={(e) => e.target.removeAttribute('readOnly')}
                        onChange={(e) => setAddForm(p => ({ ...p, username: e.target.value }))}
                        autoComplete="off"
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                          addForm.username.trim() && addFormErrors.username
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                        }`} />
                      {addForm.username.trim() && addFormErrors.username && (
                        <p className="mt-1 text-xs text-red-600">{addFormErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <input type={showAddPassword ? 'text' : 'password'} placeholder="Password (6-20 chars)" value={addForm.password}
                          onChange={(e) => setAddForm(p => ({ ...p, password: e.target.value }))}
                          autoComplete="off"
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                            addForm.password.trim() && addFormErrors.password
                              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                          }`} />
                        {addForm.password && (
                          <button type="button" onClick={() => setShowAddPassword(!showAddPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            <EyeIcon visible={showAddPassword} />
                          </button>
                        )}
                      </div>
                      {addForm.password.trim() && addFormErrors.password && (
                        <p className="mt-1 text-xs text-red-600">{addFormErrors.password}</p>
                      )}
                    </div>
                    <div className="flex items-start">
                      <button onClick={handleAddAdmin} disabled={!addFormValid || addSaving}
                        className={`w-full px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed ${
                          addFormValid
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-300 text-gray-500'
                        }`}>
                        {addSaving ? 'Creating...' : 'Create Admin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <thead className="bg-gray-100 sticky top-0 z-10 border-y border-gray-200">
                    <tr>
                      {['admin.fullName','admin.username','admin.email','admin.phone','admin.password','admin.joinDate'].map((k) => (
                        <th key={k} className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">{t(k)}</th>
                      ))}
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {admins.map((admin, idx) => (
                      <tr key={admin.id ?? idx} className={`border-b border-gray-200 ${editingId === admin.id ? 'bg-blue-50' : editingId === null ? 'hover:bg-gray-50' : ''}`}>
                        {(['fullName','username','email','phoneNumber'] as const).map((field) => {
                          const errorKey = field === 'phoneNumber' ? 'phone' : field;
                          const hasError = editingId === admin.id && editFormErrors[errorKey];
                          return (
                            <td key={field} className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                              {editingId === admin.id ? (
                                <div>
                                  <input type={field === 'email' ? 'email' : 'text'} value={editForm[field]} onChange={(e) => handleEditChange(field, e.target.value)}
                                    className={`w-full bg-transparent border-b py-1 text-sm focus:outline-none ${
                                      hasError ? 'border-red-400 text-red-700 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                                    }`} />
                                  {hasError && <p className="mt-1 text-xs text-red-600">{editFormErrors[errorKey]}</p>}
                                </div>
                              ) : admin[field]}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id ? (
                            <div>
                              <div className="relative">
                                <input type={showEditPassword ? 'text' : 'password'} value={editForm.password} placeholder={t('admin.passwordPlaceholder') || 'New password (optional)'} onChange={(e) => handleEditChange('password', e.target.value)}
                                  autoComplete="new-password"
                                  className={`w-full bg-transparent border-b py-1 pr-7 text-sm focus:outline-none ${
                                    editFormErrors.password ? 'border-red-400 text-red-700 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                                  }`} />
                                {editForm.password && (
                                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <EyeIcon visible={showEditPassword} />
                                  </button>
                                )}
                              </div>
                              {editFormErrors.password && <p className="mt-1 text-xs text-red-600">{editFormErrors.password}</p>}
                            </div>
                          ) : admin.password}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{admin.joinDate}</td>
                        {/* Role */}
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {editingId === admin.id && canEditRole(admin) ? (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleEditChange('role', 'admin')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
                                  editForm.role === 'admin'
                                    ? 'border-green-500 bg-green-100 text-green-700'
                                    : 'border-green-200 bg-white text-green-400 hover:border-green-400'
                                }`}>Admin</button>
                              <button type="button" onClick={() => handleEditChange('role', 'superadmin')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
                                  editForm.role === 'superadmin'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-purple-200 bg-white text-purple-400 hover:border-purple-400'
                                }`}>Super Admin</button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-green-100 text-green-700 border border-green-300'
                            }`}>
                              {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {editingId === admin.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={saveAdmin} disabled={saving || !editFormValid}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:cursor-not-allowed ${
                                  editFormValid
                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'border border-gray-200 bg-gray-100 text-gray-400'
                                }`}>
                                <MaterialIcon name="check" size="small" className={editFormValid ? 'text-emerald-700' : 'text-gray-400'} />
                                <span>{saving ? `${t('common.save')}...` : t('common.save')}</span>
                              </button>
                              <button onClick={cancelEditing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
                                <MaterialIcon name="close" size="small" className="text-red-700" />
                                <span>{t('common.cancel')}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {canEditAdmin(admin) && (
                                <button onClick={() => startEditing(admin)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg hover:bg-sky-100 transition-colors">
                                  <MaterialIcon name="edit" size="small" className="text-sky-700" />
                                  <span>{t('common.edit')}</span>
                                </button>
                              )}
                              {canDeleteAdmin(admin) && (
                                <button onClick={() => handleDelete(admin.id)} disabled={deletingId === admin.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                                  {deletingId === admin.id ? <span>...</span> : <><MaterialIcon name="delete" size="small" className="text-red-700" /><span>{t('common.delete')}</span></>}
                                </button>
                              )}
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

      {modal && <ConfirmModal {...modal} onCancel={modal.onCancel || closeModal} />}
    </div>
  );
}
