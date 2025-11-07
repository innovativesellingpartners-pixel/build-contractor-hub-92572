import { NavLink } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  Settings,
  LifeBuoy,
  ClipboardList,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ct1Logo from '@/assets/ct1-logo-main.png';

const navItems = [
  { to: '/admin', icon: Users, label: 'User Management', end: true },
  { to: '/admin/leads', icon: ClipboardList, label: 'Leads' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/admin/customers', icon: UserCheck, label: 'Customers' },
  { to: '/admin/support', icon: LifeBuoy, label: 'Support Tickets' },
  { to: '/admin/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-card border-r min-h-screen">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8" />
          <span className="font-semibold text-sm">Admin Portal</span>
        </div>
      </div>
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