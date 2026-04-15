import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronUp, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { usePermission } from "../Pages/AdminPages/Common/permission";
import { X } from 'lucide-react'; // Add this to your imports
import { useAccountsInfo } from '../Pages/AdminPages/contexts/AccountsInfoContext';
import { useGlobalSearch } from '../Pages/AdminPages/contexts/GlobalSearchContext';

function normalizePath(path) {
  if (!path) return "";

  return path
    .split(/[?#]/)[0] // remove query/hash
    .replace(/\/+$/, "") // remove trailing slash
    // remove non-core suffixes
    .replace(
      /\/(list|lists|create|update|edit|details|view|account-info|add-to-waiting-list|book-a-free-trial|book-a-membership)(\/.*)?$/,
      ""
    );
}



// 🔁 Recursively find active item & its parents
function findActiveItemAndParents(items, currentPath, parents = []) {
  const normalizedCurrent = normalizePath(currentPath);

  for (const item of items) {
    const normalizedItemLink = normalizePath(item.link);

    // 🔹 Main logic: mark parent active if path includes its link
    if (
      normalizedItemLink &&
      normalizedCurrent.includes(normalizedItemLink)
    ) {
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
  const { searchQuery , setSearchQuery } = useGlobalSearch();
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef();
  const { checkPermission } = usePermission();
  const MyRole = localStorage.getItem("role");
  const { historyActiveTab, setHistoryActiveTab } = useAccountsInfo();
  useEffect(() => {
    const result = findActiveItemAndParents(menuItems, location.pathname);
    if (result) {
      const { item, parents } = result;
      setActiveTab(item.link);

      // Auto-expand parent dropdowns
      const expanded = {};
      parents.forEach((p) => (expanded[p.title] = true));
      setOpenDropdowns((prev) => ({ ...prev, ...expanded }));
    }
  }, [location.pathname]);
  const [activeTab, setActiveTab] = useState(null); // track active link
  const [activeItem, setActiveItem] = useState(null);
  // Helper to check if this item or any of its subItems matches the current path
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);
  const isItemActive = (item) => {

    if (item.link && activeTab === item.link) return true; // submenu or direct link
    if (item.subItems) {
      return item.subItems.some(sub => sub.link === activeTab);
    }
    return false;
  };

  // Existing menuItemsRaw logic remains unchanged
  const menuItemsRaw = [
    {
      title: 'Dashboard',
      icon: '/SidebarLogos/Dashboard.png',
      path: '/',
      iconHover: '/SidebarLogos/DashboardH.png',
      link: '/',
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
        { title: 'Waiting List', link: '/weekly-classes/find-a-class/add-to-waiting-list/list', needPermissions: [{ module: 'waiting-list', action: 'view-listing' }] },
        { title: 'Capacity', link: '/weekly-classes/capacity', needPermissions: [{ module: 'capacity', action: 'view-listing' }] },
        { title: 'Account Information', link: '/weekly-classes/members-info', needPermissions: [{ module: 'account-information', action: 'view-listing' }] },
        {
          title: "Leads Database",
          link: '/weekly-classes/central-leads',
          needPermissions: [
            { module: "venue", action: "view-listing" },
            { module: "term-group", action: "view-listing" },
            { module: "session-plan-group", action: "view-listing" },
            { module: "payment-group", action: "view-listing" },
          ],
        }
      ]
    },
    {
      title: "One To One",
      icon: "/reportsIcons/user.png",
      path: '/one-to-one',
      iconHover: "/reportsIcons/userH.png",
      needPermissions: [{ module: 'one-to-one-lead', action: 'view-listing' },
      { module: 'session-exercise-one-to-one', action: 'view-listing' },
      ],
      subItems: [
        {
          title: "Sales",
          link: '/one-to-one',
          needPermissions: [
            { module: "venue", action: "view-listing" },
            { module: "term-group", action: "view-listing" }
          ],
        },
        {
          title: "Session plan Structure",
          link: '/one-to-one/session-plan',
          needPermissions: [
            { module: "session-exercise-one-to-one", action: "view-listing" }
          ],
        },
        {
          title: "Reports",
          link: '/one-to-one/reports',
          needPermissions: [
            { module: 'one-to-one-lead', action: 'view-listing' },
            { module: 'session-exercise-one-to-one', action: 'view-listing' },
          ],
        }
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
        { title: 'Reports', link: '/holiday-camp/reports', needPermissions: [{ module: 'holiday-find-class', action: 'view-listing' }, { module: 'holiday-booking', action: 'view-listing' }] },

      ]
    },



    {
      title: "Birthday parties",
      icon: "/SidebarLogos/Birthday.png",
      path: '/birthday-party',
      iconHover: "/SidebarLogos/BirthdayH.png",
      needPermissions: [
        { module: "birthday-party-lead", action: "view-listing" },
        { module: "session-plan-birthdayParty", action: "view-listing" },
      ],
      subItems: [
        {
          title: "Sales",
          link: '/birthday-party/leads',
          needPermissions: [
            { module: "birthday-party-lead", action: "view-listing" }
          ],
        },
        {
          title: "Session plan Structure",
          link: '/birthday-party/session-plan',
          // needPermissions: [
          //   { module: "session-plan-birthdayParty", action: "create" }
          // ],
        },
        {
          title: "Reports",
          link: '/birthday-party/reports',
          needPermissions: [
            { module: "session-plan-birthdayParty", action: "view-listing" },
            { module: "birthday-party-lead", action: "view-listing" },
          ],
        },
      ],
    },
    {
      title: "Recruitment",
      icon: "/SidebarLogos/Birthday.png",
      path: '/recruitment',

      iconHover: "/SidebarLogos/BirthdayH.png",
      needPermissions: [
        { module: "recruitment-lead-franchise", action: "view-listing" },
        { module: "recruitment-lead", action: "view-listing" },
      ],
      subItems: [
        {
          title: "Leads Database",
          link: '/recruitment/lead',
          needPermissions: [
            { module: "recruitment-lead", action: "view-listing" }
          ],


        },
        {
          title: "Franchise Leads",
          link: '/recruitment/franchise-lead',

          needPermissions: [
            { module: "recruitment-lead-franchise", action: "view-listing" }
          ],


        },
        {
          title: "Reports",
          link: '/recruitment/reports',

          needPermissions: [
            { module: "recruitment-lead-franchise", action: "view-listing" },
            { module: "recruitment-lead", action: "view-listing" }
          ],

        },

      ],
    },
    {
      title: "Reports",
      icon: "/reportsIcons/reports.png",
      path: '/reports',
      iconHover: "/reportsIcons/camper.png",
      needPermissions: [
        { module: "reports", action: "member-report" },
        { module: "reports", action: "trial-conversion-report" },
        { module: "reports", action: "sales-report" },
        { module: "reports", action: "capacity-report" },
        { module: "reports", action: "attendance-report" },
        { module: "reports", action: "cancellation-report" },
      ],
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
      needPermissions: [
        { module: 'key-information', action: 'view-listing' },
        { module: 'key-information', action: 'create' }
      ]
    },

    ...(MyRole === 'Super Admin'
      ? [{
        title: 'Permission',
        path: '/permission',
        icon: '/SidebarLogos/Dashboard.png',
        iconHover: '/SidebarLogos/DashboardH.png',
        link: '/permission',
        needPermissions: [
          { module: 'admin-role', action: 'view-listing' },
          { module: 'admin-role', action: 'create' }
        ]
      }]
      : []),

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
        // WEEKLY CLASSES
        {
          title: "Weekly classes",
          link: "#",
          needPermissions: [
            { module: "venue", action: "view-listing" },
            { module: "term-group", action: "view-listing" },
            { module: "session-plan-group", action: "view-listing" },
            { module: "payment-group", action: "view-listing" },
          ],
          subItems: [
            {
              noPaddingx: true,
              title: "Venues",
              link: "/configuration/weekly-classes/venues",
              needPermissions: [{ module: 'venue', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Term Dates & Mapping",
              link: "/configuration/weekly-classes/term-dates/list",
              needPermissions: [{ module: 'term-group', action: 'view-listing' }]

            },
            {
              noPaddingx: true,
              title: "Session Plan Library",
              link: "/configuration/weekly-classes/session-plan-list",
              needPermissions: [{ module: 'session-plan-group', action: 'view-listing' }]

            },
            {
              noPaddingx: true,
              title: "Subscription Plan Manager",
              link: "/configuration/weekly-classes/subscription-planManager",
              needPermissions: [{ module: 'payment-group', action: 'view-listing' }]

            },
            {
              noPaddingx: true,
              title: "Starter Pack",
              link: "/configuration/weekly-classes/starter-pack",
              needPermissions: [{ module: 'payment-group', action: 'view-listing' }]
            },
          ],
        },

        // HOLIDAY CAMPS
        {
          title: "Holiday camps",
          link: "#",
          needPermissions: [
            { module: "holiday-session-plan-group", action: "view-listing" },
            { module: "holiday-termGroup-create", action: "create" },
            { module: "holiday-payment-plan", action: "view-listing" },
            { module: "holiday-payment-group", action: "view-listing" },
            { module: "holiday-venue", action: "view-listing" },
            { module: "discount", action: "view-listing" },
          ],
          subItems: [

            {
              noPaddingx: true,
              title: "Add a venue",
              link: '/configuration/holiday-camp/venues',
              needPermissions: [{ module: 'holiday-venue', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Dates",
              link: '/configuration/holiday-camp/terms/list',
              needPermissions: [{ module: 'holiday-termGroup-create', action: 'create' }]
            },
            {
              noPaddingx: true,
              title: "Session Plans",
              link: '/configuration/holiday-camp/session-plan/list',
              needPermissions: [{ module: 'holiday-session-plan-group', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Payment Plan Manager",
              link: "/configuration/holiday-camp/subscription-plan-group",
              needPermissions: [
                { module: 'holiday-payment-plan', action: 'view-listing' },
                { module: 'holiday-payment-group', action: 'view-listing' }
              ]

            },

            {
              noPaddingx: true,
              title: "Discounts",
              link: "/configuration/holiday-camp/discount/list",
              needPermissions: [{ module: 'discount', action: 'view-listing' }]
            },
          ],
        },
        {
          title: "Coach pro",
          link: "#",
          needPermissions: [
            { module: "coach", action: "view-listing" },
            { module: "contract", action: "view-listing" },
            { module: "music-player", action: "view-listing" },
            { module: "course", action: "view-listing" },
            { module: "student-course", action: "view-listing" },
          ],
          subItems: [
            {
              noPaddingx: true,
              title: "Coach profile",
              link: '/configuration/coach-pro/profile',
              needPermissions: [{ module: 'coach', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Contract",
              link: '/configuration/coach-pro/contracts',
              needPermissions: [{ module: 'contract', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Music",
              link: "/configuration/coach-pro/music",
              needPermissions: [{ module: 'music-player', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Courses",
              link: '/configuration/coach-pro/courses',
              needPermissions: [{ module: 'course', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Issues list",
              link: "/configuration/coach-pro/issue-list",
              // needPermissions: [{ module: 'course', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Referrals",
              link: "/configuration/coach-pro/referrals",
              // needPermissions: [{ module: 'course', action: 'view-listing' }]
            },
            {
              noPaddingx: true,
              title: "Student Courses",
              link: "/configuration/coach-pro/student",
              needPermissions: [{ module: 'student-course', action: 'view-listing' }]
            },
          ],
        },
      ],
    },

  ];


  let menuItems = [];
  // ... permission filtering logic remains unchanged ...
  menuItemsRaw.forEach(menuItem => {
    // console.log("Checking Menu Item:", menuItem.title);

    let isMenuGranted = false;


    if (!menuItem.needPermissions) {
      // console.log("-> No permissions needed for this menu.");
      isMenuGranted = true;
    } else {
      // console.log(`-> Checkings required permissions for this menu (${menuItem.title})...`);
      menuItem.needPermissions.forEach(permission => {
        if (checkPermission(permission)) {
          // console.log(`--> Permission denied:`, permission);
          isMenuGranted = true;
        } else {
          // console.log(`--> Permission denied:`, permission);
        }
      });
    }

    // Step 2: If main menu is allowed, check sub-items
    if (isMenuGranted && menuItem.subItems && menuItem.subItems.length) {
      // console.log("-> Checking sub-items...");
      let validSubs = [];

      menuItem.subItems.forEach(sub => {
        // console.log("   Checking Sub-Item:", sub.title);

        let isSubGranted = false;
        let isChildPermissionGranted = false;

        // Step 2.1: Check permissions for sub-item
        if (!sub.needPermissions) {
          // console.log("   -> No permissions needed for this sub-item.");
          isSubGranted = true;
        } else {
          // console.log(`   -> Checking required permissions for this sub-item (${sub.title})...`);
          sub.needPermissions.forEach(permission => {
            if (checkPermission(permission)) {
              // console.log(`   --> Sub-item permission granted: ${permission}`);
              isSubGranted = true;
            } else {
              // console.log(`   --> Sub-item permission denied: ${permission}`);
            }
          });
        }

        // Step 2.2: Check children of sub-item
        if (sub.subItems && sub.subItems.length) {
          // console.log("   -> Checking children of sub-item...");
          let validChildren = [];

          sub.subItems.forEach(child => {
            // console.log("      Checking Child Item:", child.title);

            let isChildGranted = false;

            if (!child.needPermissions) {
              // console.log("      -> No permissions needed for this child.");
              isChildGranted = true;
            } else {
              // console.log("      -> Checking required permissions for this child...");
              child.needPermissions.forEach(permission => {
                if (checkPermission(permission)) {
                  // console.log(`      --> Child permission granted: ${permission}`);
                  isChildGranted = true;
                } else {
                  // console.log(`      --> Child permission denied: ${permission}`);
                }
              });
            }

            if (isChildGranted) {
              // console.log("      => Child granted access and added.");
              validChildren.push(child);
              isChildPermissionGranted = true;
            } else {
              // console.log("      => Child denied access and skipped.");
            }
          });

          sub.subItems = validChildren;
        }

        // Step 2.3: Decide if sub-item should be added
        if (isSubGranted || isChildPermissionGranted) {
          // console.log("   => Sub-item granted access and added.");
          validSubs.push(sub);
        } else {
          // console.log("   => Sub-item denied access and skipped.");
        }
      });

      menuItem.subItems = validSubs;
    }

    // Step 3: Add the menu item if granted or if any sub-items remain
    if (isMenuGranted) {
      // console.log(`=> (${menuItem.title}) Menu item granted access and added to final list.\n`);
      menuItems.push(menuItem);
    } else {
      // console.log("=> Menu item denied access and skipped.\n");
    }
  });

  const toggleDropdown = (title) => {
    localStorage.removeItem("openClassIndex");
    localStorage.removeItem("openTerms");
    localStorage.removeItem("activeTab");
    setHistoryActiveTab('General');
    setOpenDropdowns((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const removeLocalstorage = () => {
    localStorage.removeItem("openClassIndex");
    localStorage.removeItem("openTerms");
    localStorage.removeItem("activeTab");
    setHistoryActiveTab('General');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const renderMenuItems = (items, level = 0) => {


    return (
      <ul
        className={`
        ${level === 0 ? 'px-4 py-10 lg:px-1' : ' innersub'} 
        ${level == 2 ? 'md:list-disc pl-6 lg:pl-6 ' : ''} 
        ${level == 1 ? 'md:list-disc pl-6 lg:pl-13 pr-4 level1Dropdown' : ''} 
        
        space-y-1
      `}
      >
        {items.map((item) => {
          const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
          const hasInnerSubItems = Array.isArray(item.innerSubItems) && item.innerSubItems.length > 0;
          function hasNoPadding(subItems) {
            if (!subItems || !subItems.length) return false;

            return subItems.some(sub => sub.noPaddingx || hasNoPadding(sub.subItems));
          }

          // Usage for top-level item
          const noPaddingx = hasNoPadding(item.subItems);
          // true if any inner subItem has noPaddingx

          // const noPaddingx =item.subItems.noPaddingx;
          const itemTitle = typeof item === 'string' ? item : item.title;

          const isActiveTitle = true;


          const isActive = item.path
            ? item.path === '/'
              ? location.pathname === '/' // exact match for dashboard
              : location.pathname.startsWith(item.path) // include match for other routes
            : false;
          const content = (
            <motion.div
              initial={false}
             onClick={() => {
  // ✅ Reset only if search has value
  if (searchQuery) {
    setSearchQuery("");
  }

  if (hasSubItems || hasInnerSubItems) {
    toggleDropdown(itemTitle);
  } else {
    setActiveTab(item.link);
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  }
}}
              onMouseEnter={() => setHoveredItem(itemTitle)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center subitems justify-between font-semibold cursor-pointer 
    md:px-3 sm:px-4 lg:px-4 ${noPaddingx ? 'px-0' : 'md:px-3 sm:px-4 lg:px-4'} py-1.5 sm:py-2 rounded-lg ${isActiveTitle && isActive ? 'bg-blue-500 text-white' : 'bg-[#FDFDFF] '}  transition-all duration-100
    ${level === 0
                  ? isItemActive(item)
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-500 hover:text-white text-black'
                  : isItemActive(item)
                    ? 'text-blue-600 font-bold'
                    : 'hover:text-blue-600'
                }`}
            >
              <span className="flex items-center gap-2 sm:gap-3 lg:gap-3 text-sm sm:text-base lg:text-lg">
                {item.icon && level === 0 && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded">
                    {!isSidebarCollapsed && (
                      <motion.img
                        src={hoveredItem === itemTitle || isActive ? item.iconHover : item.icon}
                        alt={itemTitle}
                        className="w-4 h-4 sm:w-6 sm:h-6 drop-shadow-sm"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </span>
                )}
                {!isSidebarCollapsed && (
                  <span className={`font-semibold ${level === 0 ? 'text-[18px]' : 'text-[16px]'}`}>
                    {itemTitle}
                  </span>
                )}
              </span>
              {/* Right-side icons */}
              {!isSidebarCollapsed && (hasSubItems || hasInnerSubItems) && (
                <>
                  {/* Level 0 → Chevron icons */}
                  {level === 0 && (
                    openDropdowns[itemTitle]
                      ? <ChevronUp size={18} />
                      : <ChevronDown size={18} />
                  )}

                  {/* Level 1 → + / - icons */}
                  {level === 1 && hasSubItems && (
                    <span className="select-none">
                      {openDropdowns[itemTitle] ? (
                        <img
                          src="/images/icons/minus.png"
                          className="w-4 h-4 cursor-pointer"
                          alt="collapse"
                        />
                      ) : (
                        <img
                          src="/images/icons/add.png"
                          className="w-4 h-4 cursor-pointer"
                          alt="expand"
                        />
                      )}
                    </span>

                  )}
                </>
              )}

            </motion.div>
          );

          return (
            <li
              key={itemTitle}
              className="mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg "
              onClick={removeLocalstorage}
            >
            {item.link ? (
  <Link
    to={item.link}
    onClick={() => {
      if (searchQuery) setSearchQuery("");
    }}
  >
    {content}
  </Link>
) : content}

              {/* Handle subItems */}
              <AnimatePresence initial={false}>
                {(hasSubItems || hasInnerSubItems) && openDropdowns[itemTitle] && (
                  <motion.div
                    className='opend'
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {hasSubItems && renderMenuItems(item.subItems, level + 1)}

                    {/* Handle innerSubItems */}
                    {hasInnerSubItems && (
                      <ul className="pl-8 list-disc text-gray-700 space-y-1 mt-1">
                        {item.innerSubItems.map((inner, i) => (
                          <li
                            key={i}
                            className="cursor-pointer  hover:text-blue-600 transition-all text-sm"
                          >
                            {inner}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Sidebar Collapse Toggle Button */}

      <button
        className="hidden lg:flex fixed top-10 left-0 z-50 
              text-white p-2 rounded-r-md shadow-lg
             transition-all"
        onClick={toggleSidebarCollapse}
      >
        {isSidebarCollapsed ? (
          <Menu size={15} className='text-gray-700' />
        ) : (
          <Menu size={15} className='text-gray-700' />

        )}
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" />
            <motion.aside
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween' }}
              className="fixed top-0 left-0 w-72 h-full bg-white z-50 shadow-lg border-r lg:hidden flex flex-col"
            >
              <div className="p-6 relative font-semibold text-2xl text-center flex items-center gap-1 justify-center">
                <img
                  src="/images/icons/cross.png"
                  className="absolute left-[5%] w-3 h-3 cursor-pointer"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                  alt=""
                />

                <img src="/images/synco-text-logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                {/* <img src='/images/synco-text-round.png' alt="Welcome" className="h-10 w-auto object-contain" /> */}
              </div>
              <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500 px-2 pb-6">
                {renderMenuItems(menuItems)}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop- Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-lg transition-all duration-300
          ${isSidebarCollapsed ? 'w-20 opacity-0' : 'w-72'}
        `}
      >
        <div className="p-6 font-semibold text-2xl text-center flex items-center gap-0.5 justify-center">
          <img src='/images/synco-text-logo.png' alt="Logo" className={`h-15 w-auto object-contain ${isSidebarCollapsed ? 'hidden' : ''}`} />
          {/* <img src='/images/synco-text-round.png' alt="Welcome" className={`h-15 w-auto object-contain mb-0.5 animate-spin [animation-duration:4s] ${isSidebarCollapsed ? 'mx-auto hidden' : ''}`} /> */}
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-hide scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500 px-2">
          {renderMenuItems(menuItems)}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;



//  {
//       title: 'Holiday Camps',
//       path: '/holiday-camps',
//       icon: '/SidebarLogos/Holiday.png',
//       iconHover: '/SidebarLogos/HolidayH.png',
//       needPermissions: [
//         { module: 'discount', action: 'view-listing' },
//         { module: 'discount', action: 'create' }
//       ],
//       subItems: [
//         { title: 'Discounts', link: '/holiday-camps/discounts/list', needPermissions: [{ module: 'discount', action: 'view-listing' }, { module: 'discount', action: 'create' }] }
//       ]
//     },