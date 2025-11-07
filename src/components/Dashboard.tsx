import { useState } from "react";
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
  BarChart3
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
    const saved = sessionStorage.getItem('dashboardActiveSection');
    return (saved as ActiveSection) || 'training';
  };
  
  const [activeSection, setActiveSection] = useState<ActiveSection>(getInitialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pocketbotOpen, setPocketbotOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [upgradePlanOpen, setUpgradePlanOpen] = useState(false);

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
      <div className="bg-card/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
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
              <ProfileEditDialog />
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="hover:bg-primary/10 transition-colors hidden sm:flex">
                  <Link to="/admin">Admin Dashboard</Link>
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

      {/* Company Info Card */}
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              {/* Logo Section */}
              <div className="relative group mx-auto md:mx-0">
                {profile?.logo_url ? (
                  <img 
                    src={profile.logo_url} 
                    alt="Company Logo" 
                    className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover border border-border shadow-md group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center border border-border shadow-md group-hover:shadow-lg transition-shadow">
                    <Building2 className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                )}
                <Badge className={`${getTierBadgeColor(profile?.subscription_tier)} text-white absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-md text-xs`}>
                  {getTierLabel(profile?.subscription_tier).split(' ')[0]}
                </Badge>
              </div>

              {/* Company Details */}
              <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left">
                <div>
                  <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold">{profile?.company_name || 'Your Company'}</h2>
                    {profile?.ct1_contractor_number && (
                      <Badge variant="outline" className="text-xs font-mono">
                        CT1 #{profile.ct1_contractor_number}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">5-Star Training:</span>
                    <StarRating level={profile?.training_level || 0} />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-2 text-sm">
                  {profile?.contact_name && (
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{profile.contact_name}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                  {profile?.business_address && (
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {profile.business_address}
                        {profile.city && profile.state && (
                          <>, {profile.city}, {profile.state} {profile.zip_code}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                <ProfileEditDialog />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-primary/10 transition-colors flex-1 md:flex-none"
                  onClick={() => setContactSupportOpen(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
          </div>
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
            {activeSection === 'leads' && <CT1CRM />}
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
        <div className="fixed bottom-20 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] md:w-[450px] h-[600px] z-[99] animate-in slide-in-from-bottom-4 duration-300">
          <FloatingPocketbot onClose={() => setPocketbotOpen(false)} />
        </div>
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
        onClick={() => setPocketbotOpen(!pocketbotOpen)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] group cursor-pointer"
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