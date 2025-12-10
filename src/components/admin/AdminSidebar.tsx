import { NavLink } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  Settings,
  LifeBuoy,
  ClipboardList,
  Briefcase,
  UserCheck,
  FileText,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ct1Logo from '@/assets/ct1-logo-main.png';

const navItems = [
  { to: '/admin', icon: Users, label: 'User Management', end: true },
  { to: '/admin/leads', icon: ClipboardList, label: 'Leads' },
  { to: '/admin/estimates', icon: FileText, label: 'Estimates' },
  { to: '/admin/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/admin/customers', icon: UserCheck, label: 'Customers' },
  { to: '/admin/support', icon: LifeBuoy, label: 'Support Tickets' },
  { to: '/admin/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-16 sm:w-48 md:w-64 bg-card border-r min-h-screen">
      <div className="p-2 sm:p-4 border-b">
        <div className="flex items-center gap-2">
          <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 mx-auto sm:mx-0" />
          <span className="font-semibold text-sm hidden sm:inline">Admin Portal</span>
        </div>
      </div>
      <nav className="p-2 sm:p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 sm:px-4 py-3 rounded-lg transition-colors justify-center sm:justify-start',
                'hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};