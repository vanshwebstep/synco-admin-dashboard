import { useState, useCallback, useEffect } from "react";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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

const CancellationDashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [activeTab, setActiveTab] = useState("age");
    const [membersData, setMembersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const ageData = [
        { label: "4", value: 60 },
        { label: "5", value: 70 },
        { label: "6", value: 40 },
        { label: "7", value: 80 },
        { label: "8", value: 65 },
        { label: "9", value: 50 },
        { label: "10", value: 90 },
        { label: "11", value: 55 },
        { label: "12", value: 75 },
    ];
    const [mainData, setMainData] = useState([]);

    const genderData = [
        { label: "Male", value: 65 },
        { label: "Female", value: 35 },
    ];


    const venueOptions = [
        { value: "all", label: "All venues" },
        { value: "london", label: "London" },
        { value: "manchester", label: "Manchester" },
    ];
    const data = membersData?.cancellationReasons?.reasons?.map(r => ({
        label: r.reason,
        value: r.percentage
    })) || [];

    const ageOptions = [
        { value: "all", label: "All ages" },
        { value: "under18", label: "Under 18" },
        { value: "18-25", label: "18–25" },
        { value: "35plus", label: "35+" }
    ];

    const dateOptions = [
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
        { value: "year", label: "This Year" },
    ];
    console.log('membersData', membersData)
    const stats = [
        {
            icon: "/reportsIcons/Rct.png",
            iconStyle: "text-[#3DAFDB] bg-[#FFF19E]",
            title: "Total RTC",
            value: membersData?.totalRTCs?.thisYear ?? 0,
            diff: membersData?.totalRTCs?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: membersData?.totalRTCs?.lastYear ?? 0
        },
        {
            icon: "/reportsIcons/cancelled.png",
            iconStyle: "text-[#FF5353] bg-[#FFF5F5]",
            title: "Total Cancelled",
            value: membersData?.totalCancelled?.thisYear ?? 0,
            diff: membersData?.totalCancelled?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: membersData?.totalCancelled?.lastYear ?? 0
        },
        {

            icon: "/reportsIcons/RevenueLost.png",
            iconStyle: "text-[#E769BD] bg-[#FEF6FB]",
            title: "Monthly Revenue Lost",
            value: `£${membersData?.monthlyRevenueLost?.monthlyRevenueLost?.thisMonth.totalLost ?? 0}`,
            diff: membersData?.monthlyRevenueLost?.monthlyRevenueLost?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: `£${membersData?.monthlyRevenueLost?.monthlyRevenueLost?.lastMonth.totalLost ?? 0}`
        },
        {
            icon: "/reportsIcons/avgLifecycle.png",
            iconStyle: "text-[#F38B4D] bg-[#F6F6FE]",
            title: "Avg Membership Tenure",
            value: `${membersData?.avgMembershipTenure?.thisYear ?? 0} months`,
            diff: membersData?.avgMembershipTenure?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: `${membersData?.avgMembershipTenure?.lastYear ?? 0} months`
        },
        {
            icon: "/reportsIcons/Userremove.png",
            iconStyle: "text-[#6F65F1] bg-[#F0F9F9]",
            title: "Reactivated Membership",
            value: membersData?.reactivatedMembership?.thisYear ?? 0,
            diff: membersData?.reactivatedMembership?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: membersData?.reactivatedMembership?.lastYear ?? 0
        },
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#FF5353] bg-[#F3FAFD]",
            title: "Total New Students",
            value: membersData?.totalNewStudents?.thisYear ?? 0,
            diff: membersData?.totalNewStudents?.change ?? "0%",
            sub: "vs. prev period",
            subvalue: membersData?.totalNewStudents?.lastYear ?? 0
        }
    ];
    const exportToExcel = () => {
        // Prepare export rows
        const exportData = stats.map((item) => ({
            Title: item.title,
            Value: typeof item.value === "string" ? item.value : String(item.value),
            Change: item.diff,
            "Last Period": item.subvalue,
        }));

        // Create worksheet + workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stats Report");

        // Convert to excel
        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        // Download
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "stats-report.xlsx");
    };

    useEffect(() => {
        if (!membersData?.getByAgeandByGender) return;

        const { byAge, byGender } = membersData.getByAgeandByGender;

        if (activeTab === "age") {
            const formatted = byAge.map(item => ({
                label: `${item.age} Years`,
                value: item.percentage,   // already in API
                count: item.count
            }));
            setMainData(formatted);
        } else {
            const formatted = byGender.map(item => ({
                label: item.gender.charAt(0).toUpperCase() + item.gender.slice(1),
                value: item.percentage,
                count: item.count
            }));
            setMainData(formatted);
        }
    }, [activeTab, membersData]);


    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/weekly-class/analytics/cancellation`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
    const handleFilterChange = async (key, value) => {
        const token = localStorage.getItem("adminToken");

        const query = new URLSearchParams({ [key]: value }).toString();

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/weekly-class/analytics/cancellation?${query}`,
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
    useEffect(() => {
        fetchData();
    }, []);

    const lineData = membersData?.chart?.monthly?.map((item) => ({
        month: item.month,
        current: item.cancelled || 0,     // this year's actual data
        previous: 0                       // no previous-year data available
    })) || [];
    const getMembersAddedMonthly = (chart) => {
        if (!chart) return [];

        const years = Object.keys(chart); // ["2025", "2026"]
        if (years.length === 0) return [];

        const currentYear = years[years.length - 1]; // latest year
        const previousYear = years[years.length - 2]; // previous year

        const currentData = chart[currentYear] || [];
        const previousData = chart[previousYear] || [];

        return currentData.map((item, index) => ({
            month: item.month,
            current: item.cancelled ?? 0,
            previous: previousData[index]?.cancelled ?? 0,
        }));
    };


    const series = membersData?.graph?.chart?.series;

    const currentYearKey = series?.[0]?.name.replace(/\s+/g, "");
    const previousYearKey = series?.[1]?.name.replace(/\s+/g, "");

    const lineChartData = getMembersAddedMonthly(
        membersData?.graph?.chart
    );
    // -

    const bookings =
        membersData?.yealyGrouped?.[2025]?.monthlyGrouped?.[10]?.bookings || [];

    // ✅ Group bookings by paymentPlan title
    const planCounts = {};
    bookings.forEach((b) => {
        const planName = b?.paymentPlan?.title || "Unknown Plan";
        planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    // ✅ Convert to chart format
    const total = Object.values(planCounts).reduce((a, b) => a + b, 0);
    const colors = ["#8B5CF6", "#FACC15", "#22C55E", "#3B82F6", "#EF4444"]; // add more if needed

    const pieData = membersData?.cancellationReasons?.reasons?.map((item, i) => ({
        name: item.reason,
        value: item.percentage,
        count: item.count,
        color: ["#237FEA", "#F38B4D", "#6F65F1", "#E769BD", "#3DAFDB"][i % 5]
    })) || [];

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            border: "1px solid #E2E1E5",
            borderRadius: "0.5rem", // rounded-xl
            boxShadow: state.isFocused ? "0 0 0 1px #237FEA" : "none",
            "&:hover": {
                borderColor: "#237FEA",
            },
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
    const yearlyGrouped = membersData?.yealyGrouped || {};
    const yearKeys = Object.keys(yearlyGrouped);

    const latestYear = yearKeys.length ? yearKeys.sort().pop() : null;
    const monthlyGrouped = latestYear ? yearlyGrouped[latestYear]?.monthlyGrouped || {} : {};
    const monthKeys = Object.keys(monthlyGrouped);

    const latestMonth = monthKeys.length ? monthKeys.sort().pop() : null;

    // ✅ Get duration data safely
    const durationData =
        (latestYear && latestMonth && yearlyGrouped[latestYear]?.monthlyGrouped?.[latestMonth]?.durationOfMembership) ||
        {};

    const { thisYear = 0, lastYear = 0 } =
        membersData?.reactivatedMembership || {};

    // Calculate percentage safely
    const percentage =
        lastYear > 0 ? Math.round((thisYear / lastYear) * 100) : 0;

    // Cap percentage at 100 for UI
    const progress =
        lastYear > 0
            ? Math.min(Math.round((thisYear / lastYear) * 100), 100)
            : 0;

    // keep a tiny arc so UI doesn't look broken
    const visualProgress = progress === 0 && thisYear > 0 ? 3 : progress;

    // SVG math
    const radius = 90;
    const circumference = Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    if (loading) return (<><Loader /></>)

    return (
        <div className="lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Cancellations</h1>
                <div className="flex flex-wrap gap-3 items-center">
                    <Select
                        options={
                            membersData?.allVenues
                                ? [{ value: "", label: "All venues" }].concat(
                                    membersData.allVenues.map((v) => ({ value: v.id, label: v.name }))
                                )
                                : venueOptions
                        }
                        defaultValue={
                            membersData?.allVenues
                                ? { value: "", label: "All venues" }
                                : venueOptions[0]
                        }
                        styles={customSelectStyles}
                        components={{ IndicatorSeparator: () => null }}
                        className="md:w-40"
                        onChange={(selected) => handleFilterChange("venueId", selected.value)}
                    />
                    <Select
                        options={ageOptions}
                        defaultValue={ageOptions[0]}
                        styles={customSelectStyles}
                        components={{ IndicatorSeparator: () => null }}
                        onChange={(selected) => handleFilterChange("age", selected.value)}
                        className="md:w-40"
                    />
                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        options={dateOptions}
                        defaultValue={dateOptions[0]}
                        styles={customSelectStyles}
                        onChange={(selected) => handleFilterChange("period", selected.value)}
                        className="md:w-40"
                    />
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
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
                                className={`p-2 h-[50px] w-[50px] rounded-full flex items-center justify-center ${s.iconStyle}`}
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
                            Cancellations
                        </h2>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={lineChartData}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                                >

                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />

                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: "#6b7280", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#6b7280", fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{
                                            backgroundColor: "rgba(255,255,255,0.9)",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />


                                    <defs>
                                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>




                                    <Line
                                        type="monotone"
                                        dataKey="current"
                                        stroke="#3B82F6"
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="previous"
                                        stroke="#EC4899"
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5 mt-7">
                        <div className="bg-white rounded-2xl p-4 md:max-h-[500px] overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-gray-800 font-semibold text-[24px]">
                                    Cancelled Students
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
                                                        {item.count} 
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

                        <div className="bg-white rounded-2xl p-6">

                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-gray-800 font-semibold text-[24px]">Membership plans most cancelled</h2>
                                <EllipsisVertical className="text-gray-500" />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between md:items-center">

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
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>


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
                                                </span>                                            </div>
                                              <div className="flex gap-6 font-semibold text-gray-800">
                                                <span>{item.value}%</span>
                                                <span>{item.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                    Revenue Lost
                                </h3>

                                <div className="grid md:grid-cols-3 md:justify-between md:max-h-[100px] overflow-auto gap-4 text-sm">
                                    {pieData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            ></span>
                                            <span className="font-medium text-gray-700">
                                                {item.name}
                                                <span className="font-semibold text-gray-900 block">£20,000</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-[25%]">


                    <div className="bg-white rounded-2xl p-4 mt-5">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            Reasons for Cancellation <EllipsisVertical />
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
                                            style={{ width: `${item.value}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-[#344054] font-semibold">{item.value}%</span>

                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-3xl p-5 h-fit mt-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                                Reactivated memberships
                            </h3>
                            <EllipsisVertical />
                        </div>

                        {/* Progress */}
                        <div className="relative flex justify-center">
                            <svg width="220" height="120" viewBox="0 0 220 120">
                                {/* Background arc */}
                                <path
                                    d="M20,110 A90,90 0 0 1 200,110"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                />

                                {/* Active arc */}
                                <path
                                    d="M20,110 A90,90 0 0 1 200,110"
                                    fill="none"
                                    stroke="#2F80ED"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={
                                        circumference - (visualProgress / 100) * circumference
                                    }
                                />
                            </svg>

                            {/* Center Text */}
                            <div className="absolute top-[45%] text-center">
                                <div className="text-[48px] font-bold text-gray-900">{thisYear}</div>
                                <p className="text-[16px] text-gray-500 mt-1">
                                    Cancelled membership <br /> back to active
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-18  text-center text-gray-500">
                            <p className="font-semibold text-[16px] text-gray-700 mb-1">
                                Cancelled membership back to active
                            </p>
                            <p className="text-[14px]">
                                We have <span className="font-semibold"><span
                                    className={`font-semibold ml-1 ${percentage < 0 ? "text-red-500" : "text-green-500"
                                        }`}
                                >
                                    {membersData?.reactivatedMembership?.change}
                                </span></span> of the cancelled
                                membership back to active. Main reason: available time
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CancellationDashboard;
