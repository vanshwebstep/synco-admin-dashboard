import React, { useState, useMemo } from "react";
import Select from "react-select";
import {
    Download,
    EllipsisVertical,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";


const dashboardData = {
    recruitmentChart: {
        labels: [
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
        ],
        leads: [420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 420, 480, 500, 530, 580, 620, 650, 700, 720, 760, 780, 820],
        hires: [180, 200, 220, 240, 260, 280, 320, 340, 360, 380, 400, 420],
    },

    onboardingResults: [
        { label: "Health", value: "82%" },
        { label: "Time", value: "67%" },
        { label: "Health", value: "79%" },
        { label: "Health", value: "79%" },
    ],

    topAgents: [
        { label: "Jessica Smith", value: 50 },
        { label: "Aiden Jones", value: 30 },
        { label: "Priya Kumar", value: 20 },
        { label: "Liam Brown", value: 10 },
        { label: "Mia White", value: 5 },
    ],

};

const dateOptions = [
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
];
const venueOptions = [
    { value: "", label: "All Venues" },
    { value: "venue 1", label: "Venue 1" },
    { value: "venue 2", label: "Venue 2" },
];
const classOptions = [
    { value: "", label: "All Classes" },
    { value: "3", label: "3 to 5 Years" },
    { value: "5", label: "4 to 5 Years" },
];

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        border: "1px solid #E2E1E5",
        borderRadius: "0.5rem",
        boxShadow: state.isFocused ? "0 0 0 1px #237FEA" : "none",
        minHeight: "40px",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#237FEA" : state.isFocused ? "#F3F4F6" : "white",
        color: state.isSelected ? "white" : "#111827",
        cursor: "pointer",
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: "0.5rem",
        overflow: "hidden",
        zIndex: 50,
    }),
};

const stats = [
    {
        icon: "/reportsIcons/attendance.png",
        iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
        title: "Attendance Rate",
        value: `68%`,
        diff: "(+12%)",
        sub: "vs. prev period  ",
        subvalue: '27%'
    },
    {
        icon: "/reportsIcons/absence.png",
        iconStyle: "text-[#E769BD] bg-[#F3FAFD]",
        title: "Absence rate",
        value: `10%`,
        diff: "(+12%)",
        sub: "vs. prev period",
        subvalue: '27'
    },
    {
        icon: "/reportsIcons/totalAttend.png",
        iconStyle: "text-[#F38B4D] bg-[#FEF8F4]",
        title: "Total attendance",
        value: `1234`,
        diff: "(+12%)",
        sub: "vs. prev period ",
        subvalue: '275'
    },
    {
        icon: "/reportsIcons/growthIcon.png",
        iconStyle: "text-[#6F65F1] bg-[#F3FAFD]",
        title: "Growth",
        value: `23%`,
        diff: "(+12%)",
        sub: "vs. prev period ",
        subvalue: '27%'
    },


];



export default function AttendanceReport() {


    const chartData = useMemo(() => {
        const labels = dashboardData.recruitmentChart.labels;
        return labels.map((m, idx) => ({
            month: m,
            current: dashboardData.recruitmentChart.leads[idx],
            previous: dashboardData.recruitmentChart.hires[idx],
        }));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-0">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 pt-5">
                <h1 className="text-2xl font-semibold text-gray-800">Coach Attendance</h1>
                <div className="flex flex-wrap gap-3 items-center">

                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        placeholder='Date Range'
                        options={venueOptions}
                        defaultValue={venueOptions[0]}
                        styles={customSelectStyles}
                        className="md:w-40"
                    />
                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        placeholder='All Classes'
                        options={classOptions}
                        defaultValue={classOptions[0]}
                        styles={customSelectStyles}
                        className="md:w-40"
                    />
                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        placeholder='All Venues'
                        options={dateOptions}
                        defaultValue={dateOptions[0]}
                        styles={customSelectStyles}
                        className="md:w-40"
                    />
                    <button className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                        <Download size={16} /> Export data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s, i) => (


                    <div
                        key={i}
                        className="bg-white rounded-4xl p-3 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <div
                                className={`p-2  p-2 rounded-full flex items-center justify-center `}
                            >
                               <img className="p-1 w-full h-[60px] w-[60px]" src={s.icon} alt="" />
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold text-[#717073] text-sm">{s.title}</span>

                            <h3 className="text-[20px] font-semibold text-gray-900">{s.value} <small className="text-green-500 font-normal text-xs">{s.diff}</small></h3>
                            <p className="text-4 font-semibold text-[#717073]">
                                {s.sub} <span className="text-red-500">{s.subvalue}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[22px] font-semibold text-gray-800 ms-5">Coach Attendance</h2>
                    <EllipsisVertical className="text-gray-400" />
                </div>

                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            />
                            <defs>
                                <linearGradient id="colorLeads" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="colorHires" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>

                            <Area type="monotone" dataKey="current" stroke="none" fill="url(#colorLeads)" />
                            <Area type="monotone" dataKey="previous" stroke="none" fill="url(#colorHires)" />

                            <Line type="monotone" dataKey="current" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="previous" stroke="#EC4899" strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>



            <div className="space-y-6 md:grid mt-5  md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl">
                    <h3 className="text-[22px] font-semibold text-gray-800 mb-3">Attendance leadership board</h3>
                    <div className="space-y-3">
                        {dashboardData.topAgents.map((item, i) => (<div key={i} className="mb-4">
                            <div className="flex gap-5 justify-between">

                                <div className="w-10 h-10">
                                    <img src="/reportsIcons/agent.png" alt="" />
                                </div>
                                <div className="w-full">  <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm text-[#344054] font-semibold">{item.label}</p>

                                </div >
                                    <div className="flex items-center gap-2">

                                        <div className="w-full bg-gray-100 h-2 rounded-full">
                                            <div
                                                className="bg-[#237FEA] h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${item.value}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-[#344054] font-semibold">{item.value}</span>

                                    </div></div>
                            </div>

                        </div>
                        ))}
                    </div>
                </div>
                <div className=" bg-white rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[22px] font-semibold text-gray-800">Absence reasons</h3>
                        <EllipsisVertical className="text-gray-400" />
                    </div>

                    <div className="space-y-3">
                        {dashboardData.onboardingResults.map((r, i) => (
                            <div key={i}>
                                <p className="text-sm text-gray-700 mb-1">{r.label}</p>
                                <div className="flex items-center gap-3"><div className="w-full bg-gray-100 h-2 rounded-full">
                                    <div className="h-2 rounded-full bg-[#237FEA]" style={{ width: `${parseInt(r.value)}%` }}></div>
                                </div>
                                    <span className="text-sm"> {r.value}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>

                    <div className="bg-white p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-3 px-4">
                            <h3 className="text-[24px] font-semibold text-gray-800 pb-3">Cover Coach</h3>
                            <EllipsisVertical className="text-gray-400" />
                        </div>

                        <div className="space-y-4 px-4">
                            <div className="flex gap-5 items-center pb-4">

                                <img src="/reportsIcons/cover.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] text-[#717073]">Percentage of sessions which require a cover coach</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">25%</h4>
                                        <span className="text-xs text-gray-400 block">vs. Last Month <span className="text-red-500 font-semibold">34%</span></span>
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
