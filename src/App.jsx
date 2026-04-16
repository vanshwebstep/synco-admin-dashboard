// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';
import { HolidayPaymentPlanContextProvider } from './Components/Pages/AdminPages/contexts/HolidayPaymentContext.jsx';
import { HolidayVenueProvider } from './Components/Pages/AdminPages/contexts/HolidayVenueContext.jsx';
import { HolidayClassScheduleProvider } from './Components/Pages/AdminPages/contexts/HolidayClassScheduleContext.jsx';

import AdminLogin from './Components/AdminLogin.jsx';
import ResetPassword from './Components/ResetPassword.jsx';
import ForgotPassword from './Components/ForgotPassword.jsx';
import AdminLayout from './Components/Layout/AdminLayout.jsx';
import PermissionProtectedRoute from './PermissionProtectedRoute.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import Unauthorized from './Components/Unauthorized.jsx';
import Test from './Test.jsx';
import { renderProtectedRoute } from "./RenderProtectedRoute";
import HolidayAddtoWaitingList from './Components/Pages/AdminPages/holiday-camps/add-to-waiting-list/AddtoWaitingList.jsx';

// Import all your pages
import Dashboard from './Components/Pages/Dashboard.jsx';
import MemberList from './Components/Pages/AdminPages/members/List.jsx';
import Update from './Components/Pages/AdminPages/members/Update.jsx';
import SubscriptionPlanManagerList from './Components/Pages/AdminPages/configuration/weekly-classes/subscription-plan-manager/SubscriptionPlanManager.jsx';
import AddMembershipPlanGroup from './Components/Pages/AdminPages/configuration/weekly-classes/subscription-plan-manager/AddMembershipPlanGroup.jsx';
import DiscountsList from './Components/Pages/AdminPages/discounts/List.jsx';
import DiscountCreate from './Components/Pages/AdminPages/discounts/Create.jsx';
import Notification from './Components/Pages/AdminPages/notification/Notification.jsx';
import NotificationList from './Components/Pages/AdminPages/notification/NotificationList.jsx';
import List from './Components/Pages/AdminPages/configuration/weekly-classes/venus/List.jsx';
import FindAClass from './Components/Pages/AdminPages/weekly-classes/find-a-class/List.jsx';
import BookFreeTrial from './Components/Pages/AdminPages/weekly-classes/find-a-class/book-a-free-trial/list.jsx'
import BookMembership from './Components/Pages/AdminPages/weekly-classes/find-a-class/Book a Membership/list.jsx'
import ClassSchedule from './Components/Pages/AdminPages/configuration/weekly-classes/venus/class-schedule/List.jsx';
import Pending from './Components/Pages/AdminPages/configuration/weekly-classes/venus/class-schedule/view-session/pending.jsx';
import Completed from './Components/Pages/AdminPages/configuration/weekly-classes/venus/class-schedule/view-session/completed.jsx';
import Cancel from './Components/Pages/AdminPages/configuration/weekly-classes/venus/class-schedule/view-session/cancel.jsx';
import TermDateList from './Components/Pages/AdminPages/configuration/weekly-classes/term-and-condition/List.jsx';
import TermDateCreate from './Components/Pages/AdminPages/configuration/weekly-classes/term-and-condition/Create.jsx';
import TermDateUpdate from './Components/Pages/AdminPages/configuration/weekly-classes/term-and-condition/Update.jsx';
import SessionPlanList from './Components/Pages/AdminPages/configuration/weekly-classes/session-plan-library/list.jsx';
import SessionPlanCreate from './Components/Pages/AdminPages/configuration/weekly-classes/session-plan-library/Create.jsx';
import SessionPlanPreview from './Components/Pages/AdminPages/configuration/weekly-classes/session-plan-library/Preview.jsx';
import TrialLists from './Components/Pages/AdminPages/weekly-classes/Trials/List.jsx';
import AddMembers from './Components/Pages/AdminPages/weekly-classes/all-members/List.jsx';
import MembershipSales from './Components/Pages/AdminPages/weekly-classes/all-members/membershipSales.jsx';
import AccountInformation from './Components/Pages/AdminPages/weekly-classes/find-a-class/book-a-free-trial/account-information-book-free-trial/list.jsx';
import PermissionRole from './Components/Pages/AdminPages/Permissions/list.jsx';
// import { AccountInformationMembership } from './Components/Pages/AdminPages/configuration/weekly-classes/all-members/Account Information Book Membership/List.jsx';
import FileManager from './Components/Pages/AdminPages/Administration/folder/FileManager.jsx';


