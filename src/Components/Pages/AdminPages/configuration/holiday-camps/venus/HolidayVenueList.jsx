import React, { useEffect, useRef, useState } from 'react';
import Create from './Create';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import Loader from '../../../contexts/Loader';
import PlanTabs from '../../../weekly-classes/find-a-class/PlanTabs';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePermission } from '../../../Common/permission';
import { useHolidayVenue } from '../../../contexts/HolidayVenueContext';
import { useHolidayPayments } from '../../../contexts/HolidayPaymentContext';
import { useHolidayTerm } from '../../../contexts/HolidayTermsContext';
import { showConfirm, showError } from '../../../../../../utils/swalHelper';
const HolidayVenueList = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [congestionNote, setCongestionNote] = useState(null);

  const [clickedIcon, setClickedIcon] = useState(null);

  const handleIconClick = (icon, plan = null) => {

    console.log('plan', plan)

    if (Array.isArray(plan)) {
      console.table(plan);
    } else {
    }

    // 🔴 Validation checks with  alerts
    if (!icon) {
      showError("Missing Icon", "❌ Icon is missing!");

      console.error("❌ Icon is missing!");
      return;
    }

    if (
      (icon === "currency" && (!plan || plan.length === 0)) ||
      (icon === "calendar" && !plan)
    ) {
      showError("Missing Data", `❌ Required plan data is missing for icon: ${icon}`);


      console.error(`❌ Required plan data is missing for icon: ${icon}`);
      return;
    }

    // 🟢 Normal flow
    setClickedIcon(icon);

    setCongestionNote(null);

    if (icon === "currency") {
      setSelectedPlans(plan || []);
    } else if (icon === "group") {
      setCongestionNote(plan);
    } else if (icon === "p") {
      setCongestionNote(plan);
    } else if (icon === "calendar") {
      setCongestionNote(plan);
    }

    setShowModal(true);
  };

  const { fetchGroups, groups } = useHolidayPayments()
  const { fetchHolidayCampDate, termGroup, termData } = useHolidayTerm()

  const { venues, setFormData, setIsEditVenue, deleteVenue, fetchVenues, loading, openForm, setOpenForm } = useHolidayVenue()
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
  const isAllSelected = venues.length > 0 && selectedUserIds.length === venues.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allIds = venues.map((user) => user.id);
      setSelectedUserIds(allIds);
    }
  };


  const handleDelete = (id) => {
    setOpenForm(null);
    showConfirm('Are you sure?', 'This action will permanently delete the venue.').then((result) => {
      if (result.isConfirmed) {
        deleteVenue(id); // Call your delete function here
      }
    });
    };



    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    useEffect(() => {
      fetchVenues();
      fetchGroups();
      fetchHolidayCampDate();
    }, [fetchVenues, fetchGroups, fetchHolidayCampDate]);

    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
    const [toDate, setToDate] = useState(null);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

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

    const calendarDays = getDaysArray();

    const goToPreviousMonth = () => {
      setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
      setCurrentDate(new Date(year, month + 1, 1));
    };

    const getDateStatus = (date) => {
      if (!date) return {};

      let isStartOrEnd = false;
      let isInBetween = false;
      let isExcluded = false;
      let isSessionDate = false;

      const targetDate = new Date(date);

      congestionNote.forEach((term) => {
        const start = new Date(term.startDate);
        const end = new Date(term.endDate);

        // Start / End
        if (isSameDate(targetDate, start) || isSameDate(targetDate, end)) {
          isStartOrEnd = true;
        }
        // In Between (excluding exact start/end)
        else if (targetDate > start && targetDate < end) {
          isInBetween = true;
        }

        // Exclusion Dates
        term.exclusionDates?.forEach((ex) => {
          if (isSameDate(targetDate, new Date(ex))) {
            isExcluded = true;
          }
        });

        // Session Dates
        term.sessionsMap?.forEach((session) => {
          if (isSameDate(targetDate, new Date(session.sessionDate))) {
            isSessionDate = true;
          }
        });
      });

      return { isStartOrEnd, isInBetween, isExcluded, isSessionDate };
    };


    const isSameDate = (d1, d2) =>
      d1 &&
      d2 &&
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();



    const handleDateClick = (date) => {
      if (!fromDate || (fromDate && toDate)) {
        setFromDate(date);
        setToDate(null);
      } else if (fromDate && !toDate) {
        if (date < fromDate) {
          setFromDate(date);
        } else {
          setToDate(date);
        }
      }
    };
    //     useEffect(() => {
    //  function handleClickOutside(e) {
    //   if (e.target.id === "form-backdrop") {
    //     setOpenForm(false);
    //     setIsEditVenue(false);
    //   }
    // }


    //     if (openForm) {
    //       document.addEventListener("mousedown", handleClickOutside);
    //     } else {
    //       document.removeEventListener("mousedown", handleClickOutside);
    //     }

    //     return () => {
    //       document.removeEventListener("mousedown", handleClickOutside);
    //     };
    //   }, [openForm]);

    const modalRef = useRef(null);
    const PRef = useRef(null);
    useEffect(() => {
      function handleClickOutside(event) {
        const activeRef = clickedIcon === "group" ? modalRef : PRef;

        if (
          activeRef.current &&
          !activeRef.current.contains(event.target)
        ) {
          setShowModal(false); // Close the modal
        }
      }

      if (showModal) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showModal, clickedIcon, setShowModal]);

    if (loading) {
      return (
        <>
          <Loader />
        </>
      )
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return "";

      const date = new Date(dateStr + "T00:00:00"); // force local midnight
      if (isNaN(date.getTime())) return ""; // invalid date

      return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const detectSeason = (termName) => {
      const name = termName?.toLowerCase();
      if (name?.includes('autumn')) return 'autumn';
      if (name?.includes('spring')) return 'spring';
      return 'summer';
    };



    const filteredVenues = venues.filter((user) => {
      const keyword = search.toLowerCase();

      return (
        user.area?.toLowerCase().includes(keyword) ||
        user.name?.toLowerCase().includes(keyword) ||
        user.address?.toLowerCase().includes(keyword) ||
        user.facility?.toLowerCase().includes(keyword)
      );
    });


    const { checkPermission } = usePermission();

    const canCreate =
      checkPermission({ module: 'term-group', action: 'view-listing' }) &&
      checkPermission({ module: 'term', action: 'view-listing' }) &&
      checkPermission({ module: 'venue', action: 'create' }) &&
      checkPermission({ module: 'payment-group', action: 'view-listing' })
    const canUpdate =
      checkPermission({ module: 'term-group', action: 'view-listing' }) &&
      checkPermission({ module: 'term', action: 'view-listing' }) &&
      checkPermission({ module: 'venue', action: 'update' }) &&
      checkPermission({ module: 'payment-group', action: 'view-listing' })

    const canDelete =
      checkPermission({ module: 'term-group', action: 'view-listing' }) &&
      checkPermission({ module: 'term', action: 'view-listing' }) &&
      checkPermission({ module: 'venue', action: 'delete' }) &&
      checkPermission({ module: 'payment-group', action: 'view-listing' })
    const canViewClassSchedule =
      checkPermission({ module: 'class-schedule', action: 'view-listing' })

    return (
      <div id="form-backdrop" ref={formRef} className=" pt-1 bg-gray-50 min-h-screen">
        <div className={`flex flex-wrap pe-4 justify-between items-center mb-4 ${openForm ? 'md:w-3/4' : 'w-full'}`}>
          <h2 className="text-[28px] font-semibold">Venues</h2>
          <input
            type="text"
            placeholder="Search venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className=" w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          {canCreate &&
            <button
              onClick={() => setOpenForm(true)}
              className="bg-[#237FEA] flex items-center gap-2 cursor-pointer text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
            >
              <div className="flex items-center gap-2">
                <img src="/members/add.png" className="w-5" alt="" />
                <span>Add a New Venue</span>
              </div>
            </button>
          }
        </div>

        <div className="md:md:flex gap-6">
          <div className={`transition-all duration-300 ${openForm ? 'md:w-3/4' : 'w-full'}`}>
            {
              filteredVenues.length > 0 ? (

                <div className="max-h-[600px]">
                  <table className="w-full table-fixed bg-white">
                    <thead className="bg-[#F5F5F5] text-left border-1 border-[#EFEEF2]">
                      <tr className="font-semibold border-[#E2E1E5] border-b ">
                        <th className="p-4 text-[#717073]">
                          <div className="flex gap-3 items-center">
                            <button
                              onClick={toggleSelectAll}
                              className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-gray-500 focus:outline-none"
                            >
                              {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                            </button>
                            Area
                          </div>
                        </th>
                        <th className="p-4 text-[#717073]">Name of the venue</th>
                        <th className="p-4 text-[#717073]">Address</th>
                        <th className="p-4 text-[#717073]">Facility</th>
                        <th className="p-4 text-[#717073]"></th>
                        <th className="p-4 text-[#717073]"></th>
                      </tr>
                    </thead>

                    <tbody >
                      {filteredVenues.map((user, idx) => {
                        const isChecked = selectedUserIds.includes(user.id);

                        return (
                          <tr key={idx} className="border-t border-[#EFEEF2] font-semibold text-[#282829] hover:bg-gray-50">
                            <td className="p-4 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCheckbox(user.id)}
                                  className={`w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-700' : 'border-gray-300'
                                    } transition-colors focus:outline-none`}
                                >
                                  {isChecked && <Check size={16} strokeWidth={3} className="text-gray-700" />}
                                </button>

                                <span>{user.area || "-"}</span>
                              </div>
                            </td>
                            <td className="p-4">{user.name || "-"}</td>
                            <td className="p-4 max-w-80">{user.address || "-"}</td>
                            <td className="p-4">{user.facility || "-"}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <div
                                  onClick={() =>
                                    handleIconClick(
                                      "calendar",
                                      user.holidayCamp
                                        ?.flatMap(group => group.holidayCampDates) || []
                                    )
                                  } className="cursor-pointer"
                                >
                                  <img
                                    src="/members/calendar-circle.png"
                                    className="min-w-6 min-h-6 max-w-6 max-h-6"
                                    alt="calendar"
                                  />
                                </div>
                                <div
                                  onClick={() => handleIconClick("currency", user.paymentGroups[0]?.holidayPaymentPlans)}
                                  className="cursor-pointer"
                                >
                                  <img
                                    src="/members/Currency Icon.png"
                                    className="min-w-6 min-h-6 max-w-6 max-h-6"
                                    alt="currency"
                                  />
                                </div>
                                {user.isCongested && (
                                  <div
                                    onClick={() => handleIconClick("group", user.howToEnterFacility)}
                                    className="cursor-pointer"
                                  >
                                    <img
                                      src="/members/Group-c.png"
                                      className="min-w-6 min-h-6 max-w-6 max-h-6"
                                      alt="group"
                                    />
                                  </div>
                                )}

                                <div
                                  onClick={() =>
                                    user.hasParking
                                      ? handleIconClick("p", user.parkingNote)
                                      : handleIconClick("p")
                                  }
                                  className="cursor-pointer"
                                >
                                  <img
                                    src="/members/p.png"
                                    className="min-w-6 min-h-6 max-w-6 max-h-6"
                                    alt="p icon"
                                  />
                                </div>

                              </div>


                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {canViewClassSchedule &&
                                  <div>  <img
                                    src="/members/Time-Circle.png"
                                    className="min-w-6 min-h-6 max-w-6 max-h-6 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-90"
                                    alt="Navigate"
                                    onClick={() => navigate(`/configuration/holiday-camp/venues/class-schedule?id=${user.id}`)}
                                  /></div>
                                }
                                {canUpdate &&
                                  <div><img onClick={() => {
                                    setIsEditVenue(true);
                                    setFormData(user);
                                    setOpenForm(true)
                                  }} src="/members/edit.png" className='min-w-6 min-h-6 max-w-6 max-h-6 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-90' alt="" />
                                  </div>
                                }
                                {canDelete &&
                                  <div>
                                    <img
                                      onClick={() => handleDelete(user.id)}
                                      src="/members/delete-02.png"
                                      className="min-w-6 min-h-6 max-w-6 max-h-6 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-90"
                                      alt=""
                                    />
                                  </div>
                                }

                              </div>

                            </td>

                          </tr>
                        );
                      })}

                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='text-center  p-4 border-dotted border rounded-md'>No Data Found</p>
              )
            }
          </div>

          {openForm && (
            <div className="md:w-1/4 bg-white  rounded-4xl relative">

              <button
                onClick={() => {
                  setOpenForm(false);
                  setIsEditVenue(false);
                  setFormData({
                    area: "",
                    name: "",
                    address: "",
                    facility: "",
                    parking: false,
                    congestion: false,
                    parkingNote: "",
                    entryNote: "",
                    termDateLinkage: "",
                    subscriptionLinkage: ""
                  });
                }}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-xl"
                title="Close"
              >
              </button>
              <Create
                groups={groups}
                termGroup={termData}
                onClose={() => setOpenForm(false)}
              />

            </div>
          )}

        </div>

        {showModal && clickedIcon === "currency" && selectedPlans.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/60 flex  max-h-full items-center justify-center">
            <div className="flex items-center    justify-center w-full px-4 py-6 sm:px-6 md:py-10">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl">
                <div className="overflow-y-auto max-h-[700px] rounded-3xl scrollbar-hide p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                    <h2 className="font-semibold text-[20px] sm:text-[24px]">Subscription Plan Preview</h2>
                    <button className="text-gray-400 hover:text-black text-xl font-bold">
                      <img
                        src="/images/icons/cross.png"
                        onClick={() => setShowModal(false)}
                        alt="close"
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                  <PlanTabs selectedPlans={selectedPlans} />
                </div>
              </div>
            </div>
          </div>
        )}
        {showModal && clickedIcon === "calendar" && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-3xl w-full max-h-[80%]   overflow-y-scroll  scrollbar-hide scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500  max-w-md sm:max-w-lg p-4 sm:p-6 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center border-b  border-[#E2E1E5] pb-4 mb-4">
                <h2 className="text-[24px] font-semibold">Term Dates</h2>
                <button onClick={() => setShowModal(false)}>
                  <img
                    src="/images/icons/cross.png"
                    alt="close"
                    className="w-4 h-4 cursor-pointer transform transition-transform duration-200 hover:scale-110"
                  />
                </button>
              </div>

              {/* Term List */}
              <div className="space-y-6 text-center text-[13px]   sm:text-[14px] text-[#2E2F3E] font-medium">

                {congestionNote.map((term) => (
                  <div key={term.id}>
                    <h3 className="text-[20px] font-semibold mb-1">{term.termName} </h3>
                    <p className="text-[18px]">
                      {formatDate(term.startDate)} - {formatDate(term.endDate)}
                    </p>
                    <p className="text-[18px]">
                      Half term Exclusion:{" "}
                      {term.exclusionDates?.map((ex, idx) => (
                        <span key={idx}>
                          {formatDate(ex)}{idx < term.exclusionDates.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Calendar Section */}
              <div className="rounded p-4 mt-6 text-center text-sm w-full max-w-md mx-auto">
                {/* Calendar Header */}
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

                {/*also in calendar make auto prefilled terms startdate and end date print all like january has 15 to 21 feb has 23 to 28 */}
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0 text-[16px]">
                  {calendarDays.map((date, i) => {
                    const { isStartOrEnd, isInBetween, isExcluded, isSessionDate } = getDateStatus(date);

                    let className = "aspect-square flex items-center justify-center transition-all duration-200 ";
                    let innerDiv = null;

                    if (!date) {
                      className += "";
                    } else if (isExcluded) {
                      className += "bg-gray-400 text-white opacity-60 rounded-full cursor-not-allowed";
                    } else if (isSessionDate) {
                      className += "bg-blue-600 text-white font-bold rounded-full"; // DARK BLUE
                    } else if (isStartOrEnd) {
                      className += "";
                      innerDiv = (
                        <div className="bg-blue-600 text-white rounded-full w-full h-full flex items-center justify-center font-bold">
                          {date.getDate()}
                        </div>
                      );
                    } else if (isInBetween) {
                      className += " text-gray-800";
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
              </div>
            </div>
          </div>
        )}
        {showModal && clickedIcon === "group" && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div
              ref={modalRef}
              className="relative bg-white rounded-2xl shadow-2xl px-6 py-4 min-w-[409px] max-w-[489px]"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-red-500 font-semibold text-[18px] leading-tight">
                  Congestion Information
                </h2>
                <img src="/images/icons/infoIcon.png" alt="" />
              </div>

              <div className="mt-2 text-[16px] text-gray-700 leading-snug">
                {congestionNote ? (
                  <p>This venue is inside of the congestion zone.</p>
                ) : (
                  <>
                    <p>There is no congestion charges at this venue.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {showModal && clickedIcon === "p" && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div
              ref={PRef}
              className="relative bg-white rounded-2xl shadow-2xl px-6 py-4 min-w-[409px] max-w-[489px]"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-red-500 font-semibold text-[18px] leading-tight">
                  Parking Information
                </h2>
                <img src="/images/icons/infoIcon.png" alt="" />
              </div>

              <div className="mt-2 text-[16px] text-gray-700 leading-snug">
                {congestionNote ? (
                  congestionNote
                ) : (
                  <>
                    <p>This venue has no parking facilities available.</p>
                    <p>Roadside parking is available.</p>
                  </>
                )}
              </div>


            </div>
          </div>
        )}

      </div>
    );
  };

  export default HolidayVenueList;
