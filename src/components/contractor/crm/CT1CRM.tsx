import { useState, useEffect, useRef } from 'react';
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
  Receipt,
  Building2,
  Contact,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BookOpen, 
  Bot, 
  Store, 
  Shield, 
  Award, 
  Mic, 
  User, 
  HelpCircle,
  ClipboardList as ClipboardListHub
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useScrollDirection } from '@/hooks/useScrollDirection';
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
import GCSection from './sections/GCSection';
import ContactsSection from './sections/ContactsSection';
import PortalSection from './sections/PortalSection';
import CrewsSection from './sections/CrewsSection';
import DocumentsSection from './sections/DocumentsSection';
import ContractorNetworkSection from './sections/ContractorNetworkSection';
import TeamManagement from '@/components/contractor/TeamManagement';
import CRMSearchBar from './CRMSearchBar';
import AIReportView from './sections/AIReportView';
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import { Link } from 'react-router-dom';
import Reporting from '@/pages/Reporting';
import Accounting from '@/pages/Accounting';
import { MobileLandingPage } from './MobileLandingPage';
import { PaymentsBankingSection } from './sections/PaymentsBankingSection';
import { TemplatesSection } from './estimate/TemplatesSection';
import { LegalLinks } from '@/components/LegalLinks';

import { crmNavItems as navItemsConfig, hubNavItemsCRM, type CRMSection } from "@/config/navigation";

type Section = CRMSection;

interface CT1CRMProps {
  onOpenPocketAgent?: () => void;
  onSectionChange?: (section: string) => void;
  onHubSectionChange?: (section: string) => void;
  tierFeatures?: {
    trainingHub: boolean;
    crm: boolean;
    monthlyCall: boolean;
    insurance: boolean;
    podcast: boolean;
    standards: boolean;
    myAccount: boolean;
    home: boolean;
    leads: boolean;
    aiAssistant: boolean;
    marketplace: boolean;
  };
  activeHubSection?: string;
}