// Import all context providers
import { MemberProvider } from './Components/Pages/AdminPages/contexts/MemberContext.jsx';
import { PaymentPlanContextProvider } from './Components/Pages/AdminPages/contexts/PaymentPlanContext.jsx';
import { DiscountContextProvider } from './Components/Pages/AdminPages/contexts/DiscountContext.jsx';
import { SessionPlanContextProvider } from './Components/Pages/AdminPages/contexts/SessionPlanContext.jsx';
import { NotificationProvider } from './Components/Pages/AdminPages/contexts/NotificationContext.jsx';
import { VenueProvider } from './Components/Pages/AdminPages/contexts/VenueContext.jsx';
import { ClassScheduleProvider } from './Components/Pages/AdminPages/contexts/ClassScheduleContent.jsx';
import { TermDatesSessionProvider } from './Components/Pages/AdminPages/contexts/TermDatesSessionContext.jsx';
import { FindClassProvider } from './Components/Pages/AdminPages/contexts/FindClassContext.jsx';
import { BookFreeTrialProvider } from './Components/Pages/AdminPages/contexts/BookAFreeTrialContext.jsx';

import './App.css';
import { PermissionProvider, usePermission } from './Components/Pages/AdminPages/Common/permission.jsx';
import AccountInfoBookMembership from './Components/Pages/AdminPages/weekly-classes/all-members/Account Information Book Membership/List.jsx';
import SeeDetails from './Components/Pages/AdminPages/weekly-classes/all-members/See Details/list.jsx';
import AddtoWaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/add-to-waiting-list/AddtoWaitingList.jsx';
import WaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/add-to-waiting-list/List.jsx';
import AccountInfoWaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/add-to-waiting-list/Account Information Waiting List/List.jsx';
import Capacity from './Components/Pages/AdminPages/weekly-classes/Capacity/List.jsx';
import CancellationList from './Components/Pages/AdminPages/weekly-classes/Cancellation/list.jsx';
import AccountInfoCancellation from './Components/Pages/AdminPages/weekly-classes/Cancellation/account-information-cancellation/list.jsx';
import { BookFreeTrialLoaderProvider } from './Components/Pages/AdminPages/contexts/BookAFreeTrialLoaderContext.jsx';
import KeyInfomation from './Components/Pages/AdminPages/weekly-classes/Key Information/KeyInfomation.jsx';
// Define roles
import Account from './Components/Pages/AdminPages/weekly-classes/account-information/Account.jsx';
import Preview from './Components/Pages/AdminPages/configuration/weekly-classes/session-plan-library/Preview.jsx';
import MainTable from './Components/Pages/AdminPages/weekly-classes/account-information/MainTable.jsx';
import { AccountsInfoProvider } from './Components/Pages/AdminPages/contexts/AccountsInfoContext.jsx';
import SessionPlan from './Components/Pages/AdminPages/one-to-one/session-plan/SessionPlan.jsx';
import Create from './Components/Pages/AdminPages/one-to-one/session-plan/Create.jsx';
import OnetoOneUpdate from './Components/Pages/AdminPages/one-to-one/session-plan/Update.jsx';

