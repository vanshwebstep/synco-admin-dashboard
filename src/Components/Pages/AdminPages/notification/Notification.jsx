import { useNotification } from "../contexts/NotificationContext";
import List from "./List";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { useMembers } from "../contexts/MemberContext";
import { usePermission } from "../Common/permission";

export default function Notification() {
  const { fetchMarkAsRead } = useNotification();
  const navigate = useNavigate();
  const { checkPermission } = usePermission();

  const { activeTab, setActiveTab } = useMembers();
   console.log('activeTabssdsdsds', activeTab)
  const hasPermission =
    checkPermission({ module: 'custom-notification', action: 'create' }) &&
    checkPermission({ module: 'custom-notification', action: 'view-listing' });

  const hasMarkAsRead =
    checkPermission({ module: 'notification', action: 'read' });

     console.log('hasMarkAsRead',hasMarkAsRead)
  return (
    <>
      <div className="md:flex justify-between items-center mb-4">
        <h1 className="text-[28px] font-semibold py-2">Notification</h1>
        <div className="flex gap-4 items-center pr-2">
          {hasPermission && (
            <button
              className="text-[#717073] underline cursor-pointer transition-transform duration-300 hover:scale-105  "
              onClick={() => navigate("/notification-list")}
            >
              Create Notification
            </button>
          )}


          {hasMarkAsRead && (
            < button className="text-[#717073] underline cursor-pointer transition-transform duration-300 hover:scale-105" onClick={() => fetchMarkAsRead(activeTab)}>Mark as read</button>
            )}
        </div> </div >
      <div className="md:flex gap-5 bg-gray-50">
        <Sidebar />
        <div className="md:w-9/12 mt-5 md:mt-0 overflow-y-auto break-words overflow-x-hidden">
          <List />
        </div>

      </div>
    </>
  );
}
