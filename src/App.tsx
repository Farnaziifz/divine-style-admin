import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Otp from './pages/Otp';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import SiteSettings from './pages/settings/SiteSettings';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Collections from './pages/Collections';
import Categories from './pages/Categories';
import Specifications from './pages/Specifications';
import ProductList from './pages/ProductList';
import CreateProduct from './pages/CreateProduct';
import ProductDetail from './pages/ProductDetail';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import DiscountCodes from './pages/DiscountCodes';
import OrderDetail from './pages/OrderDetail';
import RoleManagement from './pages/RoleManagement';
import Chats from './pages/Chats';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? (JSON.parse(raw) as { role?: string }) : null;
    const role = parsed?.role;
    if (role !== 'ADMIN' && role !== 'OPERATOR') {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.clear();
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
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="create" element={<CreateProduct />} />
            <Route path=":id" element={<ProductDetail />} />
            <Route path=":id/edit" element={<EditProduct />} />
            <Route path="collections" element={<Collections />} />
            <Route path="categories" element={<Categories />} />
            <Route path="specifications" element={<Specifications />} />
          </Route>
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderCode" element={<OrderDetail />} />
          <Route path="discount-codes" element={<DiscountCodes />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="direct" element={<Chats />} />
          <Route path="settings">
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="site" element={<SiteSettings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
