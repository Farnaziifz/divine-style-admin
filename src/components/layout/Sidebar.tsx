import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  Package,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';
import logo from '../../assets/images/logo.svg';

const Sidebar = () => {
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>(['/settings']);

  const toggleSubmenu = (path: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
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
      ],
    },
    { name: 'سفارشات', icon: ShoppingBag, path: '/orders' },
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
    <aside className="w-64 bg-white/50 backdrop-blur-md border-l border-zafting-accent/10 h-screen fixed right-0 top-0 overflow-y-auto z-50">
      <div className="p-6 flex items-center justify-center border-b border-zafting-accent/10">
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="Divine Logo" className="w-12 h-12" />
          <h1 className="text-xl font-serif text-zafting-accent font-bold">
            Divine Admin
          </h1>
        </div>
      </div>
      <nav className="mt-6 px-4">
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
                    className="flex items-center gap-3 flex-1"
                    onClick={(e) => {
                      if (hasChildren) e.preventDefault();
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
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
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
    </aside>
  );
};

export default Sidebar;
