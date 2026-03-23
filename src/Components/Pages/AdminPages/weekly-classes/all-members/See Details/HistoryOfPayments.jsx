import { useState } from "react";

const HistoryOfPayments = ({ stateData }) => {
  const [showPopup, setShowPopup] = useState(null);
  console.log("stateData", stateData);

  // ✅ Safe value helper
  const safeValue = (val, fallback = "-") =>
    val !== null && val !== undefined && val !== "" ? val : fallback;

  // ✅ Date formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-[24px] font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-y-4 text-[16px]">
          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Status</div>
          <div className="col-span-1 font-medium text-green-600 text-end border-b border-gray-200 pb-4">
            {safeValue(stateData.status)}
          </div>

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">ID</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {safeValue(stateData.bookedId)}
          </div>

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Created</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {formatDate(stateData.dateBooked)}
          </div>

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Address</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {safeValue(stateData?.payments?.[0]?.billingAddress)}
          </div>

          <div className="col-span-1 text-gray-500">Email</div>
          <div className="col-span-1 text-end">
            {safeValue(stateData?.payments?.[0]?.email)}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center">
        <div>
          <h2 className="text-[24px] font-semibold">Subscription</h2>
          <span className="font-medium text-[16px]">
            {safeValue(stateData?.paymentPlan?.title)}
          </span>
        </div>
        <div className="flex items-center text-[16px] gap-4">
          <span className="font-semibold">
            {safeValue(stateData?.paymentPlan?.price)} GBP
          </span>
          <button className="text-blue-500 font-medium hover:underline">Change</button>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl shadow-sm">
        <h2 className="text-[24px] font-semibold mb-4 p-6">Payments</h2>
        <table className="w-full text-[16px]">
          <thead className="text-gray-500">
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-6">Status</th>
              <th className="text-left py-2">Source</th>
              <th className="text-left py-2">Charge</th>
              <th className="text-left py-2">Paid out</th>
              <th className="text-left py-2 w-30">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 p-6">
            {stateData?.payments?.length > 0 ? (
              stateData.payments.map((payment, index) => {
                const isFailed = payment.paymentStatus !== "paid";
                const isSuccess = payment.paymentStatus === "paid";

                return (
                  <tr key={payment.id || index} className="relative">
                    {/* Description */}
                    <td className="py-3 px-6 font-medium relative">
                      <div
                        className={`flex gap-2 items-center ${
                          isFailed ? "cursor-pointer" : ""
                        }`}
                        onClick={() =>
                          isFailed &&
                          setShowPopup(showPopup === payment.id ? null : payment.id)
                        }
                      >
                        <div className={isFailed ? "text-red-500" : "text-green-500"}>●</div>
                        <span>{safeValue(payment.description, "Membership Fee")}</span>
                      </div>

                      {/* Popup */}
                      {showPopup === payment.id && isFailed && (
                        <div className="absolute right-[200px] top-[-30px] mt-2 w-72 bg-white shadow-lg rounded-xl p-4 z-10">
                          <div className="text-red-500 font-semibold mb-2">Payment Failed</div>
                          <div className="text-gray-700 mb-2">
                            Unsuccessful payment of {safeValue(payment.firstName)}{" "}
                            {safeValue(payment.lastName)}'s subscription for{" "}
                            {safeValue(payment.description, "this month")}.
                          </div>
                          <a href="/failed-payments" className="text-blue-600 hover:underline">
                            Go to the failed payments page
                          </a>
                        </div>
                      )}
                    </td>

                    <td>{safeValue(payment.merchantRef)}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{safeValue(payment.gatewayResponse?.paymentMethod?.card?.cardType)}</td>
                    <td>
                      {safeValue(payment.gatewayResponse?.transaction?.amount)}{" "}
                      {safeValue(payment.currency, "GBP")}
                    </td>

                    <td className="text-left w-30">
                      {isFailed ? (
                        <button className="text-blue-500 text-sm font-medium hover:underline">
                          Retry Payment
                        </button>
                      ) : (
                        <span className="text-green-600 text-sm font-semibold">
                          Paid Successfully
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No payment records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryOfPayments;
