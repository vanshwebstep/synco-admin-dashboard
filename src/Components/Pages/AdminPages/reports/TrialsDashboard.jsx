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
    CalendarDays,
    CalendarCheck,
    UserCheck,
    BarChart3,
    MoreVertical,

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

const TrialsDashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [activeTab, setActiveTab] = useState("age");
    const [membersData, setMembersData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [mainData, setMainData] = useState([]);




    const venueOptions = [
        { value: "all", label: "All venues" },
        { value: "london", label: "London" },
        { value: "manchester", label: "Manchester" },
    ];
    const data = [
        { label: "Facebook", value: 60 },
        { label: "Website", value: 45 },
        { label: "Other", value: 10 },
    ];
    const currentYear = new Date().getFullYear().toString();
    const yearData = membersData?.yealyGrouped?.[currentYear] || {};
    const currentMonth = (new Date().getMonth() + 1).toString();
    const fb = membersData?.facebookPerformance || {};
    const getPercentChange = (currentVal = 0, prevVal = 0) => {
        if (!prevVal) return "0%";
        return `${(((currentVal - prevVal) / prevVal) * 100).toFixed(1)}%`;
    };

    const current = fb.currentYear || {};
    const previous = fb.previousYear || {};
    const average = fb.average || {};
    console.log('currentMonth', currentMonth)
    const metrics = [
        {
            icon: <Users className="text-teal-500" size={24} />,
            title: "Leads generated",
            value: current.leadsGenerated ?? 0,
            change: getPercentChange(
                current.leadsGenerated,
                previous.leadsGenerated
            ),
            prev: previous.leadsGenerated ?? 0,
        },
        {
            icon: <CalendarDays className="text-purple-500" size={24} />,
            title: "Trials Booked",
            value: current.trialsBooked ?? 0,
            change: getPercentChange(
                current.trialsBooked,
                previous.trialsBooked
            ),
            prev: previous.trialsBooked ?? 0,
            conversion: average.trialsBookedConversion
                ? `${average.trialsBookedConversion}%`
                : "0%",
        },
        {
            icon: <CalendarCheck className="text-sky-500" size={24} />,
            title: "Trials Attended",
            value: current.trialsAttended ?? 0,
            change: getPercentChange(
                current.trialsAttended,
                previous.trialsAttended
            ),
            prev: previous.trialsAttended ?? 0,
            conversion: average.trialsAttendedConversion
                ? `${average.trialsAttendedConversion}%`
                : "0%",
        },
        {
            icon: <UserCheck className="text-pink-400" size={24} />,
            title: "Memberships Sold",
            value: current.membershipsSold ?? 0,
            change: getPercentChange(
                current.membershipsSold,
                previous.membershipsSold
            ),
            prev: previous.membershipsSold ?? 0,
            conversion: average.membershipsSoldConversion
                ? `${average.membershipsSoldConversion}%`
                : "0%",
        },
        {
            icon: <BarChart3 className="text-orange-400" size={24} />,
            title: "Conversion Rate lead to Sale",
            value: `${current.conversionRate ?? 0}%`,
            change: getPercentChange(
                current.conversionRate,
                previous.conversionRate
            ),
            prev: `${previous.conversionRate ?? 0}%`,
        },
    ];

    const exportFbMetricsExcel = () => {
        const exportData = metrics.map((item) => ({
            Title: item.title,
            Value: String(item.value ?? "—"),
            Change: String(item.change ?? "—"),
            "Prev Period": String(item.prev ?? "—"),
            Conversion: String(item.conversion ?? "—"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Facebook Metrics");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "facebook-metrics.xlsx");
    };
    const monthlyData = yearData?.monthlyGrouped || {};     // ------------------ AGE RANGE LOGIC ------------------
      const allAges =
        membersData?.enrolledData?.byAge?.map(item =>
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

   const dateOptions = [
        { value: "thisMonth", label: "This Month" },
        { value: "thisQuarter", label: "This Quarter" },
        { value: "thisYear", label: "This Year" },
    ];
    console.log('membersData', membersData)
    const stats = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
            title: "Free Trials Booked",
            value: `${membersData?.summary?.totalTrials?.currentYear}`,
            diff: `${membersData?.summary?.totalTrials?.average}%`,
            sub: "vs. prev period ",
            subvalue: `${membersData?.summary?.totalTrials?.previousYear}`,
        },
        {
            icon: "/reportsIcons/attendent.png",
            iconStyle: "text-[#E769BD] bg-[#F3FAFD]",
            title: "How many attended",
            value: ` ${membersData?.summary?.attendedTrials?.currentYear}`,
            diff: `${membersData?.summary?.attendedTrials?.average}%`,
            sub: "vs. prev period",
            subvalue: `${membersData?.summary?.attendedTrials?.previousYear}`
        },
        {
            icon: "/reportsIcons/Percent.png",
            iconStyle: "text-[#F38B4D] bg-[#F3FAFD]",
            title: "Attendance Rate",
            value: ` ${membersData?.summary?.attendanceRate?.currentYear}`,
            diff: `${membersData?.summary?.attendanceRate?.average}%`,
            sub: "vs. prev period ",
            subvalue: `${membersData?.summary?.attendanceRate?.previousYear}`
        },
        {
            icon: "/reportsIcons/user-group2.png",
            iconStyle: "text-[#6F65F1] bg-[#F3FAFD]",
            title: "Trials to Members",
            value: ` ${membersData?.summary?.convertedTrialsToMembers?.currentYear}`,
            diff: `${membersData?.summary?.convertedTrialsToMembers?.average}%`,
            sub: "vs. prev period ",
            subvalue: `${membersData?.summary?.convertedTrialsToMembers?.previousYear}`
        },
        {
            icon: "/reportsIcons/Chart.png",
            iconStyle: "text-[#FF5353] bg-[#FEF8F4]",
            title: "Conversion Rate",
            value: ` ${membersData?.summary?.conversionRate?.currentYear}`,
            diff: `${membersData?.summary?.conversionRate?.average}%`,
            sub: "vs. prev period ",
            subvalue: `${membersData?.summary?.conversionRate?.previousYear}`
        },
        {
            icon: "/reportsIcons/calender.png",
            iconStyle: "text-[#FF5353] bg-[#FEF8F4]",
            title: "No. of Rebooks",
            value: ` ${membersData?.summary?.rebooks?.currentYear}`,
            diff: `${membersData?.summary?.rebooks?.average}%`,
            sub: "vs. prev period ",
            subvalue: `${membersData?.summary?.rebooks?.previousYear}`
        },
    ];

    useEffect(() => {
        const enrolledData = membersData?.enrolledData;

        if (!enrolledData) {
            setMainData([]);
            return;
        }

        if (activeTab === "age") {
            const formatted = (enrolledData.byAge || []).map(item => ({
                label: item.label,
                value: item.percentage, // already percentage
                count: item.count,
            }));
            setMainData(formatted);
        }
        else if (activeTab === "venue") {
            const formatted = (enrolledData.byVenue || []).map(item => ({
                label: item.label,
                value: item.percentage,
                count: item.count,
            }));
            setMainData(formatted);
        }
        else {
            const formatted = (enrolledData.byGender || []).map(item => ({
                label: item.label,
                value: item.percentage,
                count: item.count,
            }));
            setMainData(formatted);
        }
    }, [activeTab, membersData]);



    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/weekly-class/analytics/free-trial`, {
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
                `${API_BASE_URL}/api/admin/weekly-class/analytics/free-trial?${query}`,
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

    const getMembersAddedMonthly = (trialsComparison) => {
        if (!trialsComparison) return [];

        const { labels = [], series = [] } = trialsComparison;

        const currentYearSeries = series[0];
        if (!currentYearSeries) return [];

        // Find last non-zero month in current year
        const lastNonZeroIndex = currentYearSeries.data
            .map((v, i) => (v > 0 ? i : -1))
            .filter(i => i !== -1)
            .pop();

        return labels.map((month, index) => {
            const row = { month };

            series.forEach((s, sIndex) => {
                const key = s.name.replace(/\s+/g, "");

                // ✅ Trim ONLY current year AFTER last non-zero
                if (sIndex === 0 && lastNonZeroIndex !== undefined && index > lastNonZeroIndex) {
                    row[key] = null; // important
                } else {
                    row[key] = s.data?.[index] ?? 0;
                }
            });

            return row;
        });
    };

    const series = membersData?.graph?.trialsComparison?.series;

    const currentYearKey = series?.[0]?.name.replace(/\s+/g, "");
    const previousYearKey = series?.[1]?.name.replace(/\s+/g, "");

    const lineChartData = getMembersAddedMonthly(
        membersData?.graph?.trialsComparison
    );
    // -

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const plans = membersData?.membershipPlansAacquiredPostTrial || [];

    const colors = ["#8B5CF6", "#FACC15", "#22C55E", "#3B82F6", "#EF4444"];

    const pieData = plans.map((plan, index) => ({
        name: plan.title,
        value: plan.members?.percentage ?? 0,   // percentage for chart
        count: plan.members?.count ?? 0,         // members count
        revenue: plan.revenue?.amount ?? 0,      // revenue amount
        color: colors[index % colors.length],
    }));

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
    const topAgents = membersData?.topAgents || [];
    const maxBookings = Math.max(...topAgents.map(a => a.totalBookings || 0), 1);

    const ProgressBar = ({ percent }) => (
        <div className="w-full bg-gray-100 h-2 rounded-full relative">
            <div
                style={{ width: `${percent}%` }}
                className="h-2 rounded-full bg-[#237FEA] relative group cursor-pointer"
            >
                {/* Tooltip */}
                <div
                    className="absolute -top-8 right-0 translate-x-1/2
                   bg-black text-white text-xs px-2 py-1 rounded
                   opacity-0 group-hover:opacity-100 transition
                   pointer-events-none whitespace-nowrap"
                >
                    {percent}%
                </div>
            </div>
        </div>
    );
    if (loading) return (<><Loader /></>)

    return (
        <div className="lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Trials and conversions</h1>
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
                    <button onClick={exportFbMetricsExcel}
                        className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                        <Download size={16} /> Export data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 lg:grid-cols-4 gap-4 mb-8">
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

            <div className="md:flex  gap-6">
                <div className="md:w-[75%]">

                    <div className="bg-white rounded-2xl p-4">
                        <h2 className="text-gray-800 font-semibold text-[20px] mb-4">
                            Total Trials
                        </h2>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={lineChartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 0 }}

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
                                        padding={{ left: 30, right: 30 }}
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
                            <div className="flex border border-[#E2E1E5] rounded-lg p-1 w-full mb-5">
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
                                <button
                                    onClick={() => setActiveTab("venue")}
                                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${activeTab === "venue"
                                        ? "bg-[#237FEA] text-white shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    By Venue
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
                                                {/* <div
                                                    className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${item.value}%` }}
                                                ></div> */}

                                                <ProgressBar percent={item.value} />
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

                        <div className="bg-white rounded-2xl p-6">

                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-gray-800 font-semibold text-[24px]">Membership plans acquired post-trial</h2>
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
                                                        <Cell key={index} fill={entry.color} />
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
                                                </span>
                                            </div>

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
                                    Revenue Generated
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
                        <div className="bg-white rounded-2xl p-4 mt-3">
                            <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                                Marketing channel performance <EllipsisVertical />
                            </h2>

                            {(() => {
                                const perfObj = membersData?.marketingChannelPerformance;

                                // Convert object → array of { label, value }
                                const list = perfObj
                                    ? Object.entries(perfObj).map(([label, value]) => ({
                                        label: value.label || label,
                                        percentage: value.percentage ?? 0,
                                    }))
                                    : [];

                                if (list.length === 0) {
                                    return (
                                        <p className="text-xs text-gray-400 italic">
                                            No data available
                                        </p>
                                    );
                                }

                                return list.map((item, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-[#344054] font-semibold">
                                                {item.label}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-100 h-2 rounded-full">
                                                <div
                                                    className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>

                                            <span className="text-xs text-[#344054] font-semibold">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ));
                            })()}


                        </div>
                        <div className="bg-white rounded-2xl p-4 mt-3">
                            <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                                Top Agents <EllipsisVertical />
                            </h2>

                            {topAgents.map((item, index) => {
                                const percent = Math.round(
                                    ((item.totalBookings || 0) / maxBookings) * 100
                                );

                                return (
                                    <div key={item.agentId || index} className="mb-4">
                                        <div className="flex gap-5 justify-between">
                                            <div className="profileimg w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                                                <img
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = "/members/dummyuser.png";
                                                    }}
                                                    src={item.profile || "/members/dummyuser.png"}
                                                    alt={item.name}
                                                />
                                            </div>

                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs text-[#344054] font-semibold">
                                                        {item.name || "Unknown"}
                                                    </p>
                                                    {/* <span className="text-xs text-[#344054] font-semibold">
                                                        {item.totalBookings || 0}
                                                    </span> */}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                                        <ProgressBar percent={percent} />
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

                <div className="md:w-[25%]">
                    <div className="bg-white rounded-2xl p-4 mt-3">

                        <div className="flex justify-between">


                            <h2 className="text-gray-800 font-semibold mb-3 gap-3 text-[20px] flex justify-between items-center">
                                <img src="/reportsIcons/Revenue.png" className="h-7 w-7" alt="" />  Revenue
                            </h2>
                            <EllipsisVertical />
                        </div>

                        <h1 className="text-[48px] font-semibold">£{membersData?.revenueFromMemberships}</h1>
                        <p className="font-semibold text-[16px] text-[#717073]">Revenue generated from memberships acquired through free trials.</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 mt-3">
                        <div className="flex justify-between">


                            <h2 className="text-gray-800 font-semibold mb-3 gap-3 text-[20px] flex justify-between items-center">
                                <img src="/reportsIcons/Growth.png" className="h-7 w-7" alt="" /> Insights
                            </h2>
                            <EllipsisVertical />

                        </div>

                        <h6 className="text-[18px] font-semibold">Reason for non attendance</h6>
                        <p className="font-semibold text-[16px] text-[#717073]">Time</p>
                        <div className="mt-1"> <h6 className="text-[18px] font-semibold">Reason for not becoming members</h6>
                            <p className="font-semibold text-[16px] text-[#717073]">Time</p></div>
                    </div>


                    <div className="bg-white rounded-2xl p-5 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className=" font-semibold text-lg">Facebook Performance</h2>
                            <MoreVertical className="text-gray-500" size={18} />
                        </div>

                        <div className="space-y-5">
                            {metrics.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-gray-50 p-2 rounded-full">{item.icon}</div>
                                        <div>
                                            <p className="text-[#717073] font-semibold text-[15px]">
                                                {item.title}
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 flex items-center">
                                                {item.value}
                                                <span className="text-green-500 text-sm font-normal ml-1">
                                                    ({item.change})
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                vs. prev period{" "}
                                                <span className="text-red-500 font-medium">{item.prev}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {item.conversion && (
                                        <div className="text-right">
                                            <p className="text-gray-800 font-semibold">{item.conversion}</p>
                                            <p className="text-green-500 text-sm">(Conversion)</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default TrialsDashboard;
