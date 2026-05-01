import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Credits = ({ itemId }) => {
  const [searchParams] = useSearchParams();

  const [creditsData, setCreditsData] = useState([]);
  const [loading, setLoading] = useState(false);

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

      // 👉 map API response to UI structure (adjust keys if needed)
      const formatted = data.map((item) => ({
        id: item.id,
        className: item.className || "N/A",
        cancelDate: item.dueDate,
        reason: item.reason || "N/A",
        cancelledBy: item.cancelledBy || "Admin",
        credits: Number(item.credits || 0),
        issuedBy: item.issuedBy || "System",
      }));

      setCreditsData(formatted);
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
    (sum, item) => sum + item.credits,
    0
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Credits</h2>

        <div className="text-sm font-medium text-blue-600">
          Total Credits: {totalCredits}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mb-4">Loading...</p>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-500 text-left">
            <tr>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Date Cancelled</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Cancelled By</th>
              <th className="py-3 px-4">Credits</th>
              <th className="py-3 px-4">Issued By</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {creditsData.length > 0 ? (
              creditsData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">

                  <td className="py-3 px-4">
                    {item.className}
                  </td>

                  <td className="py-3 px-4">
                    {item.cancelDate
                      ? new Date(item.cancelDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>

                  <td className="py-3 px-4">
                    {item.reason}
                  </td>

                  <td className="py-3 px-4">
                    {item.cancelledBy}
                  </td>

                  <td className="py-3 px-4 font-medium text-green-600">
                    {item.credits}
                  </td>

                  <td className="py-3 px-4">
                    {item.issuedBy}
                  </td>

                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No credits found
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

export default Credits;