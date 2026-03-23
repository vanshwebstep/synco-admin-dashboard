import { useState, useCallback, useEffect } from "react";
import Select from "react-select";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    CartesianGrid
} from "recharts";

import Loader from "../contexts/Loader";

const MembersDashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [activeTab, setActiveTab] = useState("age");
    const [mainData, setMainData] = useState([]);
    const [membersData, setMembersData] = useState([]);
    const [loading, setLoading] = useState(false);

    const venueOptions = [
        { value: "all", label: "All venues" },
        { value: "london", label: "London" },
        { value: "manchester", label: "Manchester" },
    ];



    const dateOptions = [
        { value: "thisMonth", label: "This Month" },
        { value: "thisQuarter", label: "This Quarter" },
        { value: "thisYear", label: "This Year" },
    ];

    const currentYear = new Date().getFullYear().toString();
    const yearData = membersData?.yealyGrouped?.[currentYear] || {};
    const monthlyData = membersData || {};

    const currentMonth = (new Date().getMonth() + 1).toString();
    const monthData = yearData?.monthlyGrouped?.[currentMonth] || {};

    // ------------------ TOTAL MEMBERS ------------------
    const getMonthlyMembers = (data) => {
        if (!data?.yealyGrouped) return {};

        const yearKeys = Object.keys(data.yealyGrouped);
        const yearData = data.yealyGrouped[yearKeys[0]];
        const monthly = yearData?.monthlyGrouped || {};

        let result = {};

        Object.keys(monthly).forEach((monthKey) => {
            const bookings = monthly[monthKey].bookings || [];
            let count = 0;

            bookings.forEach((b) => {
                if (b.students?.length > 0) count += b.students.length;
            });

            result[monthKey] = count;
        });

        return result;
    };

    const monthlyMembers = getMonthlyMembers(membersData);
    const totalMembers = Object.values(monthlyMembers || {}).reduce(
        (sum, value) => sum + value,
        0
    );

    // ------------------ REVENUE DATA ------------------
    const revenue = yearData?.salesTrend?.currentYearStats?.totalRevenue || 0;
    const lastYearRevenue = yearData?.salesTrend?.lastYearStats?.totalRevenue || 0;

    const bookingCount = yearData?.salesTrend?.currentYearStats?.bookingCount || 0;
    const lastBookingCount = yearData?.salesTrend?.lastYearStats?.bookingCount || 0;

    const avgMonthlyFee = totalMembers ? (revenue / totalMembers).toFixed(2) : "0";
    // ------------------ AGE RANGE LOGIC ------------------
    const allAges =
        membersData?.enrolledStudents?.byAge?.map(item =>
            Number(item.label.replace(/\D/g, ""))
        ) || [];

    const avgLifeCycle = bookingCount
        ? (totalMembers / bookingCount).toFixed(1)
        : "0";

    const newStudents = monthData?.bookings?.length || 0;

    const summary = membersData?.summary || 0;

    const stats = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
            title: "Total Members",
            value: summary?.totalMembers?.current,
            diff: `+${summary?.totalMembers?.average}%`,
            sub: "vs. prev period",
            subvalue: summary?.totalMembers?.previous,
        },
        {
            icon: "/reportsIcons/pound.png",
            iconStyle: "text-[#E769BD] bg-[#FEF6FB]",
            title: "Monthly Revenue",
            value: `£${summary?.monthlyRevenue?.current}`,
            diff: `+${summary?.monthlyRevenue?.average}%`,
            sub: "vs. prev period",
            subvalue: `£${summary?.monthlyRevenue?.previous}`,
        },
        {
            icon: "/reportsIcons/pound2.png",
            iconStyle: "text-[#F38B4D] bg-[#FEF8F4]",
            title: "Average Monthly Fee",
            value: `£${summary?.averageMonthlyFee?.current}`,
            diff: `+${summary?.averageMonthlyFee?.average}%`,
            sub: "vs. prev period",
            subvalue: `£${summary?.averageMonthlyFee?.previous}`,
        },
        {
            icon: "/reportsIcons/Lifecycle.png",
            iconStyle: "text-[#6F65F1] bg-[#F6F6FE]",
            title: "Average Life Cycle",
            value: `${summary?.averageLifeCycle?.current}`,
            diff: `+${summary?.averageLifeCycle?.average}%`,
            sub: "vs. prev period",
            subvalue: `${summary?.averageLifeCycle?.previous}`,
        },
        {
            icon: "/reportsIcons/orangeadduser.png",
            iconStyle: "text-[#FF5353] bg-[#FFF5F5]",
            title: "New Students",
            value: summary?.newStudents?.current,
            diff: `+${summary?.newStudents?.average}%`,
            sub: "vs. prev period",
            subvalue: summary?.newStudents?.previous,
        },
        {
            icon: "/reportsIcons/orangeadduser.png",
            iconStyle: "text-[#FF5353] bg-[#FFF5F5]",
            title: "Retention",
            value: `${summary?.retention?.current}%`,
            diff: `+${summary?.retention?.average}%`,
            sub: "vs. prev period",
            subvalue: `${summary?.retention?.previous}%`,
        },
    ];
    const exportMemberStatsExcel = () => {
        const exportData = stats.map((item) => ({
            Title: item.title,
            Value: String(item.value ?? "—"),
            Change: String(item.diff ?? "—"),
            "Prev Period": String(item.subvalue ?? "—"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Member Stats");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "member-stats.xlsx");
    };
    const ageOptions = (() => {
        if (!allAges?.length) {
            return [{ value: "all", label: "All ages" }];
        }

        const uniqueSortedAges = [...new Set(allAges)].sort((a, b) => a - b);

        return [
            { value: "all", label: "All ages" },
            ...uniqueSortedAges.map((age) => ({
                value: age,
                label: `${age} Years`,
            })),
        ];
    })();


    // ------------------ TAB CHANGE: AGE vs GENDER ------------------
    useEffect(() => {
        const enrolledData =
            membersData?.enrolledStudents || {};

        if (activeTab === "age") {
            const byAge = enrolledData.byAge || {};
            const total = Object.values(byAge).reduce((a, b) => a + b, 0);

            const formatted = Object.entries(byAge).map(([age, count]) => ({
                label: `${count.label}`,
                value: `${count.percentage}`,
                count: count.count,
            }));
            setMainData(formatted);
        } else {
            const byGender = enrolledData.byGender || {};
            const total = Object.values(byGender).reduce((a, b) => a + b, 0);

            const formatted = Object.entries(byGender).map(([gender, count]) => ({
                label: count.label,
                value: `${count.percentage}`,
                count: count.count,
            }));

            setMainData(formatted);
        }
    }, [activeTab, membersData]);

    // ------------------ FETCH DATA ------------------
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/weekly-class/analytics/member`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setMembersData(result);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = async (key, value) => {
        const token = localStorage.getItem("adminToken");

        const query = new URLSearchParams({ [key]: value }).toString();

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/weekly-class/analytics/member?${query}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const resultRaw = await response.json();
            const result = resultRaw.data || null;

            setMembersData(result);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            setMembersData(null);
        } finally {
            setLoading(false);
        }
    };


    // ------------------ MEMBERS ADDED MONTHLY ------------------
    const monthsMap = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    };

    const getMembersAddedMonthly = (membersComparison) => {
        if (!membersComparison) return [];

        const { labels = [], series = [] } = membersComparison;

        const currentYearSeries = series[0];
        if (!currentYearSeries) return [];

        // Find last non-zero index in current year
        const lastNonZeroIndex = currentYearSeries.data
            .map((v, i) => (v > 0 ? i : -1))
            .filter(i => i !== -1)
            .pop();

        return labels.map((month, index) => {
            const row = { month };

            series.forEach((s, sIndex) => {
                const key = s.name.replace(/\s+/g, "");

                // Trim ONLY current year after last non-zero
                if (
                    sIndex === 0 &&
                    lastNonZeroIndex !== undefined &&
                    index > lastNonZeroIndex
                ) {
                    row[key] = null;
                } else {
                    row[key] = s.data?.[index] ?? 0;
                }
            });

            return row;
        });
    };


    const series = membersData?.graph?.membersComparison?.series;

    const currentYearKey = series?.[0]?.name.replace(/\s+/g, "");
    const previousYearKey = series?.[1]?.name.replace(/\s+/g, "");

    const lineChartData = getMembersAddedMonthly(
        membersData?.graph?.membersComparison
    );
    // ------------------ PIE CHART: PAYMENT PLANS ------------------
    const plansOverview = membersData?.plansOverview || [];
    const durationData = membersData?.durationOfMemberships || [];
    console.log('plansOverview', durationData);
    const colors = ["#8B5CF6", "#FACC15", "#22C55E", "#3B82F6", "#EF4444"];


    const pieData = plansOverview.map((plan, index) => ({
        name: plan.title,
        value: Math.round(plan.members.percentage), // for pie %
        membersCount: plan.members.count,
        revenueAmount: plan.revenue.amount,
        revenuePercentage: plan.revenue.percentage,
        color: colors[index % colors.length],
    }));
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            border: "1px solid #E2E1E5",
            borderRadius: "0.5rem",
            boxShadow: state.isFocused ? "0 0 0 1px #237FEA" : "none",
            "&:hover": { borderColor: "#237FEA" },
            minHeight: "40px",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? "#237FEA"
                : state.isFocused
                    ? "#F3F4F6"
                    : "white",
            color: state.isSelected ? "white" : "#111827",
            cursor: "pointer",
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "0.5rem",
            overflow: "hidden",
            zIndex: 50,
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: "0 0.75rem",
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            paddingRight: "0.5rem",
        }),
    };

    // ------------------ YEAR & MONTH LOGIC ------------------
    const yearlyGrouped = membersData?.yealyGrouped || {};
    const yearKeys = Object.keys(yearlyGrouped);

    const latestYear = yearKeys.length ? yearKeys.sort().pop() : null;
    const monthlyGrouped = latestYear ? yearlyGrouped[latestYear]?.monthlyGrouped || {} : {};
    const monthKeys = Object.keys(monthlyGrouped);

    const latestMonth = monthKeys.length ? monthKeys.sort().pop() : null;


    // ------------------ PERCENTAGE DIFFERENCE FIX ------------------
    const getTotalMembers = (data, year, month) => {
        const bookings = data?.yealyGrouped?.[year]?.monthlyGrouped?.[month]?.bookings || [];
        return bookings.reduce(
            (sum, booking) => sum + (booking.totalStudents || 0),
            0
        );
    };

    const years = Object.keys(yearlyGrouped).map(Number).sort((a, b) => b - a);

    const months = Object.keys(yearlyGrouped[currentYear]?.monthlyGrouped || {})
        .map(Number)
        .sort((a, b) => b - a);

    let prevYear = currentYear;
    let prevMonth = (Number(currentMonth) - 1).toString().padStart(2, "0");

    if (prevMonth === "00") {
        prevYear = (Number(currentYear) - 1).toString();
        prevMonth = "12";
    }

    const prevExists =
        yearlyGrouped?.[prevYear]?.monthlyGrouped?.[prevMonth];

    const currentMembers = getTotalMembers(membersData, currentYear, currentMonth);

    const prevMembers = prevExists
        ? getTotalMembers(membersData, prevYear, prevMonth)
        : 0;
    const data = membersData?.membershipSource || [];
    const membershipSource = membersData?.membershipSource || {};
    // -------- FIXED VERSION (COMPLETE & SAFE) --------
    let diffPercent =
        prevMembers > 0
            ? (((currentMembers - prevMembers) / prevMembers) * 100).toFixed(1) + "%"
            : "0%";

    // override if lastBookingCount exists
    if (lastBookingCount > 0) {
        diffPercent =
            (((totalMembers - lastBookingCount) / lastBookingCount) * 100).toFixed(1) + "%";
    }

    if (loading) return <Loader />;
    return (
        <div className="lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Members</h1>
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Venue */}
                    <Select
                        options={
                            membersData?.allVenues
                                ? [
                                    { value: "", label: "All venues" },
                                    ...membersData.allVenues.map((v) => ({
                                        value: v.id,
                                        label: v.name,
                                    })),
                                ]
                                : venueOptions
                        }
                        defaultValue={
                            membersData?.allVenues
                                ? { value: "", label: "All venues" }
                                : venueOptions?.[0]
                        }
                        styles={customSelectStyles}
                        isClearable
                        components={{ IndicatorSeparator: () => null }}
                        className="md:w-50"
                        onChange={(selected) =>
                            handleFilterChange("venueId", selected?.value || "")
                        }
                    />

                    {/* Age */}
                    <Select
                        options={ageOptions}
                        defaultValue={ageOptions?.[0]}
                        styles={customSelectStyles}
                        isClearable
                        components={{ IndicatorSeparator: () => null }}
                        className="md:w-50"
                        onChange={(selected) =>
                            handleFilterChange("age", selected?.value || "")
                        }
                    />

                    {/* Date */}
                    <Select
                        options={dateOptions}
                        defaultValue={dateOptions?.[0]}
                        styles={customSelectStyles}
                        isClearable
                        components={{ IndicatorSeparator: () => null }}
                        className="md:w-50"
                        onChange={(selected) =>
                            handleFilterChange("period", selected?.value || "")
                        }
                    />

                    {/* Export */}
                    <button
                        onClick={exportMemberStatsExcel}
                        className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                        <Download size={16} /> Export data
                    </button>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {stats.map((s, i) => (


                    <div
                        key={i}
                        className="bg-white rounded-4xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <div
                                className={`p-2 h-[50px] w-[50px] p-2 rounded-full flex items-center justify-center ${s.iconStyle}`}
                            >
                                <div className={s.iconStyle}><img className="p-1" src={s.icon} alt="" /></div>
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold text-[#717073] text-sm">{s.title}</span>

                            <h3 className="text-[20px] font-semibold text-gray-900">{s.value} <small className="text-green-500 font-normal text-xs">{s.diff}</small></h3>
                            <p className="text-xs font-semibold text-[#717073]">
                                {s.sub} <span className="text-red-500">{s.subvalue}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex  gap-6">
                <div className="md:w-[75%]">

                    <div className="bg-white rounded-2xl p-4">
                        <h2 className="text-gray-800 font-semibold text-[20px] mb-4">
                            Members vs Members in Previous Period
                        </h2>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={lineChartData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                >
                                    {/* Grid */}
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#EEF2F7"
                                        vertical={false}
                                    />

                                    {/* X Axis */}
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: "#6B7280", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    {/* Y Axis */}
                                    <YAxis
                                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    {/* Tooltip */}
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{
                                            background: "#FFFFFF",
                                            borderRadius: 12,
                                            border: "none",
                                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                        }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />

                                    {/* Gradient definition */}
                                    <defs>
                                        <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.35} />
                                            <stop offset="70%" stopColor="#60A5FA" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    {/* Previous year line (draw FIRST → stays below) */}
                                    {previousYearKey && (
                                        <Line
                                            type="monotone"
                                            dataKey={previousYearKey}
                                            stroke="#F472B6"
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                            isAnimationActive={false}
                                        />
                                    )}

                                    {/* Area fill for current year (under line) */}
                                    <Area
                                        type="monotone"
                                        dataKey={currentYearKey}
                                        stroke="none"
                                        fill="url(#colorMembers)"
                                        fillOpacity={1}
                                        connectNulls
                                        tooltipType="none"

                                    />

                                    {/* Current year line (draw LAST → stays on top) */}
                                    <Line
                                        type="monotone"
                                        dataKey={currentYearKey}
                                        stroke="#3B5BFF"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                    <div className="grid lg:grid-cols-2 gap-5 mt-7">
                        <div className="bg-white rounded-2xl p-4 md:max-h-[500px] overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-gray-800 font-semibold text-[24px]">
                                    Enrolled Students
                                </h2>
                                <EllipsisVertical className="text-gray-500" />
                            </div>

                            {/* Tabs */}
                            <div className="flex border border-[#E2E1E5] rounded-lg p-1 max-w-[300px] mb-5">
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
                                                {/* {i === 0 && (
                                                    <div className="absolute -top-6 left-[60%] transform -translate-x-1/2 bg-white text-gray-800 text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                                        {item.count} students
                                                    </div>
                                                )} */}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">
                                                {item.value}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5">

                            {/* Header */}
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-gray-800 font-semibold text-[24px]">Members</h2>
                                <EllipsisVertical className="text-gray-500" />
                            </div>

                            {/* Chart + Breakdown */}
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">

                                {/* Pie */}
                                <div className="w-full lg:w-1/3 flex justify-center">
                                    <div className="w-[160px] h-[160px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Members list */}
                                <div className="w-full lg:w-2/3 space-y-3">
                                    {pieData.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="font-medium text-gray-700">
                                                    {item.name}
                                                </span>
                                            </div>

                                            <div className="flex gap-6 font-semibold text-gray-800">
                                                <span>{item.value}%</span>
                                                <span>{item.membersCount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Revenue Split
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {pieData.map((item, i) => (
                                        <div
                                            key={i}
                                            className=" rounded-xl px-4 py-3"
                                        >
                                            {/* Plan name */}
                                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                                <span
                                                    className="min-w-2 min-h-2 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="font-medium">{item.name}</span>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-sm font-semibold text-gray-900">
                                                £{item.revenueAmount}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                <div className="md:w-[25%]">

                    <div className="bg-white rounded-2xl p-4">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            Duration of memberships <EllipsisVertical />
                        </h2>

                        {durationData.map((item, i) => (
                            <div key={i} className="mb-4">
                                <p className="text-xs text-[#344054] font-semibold mb-1">
                                    {item.label}
                                </p>

                                <div className="flex gap-2 items-center">
                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="bg-[#237FEA] h-2 rounded-full transition-all"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>

                                    <span className="text-xs text-[#344054] font-semibold">
                                        {item.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="bg-white rounded-2xl p-4 mt-5">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            Source of memberships <EllipsisVertical />
                        </h2>

                        {data.map((item, i) => (
                            <div key={i} className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-[#344054] font-semibold">{item.label}</p>

                                </div>
                                <div className="flex items-center gap-2">

                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-[#344054] font-semibold">{item.percentage}%</span>

                                </div>
                            </div>
                        ))}
                    </div>


                </div>
            </div>
        </div>
    );
};

export default MembersDashboard;
