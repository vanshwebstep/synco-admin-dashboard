import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import HeaderBanner from '../Pages/AdminPages/HeaderBanner';
import { useAccountsInfo } from '../Pages/AdminPages/contexts/AccountsInfoContext';



const AdminLayout = ({ children }) => {

  const { historyActiveTab } = useAccountsInfo();
  const routeTitleMap = {
    '/': { title: 'Dashboard', icon: "/members/Category.png" },
    '/admin-forgotpassword': { title: 'One to One', icon: "/members/Category.png" },
    '/merchandise': { title: 'Merchandise', icon: "/members/Category.png" },
    '/email-management': { title: 'Email Management', icon: "/members/Category.png" },
    '/recruitment-reports': { title: 'Recruitment Reports', icon: "/members/Category.png" },
    '/templates': { title: 'Templates', icon: "/members/Category.png" },
    '/synco-chat': { title: 'Synco Chat', icon: "/members/Category.png" },
    '/members/s': { title: 'Admin Panel', icon: "/members/Category.png" },
    '/configuration/weekly-classes/subscription-planManager': { title: 'Subscription Plan Manager', icon: "/images/icons/subscriptionplanIcon.png" },
    '/weekly-classes/add-subscription-plan-group': { title: 'Subscription Plan Manager', icon: "/images/icons/subscriptionplanIcon.png" },
    '/holiday-camps/discounts/list': { title: 'Discounts', icon: "/images/icons/subscriptionplanIcon.png" },
    '/notification': { title: 'Notifications', icon: '/members/Notification.png' },
    '/configuration/weekly-classes/term-dates/list': { title: 'Term Dates & Session Plan Mapping', icon: '/members/termCondition.png' },
    '/weekly-classes/term-dates/Create': { title: 'Term Dates & Session Plan Mapping', icon: '/members/termCondition.png' },
    '/configuration/weekly-classes/venues/class-schedule': { title: 'Class Schedule ', icon: '/members/classSchedule.png' },
    '/configuration/weekly-classes/session-plan-list': { title: 'Session Plan Library ', icon: '/members/Document.png' },
    '/configuration/weekly-classes/session-plan-preview': { title: 'Session Plan Library ', icon: '/members/Document.png' },
    '/configuration/weekly-classes/session-plan-create': { title: 'Session Plan Library ', icon: '/members/Document.png' },
    '/configuration/weekly-classes/venues': { title: 'Venues', icon: '/members/Location.png' },
    '/weekly-classes/find-a-class': { title: 'Find a Class', icon: '/members/FindClass.png' },
    '/weekly-classes/find-a-class/book-a-free-trial': { title: 'Book a FREE Trial', icon: '/members/Buy.png' },
    '/weekly-classes/trial/list': { title: 'Trialists', icon: '' },
    '/weekly-classes/all-members/list': { title: 'All Members', icon: '/members/allMembers.png' },
    '/weekly-classes/find-a-class/book-a-membership': { title: 'Book a Membership', icon: '/members/bookMembership.png' },
    '/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list': { title: 'Account Information', icon: '/members/Profile.png' },
    '/weekly-classes/all-members/membership-sales': { title: 'Membership Sales', icon: '/members/Profile.png' },
    '/weekly-classes/find-a-class/add-to-waiting-list': { title: 'Add to Waiting List', icon: '/members/waiting.png' },
    '/weekly-classes/find-a-class/add-to-waiting-list/list': { title: ' Waiting List', icon: '/members/waiting.png' },
    '/weekly-classes/capacity': { title: 'Capacity', icon: '/members/Capacity.png' },
    '/weekly-classes/cancellation': { title: 'Cancellations', icon: '/members/Cancellations.png' },
    '/weekly-classes/all-members/account-info': { title: 'Account Information', icon: '/members/Profile.png' },
    '/permission': { title: 'Permissions', icon: '/members/Profile.png' },
    '/members/List': { title: 'Admin Panel', icon: '/members/Category.png' },
    '/members/update': { title: 'Admin Panel', icon: '/members/Category.png' },
    '/KeyInfomation': { title: 'Key Information', icon: '/members/Category.png' },
    '/weekly-classes/cancellation/account-info/list': { title: 'Account Information', icon: '/members/Profile.png' },
    '/weekly-classes/term-dates/create': { title: 'Term Dates & Session Plan Mapping', icon: '/members/termCondition.png' },
    '/weekly-classes/account-information': { title: 'Account Information', icon: '/members/Profile.png' },
    '/weekly-classes/members-info': { title: 'Account Information', icon: '/members/Profile.png' },
    '/weekly-classes/cancellation/account-info/': { title: 'Account Information', icon: '/members/Profile.png' },
    '/weekly-classes/add-to-waiting-list': { title: 'Account Information', icon: '/members/Profile.png' },
    '/one-to-one': { title: 'One to One ', icon: '/members/Profile.png' },
    '/one-to-one/reports': { title: 'One to One Reports', icon: '/members/Profile.png' },
    '/one-to-one?tab=Leads': { title: 'One to One Leads', icon: '/members/Profile.png' },
    '/one-to-one?tab=Sales': { title: 'One to One Sales', icon: '/members/Profile.png' },
    '/reports/members': { title: 'Members ', icon: '/reportsIcons/report.png' },
    '/reports/trials': { title: 'Trials and conversions ', icon: '/reportsIcons/report.png' },
    '/reports/sales': { title: 'Sales', icon: '/reportsIcons/report.png' },
    '/reports/class-capacity': { title: 'Class Capacity', icon: '/reportsIcons/report.png' },
    '/reports/attendance': { title: 'Student Attendance', icon: '/reportsIcons/report.png' },
    '/reports/cancellations': { title: 'Cancellations', icon: '/reportsIcons/report.png' },
    '/reports/weekly-classes': { title: 'Parent Feedback', icon: '/reportsIcons/report.png' },
    '/one-to-one/session-plan-preview': { title: 'One to One Session Plans  ', icon: '/members/Document.png' },
    '/one-to-one/session-plan': { title: 'One to One Session Plans  ', icon: '/members/Document.png' },
    '/weekly-classes/central-leads': { title: 'Lead Database', icon: '/members/leadsicon.png' },
    '/weekly-classes/central-leads/create': { title: 'Add a New Lead', icon: '/members/leadsicon.png' },
    '/weekly-classes/central-leads/accont-info': { title: 'Account information', icon: '/members/Profile.png' },
    '/birthday-party/session-plan': { title: 'Birthday Party Session Plans  ', icon: '/members/Document.png' },
    '/birthday-party/leads': { title: 'Birthday Party ', icon: '/members/BirthdayIcon.png' },
    '/birthday-party/reports': { title: 'Birthday Party Reports ', icon: '/members/BirthdayIcon.png' },
    '/one-to-one/leads/booking-form': { title: 'Book a One to One Package ', icon: '/members/bookMembership.png' },
    '/one-to-one/sales/account-information': { title: 'Account Information', icon: '/members/Profile.png' },
    '/birthday-party/leads/booking-form': { title: 'Book a Birthday Party ', icon: '/members/BirthdayIcon.png' },
    '/birthday-party/sales/account-information': { title: 'Account Information', icon: '/members/Profile.png' },
    '/holiday-camp/reports': { title: 'Holiday Camps Report', icon: '/members/Profile.png' },

    '/configuration/holiday-camp/venues': { title: 'Holiday Camp Venues ', icon: '/members/Location.png' },
    '/configuration/holiday-camp/venues/class-schedule': { title: 'Class Schedule', icon: '/members/classSchedule.png' },
    '/configuration/holiday-camp/terms': { title: 'Holiday Camp Dates & Session Plan Mapping', icon: '/members/termCondition.png' },
    '/configuration/holiday-camp/session-plan': { title: 'Session Plan Library', icon: '/members/Document.png' },
    '/configuration/holiday-camp/subscription-plan-group': { title: 'Payment Plan Manager', icon: '/images/icons/subscriptionplanIcon.png' },
    '/configuration/holiday-camp/discount': { title: 'Discounts', icon: '/images/icons/subscriptionplanIcon.png' },
    '/holiday-camp/find-a-camp': { title: 'Find a Holiday Camp', icon: '/members/FindClass.png' },
    '/holiday-camp/find-a-camp/book-camp': { title: 'Book a Holiday Camp', icon: '/members/bookMembership.png' },
    '/templates/create': { title: 'Communication Templates', icon: "/members/Notification.png" },
    '/templates/list': { title: 'Text/Email Communications', icon: "/members/Notification.png" },
    '/templates/settingList': { title: 'Communication Templates', icon: "/members/Notification.png" },
    '/administration/file-manager': { title: 'Folders/Assets', icon: "/members/Category.png" },
    '/recruitment/lead': { title: 'Recruitment', icon: "/members/recruitment.png" },
    '/administration/to-do-list': { title: 'To-do List', icon: "/members/Category.png" },
    '/recruitment/franchise-lead': { title: 'Recruitment', icon: "/members/Category.png" },
    '/recruitment/reports': { title: 'Recruitment Report', icon: "/members/Category.png" },
    '/holiday-camp/members': { title: 'Holiday Camp Students', icon: "/members/Category.png" },
    '/holiday-camp/members/account-information': { title: 'Account Information', icon: "/members/Category.png" },
    // '/recruitment/franchise-lead': { title: 'Franchise Applications' , icon: "/members/Discovery.png"},
    '/recruitment/franchise-lead/see-details': { title: 'Franchise' , icon: "/members/Discovery.png"  },
    '/configuration/coach-pro/music': { title: 'Samba Music' , icon: "/members/Category.png"  },

  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const [profileOpen, setProfileOpen] = useState(false);


  const location = useLocation();
  const fullPath = location.pathname + location.search;

  // find best match
  let routeInfo =
    Object.entries(routeTitleMap)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([route]) => fullPath.startsWith(route))?.[1]
    || { title: 'Admin Panel', icon: '/members/Category.png' };

  // 🔥 override if historyActiveTab condition is met
  if (historyActiveTab === "History Of Payments") {
    routeInfo = {
      title: "History Payments",
      icon: '/images/icons/Wallet.png'
    };
  }

  const { title, icon: Icon } = routeInfo;
  return (
    <div className="mainLayout flex overflow-hidden max-h-[100vh] overflow-y-auto">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 w-full flex flex-col px-6 bg-gray-50 md:w-10/12 fixerhe">
        <Header
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="overflow-y-auto scrollbar-hide" id='scrollable-content'>
          {!['/', '/holiday-camps/discounts/create'].includes(location.pathname) && (
            <HeaderBanner title={title} icon={Icon} />
          )}

          <main className="flex-1  py-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
