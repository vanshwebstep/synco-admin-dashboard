import { Plus, X, Search, Download, CalendarDays } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import QcConfiguration from "./QcConfiguration";
import InvoicePdf from "./InvoicePdf";
import { useCoachPro } from "../../../contexts/CoachProContext";
import { useVenue } from "../../../contexts/VenueContext";
import Loader from '../../../contexts/Loader';
import { showError, showSuccess, showConfirm } from "../../../../../../utils/swalHelper";

import Select from "react-select";



const assessments = [
  { title: "How to use this app", status: 'Pending', grade: "0/15", percentage: '100%' },
  { title: "Coach aducation", status: 'Passed', grade: "0/15", percentage: '100%' },
  { title: "Health and safety", status: 'Passed', grade: "0/15", percentage: '100%' },
  { title: "Safeguarding", status: 'Retake', grade: "0/15", percentage: '100%' },
];
const qcResults = [
  { date: "Sat 3rd April 2023", time: '10:30-11:30am', accesor: "John Fernandes", venue: 'Marylebone', result: '75%' },
  { date: "Sat 3rd April 2023", time: '10:30-11:30am', accesor: "John Fernandes", venue: 'Marylebone', result: '75%' },
  { date: "Sat 3rd April 2023", time: '10:30-11:30am', accesor: "John Fernandes", venue: 'Marylebone', result: '75%' },
  { date: "Sat 3rd April 2023", time: '10:30-11:30am', accesor: "John Fernandes", venue: 'Marylebone', result: '75%' },
];
const attendanceData = [
  { name: "Chelsea", date: "1st May, 2023 - 11:00 AM", invoiceNumber: '#123456789', sessionDays: 5, status: 'paid', account: '£120.00' },
  { name: "Chelsea", date: "1st May, 2023 - 11:00 AM", invoiceNumber: '#123456789', sessionDays: 5, status: 'paid', account: '£120.00' },
  { name: "Chelsea", date: "1st May, 2023 - 11:00 AM", invoiceNumber: '#123456789', sessionDays: 5, status: 'unpaid', account: '£120.00' },
  { name: "Chelsea", date: "1st May, 2023 - 11:00 AM", invoiceNumber: '#123456789', sessionDays: 5, status: 'unpaid', account: '£120.00' },
];
const sessions = [
  {
    name: "Session 1",
    address: "Address 1",
    datetime: "1st May, 2023 – 11:00 AM",
    price: "£120.00",
  },
  {
    name: "Session 2",
    address: "Address 2",
    datetime: "3rd May, 2023 – 12:00 PM",
    price: "£120.00",
  },
  {
    name: "Session 3",
    address: "Address 3",
    datetime: "4th May, 2023 – 13:00 PM",
    price: "£120.00",
  },
  {
    name: "Session 4",
    address: "Address 4",
    datetime: "6th May, 2023 – 14:00 AM",
    price: "£120.00",
  },
  {
    name: "Session 5",
    address: "Address 5",
    datetime: "7th May, 2023 – 15:00 AM",
    price: "£120.00",
  },
];
export default function CoachProfile() {
  const { coachProData, fetchCoachPro, createCoachPro, deleteVenueAllocation, updateCoachPro } = useCoachPro();
  const { venues, isEditVenue, setIsEditVenue, deleteVenue, fetchVenues, openForm, setOpenForm } = useVenue()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openVenueFilter, setOpenVenueFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [venuesData, setVenuesData] = useState([]);
  console.log('venuesDataaasas', selectedCoach)
  const [formData, setFormData] = useState({ location: "", rate: "", address: "", id: "" });
  const [editingRow, setEditingRow] = useState(null);
  const [editRate, setEditRate] = useState("");
  const [openRow, setOpenRow] = useState(null);
  const [openRowIndex, setOpenRowIndex] = useState(null);
  const [openAttendanceDataRowIndex, setOpenAttendanceDataRowIndex] = useState(null);

  const [checked, setChecked] = useState(venuesData.map(() => false));
  const allChecked = checked.every(Boolean);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchCoachPro(),
          fetchVenues()
        ]);

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // fetch on mount
  useEffect(() => {
    if (coachProData && coachProData.length > 0) {
      setSelectedCoach(coachProData[0]);
    }
  }, [coachProData]);
  useEffect(() => {
    if (!coachProData.length) return;

    // 🟢 First page load only
    if (!selectedCoachId) {
      const firstCoach = coachProData[0];
      setSelectedCoachId(firstCoach.id);
      setSelectedCoach(firstCoach);
      return;
    }

    // 🟢 After create / update / delete → preserve selection
    const sameCoach = coachProData.find(
      (coach) => coach.id === selectedCoachId
    );

    if (sameCoach) {
      setSelectedCoach(sameCoach);
    }
  }, [coachProData, selectedCoachId]);

  const handleCoachSelect = (coach) => {
    setSelectedCoachId(coach.id);
    setSelectedCoach(coach);
  };
  const formatQualificationLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());


  const parsedQualifications = useMemo(() => {
    return selectedCoach?.qualifications && typeof selectedCoach.qualifications === "object"
      ? selectedCoach.qualifications
      : {};
  }, [selectedCoach]);


  const qualifications = useMemo(() => {
    return Object.entries(parsedQualifications).map(([key, value]) => ({
      key,
      address: formatQualificationLabel(key),
      checked: !!value,      // checkbox checked if file exists
      download: !!value,     // show download button if file exists
      url: value || null,    // actual file URL
    }));
  }, [parsedQualifications]);




  useEffect(() => {
    if (selectedCoach) {
      setFormData((prev) => ({
        ...prev,
        qualifications: parsedQualifications,
      }));
    }
  }, [selectedCoach, parsedQualifications]);

  useEffect(() => {
    if (coachProData && coachProData.length > 0) {
      setSelectedCoach(coachProData[0]);

    }
  }, [coachProData]); // runs when coachProData changes


  const toggleAll = () => {
    setChecked(checked.map(() => !allChecked));
  };

  const toggleOne = (i) => {
    const newChecked = [...checked];
    newChecked[i] = !newChecked[i];
    setChecked(newChecked);
  };
  const getStatusClasses = (status) => {
    if (!status) return "";

    const s = status.toLowerCase();

    if (s === "passed")
      return "bg-[#E6F9EC] text-[#1F9254]"; // green

    if (s === "pending")
      return "bg-[#FFF7E6] text-[#DFA100]"; // yellow

    if (s === "retake" || s === "failed")
      return "bg-[#FDEDED] text-[#D60000]"; // red

    return "bg-gray-100 text-gray-600";
  };
  const venueOptions = venues.map((v) => ({
    value: v.id,          // 👈 this is what you want to save
    label: v.name,        // 👈 this is what user sees
  }));
  const filteredCoaches = coachProData.filter((coach) => {
    const fullName = `${coach.firstName} ${coach.lastName || ""}`.toLowerCase();
    const email = coach.email?.toLowerCase() || "";

    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase())
    );
  });

  const handleSave = async () => {
    try {
      if (modalMode === "add") {
        const payload = {
          venueId: formData.location,
          rate: formData.rate,
          coachId: selectedCoach.id,
        };

        await createCoachPro(payload); // 🔥 fetchCoachPro already runs
      } else {
        const payload = {
          venueId: formData.location,
          rate: formData.rate,
        };

        await updateCoachPro(formData.id, payload); // 🔥 fetchCoachPro already runs
      }

      // UI reset only
      setIsModalOpen(false);
      setEditingIndex(null);
      setModalMode("add");
      setFormData({ location: "", rate: "", id: "" });

    } catch (error) {
      console.error("Venue save failed", error);
    }
  };


  const handleDownload = async (fileId, fileUrl) => {
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/coach-profile/venue-allocate/download/${fileId}/${fileUrl}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Convert response to Blob
      const blob = await response.blob();

      // Create temporary URL
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create anchor tag
      const a = document.createElement("a");
      a.href = downloadUrl;

      // Optional: set filename
      a.download = fileUrl.split("/").pop();

      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  const handleDeleteVenue = async (id) => {
    const result = await showConfirm("Are you sure?", "This venue allocation will be permanently deleted.", "Yes, delete it");

    if (!result.isConfirmed) return;

    try {
      const res = await deleteVenueAllocation(id);

      showSuccess("Deleted!", res?.message || "Venue allocation deleted successfully.");
    } catch (err) {
      showError("Error", err.message || "Failed to delete venue allocation.");
    }
  };
  useEffect(() => {
    if (selectedCoach) {
      setVenuesData(selectedCoach.coachAllocations || []);
    }
  }, [selectedCoach]);



  const tabs = ["Venues allocation", "Qualifications", "Assessments", "Contract", "QC Results", "Attendance"];
  const [activeTab, setActiveTab] = useState(0);
  console.log('selectedCoach', selectedCoach)
  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  return (
    <>

      <div className="flex min-h-screen bg-gray-50 p-4 gap-4">

        <div className="md:w-[20%] bg-white rounded-2xl py-5">
          <div className="relative px-5">
            <Search className="absolute top-2 left-8" />
            <input
              type="text"
              placeholder="Search coach"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#E2E1E5] rounded-lg p-2 pl-12 mb-4"
            />
          </div>

          <div>
            {filteredCoaches.map((coach, index) => (
              <div
                key={coach.id} // unique key
                onClick={() => handleCoachSelect(coach)}
                className={`flex items-center gap-3 p-4 px-5 cursor-pointer
                   ${selectedCoachId === coach.id
                    ? "bg-[#F7FBFF] border-l-4 border-[#237FEA]"
                    : "border-b border-[#E2E1E5]"
                  }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={coach.profile || "/members/dummyuser.png"} // use profile if available
                    alt={`${coach.firstName} ${coach.lastName || ""}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div>
                  <p className="font-semibold text-[#101828] mb-1">{`${coach.firstName} ${coach.lastName || ""}`}</p>
                  <p className="text-[14px] text-[#717073]">{coach.email}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
        {!selectedCoach ? (
          <div className="w-full flex items-center justify-center text-gray-500 text-lg py-10">
            No coach found
          </div>
        ) : (
          <div className="md:w-[80%] bg-white p-4 rounded-2xl flex gap-4">

            <div className="bg-[#FAFAFA] border border-[#E2E1E5] min-w-60 rounded-3xl py-6">
              <div className="flex flex-col items-center border-b border-[#E2E1E5] pb-5 px-6">
                <div className="w-24 h-24 rounded-full mb-3">
                  <img
                    src={selectedCoach?.profile || "/members/dummyuser.png"} // use profile if available
                    alt={`${selectedCoach?.firstName} ${selectedCoach?.lastName || ""}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h2 className="text-lg font-semibold">{`${selectedCoach?.firstName} ${selectedCoach?.lastName || ""}`}</h2>
              </div>

              <div className="mt-6 space-y-3 text-sm px-6 border-b border-[#E2E1E5] pb-5">
                <p className="text-[#282829] font-semibold">Username</p>
                <p className="text-[#717073]">{`${selectedCoach?.firstName} ${selectedCoach?.lastName || ""}`}</p>

                <p className="text-[#282829] font-semibold mt-3">Email</p>
                <p className="text-[#717073]">{`${selectedCoach?.email}`}</p>

                <p className="text-[#282829] font-semibold mt-3">Position</p>
                <p className="text-[#717073]">{`${selectedCoach?.position}`}</p>

                <p className="text-[#282829] font-semibold mt-3">Password</p>
                <p className="text-[#717073]">{`${selectedCoach?.passwordHint}`}</p>

                <p className="text-[#282829] font-semibold mt-3">Phone</p>
                <p className="text-[#717073]">{`${selectedCoach?.phoneNumber}`}</p>

                <p className="text-[#282829] font-semibold mt-3">Address</p>
                <p className="text-[#717073]">-</p>

                <p className="text-[#282829] font-semibold mt-3">Hour rate</p>
                <p className="text-[#717073]">-</p>
              </div>
              {/* £ */}
              <div className="p-4">
                <OnboardingProgress />
              </div>
            </div>



            <div className="flex-1 bg-white rounded-xl p-4">

              <div className="flex gap-6 border border-[#EFEEF2] p-2 rounded-2xl mb-4">
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`p-2 px-3 text-[16px] rounded-xl font-semibold 
                ${activeTab === i ? "text-white bg-[#237FEA]" : "text-gray-600"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 0 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Venues allocations ({venuesData.length})</h2>

                    <button
                      onClick={() => {
                        setModalMode("add");
                        setFormData({ location: "", rate: "", address: "", id: "" });
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-[#237FEA] text-white px-4 py-2.5 rounded-xl text-sm"
                    >
                      <Plus size={18} /> Add new venue
                    </button>
                  </div>

                  <table className="w-full text-sm">
                    <tbody>
                      {venuesData.map((v, index) => (
                        <tr key={index} className="border-b border-[#EFEEF2]">

                          <td className="p-3 pl-0 w-[20%]">
                            {v?.venue?.name}
                          </td>

                          <td className="p-3 pl-0 w-[50%] text-[#717073]">
                            {editingRow === index ? (
                              <div className="flex items-center gap-3 justify-start">

                                Rate per hour
                                <input
                                  type="text"
                                  value={editRate}
                                  onChange={(e) => setEditRate(e.target.value)}
                                  className="border border-gray-300 rounded-lg p-2 w-28"
                                />

                              </div>
                            ) : (v?.venue?.address)}
                          </td>

                          <td className="p-3 pl-0 w-[30%]">

                            {editingRow === index ? (
                              <div className="flex items-center gap-3 justify-end">
                                <button
                                  onClick={() => {
                                    const updated = [...venuesData];
                                    updated[index].rate = editRate;
                                    setVenuesData(updated);
                                    setEditingRow(null);
                                  }}
                                  className="border border-blue-500 text-blue-600 px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                  ✓ Confirm Change
                                </button>

                              </div>
                            ) : (
                              <div className="flex justify-end items-center gap-4">
                                <img
                                  src="/reportsIcons/Pen.png"
                                  onClick={() => {
                                    setEditingIndex(index);
                                    setModalMode("edit");
                                    setFormData({
                                      location: v?.venue?.id,
                                      rate: v?.rate,
                                      id: v?.id,
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="w-5 h-5 cursor-pointer"
                                />
                                <img onClick={() => handleDeleteVenue(v.id)} src="/reportsIcons/delete-02.png" className="w-5 h-5 cursor-pointer" alt="" />



                              </div>
                            )}

                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>
                </>
              )}
              {activeTab === 1 && (
                <>
                  {qualifications && qualifications.length > 0 ? (
                    <table className="w-full text-sm">
                      <tbody>
                        {qualifications.map((v, index) => (
                          <tr key={index} className="border-b border-[#EFEEF2]">

                            {/* Qualification name */}
                            <td className="p-3 pl-0 w-[50%] text-[#717073]">
                              {v.address}
                            </td>

                            {/* Download column */}
                            <td className="p-3 pl-0 w-[30%]">
                              <div className="flex justify-end">
                                {v.download ? (
                                  <img
                                    src="/reportsIcons/Icon.png"
                                    className="w-5 h-5 cursor-pointer"
                                    alt="Download"
                                    onClick={() => handleDownload(selectedCoach.id, v.key)}

                                  />
                                ) : (
                                  <span className="text-red-500">Not available</span>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-gray-500 py-6">
                      No qualifications available
                    </div>
                  )}
                </>
              )}

              {activeTab === 2 && (
                <div className="border border-[#E2E1E5]  rounded-2xl overflow-auto">
                  <table className="w-full text-sm ">
                    <thead>
                      <tr className="bg-[#F5F5F5] border-b border-[#DBDBDB]">
                        <th className="text-[#717073] font-semibold p-3 px-4 text-left">Title</th>
                        <th className="text-[#717073] font-semibold p-3 px-4 text-left">Status</th>
                        <th className="text-[#717073] font-semibold p-3 px-4 text-left">Grade</th>
                        <th className="text-[#717073] font-semibold p-3 px-4 text-left">Percentage</th>
                        <th className="text-[#717073] font-semibold p-3 px-4 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((v, index) => (
                        <>
                          <tr key={index} className="border-b border-[#EFEEF2]">

                            <td className="p-3 px-4 text-[#717073]">
                              {v.title}
                            </td>
                            <td className="p-3 px-4">
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusClasses(v.status)}`}>
                                {v.status}
                              </span>
                            </td>

                            <td className="p-3 px-4 text-[#717073]">
                              {v.grade}
                            </td>
                            <td className="p-3 px-4  text-[#717073]">
                              {v.percentage}
                            </td>



                            <td className="p-3 px-4 text-right"> <button onClick={() => setOpenRow(openRow === v.id ? null : v.id)} className="bg-[#237FEA] p-2 px-3 rounded-xl text-center text-white "> See Result </button> </td>


                          </tr>
                          {openRow === v.id && (
                            <tr className="">
                              <td colSpan={6} className="p-4 border-b border-[#EFEEF2] ">

                                <div className="space-y-2">

                                  <p className="flex justify-between text-[#717073] ">1. What is the purpose of the skill demonstrated in the video?
                                    <div className="flex items-center gap-2 text-green-500 font-semibold">
                                      <img src="/reportsIcons/tick-02.png" className="w-5 h-5 cursor-pointer" alt="" />
                                      To help coaches</div></p>
                                  <p className="flex justify-between text-[#717073] ">2. What is the purpose of the skill demonstrated in the video?
                                    <div className=" flex items-center gap-2  text-red-500 font-semibold">
                                      <img src="/reportsIcons/cross1.png" className="w-5 h-5 cursor-pointer" alt="" />
                                      Control the ball</div></p>

                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}

                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 3 && (
                <>
                  <div>
                    <h4 className="font-bold text-[24px] py-4">
                      Your Contract
                    </h4>

                    <h5 className="font-semibold text-[16px]">
                      INDEPENDENT CONTRACTOR AGREEMENT
                    </h5>

                    <p className="text-[#4B4B56] text-[14px] font-normal py-3">
                      This Independent Contractor Agreement is between
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="border border-[#9E9FAA] rounded-xl p-3 w-[100px] text-center outline-none bg-[#F6F6F7] mx-1"
                      />
                      and SAMBA SOCCER SCHOOLS GLOBAL LTD (“We”, “Us”, “Our”, the “Company”).
                    </p>

                    <h5 className="font-semibold text-[16px]">Background</h5>

                    <ul className="list-[lower-alpha] ml-6 text-[#4B4B56] text-[14px] font-normal py-3">
                      <li className="mt-1">
                        The Company is of the opinion that the Contractor has the necessary
                        qualifications, experience, and abilities to provide services to the Company.
                      </li>
                      <li className="mt-1">
                        The Contractor agrees to provide such services to the Company on the
                        terms and conditions set out in this Agreement.
                      </li>
                    </ul>

                    <h5 className="font-semibold text-[16px]">General</h5>

                    <p className="text-[#4B4B56] text-[14px] font-normal py-3">
                      IN CONSIDERATION OF the matters described above and of the mutual
                      benefits and obligations set forth in this Agreement, the receipt and
                      sufficiency of which consideration are hereby acknowledged, the Company
                      and the Contractor (individually a “Party” and collectively the “Parties”)
                      agree as follows:
                    </p>

                    <h5 className="font-semibold text-[16px]">General</h5>

                    <ul className="list-[lower-alpha] ml-6 text-[#4B4B56] text-[14px] font-normal py-3">
                      <li className="mt-1">
                        The particulars of this Agreement are as set out in this Agreement and in
                        the Company’s policies, procedures, and rules, as may be introduced and/or
                        varied from time to time.
                      </li>

                      <li className="mt-1">
                        The Company has a duty to safeguard all students, parents, guardians, and
                        their personal information. The Contractor agrees to adhere to the Company’s
                        policies and understands that failure to do so may lead to all work being withdrawn.
                      </li>

                      <li className="mt-1">
                        Any amendments or modifications to this Agreement or additional
                        obligations assumed by either Party must be agreed to in writing and signed
                        by both Parties.
                      </li>

                      <li className="mt-1">
                        The Contractor agrees to comply with all reasonable instructions, standards,
                        and expectations communicated by the Company.
                      </li>

                      <li className="mt-1">
                        The Contractor understands that continued failure to follow Company
                        policies or performance expectations may result in termination of this Agreement.
                      </li>
                    </ul>
                  </div>





                </>
              )}

              {activeTab === 4 && (
                <>
                  <div className="flex justify-between items-center py-4 pb-5">
                    <h3 className="font-semibold ">Quality Control Results</h3>
                    <div className="px-6 flex gap-2 items-center">
                      <div className="relative ">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search assessor"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 pl-10"
                        />
                      </div>
                      <div className="relative ">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search Venue"
                          venues
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 pl-10"
                        />
                      </div>
                      <img src="/reportsIcons/Chart_1.png" className="w-8 h-8 " alt="" />
                    </div>
                  </div>
                  <div className="border border-[#E2E1E5]  rounded-2xl overflow-auto">
                    <table className="w-full text-sm ">
                      <thead>
                        <tr className="bg-[#F5F5F5] border-b border-[#DBDBDB]">
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Date</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Time</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Assessor</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Venue</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Result</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {qcResults.map((v, index) => (
                          <React.Fragment key={index}>
                            {/* MAIN ROW */}
                            <tr className="border-b border-[#EFEEF2]">
                              <td className="p-3 px-4 text-[#717073]">{v.date}</td>
                              <td className="p-3 px-4">{v.time}</td>
                              <td className="p-3 px-4 text-[#717073]">{v.accesor}</td>
                              <td className="p-3 px-4 text-[#717073]">{v.venue}</td>

                              <td className="p-3 px-4 text-[#717073]">
                                <span className="px-3 py-1 rounded-lg text-[#34AE56] text-sm font-semibold bg-[#EBF7EE]">
                                  {v.result}
                                </span>
                              </td>

                              <td className="p-3 px-4 text-right">
                                <button
                                  onClick={() => setOpenRowIndex(openRowIndex === index ? null : index)}
                                  className="bg-[#237FEA] p-1.5 px-3 rounded-xl text-center text-white"
                                >
                                  {openRowIndex === index ? "Hide" : "See More"}
                                </button>
                              </td>
                            </tr>

                            {openRowIndex === index && (
                              <tr className="bg-white border-b border-[#efefef]">
                                <td colSpan={6} className="p-6">

                                  <div className="mb-6">
                                    <h4 className="font-semibold text-base mb-2">Results</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-[#555]">
                                      <p>Punctuality — 5/5</p>
                                      <p>Set Up — 3/5</p>
                                      <p>Uniform — 2/5</p>
                                      <p>Small Sided Games — 3/5</p>
                                      <p>Technical — 5/5</p>
                                      <p>Tactical — 3/5</p>
                                      <p>Engagement — 2/5</p>
                                    </div>
                                  </div>

                                  <div className="mb-6">
                                    <h4 className="font-semibold text-base mb-2">Strengths</h4>
                                    <ul className="list-decimal ml-5 text-sm text-[#555]">
                                      <li>Example 1</li>
                                      <li>Example 2</li>
                                      <li>Example 3</li>
                                    </ul>
                                  </div>

                                  <div className="mb-6">
                                    <h4 className="font-semibold text-base mb-2">Improvements</h4>
                                    <ul className="list-decimal ml-5 text-sm text-[#555]">
                                      <li>Example 1</li>
                                      <li>Example 2</li>
                                      <li>Example 3</li>
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-base mb-2">Voice Note</h4>
                                    <div className="flex items-center gap-2 text-[#555]">
                                      <span>Recording</span>
                                      <img src="/reportsIcons/vup.png" className="w-6" alt="" />
                                    </div>
                                  </div>

                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>

                    </table>
                  </div>
                </>
              )}
              {activeTab === 5 && (
                <>
                  <div className="flex justify-between items-center py-4 pb-5">
                    <h3 className="font-semibold">Attendance</h3>
                    <div className="px-6 flex gap-2 items-center">
                      <InvoicePdf />
                      <button onClick={() => setOpenVenueFilter(true)} className=" p-1.5 px-3 text-[#717073] rounded-xl text-center border border-[#E2E1E5]">
                        Venues filter
                      </button>
                      <button className=" flex items-center gap-2 p-1.5 px-3 text-[#717073] rounded-xl text-center border border-[#E2E1E5]">
                        <CalendarDays className="w-4" />  Time Period
                      </button>


                    </div>
                  </div>
                  <div className="border border-[#E2E1E5]  rounded-2xl overflow-auto">
                    <table className="w-full text-sm ">
                      <thead>
                        <tr className="bg-[#F5F5F5] border-b border-[#DBDBDB]">
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Venue</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Invoice</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Sessions</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Date Range</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Status</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left">Account</th>
                          <th className="text-[#717073] font-semibold p-3 px-4 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((v, index) => (
                          <React.Fragment key={index}>
                            {/* MAIN ROW */}
                            <tr className="border-b border-[#EFEEF2] ">
                              <td className="p-3 px-4 ">{v.name}</td>
                              <td className="p-3 px-4 ">{v.invoiceNumber}</td>
                              <td className="p-3 px-4 ">{v.sessionDays}</td>
                              <td className="p-3 px-4 ">{v.date}</td>

                              <td className="p-3 px-4 ">
                                <span className={`px-3 py-1 rounded-lg  text-sm font-semibold ${v.status == "paid" ? 'bg-[#EBF7EE] text-[#34AE56]' : 'bg-[#FDF6E5] text-[#EDA600] '}`}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="p-3 px-4 ">{v.account}</td>

                              <td className="p-3 px-4 text-right">
                                <button
                                  onClick={() => setOpenAttendanceDataRowIndex(openAttendanceDataRowIndex === index ? null : index)}
                                  className="bg-[#237FEA] p-1.5 px-3 rounded-xl text-center text-white"
                                >
                                  {openRowIndex === index ? "Hide" : "See More"}
                                </button>
                              </td>
                            </tr>

                            {openAttendanceDataRowIndex === index && (
                              <tr className="bg-white border-b border-[#efefef]">
                                <td colSpan={7} className="p-6">

                                  <div className="w-full max-w-4xl">
                                    <h2 className="text-lg font-semibold mb-4">Details</h2>

                                    <div className="grid grid-cols-4 gap-3 text-gray-900">
                                      {sessions.map((s, index) => (
                                        <React.Fragment key={index}>
                                          <div className="py-2">{s.name}</div>
                                          <div className="py-2">{s.address}</div>
                                          <div className="py-2">{s.datetime}</div>
                                          <div className="py-2 font-medium">{s.price}</div>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>

                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>

                    </table>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
        {showModal && (
          <QcConfiguration setShowModal={setShowModal} />
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-3xl py-6 w-[450px] shadow-xl">

              <div className="flex relative  px-6  pb-5 justify-center items-center mb-4 border-b border-[#E2E1E5]">
                <h2 className="text-xl font-semibold text-center">
                  Add New Venue
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-xl absolute left-12">✕</button>
              </div>
              <div className="px-6">
                <div className="relative mb-5">
                  {/* Search Icon */}
                  <Search
                    className="absolute left-3 top-5 text-gray-400 z-10 pointer-events-none"
                    size={20}
                  />

                  <Select
                    options={venueOptions}
                    placeholder="Search Venue"
                    isSearchable
                    isClearable
                    value={venueOptions.find(
                      (opt) => opt.value === formData.location
                    )}
                    onChange={(selected) => {
                      setFormData({
                        ...formData,
                        location: selected?.value, // ✅ venue ID saved here
                      });
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        paddingLeft: "2.25rem", // space for icon
                        borderRadius: "0.5rem",
                        borderColor: "#D1D5DB",
                        minHeight: "42px",
                        boxShadow: "none",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#9CA3AF",
                      }),
                      indicatorSeparator: () => ({ display: "none" }),
                    }}
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="">Enter hourly rate</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full mt-1 border border-gray-300 rounded-lg p-3"
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-[#237FEA] text-white py-3 rounded-lg font-semibold"
                >
                  {modalMode === "add" ? "Create New Venue" : "Update Venue"}
                </button>


              </div>

            </div>
          </div>
        )}

        {openVenueFilter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-[330px] rounded-2xl p-5 shadow-xl relative">

              <button
                onClick={() => setOpenVenueFilter(null)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mt-7 mb-2 border border-[#E2E1E5] px-3 py-2 rounded-xl mb-3">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full outline-none text-sm"
                />
              </div>

              <div className="max-h-56 overflow-y-auto pr-1">

                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  <span className="text-sm">Select all</span>
                </label>

                {venuesData.map((v, i) => (
                  <label key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => toggleOne(i)}
                    />
                    <span className="text-sm">{v.address}</span>
                  </label>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4 items-center justify-between mt-4">
                <button
                  onClick={() => {
                    setChecked(checked.map(() => false));
                  }}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl"
                >
                  Clear
                </button>

                <button
                  className="bg-[#237FEA] text-white px-4 py-2 rounded-xl"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
const OnboardingProgress = () => {
  const items = [
    { label: "Training courses", percent: 100, color: "green" },
    { label: "Uniform", percent: 25, color: "yellow" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Onboarding</h2>

      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          {/* Label */}
          <p className="text-gray-800">{item.label}</p>

          {/* Circle Progress */}
          <div className="relative w-12 h-12">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="20"
                stroke="#E5E7EB"
                strokeWidth="4"
                fill="none"
              ></circle>

              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r="20"
                stroke={item.color === "green" ? "#22C55E" : "#EAB308"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={
                  2 * Math.PI * 20 - (item.percent / 100) * (2 * Math.PI * 20)
                }
              ></circle>
            </svg>

            {/* Percent Number */}
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {item.percent}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

