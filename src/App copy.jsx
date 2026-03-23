// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';

import AdminLogin from './Components/AdminLogin.jsx';
import ResetPassword from './Components/ResetPassword.jsx';
import ForgotPassword from './Components/ForgotPassword.jsx';
import AdminLayout from './Components/Layout/AdminLayout.jsx';
import PermissionProtectedRoute from './PermissionProtectedRoute.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import Unauthorized from './Components/Unauthorized.jsx';
import Test from './Test.jsx';
import { renderProtectedRoute } from "./RenderProtectedRoute";

// Import all your pages
import Dashboard from './Components/Pages/Dashboard.jsx';
import MemberList from './Components/Pages/AdminPages/members/List.jsx';
import Update from './Components/Pages/AdminPages/members/Update.jsx';
import SubscriptiontPlanManagerList from './Components/Pages/AdminPages/configuration/weekly-classes/Subscription plan manager/SubscriptionPlanManager.jsx';
import AddMembershipPlanGroup from './Components/Pages/AdminPages/configuration/weekly-classes/Subscription plan manager/AddMembershipPlanGroup.jsx';
import DiscountsList from './Components/Pages/AdminPages/discounts/list.jsx';
import DiscountCreate from './Components/Pages/AdminPages/discounts/create.jsx';
import Notification from './Components/Pages/AdminPages/notification/Notification.jsx';
import NotificationList from './Components/Pages/AdminPages/notification/NotificationList.jsx';
import List from './Components/Pages/AdminPages/configuration/weekly-classes/venus/List.jsx';
import FindAClass from './Components/Pages/AdminPages/weekly-classes/find-a-class/List.jsx';
import BookFreeTrial from './Components/Pages/AdminPages/weekly-classes/find-a-class/Book a free trial/list.jsx'
import BookMembership from './Components/Pages/AdminPages/weekly-classes/find-a-class/Book a Membership/list.jsx'
import ClassSchedule from './Components/Pages/AdminPages/Configuration/weekly-classes/venus/Class Schedule/List.jsx';
import Pending from './Components/Pages/AdminPages/configuration/weekly-classes/venus/Class Schedule/View Session/pending.jsx';
import Completed from './Components/Pages/AdminPages/configuration/weekly-classes/venus/Class Schedule/View Session/completed.jsx';
import Cancel from './Components/Pages/AdminPages/configuration/weekly-classes/venus/Class Schedule/View Session/cancel.jsx';
import TermDateList from './Components/Pages/AdminPages/configuration/weekly-classes/Term And Condition/List.jsx';
import TermDateCreate from './Components/Pages/AdminPages/configuration/weekly-classes/Term And Condition/Create.jsx';
import TermDateUpdate from './Components/Pages/AdminPages/configuration/weekly-classes/Term And Condition/Update.jsx';
import SessionPlanList from './Components/Pages/AdminPages/configuration/weekly-classes/Session plan library/list.jsx';
import SessionPlanCreate from './Components/Pages/AdminPages/configuration/weekly-classes/Session plan library/Create.jsx';
import SessionPlanPreview from './Components/Pages/AdminPages/configuration/weekly-classes/Session plan library/Preview.jsx';
import TrialLists from './Components/Pages/AdminPages/weekly-classes/Trials/List.jsx';
import AddMembers from './Components/Pages/AdminPages/weekly-classes/All Members/List.jsx';
import MembershipSales from './Components/Pages/AdminPages/weekly-classes/All Members/membershipSales.jsx';
import AccountInformation from './Components/Pages/AdminPages/weekly-classes/find-a-class/Book a free trial/Account Information Book Free Trial/list.jsx';
import PermissionRole from './Components/Pages/AdminPages/Permissions/list.jsx';
// import { AccountInformationMembership } from './Components/Pages/AdminPages/Configuration/weekly-classes/All Members/Account Information Book Membership/List.jsx';

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
import AccountInfoBookMembership from './Components/Pages/AdminPages/weekly-classes/All Members/Account Information Book Membership/List.jsx';
import SeeDetails from './Components/Pages/AdminPages/weekly-classes/All Members/See Details/list.jsx';
import AddtoWaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/Add to Waiting List/AddtoWaitingList.jsx';
import WaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/Add to Waiting List/List.jsx';
import AccountInfoWaitingList from './Components/Pages/AdminPages/weekly-classes/find-a-class/Add to Waiting List/Account Information Waiting List/List.jsx';
import Capacity from './Components/Pages/AdminPages/weekly-classes/Capacity/list.jsx';
import CancellationList from './Components/Pages/AdminPages/weekly-classes/Cancellation/list.jsx';
import AccountInfoCancellation from './Components/Pages/AdminPages/weekly-classes/Cancellation/Account Information Cancellation/list.jsx';
import { BookFreeTrialLoaderProvider } from './Components/Pages/AdminPages/contexts/BookAFreeTrialLoaderContext.jsx';
import KeyInfomation from './Components/Pages/AdminPages/weekly-classes/Key Information/KeyInfomation.jsx';
// Define roles
import Account from './Components/Pages/AdminPages/weekly-classes/account-information/Account.jsx';
import Preview from './Components/Pages/AdminPages/configuration/weekly-classes/Session plan library/Preview.jsx';

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
          <AdminLayout>
            <RoleBasedRoute>
              <Dashboard />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Dashboard />
            </RoleBasedRoute>
          </AdminLayout>
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

      <Route path="/weekly-classes/account-information" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Account />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/subscription-planManager" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <SubscriptiontPlanManagerList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/add-subscription-plan-group" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AddMembershipPlanGroup />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/notification" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Notification />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/notification-list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <NotificationList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camps/discounts/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <DiscountsList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/holiday-camps/discounts/create" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <DiscountCreate />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/venues" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <List />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/find-a-class" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <FindAClass />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/find-a-class/book-a-free-trial" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <BookFreeTrial />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/find-a-class/add-to-waiting-list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AddtoWaitingList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/find-a-class/add-to-waiting-list/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <WaitingList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/find-a-class/book-a-membership" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <BookMembership />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AccountInformation />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/cancellation/account-info/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AccountInfoCancellation />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/cancellation" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <CancellationList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/configuration/weekly-classes/venues/class-schedule" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <ClassSchedule />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/venues/class-schedule/Sessions/viewSessions" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Pending />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/venues/class-schedule/Sessions/completed" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Completed />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/venues/class-schedule/Sessions/cancel" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Cancel />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/term-dates/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <TermDateList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/term-dates/create" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <TermDateCreate />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/term-dates/update" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <TermDateUpdate />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration/weekly-classes/session-plan-list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <SessionPlanList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/configuration/weekly-classes/session-plan-preview" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Preview />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/session-plan-create" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <SessionPlanCreate />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/session-plan-preview" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <SessionPlanPreview />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/trial/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <TrialLists />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/weekly-classes/all-members/list" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AddMembers />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/all-members/membership-sales" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <MembershipSales />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/all-members/account-info" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AccountInfoBookMembership />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/add-to-waiting-list/account-info" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <AccountInfoWaitingList />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/test" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Test />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/capacity" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <Capacity />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/weekly-classes/all-members/see-details" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <SeeDetails />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/KeyInfomation" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <KeyInfomation />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/permission" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleBasedRoute>
              <PermissionRole />
            </RoleBasedRoute>
          </AdminLayout>
        </ProtectedRoute>
      } />


      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
};

// ----------------- APP WRAPPER -----------------
function App() {

  return (
    <Router basename="/">

      <NotificationProvider>
        <VenueProvider>
          <MemberProvider>
            <PaymentPlanContextProvider>
              <DiscountContextProvider>
                <SessionPlanContextProvider>
                  <TermDatesSessionProvider>
                    <ClassScheduleProvider>
                      <FindClassProvider>
                        <BookFreeTrialProvider>
                          <BookFreeTrialLoaderProvider>
                            <PermissionProvider>
                              <AppRoutes />
                            </PermissionProvider>
                          </BookFreeTrialLoaderProvider>
                        </BookFreeTrialProvider>
                      </FindClassProvider>
                    </ClassScheduleProvider>
                  </TermDatesSessionProvider>
                </SessionPlanContextProvider>
              </DiscountContextProvider>
            </PaymentPlanContextProvider>
          </MemberProvider>
        </VenueProvider>
      </NotificationProvider>
    </Router >
  );
}

export default App;

