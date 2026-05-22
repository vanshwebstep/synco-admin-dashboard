import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { usePermission } from "../Pages/AdminPages/Common/permission";
import { useAccountsInfo } from '../Pages/AdminPages/contexts/AccountsInfoContext';
import { useGlobalSearch } from '../Pages/AdminPages/contexts/GlobalSearchContext';

function normalizePath(path) {
  if (!path) return "";
  return path
    .split(/[?#]/)[0]
    .replace(/\/+$/, "")
    .replace(
      /\/(list|lists|create|update|edit|details|view|account-info|add-to-waiting-list|book-a-free-trial|book-a-membership)(\/.*)?$/,
      ""
    );
}

function findActiveItemAndParents(items, currentPath, parents = []) {
  const normalizedCurrent = normalizePath(currentPath);
  for (const item of items) {
    const normalizedItemLink = normalizePath(item.link);
    if (normalizedItemLink && normalizedCurrent.includes(normalizedItemLink)) {
      return { item, parents };
    }
    if (item.subItems) {
      const found = findActiveItemAndParents(item.subItems, currentPath, [...parents, item]);
      if (found) return found;
    }
    if (item.innerSubItems) {
      const foundInner = findActiveItemAndParents(item.innerSubItems, currentPath, [...parents, item]);
      if (foundInner) return foundInner;
    }
  }
  return null;
}

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const { searchQuery, setSearchQuery, clearRegisteredData } = useGlobalSearch();
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef();
  const { checkPermission } = usePermission();
  const MyRole = localStorage.getItem("role");
  const { historyActiveTab, setHistoryActiveTab } = useAccountsInfo();
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const result = findActiveItemAndParents(menuItems, location.pathname);
    if (result) {
      const { item, parents } = result;
      setActiveTab(item.link);
      const expanded = {};
      parents.forEach((p) => (expanded[p.title] = true));
      setOpenDropdowns((prev) => ({ ...prev, ...expanded }));
    }
  }, [location.pathname]);

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const isItemActive = (item) => {
    if (item.link && activeTab === item.link) return true;
    if (item.subItems) {
      return item.subItems.some(sub => sub.link === activeTab);
    }
    return false;
  };

  const menuItemsRaw = [
    {
      title: 'Dashboard',
      icon: '/SidebarLogos/Dashboard.png',
      path: '/',
      iconHover: '/SidebarLogos/DashboardH.png',
      link: '/',
      lucideIcon: 'dashboard',
    },
    {
      title: 'Weekly Classes',
      path: '/weekly-classes',
      icon: '/SidebarLogos/WeeklyClasses.png',
      iconHover: '/SidebarLogos/WeeklyClassesH.png',
      needPermissions: [
        { module: 'book-membership', action: 'view-listing' },
        { module: 'book-free-trial', action: 'view-listing' },
        { module: 'find-class', action: 'view-listing' },
        { module: 'cancellation', action: 'view-listing' },
        { module: 'waiting-list', action: 'view-listing' },
        { module: 'account-information', action: 'view-listing' }
      ],
      subItems: [
        { title: 'Find a class', link: '/weekly-classes/find-a-class', needPermissions: [{ module: 'find-class', action: 'view-listing' }] },
        { title: 'Members', link: '/weekly-classes/all-members/list', needPermissions: [{ module: 'book-membership', action: 'view-listing' }] },
        { title: 'Sales', link: '/weekly-classes/all-members/membership-sales', needPermissions: [{ module: 'book-membership', action: 'view-listing' }] },
        { title: 'Trials', link: '/weekly-classes/trial/list', needPermissions: [{ module: 'book-free-trial', action: 'view-listing' }] },
        { title: 'Cancellation', link: '/weekly-classes/cancellation', needPermissions: [{ module: 'cancellation', action: 'view-listing' }] },
        { title: 'Waiting list', link: '/weekly-classes/find-a-class/add-to-waiting-list/list', needPermissions: [{ module: 'waiting-list', action: 'view-listing' }] },
        { title: 'Capacity', link: '/weekly-classes/capacity', needPermissions: [{ module: 'capacity', action: 'view-listing' }] },
        { title: 'Account Information', link: '/weekly-classes/members-info', needPermissions: [{ module: 'account-information', action: 'view-listing' }] },
        { title: 'Leads database', link: '/weekly-classes/central-leads', needPermissions: [{ module: 'venue', action: 'view-listing' }] },
      ]
    },
    {
      title: "One To One",
      icon: "/reportsIcons/user.png",
      path: '/one-to-one',
      iconHover: "/reportsIcons/userH.png",
      needPermissions: [{ module: 'one-to-one-lead', action: 'view-listing' }],
      subItems: [
        { title: "Sales", link: '/one-to-one', needPermissions: [{ module: 'venue', action: 'view-listing' }] },
        { title: "Session plan Structure", link: '/one-to-one/session-plan', needPermissions: [{ module: 'session-exercise-one-to-one', action: 'view-listing' }] },
        { title: "Reports", link: '/one-to-one/reports', needPermissions: [{ module: 'one-to-one-lead', action: 'view-listing' }] },
      ],
    },
    {
      title: 'Holiday Camps',
      path: '/holiday-camps',
      icon: '/SidebarLogos/WeeklyClasses.png',
      iconHover: '/SidebarLogos/WeeklyClassesH.png',
      needPermissions: [
        { module: 'holiday-find-class', action: 'view-listing' },
        { module: 'holiday-booking', action: 'view-listing' }
      ],
      subItems: [
        { title: 'Find a Camp', link: '/holiday-camp/find-a-camp', needPermissions: [{ module: 'holiday-find-class', action: 'view-listing' }] },
        { title: 'Members', link: '/holiday-camp/members/list', needPermissions: [{ module: 'holiday-booking', action: 'view-listing' }] },
        { title: 'Reports', link: '/holiday-camp/reports', needPermissions: [{ module: 'holiday-find-class', action: 'view-listing' }] },
      ]
    },
    {
      title: "Birthday parties",
      icon: "/SidebarLogos/Birthday.png",
      path: '/birthday-party',
      iconHover: "/SidebarLogos/BirthdayH.png",
      needPermissions: [{ module: 'birthday-party-lead', action: 'view-listing' }],
      subItems: [
        { title: "Sales", link: '/birthday-party/leads', needPermissions: [{ module: 'birthday-party-lead', action: 'view-listing' }] },
        { title: "Session plan Structure", link: '/birthday-party/session-plan' },
        { title: "Reports", link: '/birthday-party/reports', needPermissions: [{ module: 'birthday-party-lead', action: 'view-listing' }] },
      ],
    },
    {
      title: "Recruitment",
      icon: "/SidebarLogos/Birthday.png",
      path: '/recruitment',
      iconHover: "/SidebarLogos/BirthdayH.png",
      needPermissions: [{ module: 'recruitment-lead', action: 'view-listing' }],
      subItems: [
        { title: "Leads Database", link: '/recruitment/lead', needPermissions: [{ module: 'recruitment-lead', action: 'view-listing' }] },
        { title: "Franchise Leads", link: '/recruitment/franchise-lead', needPermissions: [{ module: 'recruitment-lead-franchise', action: 'view-listing' }] },
        { title: "Reports", link: '/recruitment/reports', needPermissions: [{ module: 'recruitment-lead', action: 'view-listing' }] },
      ],
    },
    {
      title: "Reports",
      icon: "/reportsIcons/reports.png",
      path: '/reports',
      iconHover: "/reportsIcons/camper.png",
      needPermissions: [{ module: 'reports', action: 'member-report' }],
      subItems: [
        { title: "Members", link: "/reports/members", needPermissions: [{ module: 'reports', action: 'member-report' }] },
        { title: "Trials and conversions", link: "/reports/trials", needPermissions: [{ module: 'reports', action: 'trial-conversion-report' }] },
        { title: "Sales", link: "/reports/sales", needPermissions: [{ module: 'reports', action: 'sales-report' }] },
        { title: "Class Capacity", link: "/reports/class-capacity", needPermissions: [{ module: 'reports', action: 'capacity-report' }] },
        { title: "Attendance", link: "/reports/attendance", needPermissions: [{ module: 'reports', action: 'member-report' }] },
        { title: "Cancellations", link: "/reports/cancellations", needPermissions: [{ module: 'reports', action: 'cancellation-report' }] },
        { title: "Weekly Classes", link: "/reports/weekly-classes", needPermissions: [{ module: 'reports', action: 'attendance-report' }] },
      ],
    },
    {
      title: 'Key Information',
      icon: '/SidebarLogos/Management.png',
      iconHover: '/SidebarLogos/ManagementH.png',
      link: '/KeyInfomation',
      path: '/KeyInfomation',
      needPermissions: [{ module: 'key-information', action: 'view-listing' }]
    },
    ...(MyRole === 'Super Admin' ? [{
      title: 'Permission',
      path: '/permission',
      icon: '/SidebarLogos/Dashboard.png',
      iconHover: '/SidebarLogos/DashboardH.png',
      link: '/permission',
      needPermissions: [{ module: 'admin-role', action: 'view-listing' }]
    }] : []),
    {
      title: 'Administration',
      path: '/members/s',
      icon: '/SidebarLogos/Admistration.png',
      iconHover: '/SidebarLogos/AdmistrationH.png',
      needPermissions: [{ module: 'member', action: 'view-listing' }],
      subItems: [
        { title: 'Admin Panel', link: '/members/List', needPermissions: [{ module: 'member', action: 'view-listing' }] },
        { title: 'To Do List', link: '/administration/to-do-list', needPermissions: [{ module: 'member', action: 'view-listing' }] },
        { title: 'Folders', link: '/administration/file-manager', needPermissions: [{ module: 'member', action: 'view-listing' }] }
      ]
    },
    {
      title: 'Templates',
      path: '/templates',
      icon: '/SidebarLogos/Template.png',
      iconHover: '/SidebarLogos/TemplateH.png',
      needPermissions: [{ module: 'holiday-custom-template', action: 'view-listing' }],
      subItems: [
        { title: 'Create a Template', link: '/templates/create', needPermissions: [{ module: 'holiday-custom-template', action: 'create' }] },
        { title: 'List of Templates', link: '/templates/list', needPermissions: [{ module: 'holiday-custom-template', action: 'view-listing' }] },
        { title: 'OutBound cons', link: '/templates/settingList', needPermissions: [{ module: 'holiday-custom-template', action: 'view-listing' }] }
      ]
    },
    {
      title: "Configuration",
      icon: "/SidebarLogos/config.png",
      path: '/configuration',
      iconHover: "/SidebarLogos/configH.png",
      needPermissions: [{ module: 'configuration', action: 'view' }],
      subItems: [
        {
          title: "Weekly classes",
          link: "#",
          needPermissions: [{ module: 'venue', action: 'view-listing' }],
          subItems: [
            { noPaddingx: true, title: "Venues", link: "/configuration/weekly-classes/venues", needPermissions: [{ module: 'venue', action: 'view-listing' }] },
            { noPaddingx: true, title: "Term Dates & Mapping", link: "/configuration/weekly-classes/term-dates/list", needPermissions: [{ module: 'term-group', action: 'view-listing' }] },
            { noPaddingx: true, title: "Session Plan Library", link: "/configuration/weekly-classes/session-plan-list", needPermissions: [{ module: 'session-plan-group', action: 'view-listing' }] },
            { noPaddingx: true, title: "Subscription Plan Manager", link: "/configuration/weekly-classes/subscription-planManager", needPermissions: [{ module: 'payment-group', action: 'view-listing' }] },
            { noPaddingx: true, title: "Starter Pack", link: "/configuration/weekly-classes/starter-pack", needPermissions: [{ module: 'payment-group', action: 'view-listing' }] },
          ],
        },
        {
          title: "Holiday camps",
          link: "#",
          needPermissions: [{ module: 'holiday-venue', action: 'view-listing' }],
          subItems: [
            { noPaddingx: true, title: "Add a venue", link: '/configuration/holiday-camp/venues', needPermissions: [{ module: 'holiday-venue', action: 'view-listing' }] },
            { noPaddingx: true, title: "Dates", link: '/configuration/holiday-camp/terms/list', needPermissions: [{ module: 'holiday-termGroup-create', action: 'create' }] },
            { noPaddingx: true, title: "Session Plans", link: '/configuration/holiday-camp/session-plan/list', needPermissions: [{ module: 'holiday-session-plan-group', action: 'view-listing' }] },
            { noPaddingx: true, title: "Payment Plan Manager", link: "/configuration/holiday-camp/subscription-plan-group", needPermissions: [{ module: 'holiday-payment-plan', action: 'view-listing' }] },
            { noPaddingx: true, title: "Discounts", link: "/configuration/holiday-camp/discount/list", needPermissions: [{ module: 'discount', action: 'view-listing' }] },
          ],
        },
        {
          title: "Coach pro",
          link: "#",
          needPermissions: [{ module: 'coach', action: 'view-listing' }],
          subItems: [
            { noPaddingx: true, title: "Coach profile", link: '/configuration/coach-pro/profile', needPermissions: [{ module: 'coach', action: 'view-listing' }] },
            { noPaddingx: true, title: "Contract", link: '/configuration/coach-pro/contracts', needPermissions: [{ module: 'contract', action: 'view-listing' }] },
            { noPaddingx: true, title: "Music", link: "/configuration/coach-pro/music", needPermissions: [{ module: 'music-player', action: 'view-listing' }] },
            { noPaddingx: true, title: "Courses", link: '/configuration/coach-pro/courses', needPermissions: [{ module: 'course', action: 'view-listing' }] },
            { noPaddingx: true, title: "Issues list", link: "/configuration/coach-pro/issue-list" },
            { noPaddingx: true, title: "Referrals", link: "/configuration/coach-pro/referrals" },
            { noPaddingx: true, title: "Student Courses", link: "/configuration/coach-pro/student", needPermissions: [{ module: 'student-course', action: 'view-listing' }] },
          ],
        },
      ],
    },
  ];

  let menuItems = [];
  menuItemsRaw.forEach(menuItem => {
    let isMenuGranted = !menuItem.needPermissions;
    if (!isMenuGranted) {
      menuItem.needPermissions.forEach(permission => {
        if (checkPermission(permission)) isMenuGranted = true;
      });
    }
    if (isMenuGranted && menuItem.subItems?.length) {
      let validSubs = [];
      menuItem.subItems.forEach(sub => {
        let isSubGranted = !sub.needPermissions;
        let isChildPermissionGranted = false;
        if (!isSubGranted) {
          sub.needPermissions.forEach(permission => {
            if (checkPermission(permission)) isSubGranted = true;
          });
        }
        if (sub.subItems?.length) {
          let validChildren = [];
          sub.subItems.forEach(child => {
            let isChildGranted = !child.needPermissions;
            if (!isChildGranted) {
              child.needPermissions.forEach(permission => {
                if (checkPermission(permission)) isChildGranted = true;
              });
            }
            if (isChildGranted) { validChildren.push(child); isChildPermissionGranted = true; }
          });
          sub.subItems = validChildren;
        }
        if (isSubGranted || isChildPermissionGranted) validSubs.push(sub);
      });
      menuItem.subItems = validSubs;
    }
    if (isMenuGranted) menuItems.push(menuItem);
  });

  const toggleDropdown = (title) => {
    localStorage.removeItem("openClassIndex");
    localStorage.removeItem("openTerms");
    localStorage.removeItem("activeTab");
    setHistoryActiveTab('General');
    clearRegisteredData();
    setOpenDropdowns((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const removeLocalstorage = () => {
    localStorage.removeItem("openClassIndex");
    localStorage.removeItem("openTerms");
    localStorage.removeItem("activeTab");
    setHistoryActiveTab('General');
    clearRegisteredData();
  };

  const toggleSidebarCollapse = () => setIsSidebarCollapsed(prev => !prev);

  // Icon mapping for sidebar items using emoji/SVG fallbacks
  const getMenuIcon = (title) => {
    const icons = {
      'Dashboard': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      'Weekly Classes': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      'One To One': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      'Holiday Camps': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      'Birthday parties': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
      'Club': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      'Merchandise': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
      'Email management': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      'Surveys': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      'Email marketing': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      'Recruitment': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      'Reports': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      'Marketing reports': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      'Key Information': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      'Permission': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      'Administration': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
      'Templates': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      'Configuration': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      ),
    };
    return icons[title] || (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  };

  const renderMenuItems = (items, level = 0) => {
    return (
      <ul className={`${level === 0 ? 'py-2' : ''} space-y-0.5`}>
        {items.map((item) => {
          const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
          const hasInnerSubItems = Array.isArray(item.innerSubItems) && item.innerSubItems.length > 0;
          const itemTitle = typeof item === 'string' ? item : item.title;

          const isActive = item.path
            ? item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            : false;

          const isSubActive = item.link && activeTab === item.link;

          // Top-level item
          if (level === 0) {
            const content = (
              <div
                onMouseEnter={() => setHoveredItem(itemTitle)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => {
                  if (searchQuery) { setSearchQuery(""); clearRegisteredData(); }
                  if (hasSubItems || hasInnerSubItems) {
                    toggleDropdown(itemTitle);
                  } else {
                    setActiveTab(item.link);
                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                  }
                }}
                className={`
                  flex items-center justify-between cursor-pointer mx-2 px-3.5 py-3.5 rounded-lg
                  transition-all duration-150
                  ${isItemActive(item) || isActive
                    ? 'bg-[#237FEA] text-white'
                    : 'text-[#9CA3AF] hover:bg-[#237FEA] hover:text-white'
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex-shrink-0 ${isItemActive(item) || isActive ? 'text-white' : 'text-[#6B7280]'}`}>
                    {getMenuIcon(itemTitle)}
                  </span>
                  {!isSidebarCollapsed && (
                    <span className={`text-[18px] ${isItemActive(item) || isActive ? 'text-white':' text-[#BFBCC8]'} font-semibold leading-tight`}>{itemTitle}</span>
                  )}
                </span>
                {!isSidebarCollapsed && (hasSubItems || hasInnerSubItems) && (
                  openDropdowns[itemTitle]
                    ? <ChevronUp size={16} className="flex-shrink-0 opacity-70" />
                    : <ChevronDown size={16} className="flex-shrink-0 opacity-70" />
                )}
              </div>
            );

            return (
              <li key={itemTitle} onClick={removeLocalstorage}>
                {item.link ? (
                  <Link to={item.link} onClick={() => { if (searchQuery) setSearchQuery(""); clearRegisteredData(); }}>
                    {content}
                  </Link>
                ) : content}

                <AnimatePresence initial={false}>
                  {(hasSubItems || hasInnerSubItems) && openDropdowns[itemTitle] && (
                    // Level 1 - change the motion div wrapper
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
<div className="relative ml-[30px] before:absolute before:left-[-1px] before:top-0 before:h-[93%] before:border-l before:border-dotted before:border-[#2D3748]">                        {hasSubItems && renderMenuItems(item.subItems, level + 1)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          }

          // Sub-item (level 1)
          if (level === 1) {
            const hasChildren = Array.isArray(item.subItems) && item.subItems.length > 0;
            const subContent = (
              // Level 1 sub-item div - replace completely
              <div
                onClick={() => {
                  if (searchQuery) { setSearchQuery(""); clearRegisteredData(); }
                  if (hasChildren) {
                    toggleDropdown(itemTitle);
                  } else {
                    setActiveTab(item.link);
                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                  }
                }}
                className={`
    flex items-center gap-2 cursor-pointer pr-4 py-2
    transition-all duration-150
    ${isSubActive
                    ? 'text-[#3B82F6] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                  }
  `}
              >
                {/* Dot sitting ON the vertical line */}
                <span className={`
    w-2 h-2 rounded-full flex-shrink-0 -ml-[5px]
    border-2
    ${isSubActive
                    ? 'bg-[#3B82F6] border-[#3B82F6]'
                    : 'bg-[#273054] border-[#273054]'
                  }
  `} />
                <span className={`
    w-3  rounded-full flex-shrink-0 -ml-[5px]
    border-b-1 border-dotted
    ${isSubActive
                    ? 'bg-[#3B82F6] border-[#3B82F6]'
                    : 'bg-[#0C153B] border-[#4B5563]'
                  }
  `} />

                {/* Text right next to dot */}
                <span className="text-[16px] pl-[5px] text-[#BFBCC8] font-medium">{itemTitle}</span>

                {hasChildren && (
                  <span className="ml-auto">
                    {openDropdowns[itemTitle]
                      ? <img src="/images/icons/minus.png" className="w-3.5 h-3.5" alt="collapse" />
                      : <img src="/images/icons/add.png" className="w-3.5 h-3.5" alt="expand" />
                    }
                  </span>
                )}
              </div>
            );

            return (
              <li key={itemTitle} onClick={removeLocalstorage}>
                {item.link && item.link !== '#' ? (
                  <Link to={item.link} onClick={() => { if (searchQuery) setSearchQuery(""); clearRegisteredData(); }}>
                    {subContent}
                  </Link>
                ) : subContent}

                <AnimatePresence initial={false}>
                  {hasChildren && openDropdowns[itemTitle] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {renderMenuItems(item.subItems, level + 1)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          }

          // Level 2 (deep nested)
          return (
            <li key={itemTitle} onClick={removeLocalstorage}>
              {item.link ? (
                <Link
                  to={item.link}
                  onClick={() => {
                    setActiveTab(item.link);
                    if (searchQuery) setSearchQuery("");
                    clearRegisteredData();
                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                  }}
                  className={`block pl-14 pr-4 py-1.5 text-[12px] font-medium transition-all duration-150
                    ${activeTab === item.link ? 'text-[#3B82F6]' : 'text-[#6B7280] hover:text-white'}
                  `}
                >
                  {itemTitle}
                </Link>
              ) : (
                <span className="block pl-14 pr-4 py-1.5 text-[12px] text-[#6B7280]">{itemTitle}</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center justify-between px-4 py-5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
        {!isSidebarCollapsed && (
          <img
            src="/images/synco-text-logo.png"
            alt="Synco"
            className="h-9 w-auto object-contain brightness-0 invert"
          />
        )}
        <button
          onClick={toggleSidebarCollapse}
          className="p-1.5 rounded-md text-[#6B7280] hover:text-white hover:bg-[#1E293B] transition-all"
        >
          {isSidebarCollapsed ? <Menu size={18} /> : <ChevronDown size={18} className="rotate-90" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374151] scrollbar-track-transparent pb-6">
        {renderMenuItems(menuItems)}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
            <motion.aside
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 w-64 h-full z-50 lg:hidden flex flex-col"
              style={{ backgroundColor: '#111827' }}
            >
              <div className="flex items-center justify-between px-4 py-5">
                <img
                  src="/images/synco-text-logo.png"
                  alt="Synco"
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-[#6B7280] hover:text-white hover:bg-[#1E293B] transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374151] scrollbar-track-transparent pb-6">
                {renderMenuItems(menuItems)}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
        style={{ backgroundColor: '#0C153B' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;