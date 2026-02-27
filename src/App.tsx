import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Otp from './pages/Otp';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
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
          <Route path="users" element={<div>مدیریت کاربران</div>} />
          <Route path="settings" element={<div>تنظیمات</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
