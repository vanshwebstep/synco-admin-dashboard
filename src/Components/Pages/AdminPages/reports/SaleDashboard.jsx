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

const SaleDashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [activeTab, setActiveTab] = useState("age");
    const [membersData, setMembersData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [mainData, setMainData] = useState([]);
    const currentYear = new Date().getFullYear().toString();

    const yearData = membersData?.yealyGrouped?.[currentYear] || {};
    const currentMonth = (new Date().getMonth() + 1).toString();

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

    console.log('membersData ', membersData)
    const overall = membersData?.summary || {};

    const stats = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
            title: "Total New Students",
            value: `${overall?.totalStudents?.current}`,
            diff: `${overall?.totalStudents?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.totalStudents?.previous}`
        },
        {
            icon: "/reportsIcons/pound.png",
            iconStyle: "text-[#E769BD] bg-[#FEF6FB]",
            title: "Monthly Revenue",
            value: `${overall?.monthlyRevenue?.current}`,
            diff: `${overall?.monthlyRevenue?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.monthlyRevenue?.previous}`,
        },
        {
            icon: "/reportsIcons/pound2.png",
            iconStyle: "text-[#F38B4D] bg-[#FEF8F4]",
            title: "Average Monthly Fee",
            value: `${overall?.averageMonthlyFee?.current}`,
            diff: `${overall?.averageMonthlyFee?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.averageMonthlyFee?.previous}`,
        },
        {
            icon: "/reportsIcons/chart2.png",
            iconStyle: "text-[#6F65F1] bg-[#F6F6FE]",
            title: "Growth Comparison",
            value: `${overall?.growthComparison?.current}`,
            diff: `${overall?.growthComparison?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.growthComparison?.previous}`,
        },
        {
            icon: "/reportsIcons/cancelled.png",
            iconStyle: "text-[#FF5353] bg-[#FFF5F5]",
            title: "Total Cancellations",
            value: `${overall?.cancelledStudents?.current}`,
            diff: `${overall?.cancelledStudents?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.cancelledStudents?.previous}`,
        },
        {
            icon: "/reportsIcons/Userremove.png",
            iconStyle: "text-[#FF5353] bg-[#FFF5F5]",
            title: "Variance",
            value: `${overall?.variance?.current}`,
            diff: `${overall?.variance?.average}%`,
            sub: "vs. prev period",
            subvalue: `${overall?.variance?.previous}`,
        }
    ];
    const allAges =
        membersData?.enrolledStudents?.byAge?.map(item =>
            Number(item.label.replace(/\D/g, ""))
        ) || [];
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
    const plansOverview = membersData?.plansOverview || [];
    const durationData = membersData?.membershipSource || [];
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
    const maxBookings = Math.max(
        ...(membersData?.topAgents || []).map(a => a.totalBookings || 0),
        1
    );

    const exportOverviewStatsExcel = () => {
        const exportData = stats.map((item) => ({
            Title: item.title,
            Value: String(item.value ?? "—"),
            Change: String(item.diff ?? "—"),
            "Prev Period": String(item.subvalue ?? "—"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Overview Summary");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "overview-summary.xlsx");
    };
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

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/weekly-class/analytics/sales`, {
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
                `${API_BASE_URL}/api/admin/weekly-class/analytics/sales?${query}`,
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


    if (loading) return (<><Loader /></>)

    return (
        <div className="lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Sales</h1>
                <div className="flex flex-wrap gap-3 items-center">
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
                    <button onClick={exportOverviewStatsExcel}
                        className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
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
                                <div className={s.iconStyle}><img src={s.icon} className="p-1" alt="" /></div>
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

            <div className="md:flex  gap-6">
                <div className="md:w-[75%]">

                    <div className="bg-white rounded-2xl p-4">
                        <h2 className="text-gray-800 font-semibold text-[20px] mb-4">
                            Sales
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
                                <h2 className="text-gray-800 font-semibold text-[24px]">Membership Plans</h2>
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



                    <div className="bg-white rounded-2xl p-4 mt-5">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            Source of memberships <EllipsisVertical />
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

                    <div className="bg-white rounded-2xl p-4 mt-3">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            Top Sales Agents <EllipsisVertical />
                        </h2>

                        {membersData?.topAgents?.map((item, i) => {
                            const percent = Math.round(
                                ((item?.totalBookings || 0) / maxBookings) * 100
                            );

                            return (
                                <div key={item.agentId || i} className="mb-4">
                                    <div className="flex gap-5 justify-between">
                                        <div className="profileimg w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                                            <img
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "/members/dummyuser.png";
                                                }}
                                                src={item?.profile || "/members/dummyuser.png"}
                                                alt=""
                                            />
                                        </div>

                                        <div className="w-full">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs text-[#344054] font-semibold">
                                                    {item?.name || "Unknown"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-100 h-2 rounded-full">
                                                    <div
                                                        className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>

                                                <span className="text-xs text-[#344054] font-semibold">
                                                    {percent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>


                </div>
            </div>
        </div>
    );
};

export default SaleDashboard;
