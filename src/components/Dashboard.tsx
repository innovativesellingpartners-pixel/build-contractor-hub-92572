import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BookOpen,
  Store,
  Building2,
  LogOut,
  HelpCircle,
  MapPin,
  Phone,
  Mail,
  Shield,
  Users,
  FileText,
  Briefcase,
  User,
  CreditCard,
  ArrowUpCircle,
  Bot,
  Mic,
  Award,
  Menu,
  X,
  BarChart3,
  Smartphone,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  DollarSign,
  Receipt,
  Globe,
  Percent,
  Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrainingHub } from "@/components/TrainingHub";
import { Marketplace } from "@/components/Marketplace";
import CT1CRM from "@/components/contractor/crm/CT1CRM";
import { Insurance } from "@/components/contractor/Insurance";
import { ProfileEditDialog } from "@/components/contractor/ProfileEditDialog";
import { StarRating } from "@/components/contractor/StarRating";
import { AccountDocuments } from "@/components/contractor/AccountDocuments";
import { FloatingPocketAgent } from "@/components/contractor/FloatingPocketbot";
import { ContactSupport } from "@/components/ContactSupport";

import { BottomNav } from "@/components/contractor/crm/BottomNav";
import { BackNavigation } from "@/components/contractor/crm/BackNavigation";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

import { VoiceAI } from "@/components/contractor/VoiceAI";
import Reporting from "@/pages/Reporting";
import HelpCenter from "@/components/help/HelpCenter";

import { PersonalTasks } from "@/components/contractor/PersonalTasks";
import { ConnectionsHub } from "@/components/contractor/ConnectionsHub";

