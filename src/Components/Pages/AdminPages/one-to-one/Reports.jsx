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
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PiUsersThreeBold } from "react-icons/pi";
import {
  Database,
  EllipsisVertical,
  CirclePercent,
  CirclePoundSterling,
  PackageOpen,
  Box,
  Plus,
} from "lucide-react";
import { showError } from "../../../../utils/swalHelper";

export default function Reports() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("adminToken");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [selectedFilter, setSelectedFilter] = useState(null);

  const filterOptions = [
    { value: "lastMonth", label: "Last Month" },
    { value: "last3Months", label: "Last 3 Months" },
    { value: "last6Months", label: "Last 6 Months" },
  ];

  /** =====================
   * ✅ Fetch Reports
   * ===================== */
  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      // add ?filterType=selectedFilter?.value
      const url = `${API_BASE_URL}/api/admin/one-to-one/analytics${selectedFilter?.value ? `?filterType=${selectedFilter.value}` : ""
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
        showError("Fetch Failed", result.message || "Something went wrong while fetching analytics data.");

        return;
      }

      setData(result);
      setSummary(result.summary || {});
      setCharts(result.charts || {});
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      showError("Fetch Failed", error.message || "An error occurred while fetching report data.");
   
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

  // Step 1: Convert API data to dictionary for easy merge
  const fullToShort = {
    January: "Jan", February: "Feb", March: "Mar", April: "Apr",
    May: "May", June: "Jun", July: "Jul", August: "Aug",
    September: "Sep", October: "Oct", November: "Nov", December: "Dec",
  };

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
  if (charts?.currentYear?.thisMonth && !existingData[currentMonthName]) {
    existingData[currentMonthName] = charts.currentYear.thisMonth.students;
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
      name: `${a.creator.firstName} ${a.creator.lastName}`,
      value: a.leadCount,
      avatar: a.creator.profile,
    })) || [];
  console.log('topAgents', topAgents)
  const pieData = charts?.currentYear?.packageBreakdown || [];
  const renewalData = charts?.currentYear?.renewalBreakdown || [];
  const revenueByPackage = charts?.currentYear?.revenueByPackage || [];
  console.log('pieData', pieData)
  const COLORS = ["#7C3AED", "#FBBF24", "#60A5FA", "#10B981"];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      padding: '2px',
      borderRadius: "10px",
      borderColor: "#ddd",
    }),
  };

  /** =====================
   * ✅ Data Export
   * ===================== */
  const handleExportData = (type = "excel") => {
    try {
      const exportRows = [
        { Metric: "Total Leads", Value: summary?.totalLeads?.thisMonth ?? 0 },
        { Metric: "Number of Sales", Value: summary?.numberOfSales?.thisMonth ?? 0 },
        { Metric: "Conversion Rate", Value: summary?.conversionRate?.thisMonth ?? 0 },
        { Metric: "Renewal Rate", Value: summary?.renewalRate?.thisMonth ?? 0 },
        { Metric: "Revenue", Value: summary?.revenue?.thisMonth ?? 0 },
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
      showError("Export Failed", error.message || "Something went wrong during export.");
   
    }
  };

  const parsePercent = (value) =>
    typeof value === "string"
      ? parseFloat(value.replace("%", "")) || 0
      : Number(value) || 0;

  const statCards = [
    {
      icon: '/reportsIcons/user-group.png',
      iconStyle: "bg-[#D9F1FB]",
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
      iconStyle: "bg-[#E3E1FB]",
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
      iconStyle: "bg-[#DDF5E6]",
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
      iconStyle: "bg-[#FBE3F2]",
      title: "Revenue Generated",
      value: summary?.revenueGenerated?.thisYear ?? "£0",
      sub1: `vs. previous period `,
      sub2: `${summary?.revenueGenerated?.lastYear ?? "£0"}`,
      color:
        Number(summary?.revenueGenerated?.thisYear ?? 0) <=
          Number(summary?.revenueGenerated?.lastYear ?? 0)
          ? "text-green-600"
          : "text-red-600",
    },
    {
      icon: '/reportsIcons/Package.png',
      iconStyle: "bg-[#D4F3F3]",
      title: "Revenue Gold Package",
      value: `£${summary?.revenueGoldPackage?.thisYear?.toLocaleString() ?? 0}`,
       sub1: `vs. previous period `,
      sub2: `£${summary?.revenueGoldPackage?.lastYear}`,
      color: Number(summary?.revenueGoldPackage?.thisYear) <= Number(summary?.revenueGoldPackage?.lastYear)
        ? "text-green-600"
        : "text-red-600",
    },
    {
      icon: '/reportsIcons/silver-package.png',
      iconStyle: "bg-[#FDE6D7]",
      title: "Revenue Silver Package",
      value: `£${summary?.revenueSilverPackage?.thisYear?.toLocaleString() ?? 0}`,
      sub1: `vs. previous period `,
      sub2: `£${summary?.revenueSilverPackage?.lastYear}`,
      color: Number(summary?.revenueSilverPackage?.thisYear) <= Number(summary?.revenueSilverPackage?.lastYear)
        ? "text-green-600"
        : "text-red-600",
    },
  ];

  console.log('marketingData', marketingData)
  /** =====================
   * ✅ UI Layout
   * ===================== */
  return (
    <div className="">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">One to One</h1>
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
              <div className="flex justify-between mb-4">

                <h2 className="font-semibold text-[24px] ">One to One Students</h2><EllipsisVertical />
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


                    {/* Current Year Line */}
                    <Line
                      type="monotone"
                      dataKey="currentStudents"
                      stroke="#3B82F6"   // slightly deeper blue
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />


                    {/* Previous Year Line */}
                    <Line
                      type="monotone"
                      dataKey="previousStudents"
                      stroke="#F472B6"
                      strokeWidth={2}
                      dot={false}
                    />


                  </LineChart>
                </ResponsiveContainer>



              </div>
            </div>

            {/* Marketing + Top Agents */}
            <div className="md:grid grid-cols-2 gap-6">
              {/* Marketing */}
              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between item-center">
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



              {/* Top Agents */}
              <div className="bg-white p-5 rounded-2xl shadow-sm">

                <div className="flex justify-between item-center">
                  <h3 className="font-semibold mb-4">Top Agents</h3>
                  <EllipsisVertical className="text-gray-500" />
                </div>
                <div className="space-y-4">
                  {topAgents.map((a, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-medium text-indigo-700">

                        <img src={a.avatar || '/members/dummyuser.png'} alt="" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="text-sm font-medium">{a.name}</div>

                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
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
          </div>

          {/* Right column */}
          <div className="md:w-[25%] space-y-6">
            {/* Package Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold ">Package Breakdown</h3><EllipsisVertical />
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      labelLine={false}
                      label={({ cx, cy, midAngle, outerRadius, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 20;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#000"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-sm font-semibold"
                          >
                            {pieData[index]?.percentage}%
                          </text>
                        );
                      }}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>


                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-sm mt-2">
                {pieData.map((p, idx) => (
                  <div key={idx}>
                    <div className="text-slate-500 flex gap-1 capitalize"><span className="" style={{ color: COLORS[idx % COLORS.length] }}>●</span>
                      {p.name}</div>
                    <div className="font-semibold pl-3 mt-2">{p.value ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Renewal Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between item-center mb-2">
                <h3 className="font-semibold mb-4">Renewal </h3>
                <EllipsisVertical className="text-gray-500" />
              </div>

              {renewalData.map((r, idx) => {
                const percent = r.percentage ?? 0; // fallback

                return (
                  <div key={idx} className="mb-3">
                    {/* Label + % */}
                    <div className="flex justify-between text-sm mb-1">
                      <div>{r.name}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex justify-between items-center gap-2"> <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-3 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                      <p className="text-xs md:w-[10%]">{percent}%</p>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Revenue by Package */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between item-center mb-2">
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
                          <div className="font-semibold text-[24px] ">{pkg.revenueGrowth}%</div>
                          <div
                            className={`text-xs font-semibold ${pkg.revenueGrowth < 0 ? "text-red-500" : "text-[#717073]"
                              }`}
                          >
                            vs last month {pkg.lastRevenueGrowth}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
