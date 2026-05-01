import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const FailedPayments = ({ itemId }) => {
      const [searchParams] = useSearchParams();

    const [failedPayments, setFailedPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");
 const idFromUrl = searchParams.get("id");

  // ✅ fallback (agar prop se aaye toh)
  const id = itemId || idFromUrl;

    const fetchFailedPayments = async () => {
        if (!id) return;
        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/book-membership/failed/${id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            const payments = result?.data || [];
            const failed = payments.filter(
                (p) => p.paymentStatus?.toLowerCase() !== "paid"
            );


            setFailedPayments(failed);
        } catch (error) {
            console.error("Error fetching failed payments:", error);
        } finally {
            setLoading(false);
        }
    };
useEffect(() => {
    if (id) {
        fetchFailedPayments();
    }
}, [id]);
    return (
        <div className="p-6 bg-white rounded-xl shadow-sm">

            <h2 className="text-lg font-semibold mb-4">Failed Payments</h2>

            {loading && (
                <p className="text-sm text-gray-500 mb-4">Loading...</p>
            )}

            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-sm">

                    <thead className="bg-gray-100 text-gray-500 text-left">
                        <tr>
                            <th className="py-3 px-4">Booking ID</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {failedPayments.length > 0 ? (
                            failedPayments.map((p) => (
                             <tr key={p.id} className="hover:bg-gray-50">
    
    {/* Name (fallback) */}
    <td className="py-3 px-4">
        {p.bookingId || "-"}
    </td>

    {/* Amount */}
    <td className="py-3 px-4">
        {p.currency} {p.gatewayResponse?.Amount || 0}
    </td>

    {/* Type */}
    <td className="py-3 px-4 capitalize">
        {p.paymentCategory || "-"}
    </td>

    {/* Date */}
    <td className="py-3 px-4">
        {p.dueDate
            ? new Date(p.dueDate).toLocaleDateString("en-GB")
            : "-"}
    </td>

    {/* Status */}
    <td className="py-3 px-4">
        <span className="px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-600 capitalize">
            {p.paymentStatus || "failed"}
        </span>
    </td>

</tr>
                            ))
                        ) : (
                            !loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">
                                        No failed payments found
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default FailedPayments;