import SessionPreview from './Components/Pages/AdminPages/one-to-one/session-plan/SessionPreview.jsx';
// import LeadsDashboard from './Components/Pages/AdminPages/one-to-one/LeadsDashboard.jsx';
// import SalesDashboard from './Components/Pages/AdminPages/one-to-one/SalesDashboard.jsx';
import BookingForm from './Components/Pages/AdminPages/one-to-one/Sales/Booking/BookingForm.jsx';
import Leads from './Components/Pages/AdminPages/one-to-one/Sales/front-pages/Leads.jsx';
import AccountMain from './Components/Pages/AdminPages/one-to-one/Sales/Info/AccountMain.jsx';
import SeeDetailsAccount from './Components/Pages/AdminPages/one-to-one/SeeDetailsAccount.jsx';
import CreateLead from './Components/Pages/AdminPages/weekly-classes/leads/CreateLead.jsx';
import Lead from './Components/Pages/AdminPages/weekly-classes/leads/Lead.jsx';
import { LeadsContextProvider } from './Components/Pages/AdminPages/contexts/LeadsContext.jsx';
import AccountInfo from './Components/Pages/AdminPages/weekly-classes/leads/leadsInfo/AccountInfo.jsx';
import MembersDashboard from './Components/Pages/AdminPages/reports/MembersDashboard.jsx';
import TrialsDashboard from './Components/Pages/AdminPages/reports/TrialsDashboard.jsx';
import SaleDashboard from './Components/Pages/AdminPages/reports/SaleDashboard.jsx';
import CapacityDashboard from './Components/Pages/AdminPages/reports/CapacityDashboard.jsx';
import AttendanceDashboard from './Components/Pages/AdminPages/reports/AttendanceDashboard.jsx';
import CancellationDashboard from './Components/Pages/AdminPages/reports/CancellationDashboard.jsx';
import WeeklyDashboard from './Components/Pages/AdminPages/reports/WeeklyDashboard.jsx';
import Reports from './Components/Pages/AdminPages/one-to-one/Reports.jsx';
import BirthdaySessionPlan from './Components/Pages/AdminPages/birthday-parties/session-plan/SessionPlan.jsx';
import BirthdaySessionPreview from './Components/Pages/AdminPages/birthday-parties/session-plan/SessionPreview.jsx';
import BirthdayCreate from './Components/Pages/AdminPages/birthday-parties/session-plan/Create.jsx';
import BirthdayLeads from './Components/Pages/AdminPages/birthday-parties/Sales/front-pages/Leads.jsx';
import BirthdayBookingForm from './Components/Pages/AdminPages/birthday-parties/Sales/Booking/BookingForm.jsx';
import BirthdayUpdate from './Components/Pages/AdminPages/birthday-parties/session-plan/Update.jsx';
import BirthdayReports from './Components/Pages/AdminPages/birthday-parties/Reports.jsx';
import AccountMainBirthDay from './Components/Pages/AdminPages/birthday-parties/Sales/Info/AccountMainBirthday.jsx';
import SeeDetailsAccountBirthday from './Components/Pages/AdminPages/birthday-parties/Sales/Info/SeeDetailsAccountBirthday.jsx';
import BookACamp from './Components/Pages/AdminPages/holiday-camps/BookACamp.jsx';
import StudentCamp from './Components/Pages/AdminPages/holiday-camps/StudentCamp.jsx';
import AccountMainHoliday from './Components/Pages/AdminPages/holiday-camps/accountInfo/AccountMainHoliday.jsx';
import SeeDetailsAccountHoliday from './Components/Pages/AdminPages/holiday-camps/accountInfo/SeeDetailsAccountHoliday.jsx';
import Recruitment from './Components/Pages/AdminPages/Recruitment/Recruitment.jsx';
import CandidateDetails from './Components/Pages/AdminPages/Recruitment/applications/seeDetails/CandidateDetails.jsx';
import CandidateVenueDetails from './Components/Pages/AdminPages/Recruitment/applications/seeCandidateDetails/CandidateVenueDetails.jsx';
import ReportsMain from './Components/Pages/AdminPages/Recruitment/reports/ReportsMain.jsx';
import HolidaySessionPlan from './Components/Pages/AdminPages/configuration/holiday-camps/session-plan-library/HolidaySessionPlan.jsx';
import { HolidaySessionPlanContextProvider } from './Components/Pages/AdminPages/contexts/HolidaySessionPlanContext.jsx';
import HolidaySessionCreate from './Components/Pages/AdminPages/configuration/holiday-camps/session-plan-library/HolidaySessionCreate.jsx';
import HolidaySessionPreview from './Components/Pages/AdminPages/configuration/holiday-camps/session-plan-library/HolidaySessionPreview.jsx';
import HolidayTermList from './Components/Pages/AdminPages/configuration/holiday-camps/Term-Dates/HolidayTermList.jsx';
import HolidayTermsCreate from './Components/Pages/AdminPages/configuration/holiday-camps/Term-Dates/HolidayTermsCreate.jsx';
import { HolidayTermsProvider } from './Components/Pages/AdminPages/contexts/HolidayTermsContext.jsx';
import HolidayVenueList from './Components/Pages/AdminPages/configuration/holiday-camps/venus/HolidayVenueList.jsx';
import ClassSheduleList from './Components/Pages/AdminPages/configuration/holiday-camps/venus/class-schedule/ClassSheduleList.jsx';
import HolidayCampPending from './Components/Pages/AdminPages/configuration/holiday-camps/venus/class-schedule/view-session/HolidayCampPending.jsx';
import HolidayCampCompleted from './Components/Pages/AdminPages/configuration/holiday-camps/venus/class-schedule/view-session/HolidayCampCompleted.jsx';
import HolidayCampCancel from './Components/Pages/AdminPages/configuration/holiday-camps/venus/class-schedule/view-session/HolidayCampCancel.jsx';
import HolidaySubscriptionPlanManager from './Components/Pages/AdminPages/configuration/holiday-camps/subscription-plan-manager/HolidaySubscriptionPlanManager.jsx';
import HolidayAddPaymentPlanGroup from './Components/Pages/AdminPages/configuration/holiday-camps/subscription-plan-manager/HolidayAddPaymentPlanGroup.jsx';
import HolidayDiscountList from './Components/Pages/AdminPages/configuration/holiday-camps/discounts/HolidayDiscountList.jsx';
import HolidayDiscountCreate from './Components/Pages/AdminPages/configuration/holiday-camps/discounts/HolidayDiscountCreate.jsx';
import CampList from './Components/Pages/AdminPages/holiday-camps/CampList.jsx';
import MembersList from './Components/Pages/AdminPages/holiday-camps/MembersList.jsx';
import WaitingLists from './Components/Pages/AdminPages/holiday-camps/add-to-waiting-list/WaitingLists.jsx';
import WaitingListTab from './Components/Pages/AdminPages/holiday-camps/add-to-waiting-list/AccountInfo/WaitingListTab.jsx';
import FranchiseLeads from './Components/Pages/AdminPages/Recruitment/franchise/FranchiseLeads.jsx';
import FranchiseCandidateDetails from './Components/Pages/AdminPages/Recruitment/franchise/seeDetails/FranchiseCandidateDetails.jsx';
import TodoList from './Components/Pages/AdminPages/Administration/todo/ToDoList.jsx';
import Createtemplate from './Components/Pages/AdminPages/Templates/CreateTemplate.jsx';
import StarterPack from './Components/Pages/AdminPages/configuration/weekly-classes/starter-pack/StarterPack.jsx';

