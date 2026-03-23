import { useState, useCallback, useEffect } from "react";
import { GiMagnet } from "react-icons/gi";
import {
    ChevronDown,
    Check, Search,
    CirclePoundSterling,
    X
} from "lucide-react";
import { PiUsersThreeBold } from "react-icons/pi";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import Loader from "../contexts/Loader";
import React from "react";
import * as XLSX from "xlsx";




const StudentCamp = () => {
    const [expandedRow, setExpandedRow] = useState(null);
    const [activeTab, setActiveTab] = useState("camp");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [holidayCampsData, setHolidayCampsData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(null);
    const navigate = useNavigate();
    const [selected, setSelected] = useState();

    const categoryOptions = [
        ...new Map(
            holidayCampsData?.map((camp) => {
                const id = camp?.holidayCamp?.id;
                if (!id) return null;

                return [
                    id,
                    {
                        label: camp?.holidayCamp?.name || "No Camp Name",
                        value: id,
                    }
                ];
            }).filter(Boolean)
        ).values()
    ];

    const [tableData, setTableData] = useState(holidayCampsData);

    const [selectedAges, setSelectedAges] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const toggleAge = (age) => {
        setSelectedAges(prev =>
            prev.includes(age)
                ? prev.filter(a => a !== age)
                : [...prev, age]
        );
    };



    const filteredStudents = holidayCampsData.filter((camp) => {
        const student = camp.students?.[0];

        // 1) If no age filter selected → show all
        if (selectedAges.length === 0) return true;

        // 2) Otherwise match selected ages
        return selectedAges.includes(student?.age);
    });
    const dateOptions = [
        ...new Map(
            holidayCampsData?.map((camp) => {
                const dateObj = camp?.holidayCamp?.holidayCampDates?.[0];

                if (!dateObj?.id) return null;

                return [
                    dateObj.id,
                    {
                        label: `${dateObj.startDate} - ${dateObj.endDate}`,
                        value: dateObj.id,
                    }
                ];
            }).filter(Boolean)
        ).values()
    ];
    const [selectedDate, setSelectedDate] = useState(
        dateOptions?.[0] ?? null
    );

    const [selectedCategory, setSelectedCategory] = useState(
        categoryOptions?.[0] ?? null
    );

    // FILTER LOGIC
    const filteredData = filteredStudents.filter((camp) => {
        const student = camp?.students?.[0];

        // ---------- SEARCH ----------
        const name = `${student?.studentFirstName || ""} ${student?.studentLastName || ""}`.toLowerCase();
        const age = String(student?.age || "").toLowerCase();
        const medical = (student?.medicalInformation || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            !searchTerm ||
            name.includes(search) ||
            age.includes(search) ||
            medical.includes(search);

        // ---------- CATEGORY ----------
        const matchesCategory =
            !selectedCategory ||
            camp?.holidayCamp?.id === selectedCategory.value;

        // ---------- DATE ----------
        const matchesDate =
            !selectedDate ||
            camp?.holidayCamp?.holidayCampDates?.[0]?.id === selectedDate.value;

        return matchesSearch && matchesCategory && matchesDate;
    });




    // FIXED: Unique Age Data
    const ageData = [
        ...new Map(
            holidayCampsData
                ?.flatMap(item => item.students || [])
                .map(student => {
                    const age = student?.age;

                    const ageLabel = age !== undefined
                        ? `${age} - ${age + 1} years`
                        : "No Age Available";

                    return [
                        age, // unique key
                        {
                            id: age,        // ✅ ADD THIS
                            label: ageLabel,
                            age: age,
                        }
                    ];
                })
        ).values()
    ];



    // Date Options


    const formatDate = (dateString) => {
        if (!dateString) return "Monday 10 April 2022, 2:50pm"; // fallback

        const date = new Date(dateString);

        return date.toLocaleString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };


const camps = holidayCampsData.map((venue, i) => {
    const schedule = venue?.students?.[0]?.holidayClassSchedules;

    return {
        id: i + 1,
        title: venue?.holidayVenue?.name || "No Venue Name",
        subtitle: venue?.holidayCamp?.name || "No Camp Name",
        date: formatDate(venue?.holidayVenue?.createdAt),
        capacity: schedule
            ? `${schedule.capacity}/${schedule.totalCapacity}`
            : "N/A",
    };
});
const venues = holidayCampsData.map((venue, i) => ({
    id: i + 1,
    title: venue?.holidayVenue?.name || "No Venue Name",
    date: formatDate(venue?.holidayVenue?.createdAt),
    capacity: `${venue?.students?.[0]?.holidayClassSchedules?.capacity ?? 0}/${venue?.students?.[0]?.holidayClassSchedules?.totalCapacity ?? 0}`,
}));




    const applyFiltersVenue = () => {
        const filtered = holidayCampsData.filter((camp) => {
            const campCategoryId = camp?.holidayCamp?.id;
            const campDateId =
                camp?.holidayCamp?.holidayCampDates?.[0]?.id;

            const matchCategory = selectedCategory
                ? campCategoryId === selectedCategory.value
                : true;

            const matchDate = selectedDate
                ? campDateId === selectedDate.value
                : true;

            return matchCategory && matchDate;
        });

        setTableData(filtered);
        setOpenDateFilter(false);
    };


    const handleDateChange = (value) => {
        setSelectedDate(value);
        console.log("Selected Date:", value);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
    };

    const fetchCamp = useCallback(async () => {
        const tokenLocal = localStorage.getItem("adminToken");
        if (!tokenLocal) return;


        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/list`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenLocal}`,
                    "Content-Type": "application/json",
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || {};
            setHolidayCampsData(result);
            setSummary(resultRaw?.summary);
        } catch (error) {
            console.error("Failed to fetch classSchedules:", error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);
    // ------------------------------
    // FILTER STATES
    // ------------------------------
    const [searchText, setSearchText] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState(""); // For Camp Type or Venue Type

    // ------------------------------
    // FILTER LOGIC
    // ------------------------------
    const filteredCamps = camps.filter((camp) => {
        const matchSearch =
            camp.title.toLowerCase().includes(searchText.toLowerCase()) ||
            camp.subtitle?.toLowerCase().includes(searchText.toLowerCase());

        const matchCapacity = capacityFilter
            ? Number(camp.capacity) >= Number(capacityFilter)
            : true;

        const matchType = typeFilter ? camp.type === typeFilter : true;

        return matchSearch && matchCapacity && matchType;
    });
console.log('holidayCampsData', holidayCampsData)
console.log('camps', camps)
    const filteredVenues = venues.filter((venue) => {
        const matchSearch =
            venue.title.toLowerCase().includes(searchText.toLowerCase());

        const matchCapacity = capacityFilter
            ? Number(venue.capacity) >= Number(capacityFilter)
            : true;

        const matchType = typeFilter ? venue.type === typeFilter : true;

        return matchSearch && matchCapacity && matchType;
    });


    useEffect(() => {
        fetchCamp();
    }, [])


    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const toggleUser = (id) => {
        setSelectedUserIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id) // remove
                : [...prev, id] // add
        );
    };

    const [openAgeFilter, setOpenAgeFilter] = useState(false);

    const [openDateFilter, setOpenDateFilter] = useState(false);

    const sendEmail = async (ids) => {
        setLoading(true);
        const token = localStorage.getItem("adminToken");

        const headers = {
            "Content-Type": "application/json",
        };
        // console.log('bookingIds', bookingIds)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/send-email`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    bookingIds: ids, // make sure bookingIds is an array like [96, 97]
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to send Email");
            }

            await showSuccess("Success!", result.message || "Mail has been Sent successfully.");

            return result;

        } catch (error) {
            console.error("Error sending Mail:", error);
            await showError("Error", error.message || "Something went wrong while sending Mail.");
               
            throw error;
        } finally {
            // await fetchOneToOneMembers(data.id);
            setLoading(false);
        }
    }


    const summaryCards = [
        { icon:  "/reportsIcons/user-group.png", iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]", title: "Total Students", value: summary?.totalStudents || 'N/A' },
        { icon:  "/reportsIcons/dollar-circle.png", iconStyle: "text-[#6F65F1] bg-[#F6F6FE]", title: "Revenue", value: `£ ${summary?.revenue}` },
        { icon:  "/reportsIcons/dollar-circle.png", iconStyle: "text-[#6F65F1] bg-[#F6F6FE]", title: "Average Price", value: `£ ${summary?.averagePrice}` },
        { icon: "/reportsIcons/magnet-purple.png", iconStyle: "text-[#099699] bg-[#F0F9F9]", title: "Top Source", value: `${summary?.topSource}`, },
    ];


const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) return;

    // Flatten data (include all students)
    const rows = [];

    filteredData.forEach((camp) => {
        camp.students.forEach((student, index) => {
            rows.push({
                Name: `${student.studentFirstName} ${student.studentLastName}`,
                Age: student.age,
                "Medical Information": student.medicalInformation || "N/A",
                "Price Paid": camp.payment?.amount
                    ? `£${camp.payment.amount}`
                    : "N/A",
                Source: camp?.bookedByAdmin
                    ? `${camp.bookedByAdmin.firstName} ${camp.bookedByAdmin.lastName}`
                    : "N/A",
                Status: camp.status,
                "Primary Student": index === 0 ? "Yes" : "No",
            });
        });
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Holiday Camp Members");

    // Export file
    XLSX.writeFile(workbook, "holiday_camp_student_info.xlsx");
};


    if (loading) return <Loader />;
    return (
        <>
            <div className="flex gap-5">
                <div className='md:w-[28%]'>

                    <div className=" bg-white py-4 rounded-2xl shadow-sm pb-0 overflow-auto">
                        <div className="flex justify-between items-center px-4">
                            <h2 className="text-xl font-semibold mb-4">Search now</h2>
                            <img
                                src="/DashboardIcons/filtericon.png"
                                onClick={() => setOpenDateFilter(true)}
                                className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                                style={{ filter: "brightness(0.5)" }}
                                alt=""
                            />

                        </div>
                        <div className="flex border border-[#E2E1E5] p-1 rounded-xl w-full md:w-11/12 m-auto">

                            {/* Camp Tab */}
                            <button
                                onClick={() => setActiveTab("camp")}
                                className={`flex-1 py-2 rounded-xl font-medium transition 
            ${activeTab === "camp"
                                        ? "bg-[#237FEA] text-white"
                                        : "text-gray-600 hover:bg-gray-100"}`}
                            >
                                Camp List
                            </button>

                            {/* Venue Tab */}
                            <button
                                onClick={() => setActiveTab("venue")}
                                className={`flex-1 py-2 rounded-xl font-medium transition
            ${activeTab === "venue"
                                        ? "bg-[#237FEA] text-white"
                                        : "text-gray-600 hover:bg-gray-100"}`}
                            >
                                Venue List
                            </button>

                        </div>


                        <div className="mt-4 px-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search camps..."
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none "
                                />
                            </div>
                        </div>

                        {activeTab === "camp" ? (
                            <div className="mt-5 ">
                                {filteredCamps.map((camp) => (
                                    <div
                                        key={camp.id}
                                        className={`flex p-4 items-start justify-between border-b border-gray-200 ${selected === camp.id ? "bg-[#F5F5F5] border-none" : "bg-none"}`}
                                    >
                                        <div className="flex items-start gap-3">

                                           <button
  onClick={(e) => {
    e.stopPropagation();
    setSelected((prev) => (prev === camp.id ? null : camp.id));
  }}
  className={`mt-1 w-5 h-5 flex items-center justify-center rounded-md border-2 
    ${selected === camp.id ? "border-none bg-blue-500" : "border-gray-300"}`}
>
  {selected === camp.id && (
    <Check size={14} strokeWidth={3} className="text-white" />
  )}
</button>



                                            <div>
                                                <div className="font-bold text-[#237FEA] text-[15px]">{camp.title}</div>
                                                <div className="text-black font-semibold text-sm">{camp.subtitle}</div>
                                                <div className="text-gray-500 text-xs mt-1">{camp.date}</div>
                                            </div>
                                        </div>

                                        {/* Capacity */}
                                        <div className="text-gray-500 text-sm whitespace-nowrap">
                                            Capacity - <span className="font-medium">{camp.capacity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-5 ">
                                {filteredVenues.map((venues) => (
                                    <div
                                        key={venues.id}
                                        className={`flex p-4 items-start justify-between border-b border-gray-200 ${selected === venues.id ? "bg-[#F5F5F5] border-none" : "bg-none"}`}
                                    >
                                        <div className="flex items-start gap-3">

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected(venues.id); // same functionality as before
                                                }}
                                                className={`mt-1 w-5 h-5 flex items-center justify-center rounded-md border-2 
        ${selected === venues.id ? "border-none bg-blue-500" : "border-gray-300"}`}
                                            >
                                                {selected === venues.id && (
                                                    <Check size={14} strokeWidth={3} className={`${selected === venues.id ? "text-white" : "text-gray-500"} `} />
                                                )}
                                            </button>



                                            <div>
                                                <div className="font-bold text-[#237FEA] text-[15px]">{venues.title}</div>
                                                <div className="text-gray-500 text-xs mt-1">{venues.date}</div>
                                            </div>
                                        </div>

                                        {/* Capacity */}
                                        <div className="text-gray-500 text-sm whitespace-nowrap">
                                            Capacity - <span className="font-medium">{venues.capacity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}



                    </div>

                </div>
                <div className='md:w-[72%]'>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {summaryCards.map((card, i) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 flex  items-center gap-4 hover:shadow-md transition-all duration-200"
                                >
                                    <div>
                                        <div
                                            className={`p-2 h-[50px] w-[50px] rounded-full ${card.iconStyle} bg-opacity-10 flex items-center justify-center`}
                                        >
                                          <div className={card.iconStyle}><img className="p-1" src={card.icon} alt="" /></div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-500">{card.title}</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold mt-1">{card.value}</h3>
                                            {card.change && (
                                                <p className="text-green-600 text-xs mt-1">({card.change})</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="mt-4 flex gap-6 items-center">
                            <h2 className="text-2xl font-semibold ">Student Info</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search Students"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 bg-white pr-3 py-2.5 border border-gray-200 rounded-lg outline-none"
                                />

                            </div>
                        </div>
                        <img
                            src="/DashboardIcons/filtericon.png"
                            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                            onClick={() => setOpenAgeFilter(true)}
                            style={{ filter: "brightness(0.5)" }}
                            alt=""
                        />
                    </div>
                    {
                        filteredData.length > 0 ? (
                            <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                                        <tr className="font-semibold text-[#717073]">
                                            <th className="py-3 px-4 whitespace-nowrap">Name</th>
                                            <th className="py-3 px-4 whitespace-nowrap">Age</th>
                                            <th className="py-3 px-4 whitespace-nowrap">Medical Information</th>
                                            <th className="py-3 px-4 whitespace-nowrap">Price Paid</th>
                                            <th className="py-3 px-4 whitespace-nowrap">Source</th>
                                            <th className="py-3 px-4 whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredData.map((camp, i) => {
                                            const student = camp?.students[0];
                                            const otherStudents = camp.students.slice(1);

                                            return (
                                                <React.Fragment key={i}>

                                                    {/* MAIN ROW */}
                                                    <tr
                                                        onClick={() =>
                                                            navigate(`/holiday-camp/members/account-information?id=${camp.id}`)
                                                        }
                                                        className="border-b border-[#EFEEF2] hover:bg-gray-50 transition cursor-pointer"
                                                    >
                                                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                                                            <div className="flex items-center gap-3">

                                                                {/* Checkbox */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleUser(camp.id);
                                                                    }}
                                                                    className={`mt-1 w-5 h-5 flex items-center justify-center rounded-md border-2 
                                                    ${selectedUserIds.includes(camp.id)
                                                                            ? "border-none bg-blue-500"
                                                                            : "border-gray-300"
                                                                        }`}
                                                                >
                                                                    {selectedUserIds.includes(camp.id) && (
                                                                        <Check size={14} strokeWidth={3} className="text-white" />
                                                                    )}
                                                                </button>

                                                                {student.studentFirstName + " " + student.studentLastName}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-4 whitespace-nowrap">{student.age}</td>
                                                        <td className="py-3 px-4 whitespace-nowrap">{student.medicalInformation || "N/A"}</td>
                                                        <td className="py-3 px-4 whitespace-nowrap">£{camp.payment?.amount || "N/A"}</td>

                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {camp?.bookedByAdmin
                                                                ? camp.bookedByAdmin.firstName + " " + camp.bookedByAdmin.lastName
                                                                : "N/A"}
                                                        </td>

                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            <span
                                                                className={`capitalize px-7 py-2 rounded-xl text-xs font-medium
    ${camp.status === "cancelled"
                                                                        ? "bg-red-50 text-red-600"
                                                                        : camp.status === "pending"
                                                                            ? "bg-yellow-50 text-yellow-600"
                                                                            : "bg-green-50 text-[#34AE56]"
                                                                    }
  `}
                                                            >
                                                                {camp.status}
                                                            </span>

                                                            {camp.students.length > 1 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedRow(expandedRow === i ? null : i);
                                                                    }}
                                                                    className="ms-2 bg-blue-500 text-white text-xs rounded-2xl px-3 py-1"
                                                                >
                                                                    Other Students
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* EXPANDED ROW */}
                                                    {expandedRow === i && otherStudents.length > 0 && (
                                                        <tr className="bg-gray-50 border-b border-[#EFEEF2]">
                                                            <td colSpan="6" className="py-4 ">
                                                                <table className="min-w-full text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="py-3 px-4 text-start whitespace-nowrap">Name</th>
                                                                            <th className="py-3 px-4 whitespace-nowrap text-start">Age</th>
                                                                            <th className="py-3 px-4 whitespace-nowrap text-start">Medical Information</th>
                                                                            <th className="py-3 px-4 whitespace-nowrap text-start">Price Paid</th>
                                                                            <th className="py-3 px-4 whitespace-nowrap  text-start">Source</th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody>
                                                                        {otherStudents.map((student2, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="py-3 px-4 whitespace-nowrap font-semibold">
                                                                                    {student2.studentFirstName + " " + student2.studentLastName}
                                                                                </td>

                                                                                <td className="py-3 px-4 whitespace-nowrap">{student2.age}</td>

                                                                                <td className="py-3 px-4 whitespace-nowrap">
                                                                                    {student2.medicalInformation || "N/A"}
                                                                                </td>

                                                                                <td className="py-3 px-4 whitespace-nowrap">
                                                                                    {camp.payment?.amount || "N/A"}
                                                                                </td>

                                                                                <td className="py-3 px-4 whitespace-nowrap">
                                                                                    {camp?.bookedByAdmin
                                                                                        ? camp.bookedByAdmin.firstName + " " + camp.bookedByAdmin.lastName
                                                                                        : "N/A"}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    )}

                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center py-3">No Data Found</p>
                        )
                    }



                    <div className="flex gap-2 mt-5 justify-end">
                        <button
                            onClick={() => {
                                if (selectedUserIds && selectedUserIds.length > 0) {
                                    sendEmail(selectedUserIds);
                                } else {
                                    showWarning("No Students Selected", "Please select at least one student before sending an email.");
                                       
                                }
                            }}
                            style={{ width: "max-content" }}
                            className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-3 py-2 rounded-xl  text-[16px]"
                        >

                            <img
                                src="/images/icons/mail.png"
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                alt=""
                            />
                            Send Email
                        </button>
                        <button style={{ width: "max-content" }} className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-3 py-2 rounded-xl  text-[16px]">
                            <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                            Send Text
                        </button>
                        <button style={{ width: "max-content" }} onClick={exportToExcel} className="flex gap-2 items-center justify-center bg-[#237FEA] text-white px-3 py-2 rounded-xl  text-[16px]">
                            <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                            Export Data
                        </button>
                    </div>
                </div>
            </div>
            {openDateFilter && (
                <div onClick={() => setOpenDateFilter(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl"
                    >
                        {/* Title */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-[18px] font-semibold">Filter</h2>
                            <X className="cursor-pointer" onClick={() => setOpenDateFilter(false)} />
                        </div>

                        {/* Date */}
                        <div className="mb-4 mt-3">
                            <label className="text-gray-800 font-medium text-sm mb-2 block">Date</label>
                            <Select
                                value={selectedDate}
                                onChange={handleDateChange}
                                options={dateOptions}
                                isClearable={false}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderRadius: "12px",
                                        minHeight: "46px",
                                        borderColor: "#D1D5DB",
                                        boxShadow: "none",
                                        "&:hover": { borderColor: "#237FEA" },
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        paddingRight: "10px",
                                    }),
                                }}
                                components={{
                                    IndicatorSeparator: () => null,
                                    DropdownIndicator: () => (
                                        <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                                    ),
                                }}
                            />
                        </div>

                        {/* Category */}
                        <div className="mb-6">
                            <label className="text-gray-800 font-medium text-sm mb-2 block">Category</label>
                            <Select
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                options={categoryOptions}
                                isClearable={false}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderRadius: "12px",
                                        minHeight: "46px",
                                        borderColor: "#D1D5DB",
                                        boxShadow: "none",
                                        "&:hover": { borderColor: "#237FEA" },
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        paddingRight: "10px",
                                    }),
                                }}
                                components={{
                                    IndicatorSeparator: () => null,
                                    DropdownIndicator: () => (
                                        <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                                    ),
                                }}
                            />
                        </div>

                        {/* Reset Filter Button */}
                        <div className="flex gap-2 items-center ">
                            <button
                                onClick={() => {
                                    setSelectedDate(null);
                                    setSelectedCategory(null);
                                }}
                                className="w-full py-3 bg-gray-600 text-white text-sm rounded-xl shadow-md active:scale-[.98] transition"
                            >
                                Reset Filter
                            </button>

                            {/* Apply Filter Button */}
                            <button
                                onClick={applyFiltersVenue}
                                className="w-full py-3 bg-blue-600 text-white text-sm rounded-xl shadow-md active:scale-[.98] transition"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>

            )}
            {openAgeFilter && (
                <div
                    onClick={() => setOpenAgeFilter(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl"
                    >
                        <div className="flex justify-end">
                            <X
                                className="cursor-pointer"
                                onClick={() => setOpenAgeFilter(false)}
                            />
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-800 font-semibold mb-3">Search by age</p>

                            <div className="space-y-3">
                                {ageData.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="flex items-center gap-3"
                                        onClick={() => toggleAge(item.id)}
                                    >
                                        <div
                                            className={`w-5 h-5 flex items-center justify-center rounded-md border-2
                ${selectedAges.includes(item.id)
                                                    ? "border-blue-600"
                                                    : "border-gray-300"}`}
                                        >
                                            {selectedAges.includes(item.id) && (
                                                <Check size={14} strokeWidth={3} className="text-blue-600" />
                                            )}
                                        </div>

                                        <span className="text-sm text-gray-700">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setOpenAgeFilter(false)}
                            className="w-full py-3 bg-blue-600 text-white text-sm rounded-xl shadow-md active:scale-[.98] transition"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default StudentCamp
