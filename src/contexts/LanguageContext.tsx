'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.selectDate': 'Select Date',
    'header.english': 'English',
    'header.thai': 'ไทย',
    'header.admin': 'Admin',
    'header.uploadPhoto': 'Upload Photo',
    'header.removePhoto': 'Remove Photo',
    'header.uploading': 'Uploading...',
    'header.confirmRemovePhoto': 'Are you sure you want to remove this photo?',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalRecords': 'Total Records',
    'dashboard.currentlyParked': 'Currently Parked',
    'dashboard.todayEntries': "Today's Entries",
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.loading': 'Loading dashboard data...',
    'dashboard.hour': 'HOUR',
    'dashboard.day': 'DAY',
    'dashboard.month': 'MONTH',
    'dashboard.year': 'YEAR',
    'dashboard.lineChart': 'Line Chart',
    'dashboard.barChart': 'Bar Chart',
    'dashboard.loadingData': 'Loading data...',
    
    // Parking Status
    'parking.floor1vip': '1st Floor (VIP)',
    'parking.floor1': '1st Floor',
    'parking.floor2': '2nd Floor',
    'parking.floor3': '3rd Floor',
    'parking.floor4': '4th Floor',
    
    // Table
    'table.time': 'Time',
    'table.licensePlate': 'License Plate',
    'table.status': 'Status',
    'table.parked': 'Parked',
    'table.exited': 'Exited',
    'table.noRecords': 'No parking records found',
    'table.loading': 'Loading...',
    
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.parkingRecords': 'Parking Records',
    'sidebar.userManagement': 'User Management',
    'sidebar.adminManagement': 'Admin Management',
    'sidebar.gateControlling': 'Gate Controlling',
    'sidebar.logout': 'Log out',
    'sidebar.confirmLogout': 'Are you sure you want to log out?',
    
    // User Management
    'user.title': 'User Management',
    'user.addUser': 'Add User',
    'user.fullName': 'Full Name',
    'user.username': 'Username',
    'user.email': 'Email',
    'user.phone': 'Phone',
    'user.licensePlate': 'License Plate',
    'user.joinDate': 'Join Date',
    'user.status': 'Status',
    'user.actions': 'Actions',
    'user.regular': 'Regular',
    'user.vip': 'VIP',
    'user.edit': 'Edit',
    'user.delete': 'Delete',
  'user.password': 'Password',
  'user.deleteConfirm': 'Are you sure you want to delete this user?',
  'user.validationError': 'Please provide full name, phone number, and license plate.',
  'user.usernamePlaceholder': 'Optional username',
  'user.emailPlaceholder': 'Optional email',
  'user.passwordPlaceholder': 'New password (optional)',
  'user.saveConfirm': 'Do you want to save these changes?',
    'user.noUsers': 'No users found',
    'user.loading': 'Loading users...',
    'user.error': 'Error loading users',
    
    // Admin Management
    'admin.title': 'Admin Management',
    'admin.addAdmin': 'Add Admin',
    'admin.adminId': 'Admin ID',
    'admin.username': 'Username',
  'admin.passwordPlaceholder': 'New password (optional)',
  'admin.password': 'Password',
    'admin.fullName': 'Full Name',
    'admin.email': 'Email',
    'admin.phone': 'Phone',
    'admin.joinDate': 'Join Date',
    'admin.actions': 'Actions',
    'admin.edit': 'Edit',
    'admin.delete': 'Delete',
  'admin.deleteConfirm': 'Are you sure you want to delete this admin?',
  'admin.saveConfirm': 'Do you want to save these changes?',
    'admin.noAdmins': 'No admins found',
    'admin.loading': 'Loading admins...',
    'admin.error': 'Error loading admins',
    
    // Gate Controlling
    'gate.title': 'Gate Controlling',
    'gate.mainGate': 'Main Gate',
    'gate.vipGate': 'VIP Gate',
    'gate.exitGate': 'Exit Gate',
    'gate.open': 'OPEN',
    'gate.closed': 'CLOSED',
    'gate.openGate': 'Open Gate',
    'gate.closeGate': 'Close Gate',
    'gate.cameraStatus': 'Camera Status',
    'gate.systemStatus': 'System Status',
    'gate.online': 'ONLINE',
    'gate.offline': 'OFFLINE',
    'gate.operational': 'ON',
    'gate.maintenance': 'OFF',
    
    // Common
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.retry': 'Retry',
  'common.loading': 'Loading...',
  },
  th: {
    // Header
    'header.selectDate': 'เลือกวันที่',
    'header.english': 'English',
    'header.thai': 'ไทย',
    'header.admin': 'ผู้ดูแลระบบ',
    'header.uploadPhoto': 'อัปโหลดรูปภาพ',
    'header.removePhoto': 'ลบรูปภาพ',
    'header.uploading': 'กำลังอัปโหลด...',
    'header.confirmRemovePhoto': 'คุณต้องการลบรูปภาพนี้หรือไม่?',
    
    // Dashboard
    'dashboard.title': 'แดชบอร์ด',
    'dashboard.totalRecords': 'รายการทั้งหมด',
    'dashboard.currentlyParked': 'กำลังจอดอยู่',
    'dashboard.todayEntries': 'รถเข้าวันนี้',
    'dashboard.totalRevenue': 'รายได้รวม',
    'dashboard.loading': 'กำลังโหลดข้อมูล...',
    'dashboard.hour': 'ชั่วโมง',
    'dashboard.day': 'วัน',
    'dashboard.month': 'เดือน',
    'dashboard.year': 'ปี',
    'dashboard.lineChart': 'กราฟเส้น',
    'dashboard.barChart': 'กราฟแท่ง',
    'dashboard.loadingData': 'กำลังโหลดข้อมูล...',
    
    // Parking Status
    'parking.floor1vip': 'ชั้น 1 (วีไอพี)',
    'parking.floor1': 'ชั้น 1',
    'parking.floor2': 'ชั้น 2',
    'parking.floor3': 'ชั้น 3',
    'parking.floor4': 'ชั้น 4',
    
    // Table
    'table.time': 'เวลา',
    'table.licensePlate': 'ป้ายทะเบียน',
    'table.status': 'สถานะ',
    'table.parked': 'จอดอยู่',
    'table.exited': 'ออกแล้ว',
    'table.noRecords': 'ไม่พบรายการจอดรถ',
    'table.loading': 'กำลังโหลด...',
    
    // Sidebar
    'sidebar.dashboard': 'แดชบอร์ด',
    'sidebar.parkingRecords': 'ประวัติการจอดรถ',
    'sidebar.userManagement': 'จัดการผู้ใช้',
    'sidebar.adminManagement': 'จัดการผู้ดูแลระบบ',
    'sidebar.gateControlling': 'ควบคุมประตู',
    'sidebar.logout': 'ออกจากระบบ',
    'sidebar.confirmLogout': 'คุณต้องการออกจากระบบหรือไม่?',
    
    // User Management
    'user.title': 'จัดการผู้ใช้',
    'user.addUser': 'เพิ่มผู้ใช้',
    'user.fullName': 'ชื่อ-นามสกุล',
    'user.username': 'ชื่อผู้ใช้',
    'user.email': 'อีเมล',
    'user.phone': 'เบอร์โทรศัพท์',
    'user.licensePlate': 'ป้ายทะเบียน',
    'user.joinDate': 'วันที่สมัคร',
    'user.status': 'สถานะ',
    'user.actions': 'การดำเนินการ',
    'user.regular': 'ทั่วไป',
    'user.vip': 'วีไอพี',
    'user.edit': 'แก้ไข',
    'user.delete': 'ลบ',
  'user.password': 'รหัสผ่าน',
  'user.deleteConfirm': 'คุณต้องการลบผู้ใช้นี้หรือไม่?',
  'user.validationError': 'กรุณากรอกชื่อ-นามสกุล เบอร์โทรศัพท์ และป้ายทะเบียน',
  'user.usernamePlaceholder': 'ระบุชื่อผู้ใช้ (ไม่บังคับ)',
  'user.emailPlaceholder': 'ระบุอีเมล (ไม่บังคับ)',
  'user.passwordPlaceholder': 'รหัสผ่านใหม่ (ไม่บังคับ)',
  'user.saveConfirm': 'คุณต้องการบันทึกการเปลี่ยนแปลงนี้หรือไม่?',
    'user.noUsers': 'ไม่พบผู้ใช้',
    'user.loading': 'กำลังโหลดข้อมูลผู้ใช้...',
    'user.error': 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
    
    // Admin Management
    'admin.title': 'จัดการผู้ดูแลระบบ',
    'admin.addAdmin': 'เพิ่มผู้ดูแลระบบ',
    'admin.adminId': 'รหัสแอดมิน',
    'admin.username': 'ชื่อผู้ใช้',
    'admin.password': 'รหัสผ่าน',
  'admin.passwordPlaceholder': 'รหัสผ่านใหม่ (ไม่บังคับ)',
    'admin.fullName': 'ชื่อ-นามสกุล',
    'admin.email': 'อีเมล',
    'admin.phone': 'เบอร์โทรศัพท์',
    'admin.joinDate': 'วันที่เข้าร่วม',
    'admin.actions': 'การดำเนินการ',
    'admin.edit': 'แก้ไข',
    'admin.delete': 'ลบ',
  'admin.deleteConfirm': 'คุณต้องการลบผู้ดูแลระบบนี้หรือไม่?',
  'admin.saveConfirm': 'คุณต้องการบันทึกการเปลี่ยนแปลงนี้หรือไม่?',
    'admin.noAdmins': 'ไม่พบผู้ดูแลระบบ',
    'admin.loading': 'กำลังโหลดข้อมูล...',
    'admin.error': 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
    
    // Gate Controlling
    'gate.title': 'ควบคุมประตู',
    'gate.mainGate': 'ประตูหลัก',
    'gate.vipGate': 'ประตูวีไอพี',
    'gate.exitGate': 'ประตูทางออก',
    'gate.open': 'เปิด',
    'gate.closed': 'ปิด',
    'gate.openGate': 'เปิดประตู',
    'gate.closeGate': 'ปิดประตู',
    'gate.cameraStatus': 'สถานะกล้อง',
    'gate.systemStatus': 'สถานะระบบ',
    'gate.online': 'ออนไลน์',
    'gate.offline': 'ออฟไลน์',
    'gate.operational': 'ทำงาน',
    'gate.maintenance': 'ปิดใช้งาน',
    
    // Common
    'common.cancel': 'ยกเลิก',
    'common.confirm': 'ยืนยัน',
    'common.save': 'บันทึก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.close': 'ปิด',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.export': 'ส่งออก',
    'common.retry': 'ลองใหม่',
    'common.loading': 'กำลังโหลด...'
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'th')) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
