"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
  ChartOptions, ChartData,
} from "chart.js";
import nextDynamic from "next/dynamic";
const Line = nextDynamic(() => import("react-chartjs-2").then(m => ({ default: m.Line })), { ssr: false });
const Bar  = nextDynamic(() => import("react-chartjs-2").then(m => ({ default: m.Bar })),  { ssr: false });
const Pie  = nextDynamic(() => import("react-chartjs-2").then(m => ({ default: m.Pie })),  { ssr: false });

interface ParkingRecord {
  id: number;
  detected_plate: string;
  entry_time: string;
  exit_time: string | null;
  parking_fee: number | null;
}

type ChartRange = "hour" | "day" | "week" | "month" | "year";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [adminName, setAdminName]       = useState("Admin");
  const [adminId, setAdminId]           = useState<number | null>(null);
  const [chartData, setChartData]       = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [currentDate, setCurrentDate]   = useState(new Date().toISOString().split("T")[0]);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [chartType, setChartType]       = useState<"line" | "bar">("line");
  const [selectedRange, setSelectedRange] = useState<ChartRange>("hour");
  const { t } = useLanguage();
  const router = useRouter();

  const parkingData = {
    floor1VIP:    { used: 15, total: 20 },
    floor1Member: { used: 19, total: 20 },
    floor2:       { used: 5,  total: 40 },
    floor3:       { used: 10, total: 40 },
    floor4:       { used: 35, total: 40 },
  };

  const pct = (used: number, total: number) => (used / total) * 100;

  useEffect(() => {
    import("chartjs-plugin-zoom").then((mod) => {
      ChartJS.register(
        CategoryScale, LinearScale, PointElement, LineElement,
        BarElement, ArcElement, Title, Tooltip, Legend, Filler
      );
    });
  }, []);

  // Load admin session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include", cache: "no-store" });
        if (!res.ok) { router.replace("/login"); return; }
        const { admin = {} } = await res.json();
        setAdminName(admin.fullName || admin.username || "Admin");
        setAdminId(admin.admin_id || admin.id || null);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  // Fetch chart data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/dashboard?type=all&date=${currentDate}`);
        const json = await res.json();
        if (json.success) setChartData(json.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentDate]);

  // Fetch recent parking records
  useEffect(() => {
    (async () => {
      try {
        setRecordsLoading(true);
        const res = await fetch(`/api/admin/parking?date=${currentDate}&limit=50`);
        const json = await res.json();
        setParkingRecords(json.success && json.data ? json.data : []);
      } catch {
        setParkingRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    })();
  }, [currentDate]);

  // ── Chart helpers ────────────────────────────────────────────────────────────

  const calcSuggestedMax = (values: number[]) => {
    const maxVal = Math.max(...values, 0);
    if (maxVal <= 10) return 12;
    const padded = maxVal * 1.2;
    const step = maxVal < 100 ? 5 : maxVal < 500 ? 10 : 50;
    return Math.ceil(padded / step) * step;
  };

  const createLineOptions = (color: string, values: number[]): ChartOptions<"line"> => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: "index", backgroundColor: "#111827", titleColor: "#fff", bodyColor: "#e5e7eb", padding: 10 },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      x: { grid: { color: "#e5e7eb" }, ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af", maxTicksLimit: 6, precision: 0 },
        suggestedMax: calcSuggestedMax(values),
      },
    },
    elements: { line: { tension: 0.35, borderWidth: 2 }, point: { radius: 0, hoverRadius: 0, hitRadius: 12, backgroundColor: color } },
  });

  const createBarOptions = (color: string, values: number[]): ChartOptions<"bar"> => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: "index", backgroundColor: "#111827", titleColor: "#fff", bodyColor: "#e5e7eb", padding: 10 },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      x: { grid: { color: "#e5e7eb" }, ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af", maxTicksLimit: 6, precision: 0 },
        suggestedMax: calcSuggestedMax(values),
      },
    },
  });

  const createLineData = (labels: string[], values: number[], color: string): ChartData<"line"> => ({
    labels,
    datasets: [{
      label: "Vehicles", data: values, borderColor: color, fill: true,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c, chartArea } = chart as any;
        if (!chartArea) return `${color}20`;
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, `${color}40`); g.addColorStop(1, `${color}05`);
        return g;
      },
    }],
  });

  const createBarData = (labels: string[], values: number[], color: string): ChartData<"bar"> => ({
    labels,
    datasets: [{ label: "Vehicles", data: values, backgroundColor: color, borderColor: color, borderWidth: 1 }],
  });

  const pieOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#111827", titleColor: "#fff", bodyColor: "#e5e7eb", padding: 10 },
    },
  };

  const floor1GroupCapacity = parkingData.floor1VIP.total + parkingData.floor1Member.total;
  const floor2To4GroupCapacity = parkingData.floor2.total + parkingData.floor3.total + parkingData.floor4.total;

  const floor1PieData = useMemo<ChartData<"pie">>(() => ({
    labels: [t("parking.floor1vip"), t("parking.floor1"), t("parking.available")],
    datasets: [{
      data: [
        parkingData.floor1VIP.used,
        parkingData.floor1Member.used,
        Math.max(floor1GroupCapacity - (parkingData.floor1VIP.used + parkingData.floor1Member.used), 0),
      ],
      backgroundColor: ["#f59e0b", "#2563eb", "#e5e7eb"],
      borderColor: ["#ffffff", "#ffffff", "#ffffff"],
      borderWidth: 2,
    }],
  }), [t, floor1GroupCapacity, parkingData.floor1VIP.used, parkingData.floor1Member.used]);

  const floor2To4PieData = useMemo<ChartData<"pie">>(() => ({
    labels: [t("parking.floor2"), t("parking.floor3"), t("parking.floor4"), t("parking.available")],
    datasets: [{
      data: [
        parkingData.floor2.used,
        parkingData.floor3.used,
        parkingData.floor4.used,
        Math.max(floor2To4GroupCapacity - (parkingData.floor2.used + parkingData.floor3.used + parkingData.floor4.used), 0),
      ],
      backgroundColor: ["#14b8a6", "#8b5cf6", "#ef4444", "#e5e7eb"],
      borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
      borderWidth: 2,
    }],
  }), [t, floor2To4GroupCapacity, parkingData.floor2.used, parkingData.floor3.used, parkingData.floor4.used]);

  const dayLabels   = useMemo(() => chartData?.dayData?.map((i: any) => i.label) ?? Array.from({length:24},(_,h)=>`${h}:00`), [chartData]);
  const dayVals     = useMemo(() => chartData?.dayData?.map((i: any) => i.total_entries) ?? Array(24).fill(0), [chartData]);
  const monthLabels = useMemo(() => chartData?.monthData?.map((i: any) => i.label) ?? Array.from({length:31},(_,i)=>String(i+1)), [chartData]);
  const monthVals   = useMemo(() => chartData?.monthData?.map((i: any) => i.total_entries) ?? Array(31).fill(0), [chartData]);
  const weekLabels  = useMemo(() => {
    if (chartData?.weekData?.length) return chartData.weekData.map((i: any) => i.label);
    const chunks = Math.ceil(monthLabels.length / 7);
    return Array.from({ length: chunks }, (_, i) => `W${i + 1}`);
  }, [chartData, monthLabels]);
  const weekVals    = useMemo(() => {
    if (chartData?.weekData?.length) return chartData.weekData.map((i: any) => i.total_entries);
    const vals: number[] = [];
    for (let i = 0; i < monthVals.length; i += 7) {
      vals.push(monthVals.slice(i, i + 7).reduce((sum: number, n: number) => sum + n, 0));
    }
    return vals;
  }, [chartData, monthVals]);
  const yearLabels  = useMemo(() => chartData?.yearData?.map((i: any) => i.label) ?? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], [chartData]);
  const yearVals    = useMemo(() => chartData?.yearData?.map((i: any) => i.total_entries) ?? Array(12).fill(0), [chartData]);
  const myLabels    = useMemo(() => chartData?.multiYearData?.map((i: any) => i.label) ?? [], [chartData]);
  const myVals      = useMemo(() => chartData?.multiYearData?.map((i: any) => i.total_entries) ?? [], [chartData]);

  const dayLineOpts   = useMemo(() => createLineOptions("#123bef", dayVals), [dayVals]);
  const dayBarOpts    = useMemo(() => createBarOptions("#123bef", dayVals), [dayVals]);
  const dayLineData   = useMemo(() => createLineData(dayLabels, dayVals, "#123bef"), [dayLabels, dayVals]);
  const dayBarData    = useMemo(() => createBarData(dayLabels, dayVals, "#123bef"), [dayLabels, dayVals]);

  const mthLineOpts   = useMemo(() => createLineOptions("#0d9488", monthVals), [monthVals]);
  const mthBarOpts    = useMemo(() => createBarOptions("#0d9488", monthVals), [monthVals]);
  const mthLineData   = useMemo(() => createLineData(monthLabels, monthVals, "#0d9488"), [monthLabels, monthVals]);
  const mthBarData    = useMemo(() => createBarData(monthLabels, monthVals, "#0d9488"), [monthLabels, monthVals]);

  const wkLineOpts    = useMemo(() => createLineOptions("#f59e0b", weekVals), [weekVals]);
  const wkBarOpts     = useMemo(() => createBarOptions("#f59e0b", weekVals), [weekVals]);
  const wkLineData    = useMemo(() => createLineData(weekLabels, weekVals, "#f59e0b"), [weekLabels, weekVals]);
  const wkBarData     = useMemo(() => createBarData(weekLabels, weekVals, "#f59e0b"), [weekLabels, weekVals]);

  const yrLineOpts    = useMemo(() => createLineOptions("#10b981", yearVals), [yearVals]);
  const yrBarOpts     = useMemo(() => createBarOptions("#10b981", yearVals), [yearVals]);
  const yrLineData    = useMemo(() => createLineData(yearLabels, yearVals, "#10b981"), [yearLabels, yearVals]);
  const yrBarData     = useMemo(() => createBarData(yearLabels, yearVals, "#10b981"), [yearLabels, yearVals]);

  const myLineOpts    = useMemo(() => createLineOptions("#8b5cf6", myVals), [myVals]);
  const myBarOpts     = useMemo(() => createBarOptions("#8b5cf6", myVals), [myVals]);
  const myLineData    = useMemo(() => createLineData(myLabels, myVals, "#8b5cf6"), [myLabels, myVals]);
  const myBarData     = useMemo(() => createBarData(myLabels, myVals, "#8b5cf6"), [myLabels, myVals]);

  const chartViews = useMemo(() => ({
    hour:  { label: t("dashboard.hour"),  badge: "bg-blue-100 text-blue-700",    lineD: dayLineData, lineO: dayLineOpts, lineColor: "#123bef", barD: dayBarData, barO: dayBarOpts },
    day:   { label: t("dashboard.day"),   badge: "bg-teal-100 text-teal-700",    lineD: mthLineData, lineO: mthLineOpts, lineColor: "#0d9488", barD: mthBarData, barO: mthBarOpts },
    week:  { label: t("dashboard.week"),  badge: "bg-amber-100 text-amber-700",  lineD: wkLineData, lineO: wkLineOpts, lineColor: "#f59e0b", barD: wkBarData, barO: wkBarOpts },
    month: { label: t("dashboard.month"), badge: "bg-green-100 text-green-700",  lineD: yrLineData, lineO: yrLineOpts, lineColor: "#10b981", barD: yrBarData, barO: yrBarOpts },
    year:  { label: t("dashboard.year"),  badge: "bg-purple-100 text-purple-700",lineD: myLineData, lineO: myLineOpts, lineColor: "#8b5cf6", barD: myBarData, barO: myBarOpts },
  }), [
    t,
    dayLineData, dayLineOpts, dayBarData, dayBarOpts,
    mthLineData, mthLineOpts, mthBarData, mthBarOpts,
    wkLineData, wkLineOpts, wkBarData, wkBarOpts,
    yrLineData, yrLineOpts, yrBarData, yrBarOpts,
    myLineData, myLineOpts, myBarData, myBarOpts,
  ]);

  const activeChart = chartViews[selectedRange];

  // ── Sidebar nav ──────────────────────────────────────────────────────────────

  const navItems = [
    { href: "/dashboard",        label: t("sidebar.dashboard"),        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", active: true },
    { href: "/parking-records",  label: t("sidebar.parkingRecords"),   icon: "M9 17h6m-6-4h6m2 8H7a2 2 0 01-2-2V7a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z" },
    { href: "/user-management",  label: t("sidebar.userManagement"),   icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { href: "/admin-management", label: t("sidebar.adminManagement"),  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { href: "/gate-controlling", label: t("sidebar.gateControlling"),  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">{t("Parking")}</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`flex items-center space-x-3 p-3 rounded-lg ${item.active ? "text-white bg-green-600" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <Header
        adminName={adminName}
        adminId={adminId}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        showDatePicker={true}
        showMenuButton={true}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left sidebar: table + floor cards */}
        <div className="w-96 p-6">
          {/* Recent records table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-gray-200" style={{ height: "100%" }}>
            <div className="overflow-auto h-full">
              {recordsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="mt-2 text-sm text-gray-600">{t("table.loading")}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-base font-bold text-gray-900">{t("table.time")}</th>
                      <th className="px-4 py-3 text-left text-base font-bold text-gray-900">{t("table.licensePlate")}</th>
                      <th className="px-4 py-3 text-center text-base font-bold text-gray-900">{t("table.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingRecords.length > 0 ? parkingRecords.map((r, i) => (
                      <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{new Date(r.entry_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.detected_plate}</td>
                        <td className="px-4 py-3 text-center"><div className="flex justify-center"><div className={`w-4 h-4 rounded-full ${r.exit_time ? "bg-red-500" : "bg-green-500"}`} /></div></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">{t("table.noRecords")}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right: Charts */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Summary */}
          {chartData?.summary && (
            <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="text-sm text-gray-800">{t("dashboard.totalRecords")}</div><div className="text-xl font-bold text-gray-600">{chartData.summary.total_records}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="text-sm text-gray-800">{t("dashboard.currentlyParked")}</div><div className="text-xl font-bold text-green-600">{chartData.summary.currently_parked}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="text-sm text-gray-800">{t("dashboard.todayEntries")}</div><div className="text-xl font-bold text-blue-600">{chartData.summary.today_entries}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="text-sm text-gray-800">{t("dashboard.totalRevenue")}</div><div className="text-xl font-bold text-teal-600">฿{Number(chartData.summary.total_revenue).toFixed(2)}</div></div>
              </div>
            </div>
          )}

          {/* Floor status cards */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { label: t("parking.floor1vip"),  data: parkingData.floor1VIP,    dotColor: "bg-amber-500",  barColor: "bg-amber-500" },
                { label: t("parking.floor1"),     data: parkingData.floor1Member, dotColor: "bg-blue-600",   barColor: "bg-blue-600" },
                { label: t("parking.floor2"),     data: parkingData.floor2,       dotColor: "bg-teal-500",   barColor: "bg-teal-500" },
                { label: t("parking.floor3"),     data: parkingData.floor3,       dotColor: "bg-violet-500", barColor: "bg-violet-500" },
                { label: t("parking.floor4"),     data: parkingData.floor4,       dotColor: "bg-red-500",    barColor: "bg-red-500" },
              ].map((f) => (
                <div key={f.label} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${f.dotColor}`} />
                      <h3 className="text-base font-bold text-gray-800">{f.label}</h3>
                    </div>
                    <p className="text-base font-bold text-gray-700">{f.data.used}/{f.data.total}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${f.barColor} rounded-full transition-all duration-500`} style={{ width: `${pct(f.data.used, f.data.total)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart controls */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg border border-gray-00 p-1 flex gap-1">
                {(["line", "bar"] as const).map((type) => (
                  <button key={type} onClick={() => setChartType(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === type ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                    {type === "line" ? t("dashboard.lineChart") : t("dashboard.barChart")}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 flex gap-1 flex-wrap">
                {(["hour", "day", "week", "month", "year"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedRange === range ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {chartViews[range].label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("dashboard.loadingData")}</div>
            ) : (
              <>
                <div className="h-[250px]">
                  {chartType === "line"
                    ? <Line data={activeChart.lineD} options={activeChart.lineO} />
                    : <Bar data={activeChart.barD} options={activeChart.barO} />}
                </div>
              </>
            )}
          </div>

          {/* Pie charts by floor groups */}
          <div className="bg-white rounded-lg p-4 shadow-sm mt-4 mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  {t("parking.floor1vip")} + {t("parking.floor1")}
                </h3>
                <div className="h-56 mb-4">
                  <Pie data={floor1PieData} options={pieOptions} />
                </div>
                <div className="space-y-2">
                  {[
                    { label: t("parking.floor1vip"), color: "bg-amber-500" },
                    { label: t("parking.floor1"), color: "bg-blue-600" },
                    { label: t("parking.available"), color: "bg-gray-200" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={`inline-block w-4 h-4 rounded-sm ${item.color}`} />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  {t("parking.floor2")}, {t("parking.floor3")}, {t("parking.floor4")}
                </h3>
                <div className="h-56 mb-4">
                  <Pie data={floor2To4PieData} options={pieOptions} />
                </div>
                <div className="space-y-2">
                  {[
                    { label: t("parking.floor2"), color: "bg-teal-500" },
                    { label: t("parking.floor3"), color: "bg-violet-500" },
                    { label: t("parking.floor4"), color: "bg-red-500" },
                    { label: t("parking.available"), color: "bg-gray-200" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={`inline-block w-4 h-4 rounded-sm ${item.color}`} />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