import CommunicationsList from './Components/Pages/AdminPages/Templates/ListofTemplates/list.jsx';
import SettingList from './Components/Pages/AdminPages/Templates/Settings/SettingList.jsx';
import { HolidayFindClassProvider } from './Components/Pages/AdminPages/contexts/HolidayFindClassContext.jsx';
import HolidayReports from './Components/Pages/AdminPages/holiday-camps/reports/HolidayReports.jsx';
import { CommunicationTemplateProvider } from './Components/Pages/AdminPages/contexts/CommunicationContext.jsx';
import { ToDoListProvider } from './Components/Pages/AdminPages/contexts/ToDoListContext.jsx';
import { RecruitmentProvider } from './Components/Pages/AdminPages/contexts/RecruitmentContext.jsx';
import Music from './Components/Pages/AdminPages/coach-pro/Music.jsx';
import CourseList from './Components/Pages/AdminPages/coach-pro/Course/CourseList.jsx';
import CourseCreate from './Components/Pages/AdminPages/coach-pro/Course/CourseCreate.jsx';
// import CoachProfile from './Components/Pages/AdminPages/configuration/coach-pro/CoachProfile.jsx';
import CoachProfile from './Components/Pages/AdminPages/configuration/coach-pro/profile/CoachProfile.jsx';
import AttendanceReport from './Components/Pages/AdminPages/configuration/coach-pro/profile/AttendanceReport.jsx';
import ContractList from './Components/Pages/AdminPages/configuration/coach-pro/contracts/ContractList.jsx';
import PdfEditor from './Components/Pages/AdminPages/configuration/coach-pro/contracts/PdfEditor.jsx';
import IssueList from './Components/Pages/AdminPages/configuration/coach-pro/issues/IssueList.jsx';
import ReferralsList from './Components/Pages/AdminPages/configuration/coach-pro/referrals/ReferralsList.jsx';
import StudentCource from './Components/Pages/AdminPages/configuration/coach-pro/studentsCources/StudentCource.jsx';
import StudentCourceAdd from './Components/Pages/AdminPages/configuration/coach-pro/studentsCources/StudentCourceAdd.jsx';
import CourseUpdate from './Components/Pages/AdminPages/coach-pro/Course/CourceUpdate.jsx';
import CourseStudentUpdate from './Components/Pages/AdminPages/configuration/coach-pro/studentsCources/CourseStudentUpdate.jsx';
import { StarterPackProvider } from './Components/Pages/AdminPages/contexts/StarterPackContext.jsx';
import { CoachProProvider } from './Components/Pages/AdminPages/contexts/CoachProContext.jsx';
import { GlobalSearchProvider } from './Components/Pages/AdminPages/contexts/GlobalSearchContext.jsx';
import { EmailProvider } from './Components/Pages/AdminPages/contexts/messages/SendEmailContext.jsx';
import { CancelMembershipProvider } from './Components/Pages/AdminPages/contexts/messages/CancelMembershipContext.jsx';

