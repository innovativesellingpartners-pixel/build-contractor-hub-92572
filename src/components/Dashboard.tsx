import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
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
  DollarSign,
  Menu,
  X,
  BarChart3,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useToast } from "@/hooks/use-toast";
import { TrainingHub } from "@/components/TrainingHub";
import { ScheduleCall } from "@/components/contractor/ScheduleCall";
import { Marketplace } from "@/components/Marketplace";
import CT1CRM from "@/components/contractor/crm/CT1CRM";
import { Insurance } from "@/components/contractor/Insurance";
import { ProfileEditDialog } from "@/components/contractor/ProfileEditDialog";
import { StarRating } from "@/components/contractor/StarRating";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { ContactSupport } from "@/components/ContactSupport";
import ct1Logo from "@/assets/ct1-logo-main.png";

import { VoiceAI } from "@/components/contractor/VoiceAI";
import Reporting from "@/pages/Reporting";

type ActiveSection = 'training' | 'crm' | 'schedule' | 'marketplace' | 'leads' | 'insurance' | 'account' | 'voiceai' | 'reporting';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { tierFeatures, hasFullAccess } = useUserTier();
  const { toast } = useToast();
  
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
  const [pocketbotOpen, setPocketbotOpen] = useState(false);
  const [pocketbotPosition, setPocketbotPosition] = useState('20px');
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [upgradePlanOpen, setUpgradePlanOpen] = useState(false);
  const [chatButtonPosition, setChatButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingChatButton, setIsDraggingChatButton] = useState(false);
  const [chatButtonDragOffset, setChatButtonDragOffset] = useState({ x: 0, y: 0 });
  const chatButtonRef = useRef<HTMLButtonElement | null>(null);

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

    setChatButtonDragOffset({
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    });
    setIsDraggingChatButton(true);
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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Top Navigation Bar */}
      <div
        className="bg-card/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-40"
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
                    <SidebarNav 
                      activeSection={activeSection} 
                      setActiveSection={handleSectionChange} 
                      tierFeatures={tierFeatures}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/" className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity">
                <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 md:h-10 md:w-10" />
                <div className="hidden sm:block">
                  <h1 className="text-base md:text-lg font-bold">Welcome to the CT1 Contractor Hub</h1>
                  <p className="text-xs text-muted-foreground">Hello, {profile?.contact_name || 'Contractor'}</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{profile?.company_name || 'Your Company'}</span>
              </div>
              
              {/* Account Button - Always Visible */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSectionChange('account')}
                className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </Button>
              
              {/* Get App Button */}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
              >
                <Link to="/app-install">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Get App</span>
                </Link>
              </Button>
              
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="hover:bg-primary/10 transition-colors">
                  <Link to="/admin">
                    <Shield className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin Dashboard</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Name Banner - Mobile Optimized */}
      <div 
        className="bg-black text-white"
        style={{ 
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "1rem"
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {profile?.contact_name || profile?.company_name || 'Contractor'}
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 pb-6 flex-1 flex gap-6">
        {/* Left Sidebar Navigation - Hidden on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-card border border-border/50 rounded-xl shadow-md p-3 sticky top-24">
            <SidebarNav activeSection={activeSection} setActiveSection={handleSectionChange} tierFeatures={tierFeatures} />
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 overflow-auto min-w-0">
          <div className="bg-card border border-border/50 rounded-xl shadow-md overflow-hidden">
            {activeSection === 'training' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <TrainingHub />
              </div>
            )}
            {activeSection === 'leads' && <CT1CRM onOpenPocketbot={() => setPocketbotOpen(true)} />}
            {activeSection === 'schedule' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <ScheduleCall />
              </div>
            )}
            {activeSection === 'insurance' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <Insurance />
              </div>
            )}
            {activeSection === 'voiceai' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <VoiceAI />
              </div>
            )}
            {activeSection === 'reporting' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <Reporting />
              </div>
            )}
            {activeSection === 'marketplace' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <Marketplace />
              </div>
            )}
            {activeSection === 'account' && (
              <div className="p-3 md:p-4 lg:p-6 min-h-[400px] md:min-h-[600px]">
                <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold">My Account</h2>
                  <Badge variant="outline" className="text-xs md:text-sm">
                    Account ID: {user?.id?.substring(0, 8)}
                  </Badge>
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
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <Building2 className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Company Name</p>
                          <p className="font-medium">{profile?.company_name || 'Not set'}</p>
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

      {/* Floating Pocketbot Widget */}
      {pocketbotOpen && (
        <FloatingPocketbot onClose={() => setPocketbotOpen(false)} onPositionChange={setPocketbotPosition} />
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
      
      {/* Floating Chat Button */}
      <button
        ref={chatButtonRef}
        onClick={() => setPocketbotOpen(!pocketbotOpen)}
        onMouseDown={handleChatButtonDragStart}
        onTouchStart={handleChatButtonDragStart}
        className="fixed z-[100] group cursor-pointer"
        style={
          chatButtonPosition
            ? { left: chatButtonPosition.x, top: chatButtonPosition.y }
            : { bottom: 24, right: 24 }
        }
        aria-label="Open CT1 Pocketbot"
      >
        <div className="bg-foreground/95 backdrop-blur-md text-background p-3 md:p-4 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 border-2 border-primary/30">
          <div className="relative">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <img src={ct1Logo} alt="CT1" className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 md:h-3.5 md:w-3.5 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </button>
    </div>
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
          AI Voice Assistant
        </Button>
      )}
      
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
          CRM/Jobs
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
        Reporting & Analytics
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
      
      {tierFeatures.monthlyCall && (
        <Button
          variant={activeSection === 'schedule' ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all ${
            activeSection === 'schedule' 
              ? 'shadow-md' 
              : 'hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent'
          }`}
          onClick={() => setActiveSection('schedule')}
        >
          <Phone className="h-4 w-4 mr-3" />
          Schedule Calls
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
            Podcast
          </Link>
        </Button>
      )}
      
      <div className="my-2 border-t border-border/50" />
      
      {tierFeatures.home && (
        <Button
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
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