export default function CT1CRM({ onOpenPocketAgent, onSectionChange, onHubSectionChange, tierFeatures, activeHubSection }: CT1CRMProps = {}) {

const navItems = navItemsConfig;

// Component moved to accept props - see above

  // Persist active section in sessionStorage
  const getInitialSection = (): Section => {
    // Check for URL param from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const crmSection = params.get('crm_section') as Section | null;
    if (crmSection && ['dashboard', 'leads', 'jobs', 'customers', 'calls', 'calendar', 'emails', 'estimates', 'reporting', 'financials', 'more', 'payments', 'accounting', 'invoices', 'templates', 'gc', 'contacts', 'help', 'portal', 'ai-report', 'crews', 'documents'].includes(crmSection)) {
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
  const [initialJobId, setInitialJobId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingDown = useScrollDirection(scrollContainerRef);

  // Save active section to sessionStorage whenever it changes
  const handleSectionChange = (section: string) => {
    // Check if navigating to a specific estimate (format: "estimate:uuid")
    if (section.startsWith('estimate:')) {
      const estimateId = section.split(':')[1];
      setInitialEstimateId(estimateId);
      setInitialJobId(null);
      // Push current section to navigation history before switching
      setNavigationHistory(prev => [...prev, activeSection]);
      setActiveSection('estimates');
      sessionStorage.setItem('ct1CrmActiveSection', 'estimates');
      setShowMobileLanding(false);
      sessionStorage.setItem('ct1CrmShowLanding', 'false');
      onSectionChange?.('estimates');
      if (isMobile) {
        setMobileMenuOpen(false);
      }
      return;
    }
    
    // Check if navigating to a specific job (format: "job:uuid")
    if (section.startsWith('job:')) {
      const jobId = section.split(':')[1];
      setInitialJobId(jobId);
      setInitialEstimateId(null);
      // Push current section to navigation history before switching
      setNavigationHistory(prev => [...prev, activeSection]);
      setActiveSection('jobs');
      sessionStorage.setItem('ct1CrmActiveSection', 'jobs');
      setShowMobileLanding(false);
      sessionStorage.setItem('ct1CrmShowLanding', 'false');
      onSectionChange?.('jobs');
      if (isMobile) {
        setMobileMenuOpen(false);
      }
      return;
    }
    
    // Clear initial IDs when navigating normally
    setInitialEstimateId(null);
    setInitialJobId(null);
    
    // Push current section to navigation history before switching
    setNavigationHistory(prev => [...prev, activeSection]);
    
    setActiveSection(section as Section);
    sessionStorage.setItem('ct1CrmActiveSection', section);
    onSectionChange?.(section);
    
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
  
  // Notify parent of initial section on mount
  useEffect(() => {
    onSectionChange?.(activeSection);
  }, []);

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
          onNavigateToLeads={() => handleSectionChange('leads')}
          onNavigateToReporting={() => handleSectionChange('reporting')}
          onNavigateToPortal={() => handleSectionChange('portal')}
          onNavigateToCrews={() => handleSectionChange('crews')}
          onNavigateToDocuments={() => handleSectionChange('documents')}
          onNavigateToTeam={() => handleSectionChange('team')}
        />
      );
    }
    
    switch (activeSection) {
      case 'dashboard':
        return <CRMDashboard onSectionChange={handleSectionChange} />;
      case 'leads':
        return <LeadsSection onSectionChange={handleSectionChange} />;
      case 'jobs':
        return <JobsSection onSectionChange={handleSectionChange} initialJobId={initialJobId} onClearInitialJob={() => setInitialJobId(null)} />;
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
      case 'gc':
        return <GCSection onSectionChange={handleSectionChange} />;
      case 'contacts':
        return <ContactsSection onSectionChange={handleSectionChange} />;
      case 'portal':
        return <PortalSection />;
      case 'crews':
        return <CrewsSection onSectionChange={handleSectionChange} />;
      case 'documents':
        return <DocumentsSection onSectionChange={handleSectionChange} />;
      case 'network':
        return <ContractorNetworkSection onSectionChange={handleSectionChange} />;
      case 'team':
        return <TeamManagement onBack={() => handleSectionChange('dashboard')} />;
      case 'ai-report':
        return <AIReportView onBack={handleBack} />;
      default:
        return <CRMDashboard onSectionChange={handleSectionChange} />;
    }
  };

  const hubNavItemsLocal = hubNavItemsCRM;

  const NavButton = ({ icon: Icon, label, isActive, onClick }: { icon: any; label: string; isActive: boolean; onClick: () => void }) => {
    const button = (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 rounded-lg transition-colors',
          sidebarOpen ? 'px-3 py-2' : 'justify-center p-2.5',
          'hover:bg-accent',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {sidebarOpen && <span className="text-sm">{label}</span>}
      </button>
    );

    if (!sidebarOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const NavigationContent = () => (
    <TooltipProvider>
      <nav className={cn("flex-1 overflow-y-auto overscroll-contain", sidebarOpen ? "p-4" : "p-2")} style={{ WebkitOverflowScrolling: 'touch' }}>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <NavButton
                icon={item.icon}
                label={item.label}
                isActive={activeSection === item.id}
                onClick={() => handleSectionChange(item.id)}
              />
            </li>
          ))}
        </ul>

        {/* Hub Navigation - Desktop only */}
        {!isMobile && onHubSectionChange && (
          <>
            <Separator className="my-3" />
            {sidebarOpen && (
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                CT1 Hub
              </p>
            )}
            <ul className="space-y-1 mt-1">
              {hubNavItems
                .filter(item => !item.feature || !tierFeatures || tierFeatures[item.feature])
                .map((item) => (
                  <li key={item.id}>
                    <NavButton
                      icon={item.icon}
                      label={item.label}
                      isActive={activeHubSection === item.id}
                      onClick={() => onHubSectionChange(item.id)}
                    />
                  </li>
                ))}
            </ul>
          </>
        )}
      </nav>
    </TooltipProvider>
  );

  return (
    <div className={cn("flex h-full w-full bg-background", isMobile && "flex-col")}>
      {/* Mobile Navigation */}
      {isMobile ? (
        <>

          {/* Search bar for mobile - sections already have their own back/dash nav */}
          {isMobile && !showMobileLanding && (
            <div className="border-b bg-card px-3 py-2 overflow-hidden max-w-full flex items-center justify-end gap-2">
              <CRMSearchBar onNavigate={handleSectionChange} />
            </div>
          )}

          {/* Main Content with bottom padding for nav - overflow protected */}
          <main className={cn("flex-1 overflow-hidden w-full max-w-full bg-background transition-[padding-bottom] duration-300", isScrollingDown ? "pb-6" : "pb-28")}>
            <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden max-w-full overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              <div className="min-h-full w-full max-w-full pb-6">
                {renderSection()}
              </div>
            </div>
          </main>

          {/* Bottom Navigation */}
          <BottomNav 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange}
            hidden={isScrollingDown}
          />
        </>
      ) : (
        <>
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              'flex-shrink-0 flex flex-col bg-card border-r transition-all duration-300',
              sidebarOpen ? 'w-64' : 'w-14'
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex items-center border-b",
              sidebarOpen ? "justify-between p-4" : "justify-center p-3"
            )}>
              {sidebarOpen && (
                <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
                  <span className="font-semibold">CT1 CRM</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>

            <NavigationContent />
            {sidebarOpen && <LegalLinks />}
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Desktop Search Bar */}
            <div className="border-b bg-card/50 px-6 py-2.5 flex items-center justify-end">
              <CRMSearchBar onNavigate={handleSectionChange} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderSection()}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
