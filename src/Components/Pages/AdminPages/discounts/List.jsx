import React, { useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { useDiscounts } from "../contexts/DiscountContext";
import Loader from '../contexts/Loader';
import { usePermission } from '../Common/permission';

const users = new Array(9).fill({
  id: 1,
 title: "SAMBA10",
  subTitle: "2023/24 Standard Pricing",
  NoOfPlans: "2",
  Method: "Code",
  type: "Amount Of Products",
  used: "15",
  status: "Active",
  activity: "2 Days Ago",
  avatar: "/members/dummyuser.png"
});




const DiscountsList = () => {
      const {fetchDiscounts,discounts,loading } = useDiscounts();
   useEffect(() => {
    const getPackages = async () => {
      try {
        const response = await fetchDiscounts();
         console.log("Fetched packages:", response);
        // do something with response (set state, display, etc.)
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    };
    getPackages();
  }, [fetchDiscounts]);
  console.log('discounts',discounts)
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [checked, setChecked] = useState(false);
 if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }
    const { checkPermission } = usePermission();
    const canCreate = checkPermission({ module: 'discount', action: 'create' });
  return (
    <div className="p-4 md:p-6 bg-gray-50 ">

      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 ${openForm ? 'md:w-3/4' : 'w-full md:w-[full]'}`}>
        <h2 className="text-2xl font-semibold">Discounts Table</h2>
       {canCreate &&
        <button
           onClick={() => navigate(`/holiday-camps/discounts/create`)}
          // onClick={() => setOpenForm(true)}
          className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
        >
          <img src="/members/add.png" className='w-5' alt="" /> Add new discount
        </button>
        }
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`transition-all duration-300 w-full ${openForm ? 'md:w-3/4' : 'md:w-full'}`}>
          <div className="overflow-x-auto w-full rounded-2xl border border-gray-200">
        <div className="overflow-x-auto w-full">
  <table className="min-w-[700px] w-full bg-white text-sm">
    <thead className="bg-[#F5F5F5] text-left">
      <tr className="font-semibold">
        <th className="p-4 text-[14px] text-[#717073] md:pl-14">Title</th>
        <th className="p-4 text-[#717073]">Method</th>
        <th className="p-4 text-[#717073]">Type</th>
        <th className="p-4 text-[#717073] text-center">Used</th>
        <th className="p-4 text-[#717073] text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      {discounts.map((user, idx) => (
        <tr
          key={idx}
          className="border-t font-semibold text-[#282829] border-gray-200 hover:bg-gray-50"
        >
          <td className="p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChecked(!checked)}
                className={`w-5 h-5 me-2 flex items-center justify-center rounded-md border-2 border-gray-500 transition-colors focus:outline-none`}
              >
                {checked && (
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="text-gray-500"
                  />
                )}
              </button>
              <div>
                <span>{user.code}</span>
                <br />
                <span className="text-[12px] text-gray-400">
                 {`${user.value} %off in holiday Camps`}
                </span>
              </div>
            </div>
          </td>
          <td className="p-4">{user.type}</td>
          <td className="p-4">{'Amount off products'}</td>
          <td className="p-4 text-center">{user.usageCount || 0}</td>
          <td className="p-4">
            <div className="flex gap-2 capitalize items-center justify-center">
              <button className={` capitalize ${user.status == 'active' ?'text-green-400 bg-green-100 ': 'text-orange-400 bg-orange-100'}  px-7 rounded-lg py-1 text-[14px]`}>
                {user.status || 'Paused'}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
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
    </div>
  );
};

export default DiscountsList;
