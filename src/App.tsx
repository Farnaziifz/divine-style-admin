import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Otp from './pages/Otp';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<div>مدیریت محصولات</div>} />
          <Route path="orders" element={<div>مدیریت سفارشات</div>} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="settings">
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="security" element={<SecuritySettings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
