import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { PageShell } from "@/components/ui/page-shell";
import { TopNavBar } from "@/components/contractor/hub/TopNavBar";
import { UnifiedHubSidebar } from "@/components/contractor/hub/UnifiedHubSidebar";
import { SidebarNav } from "@/components/contractor/hub/SidebarNav";
import { CRMSidebarNav } from "@/components/contractor/hub/CRMSidebarNav";
import { AccountSection } from "@/components/contractor/hub/AccountSection";

import { TrainingHub } from "@/components/TrainingHub";
import { Marketplace } from "@/components/Marketplace";
import CT1CRM from "@/components/contractor/crm/CT1CRM";
import { Insurance } from "@/components/contractor/Insurance";
import { FloatingPocketAgent } from "@/components/contractor/FloatingPocketbot";
import { ContactSupport } from "@/components/ContactSupport";
import { VoiceAI } from "@/components/contractor/VoiceAI";
import Reporting from "@/pages/Reporting";
import HelpCenter from "@/components/help/HelpCenter";
import { PersonalTasks } from "@/components/contractor/PersonalTasks";
import { ConnectionsHub } from "@/components/contractor/ConnectionsHub";
import { CatalogAdminPanel } from "@/components/contractor/CatalogAdminPanel";
import { CrewManagement } from "@/components/contractor/CrewManagement";
import ReputationDashboard from "@/components/contractor/ReputationDashboard";
import SubVendorPortal from "@/components/contractor/SubVendorPortal";
import TeamManagement from "@/components/contractor/TeamManagement";
import { BottomNav } from "@/components/contractor/crm/BottomNav";
import { BackNavigation } from "@/components/contractor/crm/BackNavigation";

import type { HubSection, TierFeatures } from "@/config/navigation";

type ActiveSection = HubSection;

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, isTeamMember, ownerProfile, teamRole, effectiveUserId } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { tierFeatures, hasFullAccess } = useUserTier();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Persist active section in sessionStorage
  const getInitialSection = (): ActiveSection => {
    const saved = sessionStorage.getItem('dashboardActiveSection') as ActiveSection | null;
    if (saved === 'training' as any) {
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
  const [crmActiveSection, setCrmActiveSection] = useState<string>(() => {
    return sessionStorage.getItem('ct1CrmActiveSection') || 'dashboard';
  });

  // Handle Voice AI / Pocket Agent post-payment redirects
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("voice_ai_activated") === "true") {
      setActiveSection("voiceai");
    }
    if (searchParams.get("activate_pocketbot") === "true") {
      searchParams.delete("activate_pocketbot");
      setSearchParams(searchParams, { replace: true });
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke('pocketbot-checkout');
          if (error) throw error;
          if (data?.checkout_url) window.location.href = data.checkout_url;
        } catch (err) {
          console.error('Pocketbot checkout error:', err);
        }
      })();
    }
    if (searchParams.get("pocketbot_activated") === "true") {
      searchParams.delete("pocketbot_activated");
      setSearchParams(searchParams, { replace: true });
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').update({
              pocketbot_access_type: 'paid',
              pocketbot_full_access: true,
            }).eq('user_id', user.id);
          }
        } catch (err) {
          console.error('Pocketbot activation error:', err);
        }
      })();
    }
  }, []);

  const handleSectionChange = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    sessionStorage.setItem('dashboardActiveSection', section);
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
  }, [signOut, toast]);

  const backToLeads = useCallback(() => handleSectionChange('leads'), [handleSectionChange]);

  // ── Mobile menu content ──────────────────────────────────────────
  const mobileMenuContent = activeSection === 'leads' ? (
    <CRMSidebarNav
      onSectionChange={(section) => {
        sessionStorage.setItem('ct1CrmActiveSection', section);
        sessionStorage.setItem('ct1CrmShowLanding', section === 'dashboard' ? 'true' : 'false');
        setActiveSection('training' as ActiveSection);
        setTimeout(() => setActiveSection('leads'), 0);
        setMobileMenuOpen(false);
      }}
    />
  ) : (
    <SidebarNav activeSection={activeSection} setActiveSection={handleSectionChange} tierFeatures={tierFeatures} />
  );

  // ── Section renderer ─────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 'training':
        return <PageShell onBack={backToLeads}><TrainingHub /></PageShell>;
      case 'insurance':
        return <PageShell onBack={backToLeads}><Insurance /></PageShell>;
      case 'voiceai':
        return <PageShell onBack={backToLeads}><VoiceAI /></PageShell>;
      case 'reporting':
        return <PageShell onBack={backToLeads}><Reporting /></PageShell>;
      case 'tasks':
        return <PageShell onBack={backToLeads}><PersonalTasks /></PageShell>;
      case 'crews':
        return <PageShell onBack={backToLeads}><CrewManagement /></PageShell>;
      case 'reviews':
        return <PageShell onBack={backToLeads}><ReputationDashboard onBack={backToLeads} /></PageShell>;
      case 'subs':
        return <PageShell onBack={backToLeads}><SubVendorPortal onBack={backToLeads} /></PageShell>;
      case 'team':
        return <PageShell onBack={backToLeads}><TeamManagement onBack={backToLeads} /></PageShell>;
      case 'marketplace':
        return <PageShell onBack={backToLeads}><Marketplace /></PageShell>;
      case 'help':
        return (
          <div className="min-h-[400px] md:min-h-[600px] pb-20">
            <HelpCenter
              onBack={backToLeads}
              onNavigateToSection={(section) => handleSectionChange(section as ActiveSection)}
            />
          </div>
        );
      case 'connections':
        return (
          <PageShell onBack={() => handleSectionChange('account')}>
            <BackNavigation onBackToDashboard={() => handleSectionChange('account')} className="mb-4" />
            <ConnectionsHub onNavigate={handleSectionChange} />
            {user?.email?.endsWith('@myct1.com') && (
              <div className="mt-6"><CatalogAdminPanel /></div>
            )}
          </PageShell>
        );
      case 'account':
        return (
          <PageShell onBack={backToLeads}>
            <AccountSection user={user} profile={profile} onSectionChange={handleSectionChange} />
          </PageShell>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavBar
        profile={profile}
        user={user}
        isAdmin={isAdmin}
        isTeamMember={isTeamMember}
        ownerProfile={ownerProfile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        mobileMenuContent={mobileMenuContent}
      />

      {/* Contractor Name Banner */}
      <div
        className="bg-foreground text-background border-b border-border/10"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))", paddingBottom: "0.625rem" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {profile?.company_name || profile?.contact_name || 'Your Business'}
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 pt-4 pb-6 flex-1 flex gap-0">
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
                  {renderSection()}
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
        />
      )}

      {/* Contact Support Dialog */}
      <ContactSupport open={contactSupportOpen} onOpenChange={setContactSupportOpen} />

      {/* Mobile Bottom Navigation */}
      {isMobile && activeSection !== 'leads' && (
        <BottomNav
          activeSection="more"
          onSectionChange={(section) => {
            handleSectionChange('leads');
            sessionStorage.setItem('ct1CrmActiveSection', section);
          }}
        />
      )}
    </div>
  );
}
