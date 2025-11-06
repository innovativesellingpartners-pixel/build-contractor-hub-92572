import { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Target, 
  Briefcase, 
  Users, 
  Phone, 
  Calendar, 
  Mail,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import CRMDashboard from './sections/CRMDashboard';
import LeadsSection from './sections/LeadsSection';
import OpportunitiesSection from './sections/OpportunitiesSection';
import JobsSection from './sections/JobsSection';
import CustomersSection from './sections/CustomersSection';
import CallsSection from './sections/CallsSection';
import CalendarSection from './sections/CalendarSection';
import EmailsSection from './sections/EmailsSection';
import EstimatesSection from './sections/EstimatesSection';
import ct1Logo from '@/assets/ct1-logo-main.png';

type Section = 'dashboard' | 'leads' | 'opportunities' | 'jobs' | 'customers' | 'calls' | 'calendar' | 'emails' | 'estimates';

const navItems = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
  { id: 'opportunities' as Section, label: 'Opportunities', icon: Target },
  { id: 'jobs' as Section, label: 'Jobs', icon: Briefcase },
  { id: 'customers' as Section, label: 'Customers', icon: Users },
  { id: 'estimates' as Section, label: 'Estimates', icon: FileText },
  { id: 'calls' as Section, label: 'Calls', icon: Phone },
  { id: 'calendar' as Section, label: 'Calendar', icon: Calendar },
  { id: 'emails' as Section, label: 'Emails', icon: Mail },
];

export default function CT1CRM() {
  // Persist active section in sessionStorage
  const getInitialSection = (): Section => {
    const saved = sessionStorage.getItem('ct1CrmActiveSection');
    return (saved as Section) || 'dashboard';
  };
  
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Save active section to sessionStorage whenever it changes
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    sessionStorage.setItem('ct1CrmActiveSection', section);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CRMDashboard />;
      case 'leads':
        return <LeadsSection />;
      case 'opportunities':
        return <OpportunitiesSection />;
      case 'jobs':
        return <JobsSection />;
      case 'customers':
        return <CustomersSection />;
      case 'calls':
        return <CallsSection />;
      case 'calendar':
        return <CalendarSection />;
      case 'emails':
        return <EmailsSection />;
      case 'estimates':
        return <EstimatesSection />;
      default:
        return <CRMDashboard />;
    }
  };

  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col bg-card border-r transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
              <span className="font-semibold">CT1 CRM</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-accent',
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
