import React, { useEffect, useState, useRef, useCallback , useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import Select from "react-select";

import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  UserRoundPlus, X,
  Filter, Loader2
} from "lucide-react";
import { TiUserAdd } from "react-icons/ti";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { PiUsersThreeBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import Loader from "../../../contexts/Loader";
import { useAccountsInfo } from "../../../contexts/AccountsInfoContext";
import { showError, showSuccess, showWarning } from "../../../../../../utils/swalHelper";
import { useGlobalSearch } from "../../../contexts/GlobalSearchContext";
const LeadsDashboard = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const [isOpen, setIsOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mainLoading, setMainLoading] = useState(false);
  const [noLoaderShow, setNoLoaderShow] = useState(false);
  const [leadsData, setLeadsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [summary, setSummary] = useState([]);
  const [textloading, setTextLoading] = useState(null);
  const { searchQuery } = useGlobalSearch();

  const popupRef = useRef(null);
  const [myVenues, setMyVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [tempSelectedAgent, setTempSelectedAgent] = useState(null);
  const [savedAgent, setSavedAgent] = useState([]);

  const searchedData = useMemo(() => {
  if (!searchQuery) return leadsData || [];

  const query = searchQuery.toLowerCase();

  return leadsData.filter((lead) => {
    const values = [
      lead?.parentName,
      lead?.childName,
      lead?.email,
      lead?.phone,
      lead?.postCode,
      lead?.age,
      lead?.status,
      lead?.source,
      lead?.packageInterest,
      lead?.availability,
    ];

    return values.some((val) =>
      String(val || "").toLowerCase().includes(query)
    );
  });
}, [leadsData, searchQuery]);
  function formatLocalDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // returns "2025-08-24"
  }

  // console.log('fromDate,toDate', fromDate, toDate)
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // you can change this
  const startIndex = (currentPage - 1) * rowsPerPage;


  const paginatedData = searchedData.slice(
    startIndex,
    startIndex + rowsPerPage
  );
  const totalItems = searchedData.length;

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);
  const fetchLeads = useCallback(
    async (
      studentName = "",
      status1 = false,
      status2 = false,
      status3 = false,
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      if (!studentName) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);

        // Status filters
        if (status1) queryParams.append("type", "paid");
        if (status2) queryParams.append("type", "trial");
        if (status3) queryParams.append("type", "cancelled");


        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }
        // Trial dates (support array or single value)
        // const trialDates = Array.isArray(dateoftrial) ? dateoftrial : [dateoftrial];
        // trialDates
        //   .filter(Boolean)
        //   .map(d => formatLocalDate(d))
        //   .filter(Boolean)
        //   .forEach(d => queryParams.append("trialDate", d));

        const url = `${API_BASE_URL}/api/admin/one-to-one/leads/list${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data || [];
        setLeadsData(result);
        setSummary(resultRaw.summary);
        setFromDate('');
        setToDate('');
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        setLoading(false); // only stop loader if it was started
      }
    },
    []
  );
  const { sendOnetoOneMail } = useAccountsInfo();

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setMainLoading(true);
        await fetchLeads();
      } finally {
        setMainLoading(false);
      }
    };

    loadLeads();
  }, [fetchLeads]);

 const sendText = async (bookingIds) => {
    console.log('bookingIds', bookingIds)
    setTextLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/booking/send-text`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingId: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send text");
      }

      await showSuccess("Success!", result.message || "Text has been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error sending Text:", error);
      await showError("Error", error.message || "Something went wrong while sending text.");
      throw error;
    } finally {
      setTextLoading(false);
      setSelectedUserIds([])
      await fetchLeads();
    }
  };

  const sources = summary?.sourceOfBookings;

  // Determine finalSource based on conditions
  let finalSource = "Online"; // default if not exist or invalid

  if (Array.isArray(sources) && sources.length > 0) {
    // find the max count
    const maxCount = Math.max(...sources.map((s) => s.count));

    // filter all sources that share the max count
    const topSources = sources.filter((s) => s.count === maxCount);

    // if tie → pick first one, else → only one with max count
    finalSource = topSources[0]?.source || "Online";
  }

  // then your summaryCards
  const summaryCards = [
    { icon: "/reportsIcons/user-group.png", iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]", title: "Total Leads", value: summary?.totalLeads?.count, change: summary?.totalLeads?.average },
    { icon: '/reportsIcons/greenuser.png', iconStyle: "text-[#099699] bg-[#E0F7F7]", title: "New Leads", value: summary?.newLeads?.count, change: summary?.newLeads?.average },
    { icon: '/reportsIcons/orangeuser.png', iconStyle: "text-[#F38B4D] bg-[#FFF2E8]", title: "Leads to Bookings", value: summary?.leadsWithBookings?.count, change: summary?.leadsWithBookings?.average },
    { icon: '/reportsIcons/purple-user-group.png', iconStyle: "text-[#6F65F1] bg-[#E9E8FF]", title: "Source of Leads", value: finalSource },
  ];
  const [formData, setFormData] = useState({
    parentName: "",
    childName: "",
    age: "",
    postCode: "",
    packageInterest: "",
    availability: "",
    source: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('formData', formData)
    // 🔍 Validate required fields (example)
    if (
      !formData.parentName ||
      !formData.availability ||
      !formData.age ||
      !formData.childName ||
      !formData.packageInterest ||
      !formData.postCode ||
      !formData.source
    ) {
      const missingFields = [];

      if (!formData.parentName) missingFields.push("Parent Name");
      if (!formData.childName) missingFields.push("Child Name");
      if (!formData.age) missingFields.push("Age");
      if (!formData.postCode) missingFields.push("Post Code");
      if (!formData.packageInterest) missingFields.push("Package Interest");
      if (!formData.availability) missingFields.push("Availability");
      if (!formData.source) missingFields.push("Source");
      showWarning("Missing Fields", `Please fill out the following required field(s):\n\n${missingFields.map(f => `<li>• ${f}</li>`).join("")}`);


      return;
    }


    console.log("Submitting lead:", formData);

    setLoading(true); // 🌀 optional loader state

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/leads/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData), // ✅ remove unnecessary wrapping {formData}
      });

      const result = await response.json();

      if (!response.ok) {
        // ❌ Handle API error response
        throw new Error(result.message || "Failed to create lead.");
      }

      // ✅ Success alert
      showSuccess("Lead Created", "The lead has been successfully added.");

      setCurrentPage(1);
      await fetchLeads(); // refresh roles or data
      setIsOpen(false);   // close modal or form
      setFormData({});    // reset form if needed

    } catch (error) {
      console.error("Create lead error:", error);

      showWarning("Error", error.message || "Something went wrong while creating the lead.");

    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If search is cleared, hide loader and optionally reset data
    if (value.length === 0) {
      fetchLeads(""); // optional: reload default list
      return;
    }

    setCurrentPage(1);

    fetchLeads(value);

  };

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const leadsDatas = Array(10).fill({
    id: 1,
    parent: "Tom Jones",
    child: "Steve Jones",
    age: 10,
    postCode: "W14 9EB",
    package: "Gold",
    availability: "Weekends",
    source: "Referral",
    status: "Paid",
  });
  console.log('selectedUserIds', selectedUserIds)
  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // ==== Calendar Logic ====
  const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month, year) =>
    new Date(year, month, 1).getDay(); // 0=Sun

  const daysInMonth = getDaysInMonth(
    currentDate.getMonth(),
    currentDate.getFullYear()
  );
  const firstDay = getFirstDayOfMonth(
    currentDate.getMonth(),
    currentDate.getFullYear()
  );
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString("default", { month: "long" });


  const getDaysArray = () => {
    const startDay = new Date(year, month, 1).getDay(); // Sunday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const offset = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };
  const exportToExcel = () => {
    if (!leadsData || !leadsData.length) {
      alert("No leads data available to export.");
      return;
    }

    // Prepare data
    const dataToExport = leadsData
      .filter((lead) => selectedUserIds.length === 0 || selectedUserIds.includes(lead.id))
      .map((lead) => ({
        "Parent Name": lead.parentName || "-",
        "Child Name": lead.childName || "-",
        Age: lead.age || "-",
        Postcode: lead.postCode || "-",
        "Package Interest": lead.packageInterest || "-",
        Availability: lead.availability || "-",
        Source: lead.source || "-",
        Status: lead.status || "-",
      }));

    if (!dataToExport.length) {
      alert("No data selected to export.");
      return;
    }

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LeadsData");

    // Export to file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "LeadsData.xlsx");
  };

  const calendarDays = getDaysArray();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };


  const isInRange = (date) => {
    if (!fromDate || !toDate || !date) return false;
    return date >= fromDate && date <= toDate;
  };
  const isSameDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = d1 instanceof Date ? d1 : new Date(d1);
    const date2 = d2 instanceof Date ? d2 : new Date(d2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };


  const handleDateClick = (date) => {
    if (!date) return;

    if (!fromDate) {
      setFromDate(date);
      setToDate(null); // reset second date
    } else if (!toDate) {
      // Ensure order (from <= to)
      if (date < fromDate) {
        setToDate(fromDate);
        setFromDate(date);
      } else {
        setToDate(date);
      }
    } else {
      // If both already selected, reset
      setFromDate(date);
      setToDate(null);
    }
  };
  const applyFilter = () => {
    const bookedByParams = Array.isArray(savedAgent) ? savedAgent : [];

    const isValidDate = (d) => d instanceof Date && !isNaN(d.valueOf());
    const hasFrom = isValidDate(fromDate);
    const hasTo = isValidDate(toDate);
    const hasRange = hasFrom && hasTo;

    // ✅ SweetAlert if only one date is selected
    if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
      showWarning("Incomplete Date Range", hasFrom
        ? "Please select a To Date to complete the date range."
        : "Please select a From Date to complete the date range.",)

      return; // stop further execution
    }

    const range = hasRange ? [fromDate, toDate] : [];

    // If trialDate is checked: send range as dateBookedFrom/To
    // Else: send range as createdAtFrom/To
    const dateRangeMembership = checkedStatuses.trialDate ? range : [];
    const otherDateRange = checkedStatuses.trialDate ? [] : range;
    setCurrentPage(1);

    fetchLeads(
      "",                  // venueName
      checkedStatuses.paid,   // status1
      checkedStatuses.trial,  // month2 -> duration 3
      checkedStatuses.cancelled, // month3 -> duration 1 (flexi)
      otherDateRange,         // createdAt range [from,to] OR []
      bookedByParams          // bookedBy ids
    );
  };

  const prevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }; const handleCheckboxChange = (key) => {
    setCheckedStatuses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  // ✅ Define all filters with dynamic API mapping
  const filterOptions = [
    { label: "Paid", key: "paid", apiParam: "type", apiValue: "paid" },
    { label: "Trial", key: "trial", apiParam: "type", apiValue: "trial" },
    { label: "cancelled", key: "cancelled", apiParam: "type", apiValue: "cancelled" },
  ]
  const [checkedStatuses, setCheckedStatuses] = useState(
    filterOptions.reduce((acc, option) => ({ ...acc, [option.key]: false }), {})
  );



  // Prepare calendar cells
  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

  if (mainLoading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  return (
    <>

      <div className="min-h-screen overflow-hidden bg-gray-50 py-6 flex flex-col lg:flex-row ">
        {/* Left Section */}
        <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {/* <Icon size={24} className={card.iconStyle} /> */}
                      <img src={Icon} alt="" className="p-1" />
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

          {/* Leads Table */}
          <div className="">
            <div className="flex justify-between items-center p-4">
              <h2 className="font-semibold text-2xl">One to One Leads</h2>
              <div className="flex gap-4 items-center">
                <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                  <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                </div>
                <button className="bg-white border border-[#E2E1E5] rounded-full flex justify-center items-center h-10 w-10"><TiUserAdd className="text-xl" /></button>
                <button onClick={() => setIsOpen(true)}
                  className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <Plus size={16} />
                  Add new lead
                </button>
                {leadsData.length == 0 && (
                  <button onClick={() => {
                    fetchLeads();
                    setFromDate('');
                    setToDate('');
                    setCheckedStatuses(
                      filterOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {})
                    );
                  }}
                    className="flex items-center gap-2 bg-[#ccc] text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-500 transition">

                    Reset Filters
                  </button>

                )}
              </div>
            </div>

            {
              paginatedData.length > 0 ? (
                <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                      <tr className="font-semibold text-[#717073]">
                        <th className="py-3 px-4 whitespace-nowrap">Parent Name</th>
                        <th className="py-3 px-4 whitespace-nowrap">Child Name</th>
                        <th className="py-3 px-4 whitespace-nowrap">Age</th>
                        <th className="py-3 px-4 whitespace-nowrap">PostCode</th>
                        <th className="py-3 px-4 whitespace-nowrap">Package Interest</th>
                        <th className="py-3 px-4 whitespace-nowrap">Availability</th>
                        <th className="py-3 px-4 whitespace-nowrap">Source</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((lead, i) => {
                        const isChecked = selectedUserIds.includes(lead.id);
                        return (
                          <tr
                            key={i}

                            onClick={() => {
                              if (lead?.booking) {
                                showWarning("Already Booked", "This lead has already been booked.");

                                return;
                              }

                              navigate(`/one-to-one/leads/booking-form?leadId=${lead.id}`)
                            }}

                            className={` border-b border-[#EFEEF2] hover:bg-gray-50 transition cursor-pointer ${lead?.booking ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                              }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap font-semibold">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // ⛔ prevent row click
                                    toggleCheckbox(lead.id);
                                  }}
                                  className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? "border-gray-500" : "border-gray-300"
                                    }`}
                                >
                                  {isChecked && (
                                    <Check
                                      size={16}
                                      strokeWidth={3}
                                      className="text-gray-500"
                                    />
                                  )}
                                </button>
                                {lead.parentName}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.childName}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.age}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.postCode}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.packageInterest}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.availability}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{lead.source}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="bg-[#FBEECE] capitalize semibold text-[#EDA600] px-7 py-2 rounded-xl text-xs font-medium">
                                {lead.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">

                      {/* Rows per page */}
                      <div className="flex items-center gap-2 mb-3 sm:mb-0">
                        <span>Rows per page:</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => setRowsPerPage(Number(e.target.value))}
                          className="border rounded-md px-2 py-1"
                        >
                          {[5, 10, 20, 50].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>

                        <span className="ml-2">
                          {Math.min(startIndex + 1, totalItems)} –{" "}
                          {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
                        </span>
                      </div>

                      {/* Pagination buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md border ${currentPage === 1
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-100 border-gray-300"
                            }`}
                        >
                          Prev
                        </button>

                        {(() => {
                          const buttons = [];
                          const maxVisible = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                          let endPage = startPage + maxVisible - 1;

                          if (endPage > totalPages) {
                            endPage = totalPages;
                            startPage = Math.max(1, endPage - maxVisible + 1);
                          }

                          if (startPage > 1) {
                            buttons.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className={`px-3 py-1 rounded-md border ${currentPage === 1
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "hover:bg-gray-100 border-gray-300"
                                  }`}
                              >
                                1
                              </button>
                            );
                            if (startPage > 2) buttons.push(<span key="s-ellipsis">...</span>);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            buttons.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`px-3 py-1 rounded-md border ${currentPage === i
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "hover:bg-gray-100 border-gray-300"
                                  }`}
                              >
                                {i}
                              </button>
                            );
                          }

                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1)
                              buttons.push(<span key="e-ellipsis">...</span>);
                            buttons.push(
                              <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "hover:bg-gray-100 border-gray-300"
                                  }`}
                              >
                                {totalPages}
                              </button>
                            );
                          }

                          return buttons;
                        })()}

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-100 border-gray-300"
                            }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              ) : (
                <>
                  <p className="text-center py-3">No Data Found</p>
                </>
              )
            }


          </div>
        </div>

        {/* Right Sidebar */}
        {
          showFilter && (
            <div className="md:w-4/12  flex-shrink-0   gap-5 md:ps-3">
              <div className="space-y-3 bg-white p-6 mb-5  rounded-3xl shadow-sm ">
                <h2 className="text-[24px] font-semibold">Search Now </h2>
                <div className="">
                  <label htmlFor="" className="text-base font-semibold">Search Student</label>
                  <div className="relative mt-2 ">
                    <input
                      type="text"
                      placeholder="Search by student name"
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                    />
                    <FiSearch className="absolute left-3 top-4 text-[20px]" />
                  </div>
                </div>

              </div>

              <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                <div className="">
                  <div className="flex justify-between items-center mb-5 ">
                    <h2 className="text-[24px] font-semibold">Filter by date </h2>
                    <button onClick={applyFilter} className="flex gap-2 items-center bg-[#237FEA] text-white px-3 py-2 rounded-lg text-sm text-[16px]">
                      <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                      Apply Filter
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg w-full">
                    <div className="font-semibold mb-2 text-[18px]">Choose type</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-semibold text-[16px]">

                      {filterOptions.map(({ label, key }) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="peer hidden"
                            checked={checkedStatuses[key]}
                            onChange={() => handleCheckboxChange(key)}
                          />
                          <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                            <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                          </span>
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>



                  <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                    {/* Header */}
                    <div className="flex justify-center gap-5 items-center mb-3">
                      <button
                        onClick={goToPreviousMonth}
                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <p className="font-semibold text-[20px]">
                        {currentDate.toLocaleString("default", { month: "long" })} {year}
                      </p>
                      <button
                        onClick={goToNextMonth}
                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Day Labels */}
                    <div className="grid grid-cols-7 text-xs gap-1 text-[18px] text-gray-500 mb-1">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                        <div key={day} className="font-medium text-center">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Weeks */}
                    <div className="flex flex-col  gap-1">
                      {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                        const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);


                        return (
                          <div
                            key={weekIndex}
                            className="grid grid-cols-7 text-[18px] h-12 py-1  rounded"
                          >
                            {week.map((date, i) => {
                              const isStart = isSameDate(date, fromDate);
                              const isEnd = isSameDate(date, toDate);
                              const isStartOrEnd = isStart || isEnd;
                              const isInBetween = date && isInRange(date);
                              const isExcluded = !date; // replace with your own excluded logic

                              let className =
                                " w-full h-12 aspect-square flex items-center justify-center transition-all duration-200 ";
                              let innerDiv = null;

                              if (!date) {
                                className += "";
                              } else if (isExcluded) {
                                className +=
                                  "bg-gray-300 text-white opacity-60 cursor-not-allowed";
                              } else if (isStartOrEnd) {
                                // Outer pill connector background
                                className += ` bg-sky-100 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""
                                  }`;
                                // Inner circle but with left/right rounding
                                innerDiv = (
                                  <div
                                    className={`bg-blue-700 rounded-full text-white w-12 h-12 flex items-center justify-center font-bold
                  
                  `}
                                  >
                                    {date.getDate()}
                                  </div>
                                );
                              } else if (isInBetween) {
                                // Middle range connector
                                className += "bg-sky-100 text-gray-800";
                              } else {
                                className += "hover:bg-gray-100 text-gray-800";
                              }

                              return (
                                <div
                                  key={i}
                                  onClick={() => date && !isExcluded && handleDateClick(date)}
                                  className={className}
                                >
                                  {innerDiv || (date ? date.getDate() : "")}
                                </div>
                              );
                            })}
                          </div>

                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 justify-between mt-5">
                <button
                  onClick={() => {
                    if (selectedUserIds && selectedUserIds.length > 0) {
                      sendOnetoOneMail(selectedUserIds);
                    } else {
                      showWarning("No Students Selected", "Please select at least one Lead before sending an email.");

                    }
                  }}
                  className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]"
                >
                  <img
                    src="/images/icons/mail.png"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    alt=""
                  />
                  Send Email
                </button>
                <button
                  onClick={() => {
                    if (selectedUserIds && selectedUserIds.length > 0) {
                      sendText(selectedUserIds);
                    } else {
                      showWarning("No Students Selected", "Please select at least one Lead before sending an email.");

                    }
                  }}
                  className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]">
                  <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                  {textloading ? (
                    <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                  ) : (
                    <>
                      Send Text
                    </>
                  )}
                </button>
                <button onClick={exportToExcel} className="flex gap-2 items-center justify-center bg-[#237FEA] text-white px-3 py-2 rounded-xl  text-[16px]">
                  <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                  Export Data
                </button>
              </div>
            </div>

          )
        }


      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-5">
          {/* Modal box */}
          <div className="bg-white rounded-2xl max-h-[90vh] overflow-auto w-full max-w-md p-6 relative shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={22} />
            </button>

            <h2 className="text-lg font-semibold text-center mb-6">
              Add a new lead
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Parent Name
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Child Name
                </label>
                <input
                  type="text"
                  name="childName"
                  value={formData.childName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Post Code
                </label>
                <input
                  type="text"
                  name="postCode"
                  value={formData.postCode}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Package Interest
                </label>
                <select
                  name="packageInterest"
                  value={formData.packageInterest}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Package</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Weekends">Weekends</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select</option>
                  <option value="Referral">Referral</option>
                  <option value="Online">Online</option>
                  <option value="Flyer">Flyer</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-auto px-7 py-2.5 rounded-lg font-medium transition 
        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#237FEA] hover:bg-blue-700 text-white"}`}
                >
                  {loading ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadsDashboard;
