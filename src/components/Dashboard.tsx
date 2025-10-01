import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { TrainingHub } from "@/components/TrainingHub";
import { ContractorCRM } from "@/components/contractor/ContractorCRM";
import { ScheduleCall } from "@/components/contractor/ScheduleCall";
import { Marketplace } from "@/components/Marketplace";
import { Leads } from "@/components/contractor/Leads";
import { Insurance } from "@/components/contractor/Insurance";
import { ProfileEditDialog } from "@/components/contractor/ProfileEditDialog";
import { StarRating } from "@/components/contractor/StarRating";
import { Pocketbot } from "@/components/contractor/Pocketbot";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { QuickBooks } from "@/components/contractor/QuickBooks";

type ActiveSection = 'training' | 'pocketbot' | 'crm' | 'schedule' | 'marketplace' | 'leads' | 'quickbooks' | 'insurance' | 'account';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ActiveSection>('training');

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-card/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold">Contractor Portal</h1>
                <p className="text-xs text-muted-foreground">Welcome back, {profile?.contact_name || 'Contractor'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="hover:bg-primary/10 transition-colors">
                  <a href="/admin">Admin Dashboard</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Logo Section */}
              <div className="relative group">
                {profile?.logo_url ? (
                  <img 
                    src={profile.logo_url} 
                    alt="Company Logo" 
                    className="h-24 w-24 rounded-xl object-cover border border-border shadow-md group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center border border-border shadow-md group-hover:shadow-lg transition-shadow">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
                <Badge className={`${getTierBadgeColor(profile?.subscription_tier)} text-white absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-md`}>
                  {getTierLabel(profile?.subscription_tier).split(' ')[0]}
                </Badge>
              </div>

              {/* Company Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile?.company_name || 'Your Company'}</h2>
                    {profile?.ct1_contractor_number && (
                      <Badge variant="outline" className="text-xs font-mono">
                        CT1 #{profile.ct1_contractor_number}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">5-Star Training:</span>
                    <StarRating level={profile?.training_level || 0} />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
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
              <div className="flex flex-col gap-2">
                <ProfileEditDialog />
                <Button variant="outline" size="sm" className="hover:bg-primary/10 transition-colors">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 pb-6 flex-1 flex gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-card border border-border/50 rounded-xl shadow-md p-3 sticky top-24">
            <nav className="space-y-1">
              <Button
                variant={activeSection === 'training' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'training' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('training')}
              >
                <BookOpen className="h-4 w-4 mr-3" />
                5-Star Training
              </Button>
              
              <Button
                variant={activeSection === 'pocketbot' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'pocketbot' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('pocketbot')}
              >
                <Bot className="h-4 w-4 mr-3" />
                CT1 Pocketbot
              </Button>
              
              <Button
                variant={activeSection === 'crm' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'crm' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('crm')}
              >
                <Briefcase className="h-4 w-4 mr-3" />
                CRM/Jobs
              </Button>
              
              <Button
                variant={activeSection === 'leads' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'leads' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('leads')}
              >
                <Users className="h-4 w-4 mr-3" />
                Leads
              </Button>
              
              <Button
                variant={activeSection === 'quickbooks' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'quickbooks' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('quickbooks')}
              >
                <DollarSign className="h-4 w-4 mr-3" />
                QuickBooks
              </Button>
              
              <Button
                variant={activeSection === 'insurance' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'insurance' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('insurance')}
              >
                <Shield className="h-4 w-4 mr-3" />
                Insurance
              </Button>
              
              <Button
                variant={activeSection === 'marketplace' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'marketplace' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('marketplace')}
              >
                <Store className="h-4 w-4 mr-3" />
                Marketplace
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start transition-all hover:bg-muted/80 hover:translate-x-1"
                asChild
              >
                <a href="https://lovable.dev/projects/eb889344-3c18-4b7f-b049-eddbd3665869" target="_blank" rel="noopener noreferrer">
                  <Mic className="h-4 w-4 mr-3" />
                  Podcast
                </a>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start transition-all hover:bg-muted/80 hover:translate-x-1"
                asChild
              >
                <a href="/core-values">
                  <Award className="h-4 w-4 mr-3" />
                  CT1 Contractor Standards
                </a>
              </Button>
              
              <div className="my-2 border-t border-border/50" />
              
              <Button
                variant={activeSection === 'account' ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all ${
                  activeSection === 'account' 
                    ? 'shadow-md' 
                    : 'hover:bg-muted/80 hover:translate-x-1'
                }`}
                onClick={() => setActiveSection('account')}
              >
                <User className="h-4 w-4 mr-3" />
                My Account
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start transition-all hover:bg-muted/80 hover:translate-x-1"
                asChild
              >
                <a href="/">
                  <Building2 className="h-4 w-4 mr-3" />
                  CT1 Home
                </a>
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 overflow-auto">
          <div className="bg-card border border-border/50 rounded-xl shadow-md p-6 min-h-[600px]">
            {activeSection === 'training' && <TrainingHub />}
            {activeSection === 'pocketbot' && <Pocketbot />}
            {activeSection === 'crm' && <ContractorCRM />}
            {activeSection === 'leads' && <Leads />}
            {activeSection === 'quickbooks' && <QuickBooks />}
            {activeSection === 'insurance' && <Insurance />}
            {activeSection === 'marketplace' && <Marketplace />}
            {activeSection === 'account' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">My Account</h2>
                  <Badge variant="outline" className="text-sm">
                    Account ID: {user?.id?.substring(0, 8)}
                  </Badge>
                </div>
                
                {/* Billing & Upgrade Section */}
                <div className="grid md:grid-cols-2 gap-6">
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
                    <Button className="w-full shadow-md hover:shadow-lg transition-shadow" size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Bill
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
                    <Button variant="outline" className="w-full hover:bg-primary/10 transition-colors" size="lg">
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      View Plans
                    </Button>
                  </div>
                </div>
                
                {/* QuickBooks Integration Section */}
                <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
                  <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      QuickBooks Integration
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your QuickBooks account to sync your financial data, invoices, and expenses automatically.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                          Not Connected
                        </Badge>
                      </div>
                      <Button className="w-full shadow-md hover:shadow-lg transition-shadow" size="lg">
                        <FileText className="h-4 w-4 mr-2" />
                        Connect QuickBooks
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <p>Benefits of connecting QuickBooks:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                        <li>Automatic invoice syncing</li>
                        <li>Real-time financial reporting</li>
                        <li>Expense tracking integration</li>
                        <li>Streamlined bookkeeping</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}