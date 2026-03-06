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
  Receipt,
  Building2,
  HelpCircle,
  Archive,
  GraduationCap,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

const navItems = [
  { to: '/admin', icon: Users, label: 'User Management', end: true },
  { to: '/admin/leads', icon: ClipboardList, label: 'Leads' },
  { to: '/admin/estimates', icon: FileText, label: 'Estimates' },
  { to: '/admin/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/admin/customers', icon: UserCheck, label: 'Customers' },
  { to: '/admin/gc-contacts', icon: Building2, label: 'GC Contacts' },
  { to: '/admin/archive', icon: Archive, label: 'Archive' },
  { to: '/admin/onboarding', icon: GraduationCap, label: 'Onboarding' },
  { to: '/admin/support', icon: LifeBuoy, label: 'Support Tickets' },
  { to: '/admin/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  { to: '/admin/help', icon: HelpCircle, label: 'Help Admin' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export const AdminSidebar = ({ onNavigate }: AdminSidebarProps) => {
  return (
    <aside className="w-full sm:w-48 md:w-64 bg-card border-r min-h-screen flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8" />
          <span className="font-semibold text-sm">Admin Portal</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
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
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};