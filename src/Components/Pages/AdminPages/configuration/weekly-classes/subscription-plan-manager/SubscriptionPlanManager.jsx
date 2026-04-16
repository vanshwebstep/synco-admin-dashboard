import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { usePayments } from '../../../contexts/PaymentPlanContext';
import { showConfirm, showError } from '../../../../../../utils/swalHelper';
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import { useGlobalSearch } from '../../../contexts/GlobalSearchContext';
const SubscriptionPlanManagerList = () => {
  const { fetchGroups, groups, deleteGroup, fetchGroupById, selectedGroup, loading, setLoading } = usePayments();
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [previewShowModal, setPreviewShowModal] = useState(false);
const { searchQuery } = useGlobalSearch();

  useEffect(() => {
    const getPackages = async () => {
      try {
        const response = await fetchGroups();
        console.log("Fetched packages:", response);
        // do something with response (set state, display, etc.)
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    };
    getPackages();
  }, [fetchGroups]);
  const filteredGroups = React.useMemo(() => {
  if (!searchQuery) return groups;

  const query = searchQuery.toLowerCase();

  return groups.filter((group) => {
    return [
      group.name,
      group.createdAt,
      group.paymentPlans?.length?.toString()
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}, [groups, searchQuery]);
  const [activeTab, setActiveTab] = useState({});
  const [studentKeys, setStudentKeys] = useState([]);
  const [groupByStudents, setGroupByStudents] = useState([]);
  const handleShow = async (id) => {
    const group = await fetchGroupById(id);
    if (!group || !group.paymentPlans) return;
    console.log('group.paymentPlans', group.paymentPlans)
    const grouped = group.paymentPlans.reduce((acc, plan) => {
      if (!acc[plan.students]) acc[plan.students] = [];
      acc[plan.students].push(plan);
      return acc;
    }, {});

    const keys = Object.keys(grouped).sort();

    setGroupByStudents(grouped);
    setStudentKeys(keys);
    setActiveTab(keys[0] || "");
    setPreviewShowModal(true);
  };



  console.log('plan.groupByStudents', groupByStudents[activeTab])
  const handleEdit = (id) => {
    console.log("Edit group with ID:", id);
    navigate(`/weekly-classes/add-subscription-plan-group?id=${id}`)
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "This action will permanently delete this group.",
      "Yes, delete it"
    );


    if (result.isConfirmed) {
      try {
        await deleteGroup(id); // from usePayments()
      } catch (err) {
        showError("Error", "Failed to delete the group.");
      }
    }
  };
  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  function unescapeHTML(escapedStr) {
    const doc = new DOMParser().parseFromString(escapedStr, "text/html");
    return doc.documentElement.textContent;
  }
  const sortedPlans = Array.isArray(groupByStudents[activeTab])
    ? [...groupByStudents[activeTab]]
    : groupByStudents[activeTab] && typeof groupByStudents[activeTab] === "object"
      ? Object.values(groupByStudents[activeTab])
      : [];
console.log('sortedPlans',sortedPlans)
  const intervalOrder = ["Day", "Week", "Month", "Year"];

  sortedPlans.sort((a, b) => {
    // 1️⃣ Sort by interval type
    const intervalDiff =
      intervalOrder.indexOf(a.interval) -
      intervalOrder.indexOf(b.interval);

    if (intervalDiff !== 0) return intervalDiff;

    // 2️⃣ Sort by duration (1, 3, 6 months)
    return a.duration - b.duration;
  });

  console.log(sortedPlans);

  const { checkPermission } = usePermission();
  const canCreate = checkPermission({ module: 'payment-group', action: 'create' });
  const canEdit = checkPermission({ module: 'payment-group', action: 'update' });
  const canDelete = checkPermission({ module: 'payment-group', action: 'delete' });
  return (
    <div className={`p-4 md:p-6 ${previewShowModal ? 'max-w-[1045px]' : 'max-w-full'} bg-gray-50 `}>

      {previewShowModal && (
        <>
          <h2
            onClick={() => setPreviewShowModal(false)}
            className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200">
            <img
              src="/images/icons/arrow-left.png"
              alt="Back"
              className="w-5 h-5 md:w-6 md:h-6"
            />
            <span className="truncate">{selectedGroup?.name} Preview</span>
          </h2>
          <div className="w-full  items-center rounded-3xl  justify-left bg-white w-full px-4 py-6 sm:px-6 md:py-10">
            <div className="bg-white w-full rounded-3xl p-4 sm:p-6 w-full  shadow-2xl">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                <h2 className="font-semibold text-[20px] lg:text-[24px]">Subscription Plan</h2>
                <button
                  onClick={() => setPreviewShowModal(false)}
                  className="text-gray-400 hover:text-black text-xl font-bold"
                >
                  <img src="/images/icons/cross.png" alt="close" className="w-5 h-5" />
                </button>
              </div>

              {/* Plans Grid */}

              <div className="w-full">
                {/* Student Tabs */}
                <div className="flex justify-center my-6">
                  <div className="md:inline-flex rounded-2xl border border-gray-300 bg-white p-1">
                    {studentKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-6 py-2 text-[16px] md:w-auto w-full font-semibold rounded-[14px] transition ${activeTab === key
                          ? "bg-[#237FEA] text-white"
                          : "bg-white text-[#282829]"
                          }`}
                      >
                        {key} Student{key > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="flex sm:flex-row flex-col flex-wrap pt-2 mx-auto justify-center gap-3">
                  {sortedPlans?.map((plan, idx) => (
                    <div
                      key={plan?.id}
                      className="border md:w-[32%] border-[#E2E1E5]  rounded-[20px] p-4 sm:p-5 flex flex-col justify-between transition"
                    >
                      <h3 className="text-[18px] sm:text-[20px] font-semibold mb-2">
                        {plan.title}
                      </h3>
                      <p className="text-[24px] sm:text-[32px] font-semibold mb-4">
                        £{plan?.price}/<span className="text-sm text-[#717073]">{plan.interval?.toLowerCase()}</span>
                      </p>
                      <hr className="mb-4 text-[#E2E1E5]" />
                      <ul className="space-y-2 text-[14px] text-[16px] font-semibold pb-10">
                        {plan.HolidayCampPackage &&
                          // Decode HTML entities
                          new DOMParser()
                            .parseFromString(plan.HolidayCampPackage, "text/html")
                            .body.textContent
                            // Replace <br> and &nbsp; with a marker for splitting
                            .replace(/\r?\n|&nbsp;/gi, '###')
                            // Split by <p> and <br> equivalent markers
                            .split(/###|<\/?p>/gi)
                            .map((item, index) => {
                              const text = item.replace(/<\/?[^>]+(>|$)/g, '').trim(); // remove leftover tags
                              return text ? (
                                <li key={index} className="flex items-center gap-2">
                                  <img
                                    src="/images/icons/tick-circle.png"
                                    alt=""
                                    className="w-5 h-5"
                                  />
                                  {text}
                                </li>
                              ) : null;
                            })}
                      </ul>



                      {/* <button className="px-8 py-3 text-[16px] font-medium rounded-xl bg-[#237FEA] text-white shadow transition">
                        {plan.joiningFee ? `£${plan.joiningFee} Joining Fee` : "Not Defined Joining Fee"}
                      </button> */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>

      ) ||
        <>
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 ${openForm ? 'md:w-3/4' : 'w-full md:w-[55%]'}`}>
            <h2 className="text-2xl font-semibold">Subscription Plan Manager</h2>
            {canCreate &&
              <button
                onClick={() => navigate(`/weekly-classes/add-subscription-plan-group`)}
                // onClick={() => setOpenForm(true)}
                className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
              >
                <img src="/members/add.png" className='w-5' alt="" /> Add Membership Plan Group
              </button>
            }
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className={`transition-all duration-300 w-full ${openForm ? 'md:w-3/4' : 'md:w-[55%]'}`}>
              <div className="overflow-x-auto w-full rounded-2xl border border-gray-200">
                <table className="hidden md:table w-full bg-white text-sm">
                  <thead className="bg-[#F5F5F5] text-left">
                    <tr className="font-semibold">
                      <th className="p-4 text-[14px] text-[#717073]">Name</th>
                      <th className="p-4 text-[#717073] text-center">No. of Plans</th>
                      <th className="p-4 text-[#717073]">Date Created</th>
                      <th className="p-4 text-[#717073] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups .length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-[#717073] font-medium"
                        >
                          No data available
                        </td>
                      </tr>
                    ) : (
                      filteredGroups .map((user, idx) => (
                        <tr
                          key={idx}
                          className="border-t font-semibold text-[#282829] border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const updated = checkedIds.includes(user.id)
                                    ? checkedIds.filter((id) => id !== user.id)
                                    : [...checkedIds, user.id];
                                  setCheckedIds(updated);
                                }}
                                className={`w-5 h-5 me-2 flex items-center justify-center rounded-md border-2 border-gray-500 transition-colors focus:outline-none`}
                              >
                                {checkedIds.includes(user.id) && (
                                  <Check
                                    size={16}
                                    strokeWidth={3}
                                    className="text-gray-500"
                                  />
                                )}
                              </button>
                              <span>{user.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {user.paymentPlans?.length || "0"}
                          </td>
                          <td className="p-4">
                            {new Date(user.createdAt).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-4 items-center justify-center">
                              <button
                                onClick={() => handleShow(user.id)}
                                disabled={!user.paymentPlans?.length}
                                className={`group ${!user.paymentPlans?.length
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                                  }`}
                              >
                                <img
                                  src="/images/icons/Show.png"
                                  alt="Show"
                                  className="w-5 h-4 transition-transform duration-200 group-hover:scale-110"
                                />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(user.id)}
                                  className="group"
                                >
                                  <img
                                    src="/images/icons/edit.png"
                                    alt="Edit"
                                    className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                                  />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="group flex items-center text-red-600 hover:underline"
                                >
                                  <img
                                    src="/images/icons/deleteIcon.png"
                                    alt="Delete"
                                    className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>


                {/* Mobile Version */}
                <div className="md:hidden space-y-4">
                  {filteredGroups .map((user, idx) => (
                    <div key={idx} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold text-[#282829]">{user.name}</div>
                        <button
                          onClick={() => {
                            const updated = checkedIds.includes(user.id)
                              ? checkedIds.filter((id) => id !== user.id)
                              : [...checkedIds, user.id];
                            setCheckedIds(updated);
                          }}
                          className={`w-5 h-5 flex items-center justify-center rounded-md border-2 border-gray-500`}
                        >
                          {checkedIds.includes(user.id) && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                        </button>
                      </div>

                      <div className="text-sm text-gray-600 mb-1">
                        <strong>No. of Plans:</strong> {user.paymentPlans?.length || 'null'}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Date:</strong> {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>

                      <div className="flex gap-4 items-center">
                        <button
                          onClick={() => handleShow(user.id)}
                          disabled={!user.paymentPlans?.length}
                          className={`group ${!user.paymentPlans?.length ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <img
                            src="/images/icons/Show.png"
                            alt="Show"
                            className="w-5 h-4 transition-transform duration-200 group-hover:scale-110"
                          />
                        </button>

                        <button onClick={() => handleEdit(user.id)} className="group">
                          <img
                            src="/images/icons/edit.png"
                            alt="Edit"
                            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                          />
                        </button>

                        <button onClick={() => handleDelete(user.id)} className="group flex items-center text-red-600 hover:underline">
                          <img
                            src="/images/icons/deleteIcon.png"
                            alt="Delete"
                            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>


              </div>
            </div>

            {openForm && (
              <div className="w-full md:w-1/4 bg-white rounded-2xl p-4 relative shadow-md">
                <button
                  onClick={() => setOpenForm(false)}
                  className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
                  title="Close"
                >
                  &times;
                </button>
                {/* Add your form content here */}
                <div className="text-gray-500 text-sm">Form Section (coming soon)</div>
              </div>
            )}
          </div>
        </>}
    </div>
  );
};

export default SubscriptionPlanManagerList;
