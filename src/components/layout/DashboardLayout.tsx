import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import logo from '../../assets/images/logo.svg';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-zafting-bg overflow-x-hidden" dir="rtl">
      {/* موبایل: تیره‌کردن پس‌زمینه هنگام باز بودن منو */}
      <button
        type="button"
        aria-label="بستن منو"
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* نوار بالا — فقط موبایل/تبلت */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-zafting-accent/10 bg-white/90 px-3 backdrop-blur-md sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zafting-text transition-colors hover:bg-zafting-accent/10"
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'بستن منو' : 'باز کردن منو'}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} strokeWidth={2} />}
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 shrink-0" />
          <span className="truncate text-sm font-bold text-zafting-accent">
            Divine Style
          </span>
        </div>
        <div className="h-10 w-10 shrink-0" aria-hidden />
      </header>

      <Sidebar
        mobileOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen w-full min-w-0 flex-1 pt-14 transition-[padding,margin] duration-200 lg:ms-64 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl py-4 ps-4 pe-4 sm:py-5 sm:ps-5 sm:pe-5 lg:py-8 lg:ps-8 lg:pe-6 xl:ps-10 xl:pe-8 2xl:ps-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
