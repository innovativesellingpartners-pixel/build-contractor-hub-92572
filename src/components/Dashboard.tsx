import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Store,
  Calendar as CalendarIcon,
  Building2,
  LogOut,
  HelpCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { TrainingHub } from "@/components/TrainingHub";
import { ContractorCRM } from "@/components/contractor/ContractorCRM";
import { ScheduleCall } from "@/components/contractor/ScheduleCall";
import { Marketplace } from "@/components/Marketplace";

type ActiveSection = 'training' | 'crm' | 'schedule' | 'marketplace';

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
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Company Info */}
            <div className="flex items-center gap-4">
              {profile?.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt="Company Logo" 
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{profile?.company_name || 'Your Company'}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {profile?.business_address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{profile.business_address}</span>
                      {profile.city && profile.state && (
                        <span>, {profile.city}, {profile.state} {profile.zip_code}</span>
                      )}
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Tier Info and Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge className={`${getTierBadgeColor(profile?.subscription_tier)} text-white mb-1`}>
                  {getTierLabel(profile?.subscription_tier)}
                </Badge>
                {profile?.tax_id && (
                  <p className="text-xs text-muted-foreground">Tax ID: {profile.tax_id}</p>
                )}
              </div>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
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
              <Building2 className="h-5 w-5 mr-3" />
              CT1 ZCRM
            </Button>
            
            <Button
              variant={activeSection === 'schedule' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('schedule')}
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              Schedule Call
            </Button>
            
            <Button
              variant={activeSection === 'marketplace' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('marketplace')}
            >
              <Store className="h-5 w-5 mr-3" />
              Solutions Marketplace
            </Button>
          </nav>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground mb-2">Quick Links</p>
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <User className="h-3 w-3 mr-2" />
                My Profile
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Mail className="h-3 w-3 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 p-6 overflow-auto">
          {activeSection === 'training' && <TrainingHub />}
          {activeSection === 'crm' && <ContractorCRM />}
          {activeSection === 'schedule' && <ScheduleCall />}
          {activeSection === 'marketplace' && <Marketplace />}
        </div>
      </div>
    </div>
  );
}