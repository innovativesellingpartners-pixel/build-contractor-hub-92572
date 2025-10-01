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
  Briefcase
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
import ct1Logo from "@/assets/ct1-logo-bordered.png";

type ActiveSection = 'training' | 'crm' | 'schedule' | 'marketplace' | 'leads' | 'insurance';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Business Info Bar */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin">Admin Dashboard</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <div className="flex items-start justify-between gap-6">
            {/* Left: Logo and Company Info */}
            <div className="flex items-start gap-4 flex-1">
              {profile?.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt="Company Logo" 
                  className="h-20 w-20 rounded-lg object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="h-20 w-20 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-primary/20">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{profile?.company_name || 'Your Company'}</h2>
                  {profile?.ct1_contractor_number && (
                    <Badge variant="outline" className="text-xs">
                      CT1 #{profile.ct1_contractor_number}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {profile?.contact_name && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{profile.contact_name}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.business_address && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {profile.business_address}
                        {profile.city && profile.state && (
                          <>, {profile.city}, {profile.state} {profile.zip_code}</>
                        )}
                      </span>
                    </div>
                  )}
                  {profile?.tax_id && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Tax ID:</span>
                      <span className="font-medium">{profile.tax_id}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">5-Star Training:</span>
                    <StarRating level={profile?.training_level || 0} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tier Info and Actions */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <Badge className={`${getTierBadgeColor(profile?.subscription_tier)} text-white`}>
                  {getTierLabel(profile?.subscription_tier)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <ProfileEditDialog />
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-card border-r p-4">
          <nav className="space-y-2">
            <Button
              variant={activeSection === 'training' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('training')}
            >
              <BookOpen className="h-5 w-5 mr-3" />
              5-Star Training
            </Button>
            
            <Button
              variant={activeSection === 'crm' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('crm')}
            >
              <Briefcase className="h-5 w-5 mr-3" />
              CT1 - CRM/Jobs
            </Button>
            
            <Button
              variant={activeSection === 'leads' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('leads')}
            >
              <Users className="h-5 w-5 mr-3" />
              Leads
            </Button>
            
            <Button
              variant={activeSection === 'insurance' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('insurance')}
            >
              <Shield className="h-5 w-5 mr-3" />
              Insurance
            </Button>
            
            <Button
              variant={activeSection === 'marketplace' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('marketplace')}
            >
              <Store className="h-5 w-5 mr-3" />
              Marketplace
            </Button>
          </nav>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 p-6 overflow-auto">
          {activeSection === 'training' && <TrainingHub />}
          {activeSection === 'crm' && <ContractorCRM />}
          {activeSection === 'leads' && <Leads />}
          {activeSection === 'insurance' && <Insurance />}
          {activeSection === 'marketplace' && <Marketplace />}
        </div>
      </div>
    </div>
  );
}