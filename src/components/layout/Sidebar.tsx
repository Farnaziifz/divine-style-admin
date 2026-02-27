import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, Package } from 'lucide-react';
import logo from '../../assets/images/logo.svg';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'داشبورد', icon: LayoutDashboard, path: '/' },
    { name: 'محصولات', icon: Package, path: '/products' },
    { name: 'سفارشات', icon: ShoppingBag, path: '/orders' },
    { name: 'کاربران', icon: Users, path: '/users' },
    { name: 'تنظیمات', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white/50 backdrop-blur-md border-l border-zafting-accent/10 h-screen fixed right-0 top-0 overflow-y-auto z-50">
      <div className="p-6 flex items-center justify-center border-b border-zafting-accent/10">
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="Divine Logo" className="w-12 h-12" />
          <h1 className="text-xl font-serif text-zafting-accent font-bold">Divine Admin</h1>
        </div>
      </div>
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-zafting-accent text-white shadow-md' 
                      : 'text-zafting-text hover:bg-zafting-accent/10'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
