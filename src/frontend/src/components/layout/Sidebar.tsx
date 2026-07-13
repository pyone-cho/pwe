import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const memberNavItems = [
  { to: '/events', label: 'Events', icon: '📅' },
  { to: '/announcements', label: 'Announcements', icon: '📢' },
];

const staffNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

const adminItems = [
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, organization } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-xl font-bold text-indigo-600">PWE</h1>
            {organization && (
              <p className="text-xs text-gray-500 truncate mt-1">{organization.name}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {memberNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            {isStaff && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Staff</p>
                </div>
                {staffNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )
                    }
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Admin</p>
                </div>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )
                    }
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
