import React from 'react'
import { useAccountsInfo } from '../../contexts/AccountsInfoContext';

const PaymentHistory = () => {
  const { data } = useAccountsInfo();
console.log('data',data)

  return (
    <>
      <div className="">
        {/* ==== DETAILS CARD ==== */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Details
            </h2>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Status</span>
              <span className="text-gray-800 font-semibold capitalize">
                {data?.status || data?.booking?.payment?.paymentStatus || "N/A"}
              </span>
            </div>

            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-800 font-semibold">
                {data?.id || data?.booking?.leadId || "N/A"}
              </span>
            </div>

            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-800 font-semibold">
                {data?.createdAt
                  ? new Date(data.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  : "N/A"}

              </span>
            </div>

            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Address</span>
              <span className="text-gray-800 font-semibold text-right max-w-[250px] md:max-w-[400px] break-words">
                {data?.holidayVenue?.name || "N/A"}
              </span>
            </div>

            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800 font-semibold">
                {data?.parents?.[0]?.parentEmail || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* ==== PAYMENTS TABLE ==== */}
        <div className="bg-white rounded-2xl shadow-sm py-6 w-full mx-auto">
          <h2 className="text-gray-800 text-lg font-semibold mb-4 px-6">Payments</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#717073] bg-[#F5F5F5] text-sm">
                  <th className="py-3  font-semibold px-6 md:w-5/12">Status</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Charge</th>
                  <th className="py-3 px-4 font-semibold">Paid Out</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>

              <tbody>
                {/* You can have multiple payments, but in your data only one exists */}
                <tr className="relative after:content-[''] after:block after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[97%] after:h-px after:bg-[#F2F1F5] hover:bg-gray-50 transition">
                  <td className="py-3 px-6 flex md:w-5/12 items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${data?.payment?.payment_status === "paid"
                        ? "bg-green-500"
                        : "bg-red-500"
                        }`}
                    ></span>
                    {data?.payment?.payment_status || "N/A"}
                  </td>

                  <td className="py-3 px-4">
                    {data?.marketingChannel || data?.parents?.[0]?.howDidYouHear || "N/A"}
                  </td>

                  <td className="py-3 px-4">
                    {/* {data?.booking?.payment?.stripePaymentIntentId || "N/A"} */}
                   {data?.payment?.base_amount}  
                  </td>

                  <td className="py-3 px-4">
                   {data?.payment?.discount_amount}
                  </td>

                  <td className="py-3 px-4 font-medium">
                    £
                    {data?.payment?.base_amount
                      ? parseFloat(data?.payment?.base_amount).toFixed(2)
                      : "0.00"} GBP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </>
  )
}

export default PaymentHistory
