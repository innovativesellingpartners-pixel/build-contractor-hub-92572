import { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Briefcase, 
  Users, 
  Phone, 
  Calendar, 
  Mail,
  Menu,
  X,
  FileText,
  BarChart2,
  DollarSign,
  Link as LinkIcon,
  LayoutTemplate,
  ArrowLeft,
  CreditCard,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from './BottomNav';
import { BackNavigation } from './BackNavigation';
import CRMDashboard from './sections/CRMDashboard';
import LeadsSection from './sections/LeadsSection';
import JobsSection from './sections/JobsSection';
import CustomersSection from './sections/CustomersSection';
import CallsSection from './sections/CallsSection';
import CalendarSection from './sections/CalendarSection';
import EmailsSection from './sections/EmailsSection';
import EstimatesSection from './sections/EstimatesSection';
import FinancialsSection from './sections/FinancialsSection';
import MoreSection from './sections/MoreSection';
import InvoicesSection from './sections/InvoicesSection';

import ct1Logo from '@/assets/ct1-round-logo-new.png';
import Reporting from '@/pages/Reporting';
import Accounting from '@/pages/Accounting';
import { MobileLandingPage } from './MobileLandingPage';
import { PaymentsBankingSection } from './sections/PaymentsBankingSection';
import { TemplatesSection } from './estimate/TemplatesSection';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'calendar' | 'emails' | 'estimates' | 'reporting' | 'financials' | 'more' | 'payments' | 'accounting' | 'invoices' | 'templates';

interface CT1CRMProps {
  onOpenPocketbot?: () => void;
}

export default function CT1CRM({ onOpenPocketbot }: CT1CRMProps = {}) {

const navItems = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
  { id: 'jobs' as Section, label: 'Jobs', icon: Briefcase },
  { id: 'estimates' as Section, label: 'Estimates', icon: FileText },
  { id: 'emails' as Section, label: 'Emails', icon: Mail },
  { id: 'calls' as Section, label: 'Calls', icon: Phone },
  { id: 'calendar' as Section, label: 'Calendar', icon: Calendar },
  { id: 'invoices' as Section, label: 'Invoices', icon: Receipt },
  { id: 'accounting' as Section, label: 'Accounting', icon: DollarSign },
  { id: 'templates' as Section, label: 'Templates', icon: LayoutTemplate },
  { id: 'payments' as Section, label: 'Payments', icon: CreditCard },
  { id: 'reporting' as Section, label: 'Reporting', icon: BarChart2 },
  { id: 'customers' as Section, label: 'Customers', icon: Users },
];

// Component moved to accept props - see above

  // Persist active section in sessionStorage
  const getInitialSection = (): Section => {
    // Check for URL param from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const crmSection = params.get('crm_section') as Section | null;
    if (crmSection && ['dashboard', 'leads', 'jobs', 'customers', 'calls', 'calendar', 'emails', 'estimates', 'reporting', 'financials', 'more', 'payments', 'accounting', 'invoices', 'templates'].includes(crmSection)) {
      sessionStorage.setItem('ct1CrmActiveSection', crmSection);
      // Clean URL param
      params.delete('crm_section');
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      return crmSection;
    }
    const saved = sessionStorage.getItem('ct1CrmActiveSection') as Section | null;
    // Default to 'dashboard' for 4-tile landing
    return saved || 'dashboard';
  };
  
  const getInitialLandingState = (): boolean => {
    const saved = sessionStorage.getItem('ct1CrmShowLanding');
    // Show landing by default if on dashboard
    if (saved === null) return true;
    return saved === 'true';
  };
  
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileLanding, setShowMobileLanding] = useState(getInitialLandingState);
  const [navigationHistory, setNavigationHistory] = useState<Section[]>([]);
  const [initialEstimateId, setInitialEstimateId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Save active section to sessionStorage whenever it changes
  const handleSectionChange = (section: string) => {
    // Check if navigating to a specific estimate (format: "estimate:uuid")
    if (section.startsWith('estimate:')) {
      const estimateId = section.split(':')[1];
      setInitialEstimateId(estimateId);
      // Push current section to navigation history before switching
      setNavigationHistory(prev => [...prev, activeSection]);
      setActiveSection('estimates');
      sessionStorage.setItem('ct1CrmActiveSection', 'estimates');
      setShowMobileLanding(false);
      sessionStorage.setItem('ct1CrmShowLanding', 'false');
      if (isMobile) {
        setMobileMenuOpen(false);
      }
      return;
    }
    
    // Clear initial estimate ID when navigating normally
    setInitialEstimateId(null);
    
    // Push current section to navigation history before switching
    setNavigationHistory(prev => [...prev, activeSection]);
    
    setActiveSection(section as Section);
    sessionStorage.setItem('ct1CrmActiveSection', section);
    
    // Hide landing page when navigating to any non-dashboard section
    if (section !== 'dashboard' && showMobileLanding) {
      setShowMobileLanding(false);
      sessionStorage.setItem('ct1CrmShowLanding', 'false');
    } else if (section === 'dashboard') {
      // Show landing page when explicitly navigating back to dashboard
      setShowMobileLanding(true);
      sessionStorage.setItem('ct1CrmShowLanding', 'true');
    }
    
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Handle back navigation using internal history stack
  const handleBack = () => {
    if (navigationHistory.length > 0) {
      const previousSection = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setActiveSection(previousSection);
      sessionStorage.setItem('ct1CrmActiveSection', previousSection);
      
      if (previousSection === 'dashboard') {
        setShowMobileLanding(true);
        sessionStorage.setItem('ct1CrmShowLanding', 'true');
      } else {
        setShowMobileLanding(false);
        sessionStorage.setItem('ct1CrmShowLanding', 'false');
      }
    } else {
      // If no history, go to dashboard
      setActiveSection('dashboard');
      setShowMobileLanding(true);
      sessionStorage.setItem('ct1CrmActiveSection', 'dashboard');
      sessionStorage.setItem('ct1CrmShowLanding', 'true');
    }
  };

  const renderSection = () => {
    // Show landing page on both mobile and desktop when on dashboard AND landing is active
    if (showMobileLanding && activeSection === 'dashboard') {
      return (
        <MobileLandingPage 
          onNavigateToJobs={() => handleSectionChange('jobs')}
          onNavigateToEstimates={() => handleSectionChange('estimates')}
          onNavigateToCustomers={() => handleSectionChange('customers')}
          onNavigateToEmails={() => handleSectionChange('emails')}
          onNavigateToAccounting={() => handleSectionChange('accounting')}
          onNavigateToCalls={() => handleSectionChange('calls')}
          onNavigateToCalendar={() => handleSectionChange('calendar')}
          onNavigateToInvoices={() => handleSectionChange('invoices')}
        />
      );
    }
    
    switch (activeSection) {
      case 'dashboard':
        return <CRMDashboard onSectionChange={handleSectionChange} />;
      case 'leads':
        return <LeadsSection onSectionChange={handleSectionChange} />;
      case 'jobs':
        return <JobsSection onSectionChange={handleSectionChange} />;
      case 'customers':
        return <CustomersSection onSectionChange={handleSectionChange} />;
      case 'calls':
        return <CallsSection onSectionChange={handleSectionChange} />;
      case 'calendar':
        return <CalendarSection onSectionChange={handleSectionChange} />;
      case 'emails':
        return <EmailsSection onSectionChange={handleSectionChange} />;
      case 'estimates':
        return <EstimatesSection onSectionChange={handleSectionChange} initialEstimateId={initialEstimateId} onClearInitialEstimate={() => setInitialEstimateId(null)} />;
      case 'invoices':
        return <InvoicesSection onSectionChange={handleSectionChange} />;
      case 'templates':
        return <TemplatesSection onBack={() => handleSectionChange('dashboard')} />;
      case 'financials':
        return <FinancialsSection onSectionChange={handleSectionChange} />;
      case 'reporting':
        return <Reporting />;
      case 'more':
        return <MoreSection onSectionChange={handleSectionChange} />;
      case 'payments':
        return <PaymentsBankingSection />;
      case 'accounting':
        return <Accounting />;
      default:
        return <CRMDashboard onSectionChange={handleSectionChange} />;
    }
  };

  const NavigationContent = () => (
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
              {(!isMobile || mobileMenuOpen || sidebarOpen) && <span>{item.label}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className={cn("flex h-full w-full bg-background", isMobile && "flex-col")}>
      {/* Mobile Navigation */}
      {isMobile ? (
        <>

          {/* Back Navigation for Mobile - Always visible */}
          {isMobile && !showMobileLanding && (
            <div className="border-b bg-card px-4 py-2">
              <BackNavigation 
                onBack={handleBack}
                onBackToDashboard={() => {
                  setNavigationHistory([]);
                  setActiveSection('dashboard');
                  setShowMobileLanding(true);
                  sessionStorage.setItem('ct1CrmActiveSection', 'dashboard');
                  sessionStorage.setItem('ct1CrmShowLanding', 'true');
                }}
                showBackButton={true}
              />
            </div>
          )}

          {/* Main Content with bottom padding for nav */}
          <main className="flex-1 overflow-hidden w-full pb-20 bg-background">
            <div className="h-full overflow-y-auto overflow-x-hidden">
              <div className="min-h-full w-full pb-4">
                {renderSection()}
              </div>
            </div>
          </main>

          {/* Bottom Navigation */}
          <BottomNav 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
          />
        </>
      ) : (
        <>
          {/* Desktop Sidebar */}
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

            <NavigationContent />
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {renderSection()}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
