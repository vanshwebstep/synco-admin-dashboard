import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Credits = ({ itemId, stateData }) => {
  const [searchParams] = useSearchParams();
  const creditsInfo = stateData?.credits || [];
  const [loading, setLoading] = useState(false);
  const creditsData = creditsInfo.map((item) => ({
    id: item.creditId,
    status: stateData.venue.name,
    date: item.date,
    reason: item.reason || "N/A",
    credit: Number(item.credit || 0),
    issuedBy: item.issuedBy || "System",
  }));
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");

  const idFromUrl = searchParams.get("id");
  const id = itemId || idFromUrl;

  const fetchCredits = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/book-membership/failed/${id}`, // 🔁 change API if needed
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      const data = result?.data || [];

      const formatted = data.map((item) => ({
        id: item.creditId,
        status: "Cancelled", // static or based on logic
        date: item.date,
        reason: item.reason || "N/A",
        credit: Number(item.credit || 0),
        issuedBy: item.issuedBy || "System",
      }));

    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCredits();
  }, [id]);

  // ✅ total credits
  const totalCredits = creditsData.reduce(
    (sum, item) => sum + item.credit,
    0
  );

  return (
    <div className="py-6 bg-white rounded-xl shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center px-6 mb-4">
        <h2 className="text-lg font-semibold">Class Cancelled</h2>

        <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
          Total Credits: {totalCredits}
        </div>
      </div>



      <div className="overflow-hidden ">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-500 text-left">
            <tr>
              {/* <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Date Cancelled</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Cancelled By</th>
              <th className="py-3 px-4">Credits</th>*/}

              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Issued By</th>
              <th className="py-3 px-4">Credit</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : creditsData.length > 0 ? (
              creditsData.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${index !== creditsData.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                >

                  {/* Status + Date */}
                  <td className="py-3 px-4  font-semibold">
                    <div className="flex gap-2 capitalize items-center">
                      {item.status} - {new Date(item.date).toLocaleDateString("en-GB")}
                     
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="py-3 px-4">
                    <div className="font-semibold">{item.reason}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{item.issuedBy}</div>
                  </td>

                  {/* Credit */}
                  <td className="py-3 px-4 font-semibold text-[#027A48]">
                    +{item.credit}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  No credits found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default Credits;
