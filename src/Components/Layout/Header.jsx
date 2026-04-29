import React, { useEffect, useState, useRef } from 'react';
import { Menu, X, Search, Bell, ChevronUp, ChevronDown } from 'lucide-react';
import { useNotification } from '../Pages/AdminPages/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useMembers } from "../Pages/AdminPages/contexts/MemberContext";
import { usePermission } from '../Pages/AdminPages/Common/permission';
import { useAccountsInfo } from '../Pages/AdminPages/contexts/AccountsInfoContext';
import { showConfirm } from '../../utils/swalHelper';
import { useGlobalSearch } from '../Pages/AdminPages/contexts/GlobalSearchContext';
import { verifyTokenAndSyncState } from '../verifyToken';

const Header = ({ profileOpen, setProfileOpen, toggleMobileMenu, isMobileMenuOpen }) => {
  const isFetchingRef = useRef(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  const [showNotificationPopup, setShowNotificationPopup] = useState(null);
  const { notification, customnotificationAll, setNotification, stopFetching, fetchNotification, adminInfo, setAdminInfo, franchisesInfo, setFranchisesInfo, activeAccount, setActiveAccount } = useNotification();
  const currentDate = new Date();

  const month = currentDate.toLocaleString("default", { month: "long" }); // e.g., January
  const day = currentDate.getDate(); // e.g., 8
  const weekday = currentDate.toLocaleString("default", { weekday: "long" }); // e.g., Monday
  const year = currentDate.getFullYear(); // e.g., 2024
  const { activeTab, setActiveTab } = useMembers();
  const currentPath = location.pathname
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  const storedAdmin = localStorage.getItem("adminInfo");
  const storedFranchises = localStorage.getItem("franchisesInfo");
  const storedActiveAccount = localStorage.getItem("activeAccount");
  console.log('storedFranchises', storedFranchises)
  console.log('storedActiveAccount', storedActiveAccount)

  // console.log('localStorage',localStorage)
  useEffect(() => {
    // ✅ Load adminInfo from localStorage
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminInfo(parsedAdmin);
      } catch (e) {
        console.error("Invalid adminInfo JSON in localStorage:", e);
      }
    }

    // ✅ Load franchisesInfo from localStorage
    if (storedFranchises) {
      try {
        const parsedFranchises = JSON.parse(storedFranchises);
        setFranchisesInfo(parsedFranchises);
        console.log('parsedFranchises', parsedFranchises)
      } catch (e) {
        console.error("Invalid franchisesInfo JSON in localStorage:", e);
      }
    }
    if (storedActiveAccount) {
      try {
        const parsedActiveAccount = JSON.parse(storedActiveAccount);
        setActiveAccount(parsedActiveAccount);
      } catch (e) {
        console.error("Invalid activeAccount JSON in localStorage:", e);
      }
    }
  }, []);



  const mergedNotifications = [
    ...(Array.isArray(notification?.notifications) ? notification.notifications : []),
    ...(Array.isArray(customnotificationAll) ? customnotificationAll : [])
  ].map(n => {
    // check recipient read status
    const recipientUnread = Array.isArray(n.recipients)
      ? n.recipients.some(r => r.isRead === false) // at least one unread
      : false;

    // normalize isRead
    const normalizedIsRead = n.isRead !== undefined
      ? n.isRead
      : !recipientUnread; // if recipients exist, mark false if any unread

    return {
      ...n,
      category: n.category?.trim() || "System",
      isRead: normalizedIsRead
    };
  });

  // filter by tab
  const filtered =
    activeTab === "All"
      ? mergedNotifications
      : mergedNotifications.filter(n => n.category === activeTab);

  // unread only
  const unreadNotifications = mergedNotifications.filter(n => !n.isRead);

  // unread count per category
  const totalUnreadCount = unreadNotifications.reduce((acc, curr) => {
    const cat = curr.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // 🔥 total unread count (if you need it)
  const notificationCount = unreadNotifications.length;
  const { checkPermission } = usePermission();



  const latestUnread = unreadNotifications[0]; // Show the most recent unread
  const navigate = useNavigate();
  const { historyActiveTab } = useAccountsInfo();

  const routeTitleMap = {
    '': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'admin-forgotpassword': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'merchandise': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'email-management': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'recruitment-reports': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'templates': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'weekly-classes': { title: 'Configuration', },
    'configuration/weekly-classes/find-a-class/': { title: 'Weekly Classes', },
    'synco-chat': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'members': { title: 'Admin Panel' },
    'configuration/weekly-classes/session-plan-list': { title: 'Configuration' },
    'configuration/weekly-classes/term-dates': { title: 'Configuration' },

    'configuration/weekly-classes/session-plan-create': { title: 'Configuration' },
    'configuration/weekly-classes/session-plan-preview': { title: 'Configuration' },
    'configuration/weekly-classes/subscription-planManager': { title: 'Configuration' },
    'configuration/weekly-classes/add-subscription-plan-group': { title: 'Configuration' },
    'weekly-classes/find-a-class': { title: 'Weekly Classes' },
    'weekly-classes/find-a-class/add-to-waiting-list': { title: 'Waiting List' },
    'weekly-classes/add-to-waiting-list': { title: 'Waiting List' },

    'holiday-camps/payment-planManager': { title: 'Configuration' },
    'weekly-classes/trial/list': { title: 'Trials Information' },

    'holiday-camps/add-subscription-plan-group': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'holiday-camps/discounts': { title: 'Discounts' },
    'holiday-camps/session-plan': { title: 'Configuration', },
    'notification': { title: 'Notification' },
    'weekly-classes/all-members': { title: 'Members' },
    'configuration/weekly-classes/venues': { title: 'Configuration', },
    'find-a-class/book-a-free-trial/account-info': { title: 'Account Information' },
    'weekly-classes/all-members/account-info': { title: 'Account Information' },
    'weekly-classes/central-leads/accont-info': { title: 'Account Information' },

    'weekly-classes/cancellation': { title: 'Cancellation' },
    'weekly-classes/capacity': { title: 'Capacity' },
    'members/List': { title: 'Admin Panel' },
    'members/update': { title: 'Admin Panel' },
    'weekly-classes/cancellation/account-info/list': { title: 'Account Information' },
    'weekly-classes/term-dates/create': { title: 'Configuration' },
    'weekly-classes/account-information': { title: 'Account Information' },
    'weekly-classes/cancellation/account-info/': { title: 'Account Information' },
    'one-to-one/sales/account-information': { title: 'Account Information' },
    'birthday-party/sales/account-information': { title: 'Account Information' },

    'one-to-one': { title: 'One to One ' },
    'one-to-one/session-plan-preview': { title: 'Configuration ' },
    'one-to-one/session-plan': { title: 'Configuration ' },
    'birthday-party/session-plan': { title: 'Configuration ' },

    'reports': { title: 'Weekly Classes Reports ' },
    'one-to-one/reports': { title: 'Welcome back', icon: '/images/Welcomeback.png' },

    'weekly-classes/central-leads': { title: 'Weekly Classes Lead Database ' },
    'weekly-classes/central-leads/create': { title: 'Weekly Classes ' },
    'birthday-party/leads': { title: 'Birthday party  ' },
    'one-to-one/leads/booking-form': { title: 'Booking Form' },
    'birthday-party/leads/booking-form': { title: 'Booking Form' },
    'configuration/holiday-camp': { title: 'Configuration' },
    'holiday-camp/': { title: 'Holiday Camps' },
    'templates/create': { title: 'Communication Templates' },
    'templates/list': { title: 'Text/Email Communications' },
    'templates/settingList': { title: 'Communication Templates' },
    'holiday-camp': { title: 'Configuration' },
    'birthday-party': { title: 'Configuration' },
    'recruitment': { title: 'Recruitment' },
    'recruitment/reports': { title: 'Welcome back', icon: '/images/Welcomeback.png' },
    'administration/file-manager': { title: 'Folders' },
    'configuration/holiday-camp/discount': { title: 'Discounts' },
    'holiday-camp/members': { title: 'Holiday Camps' },
    'permission': { title: 'Permissions' },
    'recruitment/franchise-lead': { title: 'Franchise' },
    'recruitment/franchise-lead/see-details': { title: 'Account Information' },

  };
  // Extract the part after `/`
  const subPath = location.pathname.split('/')[1] || '';
  console.log('franchisesInfo', franchisesInfo)
  // Match the longest route
  const routeInfo =
    Object.entries(routeTitleMap)
      .map(([route, info]) => [
        route.replace(/\/+$/, '').toLowerCase(),
        info,
      ])
      .sort((a, b) => b[0].length - a[0].length) // longest first
      .find(([route]) => currentPath.includes(route))?.[1]
    || { title: 'Configuration', icon: '/images/Welcomeback.png' };

  // if (historyActiveTab === "History Of Payments") {
  //   routeInfo = {
  //     title: 'Welcome back', icon: '/images/Welcomeback.png'
  //   };
  // }
  const { title, icon: Icon } = routeInfo;

  useEffect(() => {
    const fetchAndMerge = async () => {
      if (isFetchingRef.current || stopFetching) return;
      isFetchingRef.current = true;

      await fetchNotification();

      isFetchingRef.current = false;
    };

    fetchAndMerge();
    const interval = setInterval(fetchAndMerge, 60000);

    return () => clearInterval(interval);
  }, [fetchNotification, stopFetching]);


  const handleLogout = () => {
    showConfirm("Are you sure?", "You will be logged out!", "Log out").then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/admin-login"); // redirect to dashboard (adjust route if needed)
      }
    });

  };
  const handleSwitchAccount = async (account) => {
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/auth/switch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: account.email,
            status: account.status,
            token: token
          }),
        }
      );

      const result = await response.json();

      if (!result?.status) return;

      const newToken = result?.data?.token;

      // 🔥 IMPORTANT: replace token
      localStorage.setItem("adminToken", newToken);

      // update active account
      setActiveAccount(result.data.admin);
      localStorage.setItem("activeAccount", JSON.stringify(result.data.admin));

      setProfileOpen(false);

      // ✅ verify using NEW token
      // 🔥 call NEW function (not old verifyToken)
      await verifyTokenAndSyncState(newToken, {
        setAdminInfo,
        setActiveAccount,
        setFranchisesInfo,
      });


    } catch (error) {
      console.error("Switch error:", error);
    }
  };
  const handleNotificationClick = () => {
    if (notificationCount > 0) {
      setShowNotificationPopup((prev) => !prev);
    } else {
      navigate('/notification');
    }
  };
  const popupRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowNotificationPopup(false);
      }
    }

    if (showNotificationPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationPopup, setShowNotificationPopup]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // prevent closing when clicking the profile button
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const hasPermission =
    checkPermission({ module: 'notification', action: 'view-listing' }) ||
    checkPermission({ module: 'custom-notification', action: 'view-listing' });




  return (
    <>
      {/* HEADER */}
      {/* HEADER */}
      <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center py-4  bg-gray-50  gap-4 lg:gap-0 ${location.pathname.includes("/members/List") ? "px-8" : ""}`}>

        {/* Desktop LEFT: Greeting + Welcome */}
        <div className="hidden lg:block">
          <span className="font-semibold text-[22px] sm:text-[24px] lg:text-[26px]">Hi {adminInfo?.firstName}!</span>
          <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-semibold flex gap-2 items-center whitespace-nowrap">
            {title || 'Configuration'}
            {Icon && <img src={Icon} alt="Welcome" className="w-8 h-8 sm:w-10 sm:h-10" />}
          </h2>

        </div>

        {/* Mobile: Top Row (Menu - WelcomeImg - Profile) */}
        <div className="flex w-full justify-between items-center lg:hidden">
          {/* Mobile Menu Toggle */}
          <button onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

          <div className="flex items-center justify-center gap-0.5">
            <img src='/images/synco-text-logo.png' alt="Welcome" className="  h-10" />
            {/* <img src='/images/synco-text-round.png' alt="Welcome" className=" h-10 mb-0.5 animate-spin [animation-duration:5s]" /> */}
          </div>

          {/* Profile Image */}
          <div className="relative">
            <div
              ref={profileRef}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                <img
                  src={
                    adminInfo?.profile
                      ? `${adminInfo.profile}`
                      : '/members/dummyuser.png'
                  }
                  className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl border z-10 overflow-hidden"
              >
                {/* Current User */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <img
                      src={adminInfo?.profile || "/members/dummyuser.png"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {adminInfo?.firstName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {adminInfo?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Franchise Accounts */}
                <div className="max-h-48 overflow-y-auto">
                  {franchisesInfo?.map((item) => (
                    <div
                      key={item.id}
                      // onClick={() => handleSwitchAccount(item)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <img
                        src={item.profile || "/members/dummyuser.png"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {item.firstName} {item.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="border-t">
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                    + Add Account
                  </div>
                  <div
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-500"
                  >
                    Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop RIGHT Side Items */}
        <div className="hidden relative lg:flex flex-col sm:flex-row items-start sm:items-center md:gap-10 sm:gap-6 w-full lg:w-auto">

          {/* Search Bar */}
          <div className="relative w-full sm:w-[280px] lg:w-[200px] xl:w-[250px] 2xl:w-[400px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-[#E2E1E5] rounded-lg bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search"
            />
            <img src="/images/icons/search.png" className="absolute right-3 top-1/2 left-2 max-w-[10px] transform -translate-y-1/2 text-black" alt="" />

          </div>
          {hasPermission && (

            <div
              onClick={handleNotificationClick}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer
      ${notificationCount > 0 ? "bg-[#FF5A3C] text-white" : "bg-white border border-[#E2E1E5]"}`}
            >

              <img src="/DashboardIcons/notificationIcon.png" alt="" />

              {notificationCount > 0 && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-black text-sm font-semibold flex items-center justify-center shadow-md">
                  {notificationCount}
                </span>
              )}
            </div>
          )}

          {/* Notification Popup */}
          {showNotificationPopup && notificationCount > 0 && latestUnread && (
            <div
              ref={popupRef}
              className="md:max-w-[450px] absolute top-14 right-0 bg-white rounded-2xl shadow-sm p-6 z-10"
            >
              <h3 className="text-red-500 font-semibold text-[18px] mb-1">
                {latestUnread.title}
              </h3>
              <p className="text-[16px] font-semibold text-black">
                {latestUnread.description}
              </p>
              <a
                onClick={() => {
                  navigate('/notification');
                  setShowNotificationPopup();
                }}
                className="text-[#237FEA] cursor-pointer text-[16px] font-semibold mt-2 inline-block underline"
              >
                See more
              </a>


            </div>
          )}

          {/* Date + Profile */}
          <div className="flex items-start sm:items-center justify-between w-full sm:w-auto">
            {/* Date */}
            <div className="block text-sm text-gray-600 border-r border-gray-300 pr-4 mr-4">
              <span className="block text-right text-gray-800 font-semibold">{month}</span>
              <span className="font-semibold text-gray-600">
                {day} {weekday}, {year}
              </span>
            </div>

            {/* Profile Info + Dropdown */}
            <div className="relative">
              <div
                ref={profileRef}
                className="profile mt-1 sm:mt-2 flex items-center gap-3 cursor-pointer"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profileimg w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                  <img
                    src={
                      adminInfo?.profile
                        ? `${adminInfo.profile}`
                        : '/members/dummyuser.png'
                    }
                    alt="profile"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null; // prevent infinite loop
                      e.currentTarget.src = '/members/dummyuser.png';
                    }}
                  />
                </div>

                <div className="block text-start">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-semibold leading-[1px]">
                      {adminInfo?.firstName}
                    </span>
                    {profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">
                    {adminInfo?.role?.role}
                  </span>

                </div>
              </div>

              {profileOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Current User */}
                  <div className="px-5 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={adminInfo?.profile || "/members/dummyuser.png"}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-gray-800">
                          {adminInfo?.firstName}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">
                          {adminInfo?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Franchise Accounts */}
                  <div className="max-h-56 overflow-y-auto py-2">
                    {franchisesInfo?.map((item) => {
                      const isActive = activeAccount?.id === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSwitchAccount(item)}
                          className={`flex items-center gap-3 px-4 py-2 cursor-pointer
        ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"}
      `}
                        >
                          <img
                            src={item.profile || "/members/dummyuser.png"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {item.firstName} {item.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{item.email}</p>
                          </div>

                          {isActive && (
                            <span className="ml-auto text-xs text-blue-600">Active</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="border-t bg-gray-50">
                    <div
                      className="px-5 py-2.5 hover:bg-gray-100 cursor-pointer text-sm font-medium flex items-center gap-2"
                    >
                      <span className="text-lg">＋</span>
                      Add Account
                    </div>

                    <div
                      onClick={handleLogout}
                      className="px-5 py-2.5 hover:bg-red-50 cursor-pointer text-sm font-medium text-red-500 flex items-center gap-2"
                    >
                      ⏻ Logout
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH BAR: Only for mobile (below header) */}
      <div className="block lg:hidden px-4 sm:px-6 py-3 bg-gray-50 border-b">
        <div className="relative w-full">
          <input
            type="search"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        </div>
      </div>

    </>


  );
};

export default Header;
