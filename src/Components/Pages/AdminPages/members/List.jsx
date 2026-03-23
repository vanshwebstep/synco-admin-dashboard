import React, { useEffect, useState } from 'react';
import Create from './Create';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { useMembers } from '../contexts/MemberContext';
import Loader from '../contexts/Loader';
import { formatDistanceToNow } from 'date-fns';
import { usePermission } from "../Common/permission";

const List = () => {
      const { checkPermission } = usePermission();
  

  const { members, fetchMembers, loading } = useMembers();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
  const isAllSelected = members.length > 0 && selectedUserIds.length === members.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allIds = members.map((user) => user.id);
      setSelectedUserIds(allIds);
    }
  };


  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }

  return (
    <div className="pt-1 px-8 bg-gray-50 min-h-screen px-4">
      {/* Header */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 ${openForm ? "md:w-3/4" : "w-full"
          }`}
      >
        <h2 className="text-2xl md:text-[28px] font-semibold">Admin panel</h2>

        {checkPermission(
          { module: "member", action: "create" } ) && (
            <button
              onClick={() => setOpenForm(true)}
              className="bg-[#237FEA] flex items-center gap-2 cursor-pointer text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm md:text-base font-semibold"
            >
              <img src="/members/add.png" className="w-5" alt=""  />
              Add Member
            </button>
          )}
      </div>

      {checkPermission({ module: "member", action: "view-listing" }) ? (
        <div className="md:flex md:gap-6 md:mt-0 mt-5">

          <div className={`transition-all duration-300 ${openForm ? 'md:w-3/4' : 'w-full'}`}>

            {members.length > 0 ? (
              <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                    <tr className="font-semibold text-[#717073]">
                      <th className="p-4">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={toggleSelectAll}
                            className="min-w-5 min-h-5 flex items-center justify-center rounded-md border-2 border-gray-500"
                          >
                            {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                          </button>
                          User
                        </div>
                      </th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Position</th>
                      <th className="p-4">Activity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {members.map((user, idx) => {
                      const isChecked = selectedUserIds.includes(user.id);
                      return (
                        <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">
                          <td className="p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleCheckbox(user.id)}
                                className={`min-w-5 w-5 min-h-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-500' : 'border-gray-300'}`}
                              >
                                {isChecked && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                              </button>

                              <img
                                src={user.profile ? `${user.profile}` : '/members/dummyuser.png'}
                                alt={user.firstName || 'Profile Image'}
                                onClick={() => navigate(`/members/update?id=${user.id}`)}
                                className="w-10 h-10  rounded-full object-cover"
                                 onError={(e) => {
                      e.currentTarget.onerror = null; // prevent infinite loop
                      e.currentTarget.src = '/members/dummyuser.png';
                    }}
                              />
                              <span onClick={() => navigate(`/members/update?id=${user.id}`)}>{user.firstName || '-'} {user.lastName || ''}</span>
                            </div>
                          </td>
                          <td className="p-4" onClick={() => navigate(`/members/update?id=${user.id}`)}>{user.role?.role || '-'}</td>
                          <td className="p-4" onClick={() => navigate(`/members/update?id=${user.id}`)}>{user.phoneNumber || '-'}</td>
                          <td className="p-4" onClick={() => navigate(`/members/update?id=${user.id}`)}>{user.email || '-'}</td>
                          <td className="p-4" onClick={() => navigate(`/members/update?id=${user.id}`)}>{user.position || '-'}</td>
                          <td className="p-4">
                            {user.updatedAt ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true }) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center p-4 border-dotted border rounded-md bg-white">No Data Found</p>
            )}
          </div>

          {/* Form Panel */}
          {openForm && (
            <div className="md:w-1/4 mt-6 md:mt-0 bg-white rounded-2xl shadow-sm relative">
              <button
                onClick={() => setOpenForm(false)}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-xl"
                title="Close"
              >
                &times;
              </button>
              <Create />
            </div>
          )}
        </div>
      ) : (
        <p className="text-center p-6 text-red-500 font-semibold">
          Not Authorized
        </p>
      )}
    </div>

  );
};

export default List;
