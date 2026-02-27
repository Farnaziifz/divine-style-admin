import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
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
