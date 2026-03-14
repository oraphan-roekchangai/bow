'use client';

import { useRef, useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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

interface HeaderProps {
  adminName: string;
  adminId: number | null;
  adminRole?: string;
  currentDate?: string;
  onDateChange?: (date: string) => void;
  showDatePicker?: boolean;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export default function Header({
  adminName,
  adminId,
  adminRole,
  currentDate,
  onDateChange,
  showDatePicker = false,
  showMenuButton = false,
  onMenuClick,
}: HeaderProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const showModal = (m: ModalState) => setModal(m);
  const closeModal = () => setModal(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || !adminId) return;
    const fetchProfileImage = async () => {
      try {
        const response = await fetch(`/api/admin/profile-image?adminId=${adminId}`, { credentials: 'include', cache: 'no-store' });
        const result = await response.json();
        if (result.success && result.data.profileImage) {
          const image = result.data.profileImage;
          if (image && image.startsWith('data:image/')) {
            console.log('Valid base64 image found, length:', image.length);
            setProfileImage(image);
          } else {
            console.log('Invalid image format (not base64):', image);
            setProfileImage(null);
          }
        } else {
          console.log('No profile image found');
          setProfileImage(null);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };
    fetchProfileImage();
  }, [adminId, isReady]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminId) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showModal({
        message: 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WEBP)',
        confirmLabel: 'OK',
        hideCancel: true,
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
        onConfirm: closeModal,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showModal({
        message: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        confirmLabel: 'OK',
        hideCancel: true,
        confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
        onConfirm: closeModal,
      });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await fetch('/api/admin/profile-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ adminId, imageBase64: base64String }),
          });
          const result = await response.json();
          if (result.success) {
            setProfileImage(result.data.profileImage);
            setShowProfileMenu(false);
          } else {
            showModal({ message: result.error || 'Failed to upload image', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          showModal({ message: 'Failed to upload image', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        showModal({ message: 'Failed to read file', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      showModal({ message: 'Failed to process image', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
      setIsUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!adminId) return;
    showModal({
      message: t('header.confirmRemovePhoto') || 'Remove your profile photo?',
      warning: '*** This cannot be undone. ***',
      confirmLabel: 'Remove',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        try {
          const response = await fetch(`/api/admin/profile-image?adminId=${adminId}`, { method: 'DELETE', credentials: 'include' });
          const result = await response.json();
          if (result.success) {
            setProfileImage(null);
            setShowProfileMenu(false);
          } else {
            showModal({ message: result.error || 'Failed to delete image', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          showModal({ message: 'Failed to delete image', confirmLabel: 'OK', hideCancel: true, confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors', onConfirm: closeModal });
        }
      },
    });
  };

  const handleLogout = () => {
    showModal({
      message: t('sidebar.confirmLogout') || 'Are you sure you want to log out?',
      confirmLabel: 'Log out',
      confirmClassName: 'px-7 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors',
      onConfirm: async () => {
        closeModal();
        try {
          await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          window.location.href = '/admin/login';
        }
      },
    });
  };

  return (
    <>
      <header className="bg-white shadow-sm px-6 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              {showMenuButton && (
                <button type="button" aria-label="Open sidebar menu" onClick={onMenuClick}
                  className="h-10 w-10 rounded-lg bg-white hover:bg-gray-2=100 transition-colors flex items-center justify-center">
                  <span className="sr-only">Menu</span>
                  <svg className="w-7 h-7 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                </button>
              )}
              {showDatePicker && currentDate && onDateChange && (
                <div className="flex items-center space-x-3">
                  <label htmlFor="header-date-picker" className="text-sm font-medium text-gray-700">{t('header.selectDate')}:</label>
                  <input id="header-date-picker" type="date" value={currentDate} onChange={(e) => onDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-7 h-5 rounded-md overflow-hidden shadow-sm border border-gray-300">
                  <img src={language === 'en' ? '/admin/uk-flag.svg' : '/admin/th-flag.svg'} alt={language === 'en' ? 'UK Flag' : 'Thai Flag'} className="w-full h-full object-cover" />
                </div>
                <span className="text-gray-700">{language === 'en' ? t('header.english') : t('header.thai')}</span>
                <button onClick={() => setShowLanguageMenu(!showLanguageMenu)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                      <div className="w-6 h-4 rounded overflow-hidden mr-3"><img src="/admin/uk-flag.svg" alt="UK" className="w-full h-full object-cover" /></div>
                      {t('header.english')}
                    </button>
                    <button onClick={() => { setLanguage('th'); setShowLanguageMenu(false); }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${language === 'th' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                      <div className="w-6 h-4 rounded overflow-hidden mr-3"><img src="/admin/th-flag.svg" alt="Thailand" className="w-full h-full object-cover" /></div>
                      {t('header.thai')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-400 rounded-full overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-blue-500 transition-colors" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons text-white text-2xl">person</span>
                    </div>
                  )}
                </div>
                {showProfileMenu && adminId && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        <span className="material-icons text-blue-500 mr-2 text-lg">{isUploading ? 'hourglass_empty' : 'upload'}</span>
                        {isUploading ? t('header.uploading') : t('header.uploadPhoto')}
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                      </label>
                      {profileImage && (
                        <button onClick={handleImageRemove} disabled={isUploading}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="material-icons text-red-500 mr-2 text-lg">delete</span>
                          {t('header.removePhoto')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">{adminName}</div>
                    <div className="text-gray-500">{adminRole === 'superadmin' ? 'Super Admin' : t('header.admin')}</div>
                  </div>
                  <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        <span className="material-icons text-red-500 mr-2 text-lg">logout</span>
                        {t('sidebar.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close menus */}
      {(showProfileMenu || showAdminMenu || showLanguageMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowProfileMenu(false); setShowAdminMenu(false); setShowLanguageMenu(false); }} />
      )}

      {/* Modal */}
      {modal && <ConfirmModal {...modal} onCancel={closeModal} />}
    </>
  );
}
