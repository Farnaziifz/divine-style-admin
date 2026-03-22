import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  Package,
  ChevronDown,
  ChevronLeft,
  TicketPercent,
  LogOut,
} from 'lucide-react';
import logo from '../../assets/images/logo.svg';

type SidebarProps = {
  /** موبایل: منو باز است */
  mobileOpen?: boolean;
  /** بعد از کلیک روی لینک (بستن دراور موبایل) */
  onNavigate?: () => void;
};

const Sidebar = ({ mobileOpen = false, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>(['/settings']);

  const toggleSubmenu = (path: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleNav = (e?: MouseEvent) => {
    e?.stopPropagation();
    onNavigate?.();
  };

  const menuItems = [
    { name: 'داشبورد', icon: LayoutDashboard, path: '/' },
    {
      name: 'محصولات',
      icon: Package,
      path: '/products',
      children: [
        { name: 'لیست محصولات', path: '/products' },
        { name: 'کالکشن‌ها', path: '/products/collections' },
        { name: 'دسته‌بندی‌ها', path: '/products/categories' },
        { name: 'مشخصات', path: '/products/specifications' },
      ],
    },
    { name: 'سفارشات', icon: ShoppingBag, path: '/orders' },
    { name: 'کدهای تخفیف', icon: TicketPercent, path: '/discount-codes' },
    { name: 'کاربران', icon: Users, path: '/users' },
    {
      name: 'تنظیمات',
      icon: Settings,
      path: '/settings',
      children: [
        { name: 'پروفایل کاربری', path: '/settings/profile' },
        { name: 'امنیت و رمز عبور', path: '/settings/security' },
      ],
    },
  ];

  return (
    <aside
      className={`fixed right-0 top-0 z-50 h-dvh w-[min(18rem,88vw)] overflow-y-auto overscroll-contain border-l border-zafting-accent/10 bg-white/95 backdrop-blur-md shadow-xl transition-transform duration-200 ease-out lg:shadow-none lg:bg-white/50 ${
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="flex flex-col items-center gap-2 border-b border-zafting-accent/10 p-4 sm:p-6">
        <img src={logo} alt="Divine Style Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
        <h1 className="text-center text-base font-bold font-serif text-zafting-accent sm:text-xl">
          Divine Style Admin
        </h1>
      </div>
      <nav className="mt-4 px-3 sm:mt-6 sm:px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isSubmenuOpen = openSubmenus.includes(item.path);
            const isActive =
              location.pathname === item.path ||
              (hasChildren && location.pathname.startsWith(item.path));

            return (
              <li key={item.path}>
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zafting-accent text-white shadow-md'
                      : 'text-zafting-text hover:bg-zafting-accent/10'
                  }`}
                  onClick={() => {
                    if (hasChildren) {
                      toggleSubmenu(item.path);
                    }
                  }}
                >
                  <Link
                    to={hasChildren ? '#' : item.path}
                    className="flex flex-1 items-center gap-3"
                    onClick={(e) => {
                      if (hasChildren) e.preventDefault();
                      else handleNav(e);
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                  {hasChildren && (
                    <span className="opacity-70">
                      {isSubmenuOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronLeft size={16} />
                      )}
                    </span>
                  )}
                </div>

                {hasChildren && isSubmenuOpen && (
                  <ul className="mr-4 mt-2 space-y-1 border-r border-zafting-accent/10 pr-3">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          onClick={handleNav}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            location.pathname === child.path
                              ? 'bg-zafting-accent/10 text-zafting-accent font-bold'
                              : 'text-gray-500 hover:text-zafting-text'
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 px-3 pb-6 sm:px-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            localStorage.clear();
            navigate('/login', { replace: true });
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors border border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          <span className="font-medium">خروج از حساب</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
