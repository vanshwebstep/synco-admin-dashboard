import React, { useState, useEffect, useMemo } from "react";

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
import { useRecruitmentTemplate } from "../../contexts/RecruitmentContext";
import * as XLSX from "xlsx";

const dateOptions = [
    { value: "", label: "Date Range" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth ", label: "Last Month" },
    { value: "last3Months ", label: "Last 3 Month" },
    { value: "last6Months ", label: "Last 6 Month" },
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

function parsePercent(value) {
    // accepts "36%" or "36" or number; returns number from 0..100
    if (value == null) return 0;
    if (typeof value === "number") return value;
    const str = String(value).trim();
    if (!str) return 0;
    return Number(str.replace("%", "")) || 0;
}

export default function CoachReport() {
    const [activeTab, setActiveTab] = useState("byAge");
    const [loading, setLoading] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(dateOptions[0]);

    const { fetchCoachReport, coachReport } = useRecruitmentTemplate() || {};

    useEffect(() => {
        const loadData = async () => {
            if (!fetchCoachReport) return;
            setLoading(true);
            try {
                await fetchCoachReport();
            } catch (e) {
                // swallow - UI will use available coachReport if any
                console.error("fetchCoachReport failed", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchCoachReport]);
    const handleChange = (selectedOption) => {
        const value = selectedOption?.value ?? "";
        setSelectedDateRange(selectedOption);
        fetchCoachReport(value); // send only when value exists
    };

    // safe getters and fallbacks from coachReport
    console.log('coachReport', coachReport)
    const api = coachReport || {}; // entire response object expected to be what your hook exposes
    const data = coachReport || {};
    const report = data?.report || {};
    const chartDataFromApi = data?.chartData || {};
    const demographics = data?.demographics || {};
    const qualificationsApi = data?.qualifications || {};
    const onboardingApi = data?.onboardingResults || {};
    const sourceOfLeadsApi = data?.sourceOfLeads || [];
    const highDemandVenuesApi = data?.highDemandVenues || [];
    const topAgentsApi = data?.topAgents || [];
    const callStats = {
        callsMade: data?.report?.telephoneInterviews?.current ?? null,
        callsPrevious: data?.report?.telephoneInterviews?.previous ?? null,
        avgCallDuration: data?.recruitmentCallStats?.avgCallDuration?.value || null,
        timeToFirstContact: data?.recruitmentCallStats?.timeToFirstContact?.value || null,
        callsMadeValue: data?.recruitmentCallStats?.callsMade?.value || null,
        callsMadePrevious: data?.recruitmentCallStats?.callsMade?.previous || null,
    };

    // Build stats array to match original UI shape
    const stats = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#F3FAFD]",
            title: "Total Leads",
            value: `${report?.totalLeads?.current ?? 0}`,
            diff: "", // no diff in API; keep blank
            sub: "vs. prev period",
            subvalue: `${report?.totalLeads?.previous ?? 0}`,
        },
        {
            icon: "/reportsIcons/Calling.png",
            iconStyle: "text-[#E769BD] bg-[#F3FAFD]",
            title: "No. of telephone interviews",
            value: `${report?.telephoneInterviews?.current ?? 0}`,
            diff: `(${report?.telephoneInterviews?.conversionRate ?? 0})`,
            sub: "vs. prev period",
            subvalue: `${report?.telephoneInterviews?.previous ?? 0}`,
        },
        {
            icon: "/reportsIcons/Note.png",
            iconStyle: "text-[#F38B4D] bg-[#FEF8F4]",
            title: "No. of practical assessments",
            value: `${report?.practicalAssessments?.current ?? 0}`,
            diff: `(${report?.practicalAssessments?.conversionRate ?? 0})`,
            sub: "vs. prev period",
            subvalue: `${report?.practicalAssessments?.previous ?? 0}`,
        },
        {
            icon: "/reportsIcons/Recruitment.png",
            iconStyle: "text-[#6F65F1] bg-[#F3FAFD]",
            title: "No. of hires",
            value: `${report?.hires?.current ?? 0}`,
            diff: "",
            sub: "vs. prev period",
            subvalue: `${report?.hires?.previous ?? 0}`,
        },
        {
            icon: "/reportsIcons/Percent.png",
            iconStyle: "text-[#FF5353] bg-[#F0F9F9]",
            title: "Conversion Rate (Leads to recruitment)",
            value: `${report?.conversionRate?.current ?? report?.conversionRate ?? "0%"}`,
            diff: "",
            sub: "vs. prev period",
            subvalue: `${report?.conversionRate?.previous ?? "0%"}`,
        },
    ];

    // Build chartData for recharts: [{ month, current, previous }, ...]
    const chartData = useMemo(() => {
        // months order
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // API shape: chartData.leads.currentYear: { Jan: 0, ... }
        const leadsCurrent = chartDataFromApi?.leads?.currentYear || {};
        const hiresCurrent = chartDataFromApi?.hires?.currentYear || {};
        // If your API uses different keys, these fallbacks keep chart empty
        return months.map((m) => ({
            month: m,
            leads: Number(leadsCurrent[m] ?? 0),
            hires: Number(hiresCurrent[m] ?? 0),
        }));
    }, [chartDataFromApi]);

    // coachesDemographics mapping: produce arrays matching earlier UI
    const coachesDemographics = useMemo(() => {
        // byAge: convert { age, count, percent } -> { label, value, percent: number }
        const byAgeRaw = demographics?.byAge || [];
        const byAge = byAgeRaw.map((a) => ({
            label: String(a.age),
            value: a.count ?? 0,
            percent: parsePercent(a.percent),
        }));

        // byGender: { gender, count, percent }
        const byGenderRaw = demographics?.byGender || [];
        const byGender = byGenderRaw.map((g) => ({
            label: g.gender,
            value: g.count ?? 0,
            percent: parsePercent(g.percent),
        }));

        // byVenue: { venueName, count, percent }
        const byVenueRaw = demographics?.byVenue || [];
        const venue = byVenueRaw.map((v) => ({
            label: v.venueName,
            value: v.count ?? 0,
            percent: parsePercent(v.percent),
        }));

        return {
            byAge,
            byGender,
            venue,
        };
    }, [demographics]);

    // Qualifications array to match earlier UI structure (label, value, img)
    const qualifications = useMemo(() => {
        // API: { faQualification, dbsCertificate, coachingExperience, noExperience }
        return [
            { label: "FA Qualification(s)", value: qualificationsApi?.faQualification ?? 0, img: '/reportsIcons/fa.png' },
            { label: "DBS Certificate", value: qualificationsApi?.dbsCertificate ?? 0, img: '/reportsIcons/dbs.png' },
            { label: "2–3 years of coaching experience", value: qualificationsApi?.coachingExperience ?? 0, img: '/reportsIcons/coaching.png' },
            { label: "No experience", value: qualificationsApi?.noExperience ?? 0, img: '/reportsIcons/experience.png' },
        ];
    }, [qualificationsApi]);

    // Onboarding results list - convert api fields into array similar to original
    const onboardingResults = useMemo(() => {
        return [
            { label: "Average Call Grade", value: onboardingApi?.averageCallGrade ?? "0%" },
            { label: "Average Practical Assessment Grade", value: onboardingApi?.averagePracticalAssessmentGrade ?? "0%" },
            { label: "Average Coach Education Pass Mark", value: onboardingApi?.averageCoachEducationPassMark ?? "0%" },
        ];
    }, [onboardingApi]);

    // sourceOfLeads (map to label/value/percent)
    const sourceOfLeads = (sourceOfLeadsApi || []).map((s) => ({
        label: s.source ?? s.label ?? "Unknown",
        value: s.count ?? 0,
        percent: parsePercent(s.percent ?? s.percentage ?? `${s.count ?? 0}`),
    }));

    // highDemandVenues
    const highDemandVenues = (highDemandVenuesApi || []).map((v) => ({
        label: v.venueName ?? v.label ?? "Unknown",
        value: v.count ?? 0,
        percent: parsePercent(v.percent ?? v.percentage ?? 0),
    }));

    // topAgents
    const topAgents = (topAgentsApi || []).map((a) => ({
        label: `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "Unknown",
        value: a.totalHires ?? a.value ?? 0,
        profile: a.profile,
    }));
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
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;

        // keep only one entry per dataKey
        const unique = Object.values(
            payload.reduce((acc, item) => {
                if (!acc[item.dataKey]) {
                    acc[item.dataKey] = item;
                }
                return acc;
            }, {})
        );

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs">
                <p className="font-semibold mb-1">{label}</p>

                {unique.map(item => (
                    <p key={item.dataKey} style={{ color: item.stroke }}>
                        {item.dataKey}: {item.value}
                    </p>
                ))}
            </div>
        );
    };
    const handleExport = () => {
        const excelData = stats.map(item => ({
            "Metric": item.title,
            "Current Value": item.value,
            "Previous Value": item.subvalue,
            "Conversion / Diff": item.diff || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Report Stats");

        XLSX.writeFile(workbook, "coach-report.xlsx");
    };
    // helper to parse number from percent-like strings for width calculations
    const percentFromString = (s) => parsePercent(s);

    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-0">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Coach Recruitment</h1>
                <div className="flex flex-wrap gap-3 items-center absolute top-0 right-0">

                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        placeholder="Date Range"
                        options={dateOptions}
                        value={selectedDateRange}
                        onChange={handleChange}
                        styles={customSelectStyles}
                        className="md:w-40"
                    />

                    <button onClick={handleExport} className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                        <Download size={16} /> Export data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s, i) => (


                    <div
                        key={i}
                        className="bg-white rounded-4xl p-3 flex items-center gap-4 hover:shadow-md transition-all duration-200"
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
                            <p className="text-4 font-semibold text-[#717073]">
                                {s.sub} <span className="text-red-500">{s.subvalue}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    <div className="grid  gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-5 rounded-2xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-[22px] font-semibold text-gray-800 ms-5">Recruitment Chart (Leads vs Hires)</h2>
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
                                                content={<CustomTooltip />}
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

                                            <Area type="monotone" dataKey="leads" stroke="none" fill="url(#colorLeads)" />
                                            <Area type="monotone" dataKey="hires" stroke="none" fill="url(#colorHires)" />

                                            <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                                            <Line type="monotone" dataKey="hires" stroke="#EC4899" strokeWidth={2.5} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>


                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Coaches Demographics</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>

                            <div className="mb-3">
                                <div className="grid md:grid-cols-3 items-center gap-3 mb-3 border border-[#E2E1E5] p-1 w-full rounded-2xl">
                                    <button
                                        onClick={() => setActiveTab("byAge")}
                                        className={`px-3 py-2 rounded-xl text-sm ${activeTab === "byAge" ? "bg-[#237FEA] text-white" : "text-gray-600"
                                            }`}
                                    >
                                        By age
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("byGender")}
                                        className={`px-3 py-2 rounded-xl text-sm ${activeTab === "byGender" ? "bg-[#237FEA] text-white" : "text-gray-600"
                                            }`}
                                    >
                                        By gender
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("venue")}
                                        className={`px-3 py-2 rounded-xl text-sm ${activeTab === "venue" ? "bg-[#237FEA] text-white" : "text-gray-600"
                                            }`}
                                    >
                                        By venue
                                    </button>
                                </div>

                                {(coachesDemographics[activeTab] || []).slice(0, 6).map((d, i) => (
                                    <div key={i} className="mb-3 flex items-center gap-2">
                                        <div className="flex justify-between  mb-1">
                                            <p className="text-sm text-gray-700">{d.label}</p>
                                        </div>

                                        <div className="w-full bg-gray-100 h-2 rounded-full">
                                            <ProgressBar percent={d?.percent} />

                                        </div>
                                        <p className="text-sm text-gray-500">{d.percent ?? 0}%</p>

                                    </div>
                                ))}

                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Qualifications & Experience</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>

                            <div className="space-y-4">
                                {qualifications.map((q, i) => (
                                    <div key={i}>
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#237FEA]">
                                                <img src={q.img} alt="" /></div>
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-3">

                                                        <p className="text-sm text-gray-700">{q.label}</p>
                                                    </div>
                                                    <div className="text-sm text-gray-500">{q.value}</div>
                                                </div>

                                                <div className="w-full bg-gray-100 h-2 rounded-full">
                                                    <div className="w-full h-2 bg-gray-200 rounded-full">
                                                        <div
                                                            className="relative h-2 bg-[#237FEA] rounded-full group"
                                                            style={{
                                                                width: `${(q.value / Math.max(1, Math.max(...qualifications.map(x => x.value)))) * 100}%`
                                                            }}
                                                        >
                                                            {/* Tooltip */}
                                                            <div
                                                                className="
        absolute -top-8 right-0 translate-x-1/2
        scale-0 group-hover:scale-100
        transition-transform duration-200
        bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap
      "
                                                            >
                                                                {Math.round(
                                                                    (q.value / Math.max(1, Math.max(...qualifications.map(x => x.value)))) * 100
                                                                )}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>



                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Source of Leads</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>

                            <div className="space-y-3">
                                {sourceOfLeads.map((s, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm text-gray-700">{s.label}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-full bg-gray-100 h-2 rounded-full">
                                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="relative h-2 rounded-full bg-[#237FEA] group"
                                                        style={{ width: `${s.percent ?? s.value ?? 0}%` }}
                                                    >
                                                        {/* Tooltip at bar end */}
                                                        <div
                                                            className="
        absolute -top-8 right-0 translate-x-1/2
        scale-0 group-hover:scale-100
        transition-transform duration-200
        bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap
      "
                                                        >
                                                            {Math.round(s.percent ?? s.value ?? 0)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500">{s.percent ?? `${s.value}%`}</p>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl">
                            <h3 className="text-[22px] font-semibold text-gray-800 mb-3">High demand venues</h3>
                            <div className="space-y-3 mt-8">
                                {highDemandVenues.map((v, i) => (
                                    <div key={i} className="flex gap-2 items-center mb-5">

                                        <p className="text-sm text-gray-700 md:w-2/12">{v.label}</p>


                                        <div className="w-full bg-gray-100 h-2 rounded-full md:w-9/12">
                                            <div
                                                className="relative h-2 rounded-full bg-[#237FEA] group"
                                                style={{ width: `${v.percent ?? 10}%` }}
                                            >
                                                {/* Tooltip */}
                                                <div
                                                    className="
        absolute -top-8 right-0 translate-x-1/2
        scale-0 group-hover:scale-100
        transition-transform duration-200
        bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap
      "
                                                >
                                                    {Math.round(v.percent ?? 10)}%
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 md:w-1/12">{v.percent ?? '0%'}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                </div>

                <div className="space-y-6 md:grid lg:block md:grid-cols-2 gap-3 ">


                    <div className="bg-white p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-3 px-4">
                            <h3 className="text-[24px] font-semibold text-gray-800 pb-3">Recruitment Call Statistics</h3>
                            <EllipsisVertical className="text-gray-400" />
                        </div>

                        <div className="space-y-4 px-4">
                            <div className="flex gap-4 items-center border-b border-[#E2E1E5] pb-4">

                                <img src="/reportsIcons/Icon-with-shape.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] ">No. of calls made</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">{report?.telephoneInterviews?.current ?? 0}</h4>
                                        <span className="text-xs text-gray-400 block">vs. previous period <span className="text-red-500 font-semibold">{report?.telephoneInterviews?.previous ?? 0}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center border-b border-[#E2E1E5] pb-4">
                                <img src="/reportsIcons/greenphone.png" className="w-12" alt="" />

                                <div>
                                    <p className="text-[16px] ">Avg. duration of calls</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">{data?.recruitmentCallStats?.avgCallDuration?.value ?? "—"}</h4>
                                        <span className="text-xs text-gray-400 block">vs. previous period <span className="text-red-500 font-semibold">{data?.recruitmentCallStats?.avgCallDuration?.previous ?? "—"}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <img src="/reportsIcons/purplephn.png" className="w-12" alt="" />

                                <div>
                                    <p className="text-[16px] ">Avg. time duration of first contact</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">{data?.recruitmentCallStats?.timeToFirstContact?.value ?? "—"}</h4>
                                        <span className="text-xs text-gray-400 block">vs. previous period <span className="text-red-500 font-semibold">{data?.recruitmentCallStats?.timeToFirstContact?.previous ?? "—"}</span> </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 bg-white rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-[22px] font-semibold text-gray-800">Onboarding Results</h3>
                            <EllipsisVertical className="text-gray-400" />
                        </div>

                        <div className="space-y-3">
                            {onboardingResults.map((r, i) => (
                                <div key={i}>
                                    <p className="text-sm text-gray-700 mb-3">{r.label}</p>
                                    <div className="flex items-center gap-3"><div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div className="w-full h-2 bg-gray-200 rounded-full">
                                            <div
                                                className="relative h-2 rounded-full bg-[#237FEA] group"
                                                style={{ width: `${parsePercent(r.value)}%` }}
                                            >
                                                {/* Tooltip at bar end */}
                                                <div
                                                    className="
        absolute -top-8 right-0 translate-x-1/2
        scale-0 group-hover:scale-100
        transition-transform duration-200
        bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap
      "
                                                >
                                                    {Math.round(parsePercent(r.value))}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                        <div className="text-sm text-gray-700">{r.value}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>


                    <div className="">


                        <div className="bg-white p-5 rounded-2xl">
                            <h3 className="text-[22px] font-semibold text-gray-800 mb-3">Top agents with most hires</h3>
                            <div className="space-y-3">
                                {topAgents.map((item, i) => (<div key={i} className="mb-4">
                                    <div className="flex gap-5 justify-between">

                                        <div className="w-10 h-10">
                                            <img src={
                                                item?.profile
                                                    ? `${item.profile}`
                                                    : '/members/dummyuser.png'
                                            } alt="" />
                                        </div>
                                        <div className="w-full">  <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm text-[#344054] font-semibold">{item.label}</p>

                                        </div >
                                            <div className="flex items-center gap-2">

                                                <div className="w-full bg-gray-100 h-2 rounded-full">

                                                    <ProgressBar percent={item?.value} />

                                                </div>
                                                <span className="text-xs text-[#344054] font-semibold">{item.value}</span>

                                            </div></div>
                                    </div>

                                </div>
                                ))}
                                {topAgents.length === 0 && <p className="text-sm text-gray-500">No agents data available</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
