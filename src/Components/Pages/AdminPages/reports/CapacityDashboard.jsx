import { useState, useCallback, useEffect } from "react";
import Select from "react-select";
import {
    Users,
    PoundSterling,
    Calendar,
    Clock,
    UserPlus,
    TrendingUp, TrendingDown, MoreVertical,
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

const CapacityDashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [membersData, setMembersData] = useState([]);
    const [loading, setLoading] = useState(false);

    const venueOptions = [
        { value: "all", label: "All venues" },
        { value: "london", label: "London" },
        { value: "manchester", label: "Manchester" },
    ];
    const data = [
        { label: "Facebook", value: 60 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Acton", value: 45 },
        { label: "Other", value: 10 },
    ];
   

    const stats = [
        {
            icon: "/reportsIcons/capacity.png",
            iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
            title: "Total Capacity",
            value: membersData?.summary?.totalCapacity?.count ?? "—",
            diff: membersData?.summary?.totalCapacity?.change ?? "—",
            sub: "vs. prev period",
            subvalue: membersData?.summary?.totalCapacity?.vsPrev ?? "—",
        },
        {
            icon: "/reportsIcons/Briefcase.png",
            iconStyle: "text-[#E769BD] bg-[#FEF6FB]",
            title: "Occupancy",
            value: membersData?.summary?.occupancy?.count ?? "—",
            diff: membersData?.summary?.occupancy?.change ?? "—",
            sub: "vs. prev period",
            subvalue: membersData?.summary?.occupancy?.vsPrev ?? "—",
        },
        {
            icon: "/reportsIcons/Chart1.png",
            iconStyle: "text-[#F38B4D] bg-[#F0F9F9]",
            title: "Occupancy Rate",
            value: membersData?.summary?.occupancyRate?.count ?? "—",
            diff: membersData?.summary?.occupancyRate?.change ?? "—",
            sub: "vs. prev period",
            subvalue: membersData?.summary?.occupancyRate?.vsPrev ?? "—",
        },
        {
            icon: "/reportsIcons/unfilled.png",
            iconStyle: "text-[#6F65F1] bg-[#FFF5F5]",
            title: "Unfulfilled Spaces",
            value: membersData?.summary?.unfulfilledSpaces?.count ?? "—",
            diff: membersData?.summary?.unfulfilledSpaces?.change ?? "—",
            sub: "vs. prev period",
            subvalue: membersData?.summary?.unfulfilledSpaces?.vsPrev ?? "—",
        },
        {
            icon: "/reportsIcons/Pound-main.png",
            iconStyle: "text-[#FF5353] bg-[#FEF6FB]",
            title: "Untapped Revenue",
            value: membersData?.summary?.untappedRevenue?.count ?? "—",
            diff: membersData?.summary?.untappedRevenue?.change ?? "—",
            sub: "vs. prev period",
            subvalue: membersData?.summary?.untappedRevenue?.vsPrev ?? "—",
        },
    ];
    const dateOptions = [
        { value: "thisMonth", label: "This Month" },
        { value: "thisQuarter", label: "This Quarter" },
        { value: "thisYear", label: "This Year" },
    ];

    const ageOptions = [
        { value: "all", label: "All ages" },
        { value: "under18", label: "Under 18" },
        { value: "18-25", label: "18–25" },
    ];
    const exportCapacityStatsExcel = () => {
        const exportData = stats.map((item) => ({
            Title: item.title,
            Value: String(item.value ?? "—"),
            Change: String(item.diff ?? "—"),
            "Prev Period": String(item.subvalue ?? "—"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Capacity Summary");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "capacity-summary.xlsx");
    };
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/weekly-class/analytics/capacity`, {
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

    useEffect(() => {
        fetchData();
    }, []);


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

    const pieData = Object.keys(planCounts).map((name, index) => ({
        name,
        value: Math.round((planCounts[name] / total) * 100), // percentage
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
    const mainData = membersData?.charts?.monthWise || [];

    let highest = null;
    let lowest = null;

    if (Array.isArray(mainData) && mainData.length > 0) {
        // Filter only items that have numeric counts (avoid null/undefined)
        const validData = mainData.filter(
            item => typeof item.currentYearCount === "number"
        );

        if (validData.length > 0) {
            highest = validData.reduce((max, item) =>
                item.currentYearCount > max.currentYearCount ? item : max
            );

            lowest = validData.reduce((min, item) =>
                item.currentYearCount < min.currentYearCount ? item : min
            );
        }
    }


    const COLORS = ["#043bd3ff", "#7bb9ffff", "#0cb823e3", "#eb6e25ff", "#f3f63bff", "#ff0000ff"];

    // Ensure we always have an array
    const capacityData = Array.isArray(membersData?.capacityByClass)
        ? membersData.capacityByClass
        : [];

    // Handle empty state
    const isEmpty = capacityData.length === 0;

    if (loading) return (<><Loader /></>)

    return (
        <div className="lg:p-6 bg-gray-50 min-h-screen">

            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800 lg:mb-0 mb-4">Class Capacity</h1>
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
                    <button onClick={exportCapacityStatsExcel}
                        className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                        <Download size={16} /> Export data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {stats.map((s, i) => (


                    <div
                        key={i}
                        className="bg-white rounded-4xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <div
                                className={`p-2 h-[50px] w-[50px] rounded-full flex items-center justify-center ${s.iconStyle}`}
                            >
                                <div className={`${s.iconStyle} `}><img src={s.icon} className="p-1" alt="" /></div>
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
                <div className="lg:w-[75%] md:w-[67%]">

                    <div className="bg-white rounded-2xl p-4">
                        <h2 className="text-gray-800 font-semibold text-[24px] mb-4">
                            Capacity
                        </h2>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={membersData?.charts?.monthWise}
                                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                                >
                                    {/* Soft grid */}
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="#E5E7EB"
                                    />

                                    {/* Clean axes */}
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

                                    {/* Smooth tooltip */}
                                    <Tooltip
                                        cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
                                        contentStyle={{
                                            backgroundColor: "rgba(255,255,255,0.95)",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                        }}
                                    />

                                    {/* Gradient Areas */}
                                    <defs>
                                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.03} />
                                        </linearGradient>

                                        <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>

                                    {/* Shaded Areas under lines */}
                                    <Area
                                        type="monotone"
                                        dataKey="currentYearCount"
                                        stroke="none"
                                        fill="url(#colorCurrent)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="prevYearCount"
                                        stroke="none"
                                        fill="url(#colorPrevious)"
                                    />

                                    {/* Current (Blue) Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="currentYearCount"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />

                                    {/* Previous (Pink) Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="prevYearCount"
                                        stroke="#EC4899"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>

                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5 mt-7">
                        <div className="bg-white rounded-2xl p-4 mt-3 md:max-h-[400px] overflow-auto">
                            <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                                Capacity by venue <EllipsisVertical />
                            </h2>

                            {membersData?.capacityByVenue?.map((item, i) => (
                                <div key={i} className="mb-4">
                                    <div className="flex gap-5 items-center justify-between">


                                        <p className="text-xs text-[#344054] w-[50px] font-semibold">{item.name}</p>

                                        <div className="w-full">
                                            <div className="flex justify-between items-center mb-1">
                                            </div >
                                            <div className="flex items-center gap-2">

                                                <div className="w-full bg-gray-100 h-2 rounded-full">
                                                    <div
                                                        className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${item.value}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-[#344054] font-semibold">{item.percentage}%</span>

                                            </div></div>
                                    </div>

                                </div>
                            ))}
                        </div>


                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-gray-800 font-semibold text-[20px] md:text-[24px]">
                                    Capacity By Class
                                </h2>
                                <EllipsisVertical className="text-gray-500" />
                            </div>

                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
                                    <span>No capacity data available</span>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-center justify-center">
                                    {/* Donut Chart */}
                                    <div className="w-[350px] h-[150px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={capacityData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    dataKey="usedCount"
                                                    stroke="none"
                                                    paddingAngle={2}
                                                >
                                                    {capacityData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-4 md:mt-0 md:ml-6 space-y-2 w-full">
                                        {capacityData.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between items-center text-gray-700 text-sm"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor: COLORS[i % COLORS.length],
                                                        }}
                                                    ></span>
                                                    <span>{item?.className || "Unknown"}</span>
                                                </div>
                                                <div className="flex items-center space-x-4 font-semibold text-gray-900">
                                                    <span>{item?.percentageUsed ?? 0}</span>
                                                    <span>{item?.usedCount ?? 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:w-[25%] md:w-[33%]">



                    <div className="bg-white rounded-2xl p-4  md:max-h-[400px] overflow-auto">
                        <h2 className="text-gray-800 font-semibold mb-3 text-[24px] flex justify-between items-center">
                            High Demand Venues <EllipsisVertical />
                        </h2>

                        {membersData?.highDemandVenue?.map((item, i) => (
                            <div key={i} className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-[#344054] font-semibold">{item.name}</p>

                                </div>
                                <div className="flex items-center gap-2">

                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${item?.count}` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-[#344054] font-semibold">{item?.percentage}</span>

                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl p-5 mt-4 mx-auto">

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-gray-800 font-semibold text-lg">Trends</h2>
                            <MoreVertical className="text-gray-500" size={18} />
                        </div>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-orange-50 p-2 rounded-full">
                                <TrendingUp className="text-orange-500" size={22} />
                            </div>
                            <div>
                                <p className="text-gray-600 font-medium text-sm">Higher demand</p>
                                <p className="text-gray-900 font-semibold text-base">{highest?.month}</p>
                            </div>
                        </div>

                        <hr className="border-gray-100 my-3" />

                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-teal-50 p-2 rounded-full">
                                <TrendingDown className="text-teal-500" size={22} />
                            </div>
                            <div>
                                <p className="text-gray-600 font-medium text-sm">Lowest Demand</p>
                                <p className="text-gray-900 font-semibold text-base">{lowest?.month}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-800 font-semibold text-sm mb-1">Other factors</p>
                            <p className="text-gray-500 text-sm">
                                In holidays the waiting list increase 40%
                            </p>
                        </div>
                    </div>




                </div>
            </div>
        </div>
    );
};

export default CapacityDashboard;
