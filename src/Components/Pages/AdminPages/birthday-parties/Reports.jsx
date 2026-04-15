import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Users,
  PoundSterling,
  Calendar,
  Clock,
  UserPlus,
  RotateCcw,
  Download,
  EllipsisVertical,
   
} from "lucide-react";

 
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PiUsersThreeBold } from "react-icons/pi";
import {
  Database,
  CirclePercent,
  CirclePoundSterling,
  PackageOpen,
  Box,
  Plus,
} from "lucide-react";
import { color } from "framer-motion";
import { showError } from "../../../../utils/swalHelper";

export default function BirthdayReports() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("adminToken");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [activeTab, setActiveTab] = useState("age");
  const [packageActiveTab, setPackageActiveTab] = useState("revenue");
  const [mainData, setMainData] = useState([]);
  const [packageData, setPackageData] = useState([]);
  const filterOptions = [
    { value: "lastMonth", label: "Last Month" },
    { value: "last3Months", label: "Last 3 Months" },
    { value: "last6Months", label: "Last 6 Months" }
  ];

  /** =====================
   * ✅ Fetch Reports
   * ===================== */
  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      // add ?filterType=selectedFilter?.value
      const url = `${API_BASE_URL}/api/admin/birthday-party/analytics${selectedFilter?.value ? `?filterType=${selectedFilter.value}` : ""
        }`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      if (!result.status) {
        showError(result.message || "Something went wrong while fetching analytics data.");
        return;
      }

      setData(result);
      setSummary(result.summary || {});
      setCharts(result.charts || {});
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token, selectedFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /** =====================
   * ✅ Stat Cards
   * ===================== */
  useEffect(() => {
    const enrolledData = charts?.currentYear?.packageBackground || [];
    let formatted = [];

    const findDataByKey = (key) => {
      const item = enrolledData.find(obj => obj[key]);
      return item ? item[key] : [];
    };

    if (packageActiveTab === "revenue") {
      const totals = findDataByKey("revenue");
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }
    else if (packageActiveTab === "growth") {
      const totals = findDataByKey("growth");
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }
    else if (packageActiveTab === "other") {
      const totals = findDataByKey("other");
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }

    setPackageData(formatted);
  }, [packageActiveTab, charts]);


  useEffect(() => {
    const enrolledData = charts?.currentYear?.partyBooking?.[0] || {};

    let formatted = [];

    if (activeTab === "total") {
      const totals = enrolledData.byTotal || [];
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }
    else if (activeTab === "age") {
      const totals = enrolledData.byAge || [];
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }
    else if (activeTab === "venue") {
      const totals = enrolledData.byVenue || [];
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }
    else {
      const totals = enrolledData.byGender || [];
      formatted = totals.map(v => ({
        label: v.name,
        value: v.percentage,
        count: v.count,
      }));
    }

    setMainData(formatted);
  }, [activeTab, charts]);


  /** =====================
   * ✅ Chart Data
   * ===================== */
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentMonthName = currentDate.toLocaleString("default", { month: "long" });

  const allMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const fullToShort = {
    January: "Jan", February: "Feb", March: "Mar", April: "Apr",
    May: "May", June: "Jun", July: "Jul", August: "Aug",
    September: "Sep", October: "Oct", November: "Nov", December: "Dec",
  };

  // Step 1: Convert API data to dictionary for easy merge
  const existingData = {};
  (charts?.currentYear?.monthlyStudents || []).forEach(item => {
    const short = fullToShort[item.month] || item.month;
    existingData[short] = item.students;
  });
  const currentYearData = {};
  (charts?.currentYear?.monthlyStudents || []).forEach(item => {
    const m = fullToShort[item.month] || item.month;
    currentYearData[m] = item.students;
  });

  const lastYearData = {};
  (charts?.lastYear?.monthlyStudents || []).forEach(item => {
    const m = fullToShort[item.month] || item.month;
    lastYearData[m] = item.students;
  });
  // Step 2: Add current month if missing
  if (charts?.thisMonth && !existingData[currentMonthName]) {
    existingData[currentMonthName] = charts.thisMonth.students;
  }

  // Step 3: Build final data (past + current + future)
  const lineData = allMonths.map((month, index) => ({
    month,

    // current year stops at current month
    currentStudents:
      index <= currentMonthIndex
        ? currentYearData[month] ?? 0
        : null,

    // last year always full
    previousStudents: lastYearData[month] ?? 0,
  }));

  const marketingData =
    charts?.currentYear?.marketChannelPerformance?.map((m) => ({
      name: m.name,
      percentage: m.percentage?.toFixed(1) ?? 0,
      percentText: `${m.percentage?.toFixed(1) ?? 0}%`,
      value: m.count ?? 0,
    })) || [];

  const topAgents =
    charts?.currentYear?.topAgents?.map((a) => ({
      name: `${a.creator?.firstName} ${a.creator?.lastName}`,
      value: a.leadCount,
      avatar: a?.creator?.profile || a.creator?.profile?.[0],
    })) || [];

  const pieData = charts?.currentYear?.packageBreakdown || [];
  const renewalData = charts?.currentYear?.renewalBreakdown || [];
  const revenueByPackage = charts?.currentYear?.revenueByPackage || [];
  const averageBirthdayChild = charts?.currentYear?.averageBirthdayChild || {};

  const COLORS = ["#7C3AED", "#FBBF24", "#60A5FA", "#10B981"];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: "10px",
      borderColor: "#ddd",
    }),
  };
  const parsePercent = (value) =>
    typeof value === "string"
      ? parseFloat(value.replace("%", "")) || 0
      : Number(value) || 0;

  /** =====================
   * ✅ Data Export
   * ===================== */
  const goldData = revenueByPackage.find(pkg => pkg.name === "Gold");
  const silverData = revenueByPackage.find(pkg => pkg.name === "Silver");
