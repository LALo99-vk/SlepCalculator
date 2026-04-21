import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Calculator, FileText, Users, Package, Settings, UserCheck, X, Building2, Layers } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'History', href: '/history', icon: FileText },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Materials', href: '/materials', icon: Package },
    { name: 'Custom Records', href: '/custom-records', icon: Layers },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Users', href: '/users', icon: UserCheck },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-lg font-semibold">SLEP System</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-primary-600 text-white dark:bg-primary-600 dark:text-white' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;