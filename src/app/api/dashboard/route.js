import { executeQuery } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get("type") || "all";
    const dateParam =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    let responseData = {};

    if (chartType === "all" || chartType === "day") {
      responseData.dayData = await getDayData(dateParam);
    }

    if (chartType === "all" || chartType === "month") {
      responseData.monthData = await getMonthData(dateParam);
    }

    if (chartType === "all" || chartType === "year") {
      responseData.yearData = await getYearData(dateParam);
    }

    if (chartType === "all" || chartType === "multi-year") {
      responseData.multiYearData = await getMultiYearData();
    }

    if (chartType === "all") {
      responseData.summary = await getSummaryData(dateParam);
    }

    return Response.json({
      success: true,
      type: chartType,
      date: dateParam,
      data: responseData,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}

async function getDayData(date) {
  const query =
    "SELECT HOUR(check_in_time) as hour, COUNT(*) as total_entries, COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as completed, COUNT(CASE WHEN check_out_time IS NULL THEN 1 END) as currently_parked, COALESCE(SUM(fee), 0) as total_revenue FROM parking_records WHERE DATE(check_in_time) = ? GROUP BY HOUR(check_in_time) ORDER BY hour";

  const results = await executeQuery(query, [date]);

  // หาชั่วโมงล่าสุดของวันที่เลือก
  const selectedDate = new Date(date + 'T00:00:00');
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();
  const maxHour = isToday ? now.getHours() : 23;

  const hourlyData = Array.from({ length: maxHour + 1 }, (_, hour) => {
    const found = results.find((r) => r.hour === hour);
    return {
      hour: hour,
      label: hour + ":00",
      total_entries: found ? found.total_entries : 0,
      completed: found ? found.completed : 0,
      currently_parked: found ? found.currently_parked : 0,
      total_revenue: found ? parseFloat(found.total_revenue) : 0,
    };
  });

  return hourlyData;
}

async function getMonthData(date) {
  const parts = date.split("-");
  const year = parts[0];
  const month = parts[1];
  const daysInMonth = new Date(year, month, 0).getDate();

  // หาวันล่าสุดที่จะแสดง
  const selectedDate = new Date(date + 'T00:00:00');
  const now = new Date();
  const isCurrentMonth = selectedDate.getFullYear() === now.getFullYear() && 
                         selectedDate.getMonth() === now.getMonth();
  const maxDay = isCurrentMonth ? now.getDate() : daysInMonth;

  // ถ้าเลือกเดือนในอนาคต ไม่แสดงข้อมูล
  if (selectedDate > now) {
    return [];
  }

  const query =
    "SELECT DAY(check_in_time) as day, COUNT(*) as total_entries, COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as completed, COUNT(CASE WHEN check_out_time IS NULL THEN 1 END) as currently_parked, COALESCE(SUM(fee), 0) as total_revenue FROM parking_records WHERE YEAR(check_in_time) = ? AND MONTH(check_in_time) = ? GROUP BY DAY(check_in_time) ORDER BY day";

  const results = await executeQuery(query, [year, month]);

  const dailyData = Array.from({ length: maxDay }, (_, index) => {
    const day = index + 1;
    const found = results.find((r) => r.day === day);
    return {
      day: day,
      label: String(day),
      total_entries: found ? found.total_entries : 0,
      completed: found ? found.completed : 0,
      currently_parked: found ? found.currently_parked : 0,
      total_revenue: found ? parseFloat(found.total_revenue) : 0,
    };
  });

  return dailyData;
}

async function getYearData(date) {
  const parts = date.split("-");
  const year = parts[0];
  const selectedMonth = parseInt(parts[1]);
  
  const selectedDate = new Date(date + 'T00:00:00');
  const now = new Date();
  
  // หาเดือนล่าสุดที่จะแสดง (นับตั้งแต่เดือนมกราคมจนถึงเดือนของวันที่เลือก)
  const isCurrentYear = parseInt(year) === now.getFullYear();
  const maxMonth = isCurrentYear ? Math.min(selectedMonth, now.getMonth() + 1) : selectedMonth;

  // ถ้าเลือกปีในอนาคต ไม่แสดงข้อมูล
  if (parseInt(year) > now.getFullYear()) {
    return [];
  }

  const query =
    "SELECT MONTH(check_in_time) as month, COUNT(*) as total_entries, COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as completed, COUNT(CASE WHEN check_out_time IS NULL THEN 1 END) as currently_parked, COALESCE(SUM(fee), 0) as total_revenue FROM parking_records WHERE YEAR(check_in_time) = ? AND MONTH(check_in_time) <= ? GROUP BY MONTH(check_in_time) ORDER BY month";

  const results = await executeQuery(query, [year, maxMonth]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyData = Array.from({ length: maxMonth }, (_, index) => {
    const month = index + 1;
    const found = results.find((r) => r.month === month);
    return {
      month: month,
      label: monthNames[index],
      total_entries: found ? found.total_entries : 0,
      completed: found ? found.completed : 0,
      currently_parked: found ? found.currently_parked : 0,
      total_revenue: found ? parseFloat(found.total_revenue) : 0,
    };
  });

  return monthlyData;
}

async function getMultiYearData() {
  const query =
    "SELECT YEAR(check_in_time) as year, COUNT(*) as total_entries, COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as completed, COUNT(CASE WHEN check_out_time IS NULL THEN 1 END) as currently_parked, COALESCE(SUM(fee), 0) as total_revenue FROM parking_records GROUP BY YEAR(check_in_time) ORDER BY year";

  const results = await executeQuery(query);

  // Get range of years from database or use default range
  const currentYear = new Date().getFullYear();
  const startYear = results.length > 0 ? Math.min(...results.map(r => r.year)) : currentYear - 5;
  const endYear = currentYear + 5;

  const yearlyData = [];
  for (let year = startYear; year <= endYear; year++) {
    const found = results.find((r) => r.year === year);
    yearlyData.push({
      year: year,
      label: String(year),
      total_entries: found ? found.total_entries : 0,
      completed: found ? found.completed : 0,
      currently_parked: found ? found.currently_parked : 0,
      total_revenue: found ? parseFloat(found.total_revenue) : 0,
    });
  }

  return yearlyData;
}

async function getSummaryData(date) {
  // Get total records from all time
  const totalRecordsQuery = `
    SELECT COUNT(*) as total_records
    FROM parking_records
  `;
  const totalRecordsResult = await executeQuery(totalRecordsQuery);
  const totalRecords = totalRecordsResult[0].total_records;

  // Get currently parked vehicles (from all time)
  const currentlyParkedQuery = `
    SELECT COUNT(*) as currently_parked
    FROM parking_records
    WHERE check_out_time IS NULL
  `;
  const currentlyParkedResult = await executeQuery(currentlyParkedQuery);
  const currentlyParked = currentlyParkedResult[0].currently_parked;

  // Get data for the selected date
  const dateQuery = `
    SELECT 
      COUNT(*) as today_entries,
      COALESCE(SUM(fee), 0) as today_revenue,
      COUNT(DISTINCT detected_plate) as unique_vehicles 
    FROM parking_records
    WHERE DATE(check_in_time) = ?
  `;
  const dateResults = await executeQuery(dateQuery, [date]);
  const dateSummary = dateResults[0];

  return {
    total_records: totalRecords,
    currently_parked: currentlyParked,
    today_entries: dateSummary.today_entries,
    today_revenue: parseFloat(dateSummary.today_revenue),
    total_revenue: parseFloat(dateSummary.today_revenue), // แสดงรายได้รายวัน
    unique_vehicles: dateSummary.unique_vehicles,
  };
}
