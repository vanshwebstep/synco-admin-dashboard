import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const tabs = [
    "General",
    "History of Payments",
    "Credits",
    "Attendance",
];

const FailedPayment = () => {
    const { serviceHistoryMembership, serviceHistory } = useBookFreeTrial()

    const navigate = useNavigate();
    const location = useLocation();
    const [itemId, setItemId] = useState(null);




    return (
        <>
            <div className=" flex justify-between items-end mb-5 gap-2 md:gap-3">
                <div className=" flex items-center gap-2 md:gap-3">
                    <h2
                        onClick={() => {
                            navigate(
                                memberInfo === 'allMembers'
                                    ? "/weekly-classes/all-members/list"
                                    : "/weekly-classes/all-members/membership-sales"
                            );
                        }}
                        className="text-xl md:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    >
                        <img
                            src="/images/icons/arrow-left.png"
                            alt="Back"
                            className="w-5 h-5 md:w-6 md:h-6"
                        />
                    </h2>
                </div>
            </div >
            {/* {/* {activeTab === "Service History" && (
        <ServiceHistory serviceHistory={serviceHistory} />
      )} */}
            <div className="bg-white rounded-2xl shadow-sm ">
                <h2 className="text-[24px] font-semibold mb-4 p-6">Payments</h2>
                <table className="w-full text-[16px]">
                    <thead className="text-gray-500  p-6 ">
                        <tr className="bg-gray-100 p-6 ">
                            <th className="text-left py-2 px-6">Status</th>
                            <th className="text-left py-2">Source</th>
                            <th className="text-left py-2">Charge</th>
                            <th className="text-left py-2">Paid put</th>
                            <th className="text-left py-2 w-30">Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 p-6">
                        {/* Failed payment */}
                        <tr>
                            <td className="py-3 px-6 font-medium relative">
                                <div
                                    className="flex gap-2 items-center cursor-pointer"
                                    onClick={() => setShowPopup(!showPopup)}
                                >
                                    <div className="text-red-500">●</div>
                                    <span>May Membership fee</span>
                                </div>

                                {showPopup && (
                                    <div className="absolute right-[200px] top-[-30px] mt-2 w-140 bg-white shadow-lg rounded-xl p-4 z-10">
                                        <div className="text-red-500 font-semibold mb-2">Payment Failed</div>
                                        <div className="text-gray-700 mb-2">
                                            Unsuccessful payment of John Smith's subscription for the month of May.
                                        </div>
                                        <a
                                            href="/failed-payments"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Go to the failed payments page
                                        </a>
                                    </div>
                                )}
                            </td>
                            <td>-</td>
                            <td>01/06/2023</td>
                            <td>-</td>
                            <td>3999 GBP</td>
                            <td className="text-left w-30">
                                <button className="text-blue-500  text-sm font-medium hover:underline">
                                    Retry Payment
                                </button>
                            </td>
                        </tr>

                        {/* Successful payments */}
                        <tr>
                            <td className="py-3 flex  gap-2 font-medium px-6 ">
                                <div className="text-green-600">● </div> April Membership fee
                            </td>
                            <td>-</td>
                            <td>01/06/2023</td>
                            <td>-</td>
                            <td>3999 GBP</td>
                            <td></td>
                        </tr>

                        <tr>
                            <td className="py-3 flex gap-2 font-medium px-6">
                                <div className="text-green-600">● </div> April Membership fee
                            </td>
                            <td>-</td>
                            <td>01/06/2023</td>
                            <td>-</td>
                            <td>3999 GBP</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default FailedPayment