const commonRole = ['Admin', 'user', 'Member', 'Agent', 'Super Admin'];

// Role-based route component
const RoleBasedRoute = ({ children }) => {
  return children;
};

// ----------------- ALLOWED PATHS -----------------
const getAllowedBasePathsFromMenu = (items, role) => {
  return items
    .filter(item => !item.role || item.role.includes(role))
    .map(item => item.link)
    .filter(Boolean);
};

// ----------------- AUTH ROUTES -----------------
const AuthRoutes = () => {
  const location = useLocation();
  const isForgot = location.pathname === '/admin-ForgotPassword';
  return (
    <div className='login-container'>

      <div className={`login-container-inner ${isForgot ? 'forgetPass' : ''}`}>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-ForgotPassword" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </div>
  );
};

// ----------------- MAIN ROUTES -----------------
const AppRoutes = () => {
  const location = useLocation();
  const { checkPermission } = usePermission();

  useEffect(() => {
    const container = document.getElementById("scrollable-content");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth", // change to "auto" if you don’t want animation
      });
    }
  }, [location.pathname]);
  const isAuth = ['/admin-login', '/reset-password', '/admin-ForgotPassword'].includes(location.pathname);

  if (isAuth) return <AuthRoutes />;
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      {/* Role-based routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Dashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Dashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/members/list"
        element={renderProtectedRoute(MemberList, [
          { module: "member", action: "view-listing" },
        ])} />

      <Route
        path="/members/update"
        element={renderProtectedRoute(Update, [
          { module: "member", action: "update" },
        ])}
      />
      <Route
        path="/weekly-classes/account-information"
        element={renderProtectedRoute(Account, [{ module: "account-information", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/subscription-planManager"
        element={renderProtectedRoute(SubscriptionPlanManagerList, [{ module: "payment-plan", action: "view-listing" }, { module: "payment-group", action: "view-listing" }])}
      />

      <Route
        path="/weekly-classes/add-subscription-plan-group"
        element={renderProtectedRoute(AddMembershipPlanGroup, [{ module: "payment-group", action: "create" }])}
      />

      <Route
        path="/notification"
        element={renderProtectedRoute(Notification, [{ module: "notification", action: "view-listing" }])}
      />
      <Route
        path="/notification-list"
        element={renderProtectedRoute(NotificationList, [{ module: "notification", action: "view-listing" }])}
      />
      <Route
        path="/holiday-camps/discounts/list"
        element={renderProtectedRoute(DiscountsList, [{ module: "discount", action: "view-listing" }])}
      />

      <Route
        path="/holiday-camps/discounts/create"
        element={renderProtectedRoute(DiscountCreate, [{ module: "discount", action: "create" }])}
      />

      <Route
        path="/configuration/weekly-classes/venues"
        element={renderProtectedRoute(List, [{ module: "venue", action: "view-listing" }])}
      />

      <Route
        path="/weekly-classes/find-a-class"
        element={renderProtectedRoute(FindAClass, [{ module: "find-class", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/find-a-class/book-a-free-trial"
        element={renderProtectedRoute(BookFreeTrial, [{ module: "book-free-trial", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/find-a-class/add-to-waiting-list"
        element={renderProtectedRoute(AddtoWaitingList, [{ module: "add-waiting-list", action: "create" }])}
      />
      <Route
        path="/weekly-classes/find-a-class/add-to-waiting-list/list"
        element={renderProtectedRoute(WaitingList, [{ module: "add-waiting-list", action: "create" }])}
      />
      <Route
        path="/weekly-classes/find-a-class/book-a-membership"
        element={renderProtectedRoute(BookMembership, [{ module: "book-membership", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list"
        element={renderProtectedRoute(AccountInformation, [{ module: "book-free-trial", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/cancellation/account-info/list"
        element={renderProtectedRoute(AccountInfoCancellation, [{ module: "cancellation", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/cancellation"
        element={renderProtectedRoute(CancellationList, [{ module: "cancellation", action: "view-listing" }])}
      />

      <Route
        path="/configuration/weekly-classes/venues/class-schedule"
        element={renderProtectedRoute(ClassSchedule, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/venues/class-schedule/Sessions/viewSessions"
        element={renderProtectedRoute(Pending, [{ module: "class-schedule", action: "view-listing" }])}
      />

      <Route
        path="/configuration/weekly-classes/venues/class-schedule/Sessions/completed"
        element={renderProtectedRoute(Completed, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/venues/class-schedule/Sessions/cancel"
        element={renderProtectedRoute(Cancel, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/term-dates/list"
        element={renderProtectedRoute(TermDateList, [{ module: "term-group", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/term-dates/create"
        element={renderProtectedRoute(TermDateCreate, [{ module: "term-group", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/term-dates/update"
        element={renderProtectedRoute(TermDateUpdate, [{ module: "term-group", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/session-plan-list"
        element={renderProtectedRoute(SessionPlanList, [{ module: "session-plan-group", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/starter-pack"
        element={renderProtectedRoute(StarterPack, [{ module: "payment-group", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/session-plan-preview"
        element={renderProtectedRoute(Preview, [{ module: "session-plan-group", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/session-plan-create"
        element={renderProtectedRoute(SessionPlanCreate, [{ module: "session-plan-group", action: "view-listing" }])}
      />
      <Route
        path="/configuration/weekly-classes/session-plan-preview"
        element={renderProtectedRoute(SessionPlanPreview, [{ module: "session-plan-group", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/trial/list"
        element={renderProtectedRoute(TrialLists, [{ module: "book-free-trial", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/all-members/list"
        element={renderProtectedRoute(AddMembers, [{ module: "book-membership", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/all-members/membership-sales"
        element={renderProtectedRoute(MembershipSales, [{ module: "book-membership", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/all-members/account-info"
        element={renderProtectedRoute(AccountInfoBookMembership, [{ module: "book-membership", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/add-to-waiting-list/account-info"
        element={renderProtectedRoute(AccountInfoWaitingList, [{ module: "waiting-list", action: "view-listing" }])}
      />
      <Route
        path="/test"
        element={renderProtectedRoute(Test)}
      />
      <Route
        path="/weekly-classes/capacity"
        element={renderProtectedRoute(Capacity, [{ module: "capacity", action: "view-listing" }])}
      />
      <Route
        path="/weekly-classes/all-members/see-details"
        element={renderProtectedRoute(SeeDetails, [{ module: "book-membership", action: "view-listing" }])}
      />
      <Route
        path="/KeyInfomation"
        element={renderProtectedRoute(KeyInfomation, [{ module: "key-information", action: "view-listing" }])}
      />
      <Route
        path="/permission"
        element={renderProtectedRoute(PermissionRole, [{ module: "admin-role", action: "view-listing" }])}
      />

      <Route path="/weekly-classes/members-info" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <MainTable />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/account-information" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Account />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/reports" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Reports />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Leads />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/session-plan" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SessionPlan />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/session-plan-create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Create />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/session-plan-update" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <OnetoOneUpdate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/session-plan-preview" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SessionPreview />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/one-to-one/leads/booking-form" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BookingForm />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/sales/account-information" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AccountMain />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/one-to-one/sales/account-information/see-details" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SeeDetailsAccount />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/central-leads" element={
        <LeadsContextProvider>

          <ProtectedRoute>
            <GlobalSearchProvider>
              <AdminLayout>
                <RoleBasedRoute>
                  <Lead />
                </RoleBasedRoute>
              </AdminLayout>
            </GlobalSearchProvider>
          </ProtectedRoute>

        </LeadsContextProvider>
      } />
      <Route path="/weekly-classes/central-leads/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CreateLead />
              </RoleBasedRoute>
            </AdminLayout>

          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AccountInfo />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/reports/members" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <MembersDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/trials" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <TrialsDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/sales" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SaleDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/class-capacity" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CapacityDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/attendance" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AttendanceDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/cancellations" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CancellationDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/central-leads/accont-info" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AccountInfo />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/reports/weekly-classes" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <WeeklyDashboard />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />


      {/* birthday  */}
      <Route path="/birthday-party/session-plan" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdaySessionPlan />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>

      } />
      <Route path="/birthday-party/session-plan-preview" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdaySessionPreview />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/session-plan-create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdayCreate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/session-plan-update" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdayUpdate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/leads" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdayLeads />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/leads/booking-form" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdayBookingForm />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/reports" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BirthdayReports />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/sales/account-information" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AccountMainBirthDay />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/birthday-party/sales/account-information/see-details" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SeeDetailsAccountBirthday />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <StudentCamp />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/members/list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <StudentCamp />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/find-a-camp" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CampList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/find-a-camp/book-camp" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <BookACamp />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/waiting-list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <WaitingLists />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/members/account-information" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AccountMainHoliday />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/waiting-list/account-information" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <WaitingListTab />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/members/account-information/see-details" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SeeDetailsAccountHoliday />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/reports" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidayReports />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/holiday-camp/session-plan/list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidaySessionPlan />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/holiday-camp/session-plan/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidaySessionCreate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/holiday-camp/session-plan/preview" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidaySessionPreview />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/holiday-camp/terms/list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidayTermList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/holiday-camp/terms/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidayTermsCreate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />
      <Route path="/configuration/holiday-camp/discount/list"
        element={renderProtectedRoute(HolidayDiscountList, [{ module: "discount", action: "view-listing" }])} />

      <Route
        path="/configuration/holiday-camp/discount/create"
        element={renderProtectedRoute(HolidayDiscountCreate, [{ module: "discount", action: "create" }])}
      />

      <Route
        path="/configuration/holiday-camp/subscription-plan-group"
        element={renderProtectedRoute(HolidaySubscriptionPlanManager, [{ module: "payment-plan", action: "view-listing" }, { module: "payment-group", action: "view-listing" }])}
      />

      <Route
        path="/configuration/holiday-camp/subscription-plan-group/create"
        element={renderProtectedRoute(HolidayAddPaymentPlanGroup, [{ module: "payment-group", action: "create" }])}
      />
      <Route
        path="/configuration/holiday-camp/venues"
        element={renderProtectedRoute(HolidayVenueList, [{ module: "venue", action: "view-listing" }])}
      />
      <Route
        path="/configuration/holiday-camp/venues/class-schedule"
        element={renderProtectedRoute(ClassSheduleList, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route
        path="/configuration/holiday-camp/venues/class-schedule/Sessions/viewSessions"
        element={renderProtectedRoute(HolidayCampPending, [{ module: "class-schedule", action: "view-listing" }])}
      />

      <Route
        path="/configuration/holiday-camp/venues/class-schedule/Sessions/completed"
        element={renderProtectedRoute(HolidayCampCompleted, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route
        path="/configuration/holiday-camp/venues/class-schedule/Sessions/cancel"
        element={renderProtectedRoute(HolidayCampCancel, [{ module: "class-schedule", action: "view-listing" }])}
      />
      <Route path="/recruitment/lead" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Recruitment />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/recruitment/lead/coach/profile" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CandidateDetails />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/recruitment/lead/venue-manager/profile" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CandidateVenueDetails />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/recruitment/reports" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <ReportsMain />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/recruitment/franchise-lead" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <FranchiseLeads />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/administration/to-do-list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <TodoList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/administration/file-manager" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <FileManager />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/recruitment/franchise-lead/see-details" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <FranchiseCandidateDetails />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/templates/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Createtemplate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/templates/list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CommunicationsList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/templates/settingList" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <SettingList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camp/find-a-camp/add-to-waiting-list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <HolidayAddtoWaitingList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/music" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <Music />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/profile" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <CoachProfile />
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/courses" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CourseList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/course/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CourseCreate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/profile/report" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <AttendanceReport />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/contracts" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <ContractList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/contracts/update" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <PdfEditor />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/issue-list" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <IssueList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/referrals" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <ReferralsList />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/student" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <StudentCource />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/student/create" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <StudentCourceAdd />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/course/update" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CourseUpdate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

      <Route path="/configuration/coach-pro/student/update" element={
        <ProtectedRoute>
          <GlobalSearchProvider>
            <AdminLayout>
              <RoleBasedRoute>
                <CourseStudentUpdate />
              </RoleBasedRoute>
            </AdminLayout>
          </GlobalSearchProvider>
        </ProtectedRoute>
      } />

    </Routes>
  );
};

// ----------------- APP WRAPPER -----------------
function App() {

  return (
    <Router basename="/">

      <NotificationProvider>
        <AccountsInfoProvider>
          <LeadsContextProvider>
            <HolidayPaymentPlanContextProvider>
              <HolidayVenueProvider>
                <HolidayFindClassProvider>


                  <HolidayClassScheduleProvider>
                    <VenueProvider>
                      <MemberProvider>
                        <HolidaySessionPlanContextProvider>
                          <HolidayTermsProvider>
                            <PaymentPlanContextProvider>
                              <DiscountContextProvider>
                                <SessionPlanContextProvider>
                                  <TermDatesSessionProvider>
                                    <ClassScheduleProvider>
                                      <FindClassProvider>
                                        <BookFreeTrialProvider>
                                          <BookFreeTrialLoaderProvider>
                                            <PermissionProvider>
                                              <CommunicationTemplateProvider>
                                                <ToDoListProvider>
                                                  <RecruitmentProvider>
                                                    <CoachProProvider>
                                                      <StarterPackProvider>
                                                        <EmailProvider>
                                                          <CancelMembershipProvider>
                                                            <AppRoutes />
                                                          </CancelMembershipProvider>
                                                        </EmailProvider>
                                                      </StarterPackProvider>
                                                    </CoachProProvider>
                                                  </RecruitmentProvider>
                                                </ToDoListProvider>
                                              </CommunicationTemplateProvider>
                                            </PermissionProvider>
                                          </BookFreeTrialLoaderProvider>
                                        </BookFreeTrialProvider>
                                      </FindClassProvider>
                                    </ClassScheduleProvider>
                                  </TermDatesSessionProvider>
                                </SessionPlanContextProvider>
                              </DiscountContextProvider>
                            </PaymentPlanContextProvider>
                          </HolidayTermsProvider>
                        </HolidaySessionPlanContextProvider>
                      </MemberProvider>
                    </VenueProvider>
                  </HolidayClassScheduleProvider>
                </HolidayFindClassProvider>
              </HolidayVenueProvider>
            </HolidayPaymentPlanContextProvider>
          </LeadsContextProvider>
        </AccountsInfoProvider>
      </NotificationProvider>
    </Router >
  );
}

export default App;

