import { useEffect } from "react";
import { useMembers } from "../contexts/MemberContext";
import { useNotification } from "../contexts/NotificationContext";
import { Loader } from "lucide-react";

export default function List() {
  const { activeTab } = useMembers();
  const {
    notification,
    fetchMarkAsRead,
    loadingNotification,
    fetchNotification,
    customnotificationAll
  } = useNotification();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Merge notifications with fallback category if missing
  const toArray = (val) => Array.isArray(val) ? val : val ? [val] : [];

  // Or, better: create a new object without the admin field
  const allNotifications = [
    ...toArray(notification.notifications),
    ...toArray(customnotificationAll)
  ].map(({ ...rest }) => ({
    ...rest,
    category: rest.category?.trim() || "System"
  }));


  // ✅ Filter by active tab
  const filtered =
    activeTab === "All"
      ? allNotifications
      : allNotifications.filter(n => n.category === activeTab);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);
   console.log('allNotifications', allNotifications)
 function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  let hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds} ${ampm}`;
}

   console.log('filteredss', filtered)
  return (
    <div className="space-y-5 bg-white p-10 rounded-2xl">
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 text-lg">No notifications found.</div>
      )}
      {filtered
        .slice() // optional: avoids mutating the original array
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // newest first
        .map((item, idx) => (
          <div
            key={idx}
            className={`text-[18px] pb-5 ${idx !== filtered.length - 1 ? "border-b border-[#E2E1E5]" : ""
              }`}
          >
            <div className="flex gap-4">
              <img
                src={
                  item?.admin?.profile
                    ? `${item.admin.profile}`
                    : item?.createdBy?.profile
                      ? `${item.createdBy.profile}`
                      : '/members/dummyuser.png'
                }
                alt={item.name || "avatar"}
                onError={(e) => {
                  e.currentTarget.onerror = null; // prevent infinite loop
                  e.currentTarget.src = '/members/dummyuser.png';
                }}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{item?.admin?.firstName || item?.createdBy?.name || 'N/A'}</p>
                <span className="text-[16px] text-[#717073]">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[18px] py-4 pb-2">{item.title}</h3>
              <p className="text-[18px] font-medium text-gray-600 mt-1">
                {item.description}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
}
