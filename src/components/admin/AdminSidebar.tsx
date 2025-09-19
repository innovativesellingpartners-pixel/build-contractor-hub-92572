import { NavLink } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: Home, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/training', icon: BookOpen, label: 'Training Content' },
  { to: '/admin/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-card border-r min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};