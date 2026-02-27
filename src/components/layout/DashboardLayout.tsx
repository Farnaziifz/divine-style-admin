import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-zafting-bg" dir="rtl">
      <Sidebar />
      <main className="flex-1 mr-64 p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
