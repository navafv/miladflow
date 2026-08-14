import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import MadrassaDashboard from "./pages/MadrassaDashboard.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import LiveTvDashboard from "./components/LiveTvDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import TeamsPage from "./pages/admin/TeamsPage.jsx";
import CategoriesPage from "./pages/admin/CategoriesPage.jsx";
import EventsPage from "./pages/admin/EventsPage.jsx";
import RulesPage from "./pages/admin/RulesPage.jsx";
import VenuesPage from "./pages/admin/VenuesPage.jsx";
import StudentsPage from "./pages/admin/StudentsPage.jsx";
import RegistrationPage from "./pages/admin/RegistrationPage.jsx";
import RegistrationsViewPage from "./pages/admin/RegistrationsViewPage.jsx";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage.jsx";
import AdminResultsPage from "./pages/admin/ResultsPage.jsx";
import ReportsPage from "./pages/admin/ReportsPage.jsx";
import SettingsPage from "./pages/admin/SettingsPage.jsx";

function AdminBoundary({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundary scope="admin section" resetKey={location.pathname}>
      {children}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary scope="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminBoundary>
                <AdminLayout />
              </AdminBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="registration" element={<RegistrationPage />} />
          <Route
            path="registrations/view"
            element={<RegistrationsViewPage />}
          />
          <Route path="schedule" element={<AdminSchedulePage />} />
          <Route path="results" element={<AdminResultsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/:slug" element={<MadrassaDashboard />} />
        <Route path="/:slug/results" element={<ResultsPage />} />
        <Route path="/:slug/schedule" element={<SchedulePage />} />
        <Route path="/:slug/tv" element={<LiveTvDashboard />} />
      </Routes>
    </ErrorBoundary>
  );
}