console.log('summary',summary)
  const statCards = [
    {
      icon: '/reportsIcons/user-group.png',
      iconStyle: "bg-[#E8F7FC] text-[#3DAFDB]",  // light cyan
      title: "Total Leads",
      value: summary?.totalLeads?.thisYear ?? 0,
      sub1: `vs. previous period `,
      sub2: `${summary?.totalLeads?.lastYear ?? 0}`,
      color: Number(summary?.totalLeads?.thisYear) <= Number(summary?.totalLeads?.lastYear)
        ? "text-green-600"
        : "text-red-600",

    },
    {
      icon: '/reportsIcons/Coins.png',
      iconStyle: "bg-[#EAE8FF] text-[#6F65F1]", // light violet
      title: "Number of Sales",
      value: summary?.numberOfSales?.thisYear ?? 0,
      sub1: `vs. previous period `,
      sub2: `${summary?.numberOfSales?.lastYear ?? 0}`,
      color: Number(summary?.numberOfSales?.thisYear) <= Number(summary?.numberOfSales?.lastYear)
        ? "text-green-600"
        : "text-red-600",
    },
    {
      icon: '/reportsIcons/Percent.png',
      iconStyle: "bg-[#E9F7EE] text-[#34AE56]", // light green
      title: "Conversion Rate",
      value: summary?.conversionRate?.thisYear ?? "0%",
      sub1: `vs. previous period `,
      sub2: `${summary?.conversionRate?.lastYear ?? "0%"}`,
      color: parsePercent(summary?.conversionRate?.thisYear) <= parsePercent(summary?.conversionRate?.lastYear)
        ? "text-green-600"
        : "text-red-600",
    },
    {
      icon: '/reportsIcons/pound.png',
      iconStyle: "bg-[#FCE9F3] text-[#E769BD]", // light pink
      title: "Revenue Generated",
      value: `£${summary?.revenueGenerated?.thisYear ?? "£0"}`,
      sub1: `vs. previous period `,
      sub2: ` ${summary?.revenueGenerated?.lastYear ?? "£0"}`,
      color:
        Number(summary?.revenueGenerated?.thisYear ?? 0) <=
          Number(summary?.revenueGenerated?.lastYear ?? 0)
          ? "text-green-600"
          : "text-red-600",

    },
    {
      icon: '/reportsIcons/Package.png',
      iconStyle: "bg-[#E5F7F7] text-[#099699]", // light teal
      title: "Revenue Gold Package",
      value: `£${summary?.packageRevenue?.gold?.thisYear}`,
      sub1: `vs. previous period `,
      sub2: `£${summary?.packageRevenue?.gold?.lastYear}`,
      color: Number(summary?.packageRevenue?.gold?.thisYear) <= Number(summary?.packageRevenue?.gold?.lastYear)
        ? "text-green-600"
        : "text-red-600",

    },
    {
      icon: '/reportsIcons/silver-package.png',
      iconStyle: "bg-[#FFF1E9] text-[#F38B4D]", // light orange
      title: "Revenue Silver Package",
      value: `£${summary?.packageRevenue?.silver?.thisYear}`,
      sub1: `vs. previous period `,
      sub2: `£${summary?.packageRevenue?.silver?.lastYear}`,
      color: Number(summary?.packageRevenue?.silver?.thisYear) <= Number(summary?.packageRevenue?.silver?.lastYear)
        ? "text-green-600"
        : "text-red-600",
    },
  ];

  const handleExportData = (type = "excel") => {
    try {
      const exportRows = [
        { Metric: "Total Leads", Value: summary?.totalLeads?.thisYear ?? 0 },
        { Metric: "Number of Sales", Value: summary?.numberOfSales?.thisYear ?? 0 },
        { Metric: "Conversion Rate", Value: summary?.conversionRate?.thisYear ?? 0 },
        { Metric: "Renewal Rate", Value: summary?.renewalRate?.thisYear ?? 0 },
        { Metric: "Revenue", Value: summary?.revenue?.thisYear ?? 0 },
      ];

      if (["excel", "csv"].includes(type)) {
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Analytics");

        const fileType = type === "excel" ? "xlsx" : "csv";
        const fileData = XLSX.write(wb, { bookType: fileType, type: "array" });

        const blob = new Blob([fileData], {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        saveAs(blob, `OneToOne_Analytics_${new Date().toISOString().split("T")[0]}.${fileType}`);
      }

      if (type === "pdf") {
        const doc = new jsPDF();
        doc.text("One-to-One Analytics Summary", 14, 20);

        const pdfTable = [
          ["Metric", "Value"],
          ...exportRows.map((r) => [r.Metric, String(r.Value)]),
        ];

        doc.autoTable({
          startY: 30,
          head: [pdfTable[0]],
          body: pdfTable.slice(1),
        });

        doc.save(`OneToOne_Analytics_${new Date().toISOString().split("T")[0]}.pdf`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      showError(error.message || "Something went wrong during export.");
    }
  };

  console.log('revenueByPackage', revenueByPackage);
  /** =====================
   * ✅ UI Layout
   * ===================== */
  return (
    <div className="">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Birthday Party</h1>
          <div className="flex items-center space-x-3">
            <Select
              value={selectedFilter}
              onChange={(value) => {
                setSelectedFilter(value);
                fetchReports(); // call API immediately when changed (optional)
              }}
              options={filterOptions}
              styles={customStyles}
              classNamePrefix="react-select"
              isSearchable={false}
              isClearable={true} // ✅ enables remove/clear
              placeholder="Select duration"
            />
            <button
              onClick={() => handleExportData("excel")}
              className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow"
            >
              <Plus size={16} /> Export data
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-white flex items-center gap-3 rounded-[20px] p-4 shadow-sm"
              >
                <div
                  className={`p-2 h-[50px] w-[50px] rounded-full flex items-center justify-center ${s.iconStyle} bg-opacity-10`}
                >
                  <img src={Icon} alt="" className="p-1" />
                </div>
                <div>
                  <div className="text-[14px] text-[#717073] font-semibold">{s.title}</div>
                  <div className="text-[20px] text-black font-semibold">{s.value}</div>
                  <div className={`text-[12px] text-[#717073] font-semibold`}>{s.sub1} <span className={` ${s.color}`}>{s.sub2}</span></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts + Insights Section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column */}
          <div className="space-y-6 md:w-[75%] md:pe-6">
            {/* Students Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold mb-4">Total Students</h3>

                <EllipsisVertical className="text-gray-500" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>

                    {/* Gradient */}
                   <defs>
  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.35} />
    <stop offset="70%" stopColor="#60A5FA" stopOpacity={0.15} />
    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
  </linearGradient>
</defs>


                    {/* Grid */}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EEF2F7"
                      vertical={false}
                    />

                    {/* X Axis */}
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />
   {/* Current Year Line */}
                    <Line
                      type="monotone"
                      dataKey="currentStudents"
                      stroke="#3B5BFF"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />

                    {/* Previous Year Line */}
                    <Line
                      type="monotone"
                      dataKey="previousStudents"
                      stroke="#F472B6"     // soft pink
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    {/* Y Axis */}
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />

                    {/* Tooltip */}
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />

                    {/* Area (Current Year Only) */}
                    <Area
                      type="monotone"
                      dataKey="currentStudents"
                      stroke="none"
                      fill="url(#currentGradient)"
                      fillOpacity={1}
                      tooltipType="none"
                    />

                 

                  </LineChart>
                </ResponsiveContainer>



              </div>
            </div>

            {/* Marketing + Top Agents */}
            <div className="md:grid grid-cols-2 gap-6">
              {/* Marketing */}
              <div>

                <div className="bg-white rounded-2xl p-4 md:max-h-[500px] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-800 font-semibold ">
                      Package Background
                    </h3>
                    <EllipsisVertical className="text-gray-500" />
                  </div>

                  {/* Tabs */}
                  <div className="flex border border-[#E2E1E5] rounded-lg p-1 w-full mb-5">
                    <button
                      onClick={() => setPackageActiveTab("revenue")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${packageActiveTab === "revenue"
                        ? "bg-[#237FEA] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setPackageActiveTab("growth")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${packageActiveTab === "growth"
                        ? "bg-[#237FEA] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      Growth
                    </button>
                  </div>

                  {/* Chart Bars */}
                  <div>
                    {packageData.map((item, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between gap-3 items-center mb-1">
                          <p className="text-xs text-[#344054] font-semibold">
                            {item.label}
                          </p>
                          <div className="w-full bg-gray-100 h-2 rounded-full relative">
                            <div
                              className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${item.value}%` }}
                            ></div>

                            {/* Example floating label (only for first item) */}

                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {item.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 mt-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold mb-4">Marketing Channel Performance</h3>

                    <EllipsisVertical className="text-gray-500" />
                  </div>
                  <div className="space-y-4">
                    {marketingData.map((m, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="text-slate-600">{m.name}</div>

                        </div>

                        {/* Wrapper (hover trigger) */}
                        <div className="relative group">

                          {/* Tooltip */}
                          <div
                            className="absolute -top-8 opacity-0 group-hover:opacity-100 
                       transition-opacity duration-200 text-xs
                       bg-white text-black px-2 py-1 rounded-full shadow-md 
                       pointer-events-none border border-slate-200"
                            style={{
                              left: `${m.percentage}%`,
                              transform: "translateX(-50%)"
                            }}
                          >
                            {m.percentage}%
                          </div>

                          {/* Bar */}
                          <div className="flex gap-2 justify-between items-center">
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                              <div
                                className="h-3 rounded-full bg-blue-500"
                                style={{ width: `${m.percentage}%` }}
                              />
                            </div>
                            <div className="text-slate-400">{m.percentText}</div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              </div>
              <div>
                <div className="bg-white rounded-2xl p-4 md:max-h-[500px] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-800 font-semibold ">
                      Party Booking
                    </h3>
                    <EllipsisVertical className="text-gray-500" />
                  </div>

                  {/* Tabs */}
                  <div className="flex border border-[#E2E1E5] rounded-lg p-1 w-full mb-5">
                    <button
                      onClick={() => setActiveTab("total")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "total"
                        ? "bg-[#237FEA] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      By Total
                    </button>
                    <button
                      onClick={() => setActiveTab("age")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "age"
                        ? "bg-[#237FEA] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      By Age
                    </button>
                    <button
                      onClick={() => setActiveTab("gender")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "gender"
                        ? "bg-[#237FEA] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      By Gender
                    </button>
                  </div>

                  {/* Chart Bars */}
                  <div>
                    {mainData.map((item, i) => (
                      <div key={i} className="mb-4">


                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#344054] font-semibold">{item.label}</p>

                          <div className="relative group w-full bg-gray-100 h-2 rounded-full">

                            {/* Tooltip */}
                            <div
                              className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 
        text-xs bg-white text-black px-2 py-1 rounded-full shadow-md pointer-events-none 
        border border-slate-200"
                              style={{
                                left: `${item.value}%`,
                                transform: "translateX(-50%)",
                              }}
                            >
                              {item.value}%
                            </div>

                            {/* Progress Fill */}
                            <div
                              className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${item.value}%` }}
                            ></div>

                            {/* Floating Label for First Item */}

                          </div>
                          <span className="text-xs text-gray-500 font-medium">{item.value}%</span>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
                <div className="bg-white p-5 mt-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold mb-4">Top Agents</h3>

                    <EllipsisVertical className="text-gray-500" />
                  </div>
                  <div className="space-y-4">
                    {topAgents.map((a, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-700">
                          {a.avatar ? (
                            <img
                              src={a.avatar}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : null}

                        </div>
                        <div className="flex-1 items-center">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium">{a.name}</div>

                          </div>
                          <div className="flex justify-between gap-1 items-center">
                            <div className="w-full bg-slate-100 h-2 rounded-full  overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-blue-400"
                                style={{ width: `${(a.value / 10) * 100}%` }}
                              />
                            </div>
                            <div className="text-sm text-slate-400">{a.value}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Top Agents */}
            </div>
          </div>

          {/* Right column */}
          <div className="md:w-[25%] space-y-6">

            {/* Revenue by Package */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold mb-4">Revenue by Package</h3>
                <EllipsisVertical className="text-gray-500" />
              </div>
              <div className="space-y-3">
                {revenueByPackage.map((pkg, idx) => (
                  <div key={idx} className="  rounded-lg">
                    <div className="">
                      <div>
                        <div className="text-[20px] font-semibold text-[#101828]">{pkg.name}</div>
                        <div className="font-semibold text-[#717073] text-[16px]">£{pkg.currentRevenue}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className=" ">
                          <img src="/images/icons/growth.png" alt="" className="w-[60px]" />
                        </div>
                        <div className="">
                          <div className="text-[16px] font-semibold">Revenue Growth</div>
                          <div className="font-semibold  ">{pkg.revenueGrowth}%</div>
                          <div
                            className={`text-xs font-semibold ${pkg.revenueGrowth < 0 ? "text-red-500" : "text-[#717073]"
                              }`}
                          >
                            vs last month {pkg.lastRevenue}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">


              <div className="flex items-center gap-4">
                <div className=" ">
                  <img src="/images/icons/bdy.png" alt="" className="w-[60px]" />
                </div>
                <div className="">
                  <div className="font-semibold text-[#717073] text-[14px]">Average of Birthday Child</div>
                  <div
                    className={`text-[20px] font-semibold`}
                  >
                    {averageBirthdayChild.label}
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
