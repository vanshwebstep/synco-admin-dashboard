import React, { useState } from "react";
import { Download } from "lucide-react";
import { MdStars } from "react-icons/md";

const Rewards = () => {
  const [activeTab, setActiveTab] = useState("referrals");

  const referrals = Array(10).fill({
    date: "01/06/2023",
    name: "Steve Jones",
    email: "tom.jones@gmail.com",
    phone: "123456789",
    status: "Pending",
  });

  return (
    <div className="min-h-screen bg-[#F9F9FB] md:p-4 md:p-8 flex flex-col">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-6 bg-white md:w-3/12 p-2 border border-[#E2E1E5]  rounded-2xl ">
        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-6 py-3 rounded-xl text-[16px] font-semibold ${activeTab === "referrals"
            ? "bg-[#237FEA] text-white"
            : "bg-white text-gray-700 "
            }`}
        >
          Referrals
        </button>
        <button
          onClick={() => setActiveTab("loyalty")}
          className={`px-6 py-2 rounded-xl text-[16px] font-semibold ${activeTab === "loyalty"
            ? "bg-[#237FEA] text-white"
            : "bg-white text-gray-700 "
            }`}
        >
          Loyalty Points
        </button>
      </div>

      {activeTab == "referrals" && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Customer Referrals
          </h2>

          <div className="flex flex-col md:flex-row gap-10">
            {/* Table */}
            <div className="flex-1 md:w-9/12 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                    <tr className="font-semibold text-[#717073]">
                      <th className="p-4">Date</th>
                      <th className="p-4">Referral name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((item, idx) => (
                      <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">

                        <td className="p-4">{item.date}</td>
                        <td className="p-4">{item.name}</td>
                        <td className="p-4">{item.email}</td>
                        <td className="p-4">{item.phone}</td>
                        <td className="p-4">
                          <span className="bg-[#FFF5E0] text-[#E6A400] px-3 py-1 rounded-lg font-medium text-sm">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stats Card */}
            <div className="md:w-3/12">
              <div className="w-full reward  flex flex-col items-center p-4 rounded-xl">

                <div className="bg-white rounded-2xl py-6 px-8 w-full">
                  <h3 className="text-[#237FEA] text-[64px] text-left font-bold">01</h3>
                  <p className="text-[#282829] text-[24px] text-left font-semibold mb-4">
                    Successful referral
                  </p>
                  <hr className="my-2 border-[#237FEA] w-6/12" />
                  <h3 className="text-[#237FEA] text-[64px] text-left font-bold">01</h3>
                  <p className="text-[#282829] text-[24px] text-left font-semibold">Free month</p>
                </div>


              </div>

              <div className="flex justify-end w-full">
                <button className="mt-6 bg-[#237FEA] hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-3 px-5 py-2 rounded-lg shadow-sm">
                  <Download size={16} />
                  Export data
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {activeTab == "loyalty" && (
        <>


          <div className="grid grid-cols-2 gap-5 mb-5">

            <div
              className="grid-item bg-cover bg-center bg-no-repeat  p-8 rounded-3xl"
              style={{ backgroundImage: "url('/images/loyality-point1.png')" }}
            >
              <h2 className="text-white font-bold md:text-[56px] ">5,000</h2>
              <h4 className="text-white font-semibold md:text-[24px]">Your Points</h4>
            </div>
            <div
              className="grid-item bg-cover bg-center bg-no-repeat  p-8 rounded-3xl"
              style={{ backgroundImage: "url('/images/loyality-point2.png')" }}
            >

                <h2 className="text-black font-bold md:text-[56px] ">39</h2>
              <h4 className="text-black font-semibold md:text-[24px]">Rewards Collected</h4>
            </div>



          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Collected rewards history
          </h2>

        
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                    <tr className="font-semibold text-[#717073]">
                      <th className="p-4">Collected Date</th>
                      <th className="p-4">Task Name</th>
                      <th className="p-4 text-right">Collected Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((item, idx) => (
                      <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">

                        <td className="p-4">{item.date}</td>
                        <td className="p-4">{item.name}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end">
                                                   <button className="bg-[#FCF0DD] text-[#E4951E] p-2 rounded-xl flex items-center justify-end gap-2"><MdStars className="text-xl"/> 100 Points</button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </>
      )}

    </div>
  );
};

export default Rewards;
