"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ParkingRecord {
  id: number;
  detected_plate: string;
  entry_time: string;
  exit_time: string | null;
  parking_fee: number | null;
}

export default function Dashboard() {
  const [selectedView, setSelectedView] = useState("Day");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminId, setAdminId] = useState<number | null>(null); // เปลี่ยนเป็น null แทน 1 เพื่อไม่ดึงรูป admin 1 ก่อน
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line'); // เพิ่ม state สำหรับเลือกประเภทกราฟ
  const { t } = useLanguage();
  const router = useRouter();

  // Parking data for each floor
  const parkingData = {
    floor1VIP: { used: 15, total: 20 },
    floor1Member: { used: 19, total: 20 },
    floor2: { used: 5, total: 40 },
    floor3: { used: 10, total: 40 },
    floor4: { used: 35, total: 40 },
  };

  // Calculate percentage for circle progress
  const calculatePercentage = (used: number, total: number) => {
    return (used / total) * 100;
  };

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard?type=all&date=${currentDate}`);
        const result = await response.json();
        
        if (result.success) {
          setChartData(result.data);
        } else {
          console.error('Failed to fetch dashboard data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentDate]);

  // Fetch parking records
  useEffect(() => {
    const fetchParkingRecords = async () => {
      try {
        setRecordsLoading(true);
        const response = await fetch(`/api/parking?date=${currentDate}&limit=50`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setParkingRecords(result.data);
        } else {
          console.error('Failed to fetch parking records:', result.error);
          setParkingRecords([]);
        }
      } catch (error) {
        console.error('Error fetching parking records:', error);
        setParkingRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchParkingRecords();
  }, [currentDate]); // Re-fetch when currentDate changes

  // Load current admin from secure cookie via API
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
      } catch (error) {
        console.error('Failed to load admin session:', error);
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

  // Shared Line Chart Options
  const createLineOptions = (color: string): ChartOptions<"line"> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        intersect: false,
        mode: "index",
        backgroundColor: "#111827",
        borderColor: "#1f2937",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#e5e7eb",
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y}`,
        },
      },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { color: "#e5e7eb" },
        ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af" },
        suggestedMax: 160,
      },
    },
    elements: {
      line: { tension: 0.35, borderWidth: 2 },
      point: { radius: 3, hoverRadius: 5, backgroundColor: color },
    },
  });

  // Shared Bar Chart Options
  const createBarOptions = (color: string): ChartOptions<"bar"> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        intersect: false,
        mode: "index",
        backgroundColor: "#111827",
        borderColor: "#1f2937",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#e5e7eb",
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y}`,
        },
      },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { color: "#e5e7eb" },
        ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af" },
        suggestedMax: 160,
      },
    },
  });

  // Create Line Chart Data with gradient
  const createLineData = (labels: string[], values: number[], color: string): ChartData<"line"> => ({
    labels,
    datasets: [
      {
        label: "Vehicles",
        data: values,
        borderColor: color,
        fill: true,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart as any;
          if (!chartArea) return `${color}20`; // fallback with opacity
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${color}40`);
          gradient.addColorStop(1, `${color}05`);
          return gradient;
        },
      },
    ],
  });

  // Create Bar Chart Data
  const createBarData = (labels: string[], values: number[], color: string): ChartData<"bar"> => ({
    labels,
    datasets: [
      {
        label: "Vehicles",
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      },
    ],
  });

  // Day (Hourly) Chart Data
  const dayLabels = useMemo(() => {
    if (chartData?.dayData) {
      return chartData.dayData.map((item: any) => item.label);
    }
    return Array.from({ length: 24 }, (_, h) => `${h}:00`);
  }, [chartData]);

  const dayDataValues = useMemo(() => {
    if (chartData?.dayData) {
      return chartData.dayData.map((item: any) => item.total_entries);
    }
    return Array(24).fill(0);
  }, [chartData]);

  const dayLineOptions = useMemo(() => createLineOptions("#123bef"), []);
  const dayLineData = useMemo(() => createLineData(dayLabels, dayDataValues, "#123bef"), [dayLabels, dayDataValues]);
  const dayBarOptions = useMemo(() => createBarOptions("#123bef"), []);
  const dayBarData = useMemo(() => createBarData(dayLabels, dayDataValues, "#123bef"), [dayLabels, dayDataValues]);

  // Month (Daily) Chart Data
  const monthLabels = useMemo(() => {
    if (chartData?.monthData) {
      return chartData.monthData.map((item: any) => item.label);
    }
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }, [chartData]);

  const monthValues = useMemo(() => {
    if (chartData?.monthData) {
      return chartData.monthData.map((item: any) => item.total_entries);
    }
    return Array(31).fill(0);
  }, [chartData]);

  const monthLineOptions = useMemo(() => createLineOptions("#0d9488"), []);
  const monthLineData = useMemo(() => createLineData(monthLabels, monthValues, "#0d9488"), [monthLabels, monthValues]);
  const monthBarOptions = useMemo(() => createBarOptions("#0d9488"), []);
  const monthBarData = useMemo(() => createBarData(monthLabels, monthValues, "#0d9488"), [monthLabels, monthValues]);

  // Year (Monthly) Chart Data
  const yearLabels = useMemo(() => {
    if (chartData?.yearData) {
      return chartData.yearData.map((item: any) => item.label);
    }
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }, [chartData]);

  const yearValues = useMemo(() => {
    if (chartData?.yearData) {
      return chartData.yearData.map((item: any) => item.total_entries);
    }
    return Array(12).fill(0);
  }, [chartData]);

  const yearLineOptions = useMemo(() => createLineOptions("#10b981"), []);
  const yearLineData = useMemo(() => createLineData(yearLabels, yearValues, "#10b981"), [yearLabels, yearValues]);
  const yearBarOptions = useMemo(() => createBarOptions("#10b981"), []);
  const yearBarData = useMemo(() => createBarData(yearLabels, yearValues, "#10b981"), [yearLabels, yearValues]);

  // Multi-Year Chart Data
  const multiYearLabels = useMemo(() => {
    if (chartData?.multiYearData) {
      return chartData.multiYearData.map((item: any) => item.label);
    }
    return ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029"];
  }, [chartData]);

  const multiYearValues = useMemo(() => {
    if (chartData?.multiYearData) {
      return chartData.multiYearData.map((item: any) => item.total_entries);
    }
    return Array(11).fill(0);
  }, [chartData]);

  const multiYearLineOptions = useMemo(() => createLineOptions("#8b5cf6"), []);
  const multiYearLineData = useMemo(() => createLineData(multiYearLabels, multiYearValues, "#8b5cf6"), [multiYearLabels, multiYearValues]);
  const multiYearBarOptions = useMemo(() => createBarOptions("#8b5cf6"), []);
  const multiYearBarData = useMemo(() => createBarData(multiYearLabels, multiYearValues, "#8b5cf6"), [multiYearLabels, multiYearValues]);

  return (
    <div className="min-h-screen bg-green-50">
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
            <a href="/dashboard" className="flex items-center space-x-3 text-white bg-green-600 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{t('sidebar.dashboard')}</span>
            </a>
            <a href="/parking-records" className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-3 rounded-lg">
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
      
      {/* Header */}
      <Header 
        adminName={adminName}
        adminId={adminId}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        showDatePicker={true}
      />

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Sidebar - Table and Parking Status Cards */}
        <div className="w-96 p-6 space-y-4 flex flex-col">
          {/* Recent Parking Records Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-400 flex-shrink-0" style={{ height: '35vh' }}>
            <div className="overflow-auto h-full">
              {recordsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">{t('table.loading')}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-base font-bold text-gray-900">{t('table.time')}</th>
                      <th className="px-4 py-3 text-left text-base font-bold text-gray-900">{t('table.licensePlate')}</th>
                      <th className="px-4 py-3 text-center text-base font-bold text-gray-900">{t('table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingRecords.length > 0 ? (
                      parkingRecords.map((record, index) => (
                        <tr 
                          key={record.id} 
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-900 font-medium text-sm">
                            {new Date(record.entry_time).toLocaleTimeString('th-TH', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium text-sm">
                            {record.detected_plate}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              {record.exit_time ? (
                                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">
                          {t('table.noRecords')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Parking Status Cards - Scrollable if needed */}
          <div className="flex-1 space-y-4 overflow-y-auto">
          {/* 1st Floor VIP */}
          <div className="bg-green-700 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-white mb-4">{t('parking.floor1vip')}</h3>
              <p className="text-xl font-bold text-white mb-4">{parkingData.floor1VIP.used}/{parkingData.floor1VIP.total}</p>
            </div>
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white rounded-full overflow-hidden shadow">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(parkingData.floor1VIP.used, parkingData.floor1VIP.total)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 1st Floor Member */}
          <div className="bg-blue-400 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('parking.floor1')}</h3>
              <p className="text-xl font-bold text-gray-900 mb-4">{parkingData.floor1Member.used}/{parkingData.floor1Member.total}</p>
            </div>
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white rounded-full overflow-hidden shadow">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(parkingData.floor1Member.used, parkingData.floor1Member.total)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 2nd Floor */}
          <div className="bg-blue-400 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('parking.floor2')}</h3>
              <p className="text-xl font-bold text-gray-900 mb-4">{parkingData.floor2.used}/{parkingData.floor2.total}</p>
            </div>
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white rounded-full overflow-hidden shadow">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(parkingData.floor2.used, parkingData.floor2.total)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 3rd Floor */}
          <div className="bg-blue-400 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('parking.floor3')}</h3>
              <p className="text-xl font-bold text-gray-900 mb-4">{parkingData.floor3.used}/{parkingData.floor3.total}</p>
            </div>
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white rounded-full overflow-hidden shadow">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(parkingData.floor3.used, parkingData.floor3.total)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 4th Floor */}
          <div className="bg-blue-400 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('parking.floor4')}</h3>
              <p className="text-xl font-bold text-gray-900 mb-4">{parkingData.floor4.used}/{parkingData.floor4.total}</p>
            </div>
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="h-2 bg-white rounded-full overflow-hidden shadow">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(parkingData.floor4.used, parkingData.floor4.total)}%` }}
                ></div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Right Content Area - Charts */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Summary Statistics */}
          {chartData?.summary && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">{t('dashboard.totalRecords')}</div>
                <div className="text-2xl font-bold text-gray-900">{chartData.summary.total_records}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">{t('dashboard.currentlyParked')}</div>
                <div className="text-2xl font-bold text-green-600">{chartData.summary.currently_parked}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">{t('dashboard.todayEntries')}</div>
                <div className="text-2xl font-bold text-blue-600">{chartData.summary.today_entries}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500">{t('dashboard.totalRevenue')}</div>
                <div className="text-2xl font-bold text-teal-600">฿{chartData.summary.total_revenue.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Chart Type Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  {t('dashboard.lineChart')}
                </span>
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t('dashboard.barChart')}
                </span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <div className="text-gray-500">{t('dashboard.loadingData')}</div>
            </div>
          )}

          {/* Charts - Dynamic based on chartType */}
          {!loading && (
            <div className="space-y-4">
              {/* Hour Chart */}
              <div className="relative bg-white rounded-xl p-6 shadow-sm">
                <div className="absolute top-2 right-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 shadow-sm">
                  {t('dashboard.hour')}
                </div>
                <div className="h-56">
                  {chartType === 'line' ? (
                    <Line data={dayLineData} options={dayLineOptions} />
                  ) : (
                    <Bar data={dayBarData} options={dayBarOptions} />
                  )}
                </div>
              </div>

              {/* Day Chart */}
              <div className="relative bg-white rounded-xl p-6 shadow-sm">
                <div className="absolute top-2 right-2 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold px-4 py-1 shadow-sm">
                  {t('dashboard.day')}
                </div>
                <div className="h-56">
                  {chartType === 'line' ? (
                    <Line data={monthLineData} options={monthLineOptions} />
                  ) : (
                    <Bar data={monthBarData} options={monthBarOptions} />
                  )}
                </div>
              </div>

              {/* Month Chart */}
              <div className="relative bg-white rounded-xl p-6 shadow-sm">
                <div className="absolute top-2 right-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 shadow-sm">
                  {t('dashboard.month')}
                </div>
                <div className="h-56">
                  {chartType === 'line' ? (
                    <Line data={yearLineData} options={yearLineOptions} />
                  ) : (
                    <Bar data={yearBarData} options={yearBarOptions} />
                  )}
                </div>
              </div>

              {/* Year Chart */}
              <div className="relative bg-white rounded-xl p-6 shadow-sm">
                <div className="absolute top-2 right-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 shadow-sm">
                  {t('dashboard.year')}
                </div>
                <div className="h-56">
                  {chartType === 'line' ? (
                    <Line data={multiYearLineData} options={multiYearLineOptions} />
                  ) : (
                    <Bar data={multiYearBarData} options={multiYearBarOptions} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}