type ActiveSection = 'training' | 'crm' | 'marketplace' | 'leads' | 'insurance' | 'account' | 'voiceai' | 'reporting' | 'tasks' | 'help' | 'connections';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { tierFeatures, hasFullAccess } = useUserTier();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Persist active section in sessionStorage
  const getInitialSection = (): ActiveSection => {
    const saved = sessionStorage.getItem('dashboardActiveSection') as ActiveSection | null;
    // Remap old 'training' value to 'leads' for mobile 4-tile landing
    if (saved === 'training') {
      sessionStorage.removeItem('dashboardActiveSection');
      return 'leads';
    }
    return saved || 'leads';
  };
  
  const [activeSection, setActiveSection] = useState<ActiveSection>(getInitialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pocketAgentOpen, setPocketAgentOpen] = useState(false);
  const [pocketAgentPosition, setPocketAgentPosition] = useState('20px');
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [upgradePlanOpen, setUpgradePlanOpen] = useState(false);
  const [crmActiveSection, setCrmActiveSection] = useState<string>(() => {
    // Initialize from sessionStorage to sync with CRM
    return sessionStorage.getItem('ct1CrmActiveSection') || 'dashboard';
  });
  const [chatButtonPosition, setChatButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingChatButton, setIsDraggingChatButton] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [chatButtonDragOffset, setChatButtonDragOffset] = useState({ x: 0, y: 0 });
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const chatButtonRef = useRef<HTMLButtonElement | null>(null);

  // Handle Voice AI post-payment redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("voice_ai_activated") === "true") {
      setActiveSection("voiceai");
      // VoiceAI component will handle the actual activation
    }
  }, []);

  useEffect(() => {
    if (!chatButtonRef.current || chatButtonPosition) return;

    const button = chatButtonRef.current;
    const rect = button.getBoundingClientRect();
    setChatButtonPosition({
      x: window.innerWidth - rect.width - 24,
      y: window.innerHeight - rect.height - 24,
    });
  }, [chatButtonPosition]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingChatButton || !chatButtonRef.current) return;

      const point =
        e instanceof TouchEvent ? e.touches[0] : (e as MouseEvent);

      // Check if user moved enough to be considered a drag (5px threshold)
      if (dragStartPosition.current) {
        const dx = Math.abs(point.clientX - dragStartPosition.current.x);
        const dy = Math.abs(point.clientY - dragStartPosition.current.y);
        if (dx > 5 || dy > 5) {
          setHasDragged(true);
        }
      }

      const newX = point.clientX - chatButtonDragOffset.x;
      const newY = point.clientY - chatButtonDragOffset.y;

      const button = chatButtonRef.current;
      const rect = button.getBoundingClientRect();
      const minX = 0;
      const maxX = window.innerWidth - rect.width;
      const minY = 0;
      const maxY = window.innerHeight - rect.height;

      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));

      setChatButtonPosition({ x: constrainedX, y: constrainedY });
    };

    const handleUp = () => {
      if (!isDraggingChatButton) return;
      setIsDraggingChatButton(false);
      dragStartPosition.current = null;
      if (chatButtonPosition) {
        localStorage.setItem(
          'ct1_chat_button_position',
          JSON.stringify(chatButtonPosition)
        );
      }
    };

    if (isDraggingChatButton) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchend', handleUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingChatButton, chatButtonDragOffset, chatButtonPosition]);

  useEffect(() => {
    const saved = localStorage.getItem('ct1_chat_button_position');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number'
      ) {
        setChatButtonPosition(parsed);
      }
    } catch {
      // ignore bad data
    }
  }, []);

  const handleChatButtonDragStart = (
    e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>
  ) => {
    if (!chatButtonRef.current) return;

    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    const rect = chatButtonRef.current.getBoundingClientRect();

    dragStartPosition.current = { x: point.clientX, y: point.clientY };
    setHasDragged(false);
    setChatButtonDragOffset({
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    });
    setIsDraggingChatButton(true);
  };

  const handleChatButtonClick = () => {
    // Only toggle Pocket Agent if user didn't drag
    if (!hasDragged) {
      setPocketAgentOpen(!pocketAgentOpen);
    }
    // Reset drag state after click
    setHasDragged(false);
  };

  // Save active section to sessionStorage whenever it changes
  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
    sessionStorage.setItem('dashboardActiveSection', section);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'launch': return 'LAUNCH Growth Starter';
      case 'growth': return 'Growth Business Builder';
      case 'accel': return 'Accel! Market Dominator';
      default: return 'LAUNCH Growth Starter';
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'launch': return 'bg-blue-500';
      case 'growth': return 'bg-green-500';
      case 'accel': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <div
        className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden border-border">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
                  <div className="py-4">
                    {activeSection === 'leads' ? (
                      <CRMSidebarNav 
                        onSectionChange={(section) => {
                          sessionStorage.setItem('ct1CrmActiveSection', section);
                          // Also set the landing state for dashboard
                          if (section === 'dashboard') {
                            sessionStorage.setItem('ct1CrmShowLanding', 'true');
                          } else {
                            sessionStorage.setItem('ct1CrmShowLanding', 'false');
                          }
                          // Force re-render of CRM by briefly switching away and back
                          setActiveSection('training');
                          setTimeout(() => setActiveSection('leads'), 0);
                          setMobileMenuOpen(false);
                        }}
                      />
                    ) : (
                      <SidebarNav 
                        activeSection={activeSection} 
                        setActiveSection={handleSectionChange} 
                        tierFeatures={tierFeatures}
                      />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/" className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity">
                <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 md:h-10 md:w-10" />
                <div className="hidden sm:block">
                  <h1 className="text-sm md:text-base font-semibold text-foreground">CT1 Contractor Hub</h1>
                  <p className="text-xs text-muted-foreground">Hello, {profile?.contact_name || 'Contractor'}</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/60 rounded-lg border border-border/40">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{profile?.company_name || 'Your Company'}</span>
              </div>
              
              {/* Home Button */}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors"
              >
                <Link to="/home">
                  <Home className="h-4 w-4" />
                  <span className="text-xs">Home</span>
                </Link>
              </Button>

              {/* Account Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSectionChange('account')}
                className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="text-xs">Acct</span>
              </Button>
              
              {/* Help Button */}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors"
              >
                <Link to="/dashboard/helpcenter">
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-xs">Help</span>
                </Link>
              </Button>
              
              {/* Get App Button */}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors"
              >
                <Link to="/app-install">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs">App</span>
                </Link>
              </Button>
              
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors">
                  <Link to="/admin">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs">Admin</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-1 px-2 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Name Banner */}
      <div 
        className="bg-foreground text-background border-b border-border/10"
        style={{ 
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingBottom: "0.625rem"
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {profile?.company_name || profile?.contact_name || 'Your Business'}
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 pt-4 pb-6 flex-1 flex gap-0">
        {/* Main Content Panel */}
        <div className="flex-1 overflow-auto min-w-0">
          {activeSection === 'leads' ? (
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <CT1CRM 
                onOpenPocketAgent={() => setPocketAgentOpen(true)}
                onSectionChange={(section) => {
                  if (section === 'help') {
                    navigate('/dashboard/helpcenter');
                  } else {
                    setCrmActiveSection(section);
                  }
                }}
                onHubSectionChange={handleSectionChange}
                tierFeatures={tierFeatures}
                activeHubSection={activeSection}
              />
            </div>
          ) : (
            <div className="flex h-full">
              {/* Unified Sidebar for non-CRM sections on desktop */}
              <div className="hidden lg:flex flex-shrink-0">
                <UnifiedHubSidebar 
                  activeHubSection={activeSection}
                  onHubSectionChange={handleSectionChange}
                  onCrmSectionChange={(section) => {
                    handleSectionChange('leads');
                    sessionStorage.setItem('ct1CrmActiveSection', section);
                    sessionStorage.setItem('ct1CrmShowLanding', section === 'dashboard' ? 'true' : 'false');
                  }}
                  tierFeatures={tierFeatures}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-card border border-border/40 rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  {activeSection === 'training' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <TrainingHub />
                    </div>
                  )}
                  {activeSection === 'insurance' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <Insurance />
                    </div>
                  )}
                  {activeSection === 'voiceai' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <VoiceAI />
                    </div>
                  )}
                  {activeSection === 'reporting' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <Reporting />
                    </div>
                  )}
                  {activeSection === 'tasks' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <PersonalTasks />
                    </div>
                  )}
                  {activeSection === 'marketplace' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('leads')}
                        className="mb-4 lg:hidden"
                      />
                      <Marketplace />
                    </div>
                  )}
                  {activeSection === 'help' && (
                    <div className="min-h-[400px] md:min-h-[600px] pb-20">
                      <HelpCenter 
                        onBack={() => handleSectionChange('leads')} 
                        onNavigateToSection={(section) => handleSectionChange(section as ActiveSection)}
                      />
                    </div>
                  )}
                  {activeSection === 'connections' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <BackNavigation 
                        onBackToDashboard={() => handleSectionChange('account')}
                        className="mb-4"
                      />
                      <ConnectionsHub onNavigate={handleSectionChange} />
                    </div>
                  )}
                  {activeSection === 'account' && (
                    <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px] pb-20">
                      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                        <BackNavigation 
                          onBackToDashboard={() => handleSectionChange('leads')}
                          className="mb-4 lg:hidden"
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                          <div>
                            <h2 className="text-2xl md:text-3xl font-bold">My Account</h2>
                            <p className="text-sm text-muted-foreground">Manage your business profile and branding</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <ProfileEditDialog />
                            <Badge variant="outline" className="text-xs md:text-sm">
                              ID: {user?.id?.substring(0, 8)}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Billing & Upgrade Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="group bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 rounded-xl p-6 space-y-4 hover:shadow-lg hover:border-primary/50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CreditCard className="h-6 w-6 text-primary" />
                              </div>
                              <h3 className="text-xl font-semibold">Pay My CT1 Bill</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Keep your subscription active by paying your monthly bill securely.
                            </p>
                            <Button 
                              className="w-full shadow-md hover:shadow-lg transition-shadow" 
                              size="lg"
                              asChild
                            >
                              <Link to="/pay-bill">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Bill
                              </Link>
                            </Button>
                          </div>
                          
                          <div className="group bg-gradient-to-br from-muted/30 to-muted/50 border-2 border-border rounded-xl p-6 space-y-4 hover:shadow-lg hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowUpCircle className="h-6 w-6 text-primary" />
                              </div>
                              <h3 className="text-xl font-semibold">Upgrade Plan</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Unlock more features and grow your business faster.
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full hover:bg-primary/10 transition-colors" 
                              size="lg"
                              onClick={() => setUpgradePlanOpen(true)}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              View Plans
                            </Button>
                          </div>
                        </div>
                        
                        {/* Connections Card */}
                        <div 
                          className="group flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                          onClick={() => handleSectionChange('connections')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Globe className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold">Connections</h3>
                              <p className="text-sm text-muted-foreground">Banking, calendar, email, and other integrations</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleSectionChange('connections'); }}
                          >
                            Manage
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {/* Account Information Card */}
                          <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
                            <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Account Information
                              </h3>
                            </div>
                            <div className="p-6 space-y-4">
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Mail className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                                  <p className="font-medium">{user?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <User className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Contact Name</p>
                                  <p className="font-medium">{profile?.contact_name || 'Not set'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Phone className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Business Information Card */}
                          <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
                            <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Business Information
                              </h3>
                            </div>
                            <div className="p-6 space-y-4">
                              {/* Logo Display */}
                              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                                <div className="h-16 w-16 rounded-lg border flex items-center justify-center bg-background overflow-hidden">
                                  {profile?.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                  ) : (
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-lg">{profile?.company_name || 'Your Company'}</p>
                                  {profile?.trade && <p className="text-sm text-muted-foreground">{profile.trade}</p>}
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business Address</p>
                                  <p className="font-medium text-sm">
                                    {profile?.business_address || 'Not set'}
                                    {profile?.city && profile?.state && (
                                      <>, {profile.city}, {profile.state} {profile.zip_code}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business Email</p>
                                    <p className="font-medium text-sm truncate">{profile?.business_email || 'Not set'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Website</p>
                                    <p className="font-medium text-sm truncate">{profile?.website_url || 'Not set'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">License Number</p>
                                    <p className="font-medium">{profile?.license_number || 'Not set'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tax ID</p>
                                    <p className="font-medium">{profile?.tax_id || 'Not set'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Estimate Defaults Card */}
                        <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Percent className="h-5 w-5 text-primary" />
                              Estimate Defaults
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sales Tax Rate</p>
                                <p className="text-2xl font-bold">{profile?.default_sales_tax_rate || 6.0}%</p>
                              </div>
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Required Deposit</p>
                                <p className="text-2xl font-bold">{profile?.default_deposit_percent || 30.0}%</p>
                              </div>
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Warranty</p>
                                <p className="text-2xl font-bold">{profile?.default_warranty_years || 2} yr</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Documents Section */}
                        <AccountDocuments
                          onNavigateToDocuments={() => {
                            handleSectionChange('leads');
                            sessionStorage.setItem('ct1CrmActiveSection', 'documents');
                          }}
                        />

                        {/* Subscription Card */}
                        <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Shield className="h-5 w-5 text-primary" />
                              Subscription & Status
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Current Plan</p>
                                <Badge className={`${getTierBadgeColor(profile?.subscription_tier)} text-white shadow-md`}>
                                  {getTierLabel(profile?.subscription_tier)}
                                </Badge>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm text-muted-foreground">CT1 Contractor Number</p>
                                <p className="font-mono font-bold text-lg">#{profile?.ct1_contractor_number || 'Not assigned'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Pocket Agent Widget */}
      {pocketAgentOpen && (
        <FloatingPocketAgent 
          onClose={() => setPocketAgentOpen(false)} 
          onPositionChange={setPocketAgentPosition}
          initialPosition={chatButtonPosition || undefined}
        />
      )}
      
      {/* Contact Support Dialog */}
      <ContactSupport open={contactSupportOpen} onOpenChange={setContactSupportOpen} />
      
      {/* Upgrade Plan Dialog */}
      <Dialog open={upgradePlanOpen} onOpenChange={setUpgradePlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
              Choose an option to continue:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full" 
              size="lg"
              asChild
              onClick={() => setUpgradePlanOpen(false)}
            >
              <Link to="/pricing">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                View Available Plans
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              asChild
              onClick={() => {
                setUpgradePlanOpen(false);
                setContactSupportOpen(true);
              }}
            >
              <Link to="/contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Bottom Navigation - Show when not in CRM/leads section */}
      {isMobile && activeSection !== 'leads' && (
        <BottomNav 
          activeSection="more"
          onSectionChange={(section) => {
            // Navigate to CRM with the selected section
            handleSectionChange('leads');
            sessionStorage.setItem('ct1CrmActiveSection', section);
          }}
        />
      )}
      
      {/* Floating Chat Button - Disabled for now, using DashboardPocketAgent instead
      {(activeSection !== 'leads' || crmActiveSection === 'dashboard') && (
        <button
          ref={chatButtonRef}
          onClick={handleChatButtonClick}
          onMouseDown={handleChatButtonDragStart}
          onTouchStart={handleChatButtonDragStart}
          className="fixed z-[100] h-12 w-12 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
          style={
            chatButtonPosition
              ? { left: chatButtonPosition.x, top: chatButtonPosition.y }
              : { bottom: isMobile && activeSection !== 'leads' ? 84 : 24, right: 24 }
          }
          aria-label="Open CT1 Pocket Agent"
        >
          <img src={ct1Logo} alt="CT1" className="h-7 w-7" />
        </button>
      )}
      */}
    </div>
  );
}

// Unified Hub Sidebar - shown on desktop for non-CRM sections
interface UnifiedHubSidebarProps {
  activeHubSection: ActiveSection;
  onHubSectionChange: (section: ActiveSection) => void;
  onCrmSectionChange: (section: string) => void;
  tierFeatures: SidebarNavProps['tierFeatures'];
}

function UnifiedHubSidebar({ activeHubSection, onHubSectionChange, onCrmSectionChange, tierFeatures }: UnifiedHubSidebarProps) {
  const crmNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: ClipboardList },
    { id: 'estimates', label: 'Estimates', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reporting', label: 'Reporting', icon: BarChart3 },
  ];

  const hubNavItems: { id: ActiveSection; label: string; icon: typeof BookOpen; feature?: keyof SidebarNavProps['tierFeatures'] }[] = [
    { id: 'training', label: '5-Star Training', icon: BookOpen, feature: 'trainingHub' },
    { id: 'voiceai', label: 'Voice AI', icon: Bot, feature: 'aiAssistant' },
    { id: 'marketplace', label: 'Marketplace', icon: Store, feature: 'marketplace' },
    { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
    { id: 'insurance', label: 'Insurance', icon: Shield, feature: 'insurance' },
    { id: 'account', label: 'My Account', icon: User, feature: 'myAccount' },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
  ];

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-card border-r overflow-y-auto">
      <div className="flex items-center gap-2 p-4 border-b">
        <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
        <span className="font-semibold">CT1 CRM</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {crmNavItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className="w-full justify-start transition-all hover:bg-accent text-muted-foreground border border-transparent"
            onClick={() => onCrmSectionChange(item.id)}
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </Button>
        ))}

        <div className="my-3 border-t border-border/50" />
        <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CT1 Hub</p>

        {hubNavItems
          .filter(item => !item.feature || tierFeatures[item.feature])
          .map((item) => (
            <Button
              key={item.id}
              variant={activeHubSection === item.id ? 'default' : 'ghost'}
              className={`w-full justify-start transition-all ${
                activeHubSection === item.id
                  ? 'shadow-md'
                  : 'hover:bg-accent text-muted-foreground border border-transparent'
              }`}
              onClick={() => onHubSectionChange(item.id)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
      </nav>
    </aside>
  );
}

// Sidebar Navigation Component
interface SidebarNavProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  tierFeatures: {
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
}

function SidebarNav({ activeSection, setActiveSection, tierFeatures }: SidebarNavProps) {
  return (
    <nav className="space-y-1 p-3">
      {tierFeatures.leads && (
        <Button
          variant={activeSection === 'leads' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'leads' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('leads')}
        >
          <Briefcase className="h-4 w-4 mr-3" />
          CT1 CRM
        </Button>
      )}
      
      {tierFeatures.trainingHub && (
        <Button
          variant={activeSection === 'training' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'training' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('training')}
        >
          <BookOpen className="h-4 w-4 mr-3" />
          5-Star Training
        </Button>
      )}
      
      {tierFeatures.aiAssistant && (
        <Button
          variant={activeSection === 'voiceai' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'voiceai' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('voiceai')}
        >
          <Bot className="h-4 w-4 mr-3" />
          Voice AI
        </Button>
      )}
      
      {tierFeatures.marketplace && (
        <Button
          variant={activeSection === 'marketplace' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'marketplace' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('marketplace')}
        >
          <Store className="h-4 w-4 mr-3" />
          Marketplace
        </Button>
      )}
      
      <Button
        variant={activeSection === 'reporting' ? 'default' : 'ghost'}
        className={`w-full justify-start transition-all ${
          activeSection === 'reporting' 
            ? 'shadow-md' 
            : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
        }`}
        onClick={() => setActiveSection('reporting')}
      >
        <BarChart3 className="h-4 w-4 mr-3" />
        Reporting
      </Button>
      
      <Button
        variant={activeSection === 'tasks' ? 'default' : 'ghost'}
        className={`w-full justify-start transition-all ${
          activeSection === 'tasks' 
            ? 'shadow-md' 
            : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
        }`}
        onClick={() => setActiveSection('tasks')}
      >
        <ClipboardList className="h-4 w-4 mr-3" />
        My Tasks
      </Button>
      
      {tierFeatures.insurance && (
        <Button
          variant={activeSection === 'insurance' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'insurance' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('insurance')}
        >
          <Shield className="h-4 w-4 mr-3" />
          Insurance
        </Button>
      )}
      
      {tierFeatures.standards && (
        <Button
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
          asChild
        >
          <a href="/core-values">
            <Award className="h-4 w-4 mr-3" />
            CT1 Standards
          </a>
        </Button>
      )}
      
      {tierFeatures.podcast && (
        <Button
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
          asChild
        >
          <Link to="/blog-podcast">
            <Mic className="h-4 w-4 mr-3" />
            CT1 Podcast
          </Link>
        </Button>
      )}
      
      {tierFeatures.myAccount && (
        <Button
          variant={activeSection === 'account' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'account' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('account')}
        >
          <User className="h-4 w-4 mr-3" />
          My Account
        </Button>
      )}
      
      <div className="my-2 border-t border-border/50" />
      
      <Button
        variant="ghost"
        className="w-full justify-start transition-all hover:bg-primary/10 hover:border-primary hover:text-foreground border border-transparent"
        asChild
      >
        <Link to="/dashboard/helpcenter">
          <HelpCircle className="h-4 w-4 mr-3" />
          Help Center
        </Link>
      </Button>
      
      {tierFeatures.home && (
        <Button
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-primary/10 hover:border-primary hover:text-foreground border border-transparent"
          asChild
        >
          <a href="/">
            <Building2 className="h-4 w-4 mr-3" />
            CT1 Home
          </a>
        </Button>
      )}
    </nav>
  );
}

// CRM Sidebar Navigation Component
type CRMSection = 'dashboard' | 'leads' | 'estimates' | 'invoices' | 'jobs' | 'calls' | 'emails' | 'calendar' | 'accounting' | 'payments' | 'customers' | 'reporting';

interface CRMSidebarNavProps {
  onSectionChange: (section: CRMSection) => void;
}

function CRMSidebarNav({ onSectionChange }: CRMSidebarNavProps) {
  const crmNavItems = [
    { id: 'dashboard' as CRMSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads' as CRMSection, label: 'Leads', icon: ClipboardList },
    { id: 'jobs' as CRMSection, label: 'Jobs', icon: Briefcase },
    { id: 'estimates' as CRMSection, label: 'Estimates', icon: FileText },
    { id: 'customers' as CRMSection, label: 'Customers', icon: Users },
    { id: 'invoices' as CRMSection, label: 'Invoices', icon: Receipt },
    { id: 'calls' as CRMSection, label: 'Calls', icon: Phone },
    { id: 'emails' as CRMSection, label: 'Emails', icon: Mail },
    { id: 'calendar' as CRMSection, label: 'Calendar', icon: Calendar },
    { id: 'accounting' as CRMSection, label: 'Accounting', icon: DollarSign },
    { id: 'payments' as CRMSection, label: 'Payments', icon: CreditCard },
    { id: 'reporting' as CRMSection, label: 'Reporting', icon: BarChart3 },
  ];

  return (
    <nav className="space-y-1 p-3">
      <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-border/50">
        <img src={ct1Logo} alt="CT1" className="h-6 w-6" />
        <span className="font-semibold text-sm">CT1 CRM</span>
      </div>
      {crmNavItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
          onClick={() => onSectionChange(item.id)}
        >
          <item.icon className="h-4 w-4 mr-3" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
}