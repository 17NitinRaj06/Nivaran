import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LogoSpinner from './components/ui/LogoSpinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReportIssue = lazy(() => import('./pages/ReportIssue'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const MyReports = lazy(() => import('./pages/MyReports'));
const Profile = lazy(() => import('./pages/Profile'));
const ComplaintTracking = lazy(() => import('./pages/ComplaintTracking'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDatabase = lazy(() => import('./pages/admin/AdminDatabase'));
const OfficerDashboard = lazy(() => import('./pages/officer/OfficerDashboard'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LogoSpinner size="md" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LogoSpinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ children, roles }) {
  const { user, loading, userRole } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LogoSpinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return children;
}

function SuspenseRoute({ element }) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<SuspenseRoute element={<Landing />} />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<SuspenseRoute element={<Login />} />} />
        <Route path="/signup" element={<SuspenseRoute element={<Signup />} />} />
      </Route>
      <Route path="/verify-email" element={<SuspenseRoute element={<VerifyEmail />} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuspenseRoute element={<Dashboard />} />} />
        <Route path="report" element={<SuspenseRoute element={<ReportIssue />} />} />
        <Route path="leaderboard" element={<SuspenseRoute element={<Leaderboard />} />} />
        <Route path="my-reports" element={<SuspenseRoute element={<MyReports />} />} />
        <Route path="profile" element={<SuspenseRoute element={<Profile />} />} />
        <Route path="tracking/:id" element={<SuspenseRoute element={<ComplaintTracking />} />} />
        <Route path="tracking" element={<SuspenseRoute element={<ComplaintTracking />} />} />
        <Route
          path="admin"
          element={
            <RoleRoute roles={['admin']}>
              <SuspenseRoute element={<AdminDashboard />} />
            </RoleRoute>
          }
        />
        <Route
          path="admin/database"
          element={
            <RoleRoute roles={['admin']}>
              <SuspenseRoute element={<AdminDatabase />} />
            </RoleRoute>
          }
        />
        <Route
          path="officer"
          element={
            <RoleRoute roles={['officer', 'admin']}>
              <SuspenseRoute element={<OfficerDashboard />} />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
