import { useMembers } from "../contexts/MemberContext";
import { useNotification } from "../contexts/NotificationContext";

const validCategories = [
  "Complaints",
  "Payments",
  "Cancelled Memberships",
  "Members",
  "Member Roles",
  "System",
  "Activity Logs",
  "Security",
  "Login",
  "Settings",
  "Updates",
  "Announcements",
  "Tasks",
  "Messages",
  "Support"
];

const allTabs = ["All", ...validCategories];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useMembers();
  const { notification, customnotificationAll } = useNotification();

const mergedNotifications = [
  ...(Array.isArray(notification?.notifications) ? notification.notifications : []),
  ...(Array.isArray(customnotificationAll) ? customnotificationAll : [])
].map(n => {
  // Check recipient read status (if exists)
  const recipientIsRead = Array.isArray(n.recipients)
    ? n.recipients.every(r => r.isRead)
    : false;

   // console.log("notification", notification);
   // console.log("customnotificationAll", customnotificationAll);

  return {
    ...n,
    category: n.category?.trim() || "System",
    isRead: n.isRead ?? recipientIsRead // normalize isRead at top level
  };
});



  const filtered =
    activeTab === "All"
      ? mergedNotifications
      : mergedNotifications.filter(n => n.category === activeTab);
   // console.log('filtsdsdered', filtered)
  // ✅ Filter unread only
  const unreadNotifications = mergedNotifications.filter(n => !n.isRead);

  // ✅ Count unread per category
  const categoryCounts = unreadNotifications.reduce((acc, curr) => {
    const cat = curr.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
   // console.log("unreadNotifications", unreadNotifications)
  // Optional: Sort categories with unread items first
  // const sortedTabs = [...allTabs].sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));
  const tabsToDisplay = allTabs; // or use sortedTabs for sorting

  return (
    <div className="md:w-3/12 bg-white rounded-2xl">
      <h2 className="text-[24px] font-semibold mb-4 px-7 pt-5">Categories</h2>
      <ul className="space-y-2">
        {tabsToDisplay.map((tabLabel) => {
          const count =
            tabLabel === "All"
              ? unreadNotifications.length
              : categoryCounts[tabLabel] || 0;

          return (
            <li
              key={tabLabel}
              onClick={() => setActiveTab(tabLabel)}
              className={`cursor-pointer text-[#282829] font-medium p-4 flex gap-5 text-[18px] px-7 ${activeTab === tabLabel
                ? "bg-[#F7FBFF] border-l-3 border-[#237FEA] font-medium"
                : ""
                }`}
            >
              <span>{tabLabel}</span>
              {count > 0 && (
                <span className="bg-[#FF5C40] text-white text-[14px] font-semibold rounded-full h-7 w-7 flex items-center justify-center">
                  {count}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}





// const adminId = 7; // Replace this with the actual logged-in admin ID

// // ✅ Step 1: Clean up and flag correct isRead for custom notifications
// const cleanedCustomNotifications = customnotificationAll.map(n => {
//   const recipient = n.recipients?.find(r => r.recipientId === adminId);
//   return {
//     ...n,
//     isRead: recipient?.isRead ?? true, // if not found, treat as read
//     category: n.category?.trim() || "System"
//   };
// });

// // ✅ Step 2: Also normalize normal notifications (in case they don't have top-level isRead)
// const cleanedNormalNotifications = notification.map(n => {
//   const recipient = n.recipients?.find(r => r.recipientId === adminId);
//   return {
//     ...n,
//     isRead: recipient?.isRead ?? true, // fallback to read if not found
//     category: n.category?.trim() || "System"
//   };
// });

// // ✅ Step 3: Merge both cleaned arrays
// const mergedNotifications = [...cleanedNormalNotifications, ...cleanedCustomNotifications];

// // ✅ Step 4: Apply category filter
// const filtered =
//   activeTab === "All"
//     ? mergedNotifications
//     : mergedNotifications.filter(n => n.category === activeTab);

// // ✅ Step 5: Filter unread notifications
// const unreadNotifications = mergedNotifications.filter(n => !n.isRead);

// // ✅ Step 6: Count unread notifications by category
// const categoryCounts = unreadNotifications.reduce((acc, curr) => {
//   const cat = curr.category;
//   acc[cat] = (acc[cat] || 0) + 1;
//   return acc;
// }, {});

