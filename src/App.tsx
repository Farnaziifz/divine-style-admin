import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Otp from './pages/Otp';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import SiteSettings from './pages/settings/SiteSettings';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import CustomerGroups from './pages/CustomerGroups';
import CustomerGroupDetail from './pages/CustomerGroupDetail';
import Collections from './pages/Collections';
import Categories from './pages/Categories';
import Specifications from './pages/Specifications';
import ProductList from './pages/ProductList';
import CreateProduct from './pages/CreateProduct';
import ProductDetail from './pages/ProductDetail';
import EditProduct from './pages/EditProduct';
import OutOfStockProducts from './pages/OutOfStockProducts';
import Orders from './pages/Orders';
import OfflineSales from './pages/OfflineSales';
import CreateOfflineSale from './pages/CreateOfflineSale';
import OfflineSalesReport from './pages/OfflineSalesReport';
import SalesDetailReport from './pages/SalesDetailReport';
import DiscountCodes from './pages/DiscountCodes';
import OrderDetail from './pages/OrderDetail';
import RoleManagement from './pages/RoleManagement';
import ContentCalendar from './pages/ContentCalendar';
import Chats from './pages/Chats';
import BlogCategories from './pages/BlogCategories';
import BlogPosts from './pages/BlogPosts';
import BlogPostEditor from './pages/BlogPostEditor';
import LoyaltyDashboard from './pages/LoyaltyDashboard';
import LoyaltySegments from './pages/LoyaltySegments';
import LoyaltyDiscountCodes from './pages/LoyaltyDiscountCodes';
import LoyaltyCashback from './pages/LoyaltyCashback';
import LoyaltyCoupons from './pages/LoyaltyCoupons';
import LoyaltyCreditPoints from './pages/LoyaltyCreditPoints';
import LoyaltyChurnEvaluation from './pages/LoyaltyChurnEvaluation';
import LoyaltyLoyaltyEvaluation from './pages/LoyaltyLoyaltyEvaluation';
import LoyaltyReports from './pages/LoyaltyReports';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? (JSON.parse(raw) as { role?: string }) : null;
    // فقط مدیر / اپراتور؛ نقش USER باعث می‌شد بعد از ورود توکن‌ها پاک به نظر برسند
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

/**
 * حفاظت اضافه در سطح روت (نه فقط پنهان‌کردن آیتم منو) — چون این بخش داده‌های مالی
 * حساس (مبالغ تخفیف/کش‌بک) نشان می‌دهد. بقیهٔ صفحات این الگو را ندارند و فقط با
 * canSee() در Sidebar پنهان می‌شوند؛ برای این بخش عمداً سخت‌گیرتریم.
 */
const LoyaltyClubRoute = ({ children }: { children: ReactNode }) => {
  const hasAccess = (() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw
        ? (JSON.parse(raw) as { role?: string; permissions?: string[] })
        : null;
      const role = parsed?.role;
      const permissions = Array.isArray(parsed?.permissions) ? parsed.permissions : [];
      return role === 'ADMIN' || (role === 'OPERATOR' && permissions.includes('LOYALTY_CLUB_MANAGE'));
    } catch {
      return false;
    }
  })();

  if (!hasAccess) {
    return <Navigate to="/" replace />;
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
            <Route path="out-of-stock" element={<OutOfStockProducts />} />
            <Route path=":id" element={<ProductDetail />} />
            <Route path=":id/edit" element={<EditProduct />} />
            <Route path="collections" element={<Collections />} />
            <Route path="categories" element={<Categories />} />
            <Route path="specifications" element={<Specifications />} />
          </Route>
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderCode" element={<OrderDetail />} />
          <Route path="sales/detail" element={<SalesDetailReport />} />
          <Route path="offline-sales" element={<OfflineSales />} />
          <Route path="offline-sales/create" element={<CreateOfflineSale />} />
          <Route path="offline-sales/report" element={<OfflineSalesReport />} />
          <Route path="discount-codes" element={<DiscountCodes />} />
          <Route path="content-calendar" element={<ContentCalendar />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="customer-groups" element={<CustomerGroups />} />
          <Route path="customer-groups/:id" element={<CustomerGroupDetail />} />
          <Route
            path="loyalty-club"
            element={
              <LoyaltyClubRoute>
                <Outlet />
              </LoyaltyClubRoute>
            }
          >
            <Route path="dashboard" element={<LoyaltyDashboard />} />
            <Route path="segments" element={<LoyaltySegments />} />
            <Route path="discount-codes" element={<LoyaltyDiscountCodes />} />
            <Route path="cashback" element={<LoyaltyCashback />} />
            <Route path="coupons" element={<LoyaltyCoupons />} />
            <Route path="credit-points" element={<LoyaltyCreditPoints />} />
            <Route path="churn-evaluation" element={<LoyaltyChurnEvaluation />} />
            <Route path="loyalty-evaluation" element={<LoyaltyLoyaltyEvaluation />} />
            <Route path="reports" element={<LoyaltyReports />} />
          </Route>
          <Route path="roles" element={<RoleManagement />} />
          <Route path="direct" element={<Chats />} />
          <Route path="blog">
            <Route path="categories" element={<BlogCategories />} />
            <Route path="posts" element={<BlogPosts />} />
            <Route path="posts/create" element={<BlogPostEditor />} />
            <Route path="posts/:id" element={<BlogPostEditor />} />
          </Route>
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
