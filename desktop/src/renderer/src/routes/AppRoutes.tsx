import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyAccount from '../pages/auth/VerifyAccount';

// Dashboards
import StudentDashboard from '../pages/student/StudentDashboard';
import BrowseClasses from '../pages/student/BrowseClasses';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherClasses from '../pages/teacher/TeacherClasses';
import TeacherProfile from '../pages/teacher/TeacherProfile';
import TeacherPendingPage from '../pages/teacher/TeacherPendingPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTeachersPage from '../pages/admin/AdminTeachersPage';
import PaymentPage from '../pages/payment/PaymentPage';
import PaymentHistory from '../pages/payment/PaymentHistory';
import LiveWatchPage from '../pages/stream/LiveWatchPage';
import TeacherStreamPage from '../pages/stream/TeacherStreamPage';
import { useAuthStore } from '../store/useAuthStore';

const AppRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isApproved = user?.teacherProfile?.approvalStatus === 'APPROVED';

  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-account" element={<VerifyAccount />} />
      </Route>

      {/* Protected Dashboards */}
      <Route element={<DashboardLayout />}>
        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/classes" element={<BrowseClasses />} />
          <Route path="/student/payment" element={<PaymentPage />} />
          <Route path="/student/payments" element={<PaymentHistory />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
          <Route path="/teacher" element={isApproved ? <TeacherDashboard /> : <TeacherPendingPage />} />
          <Route path="/teacher/classes" element={isApproved ? <TeacherClasses /> : <Navigate to="/teacher" replace />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />
          <Route path="/teacher/live" element={isApproved ? <TeacherStreamPage /> : <Navigate to="/teacher" replace />} />
        </Route>

        {/* Shared — authenticated students + teachers */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} />}>
          <Route path="/live/:id" element={<LiveWatchPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachersPage />} />
        </Route>
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
