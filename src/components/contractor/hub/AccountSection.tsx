import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Shield,
  Users,
  FileText,
  User,
  CreditCard,
  ArrowUpCircle,
  Globe,
  Percent,
} from "lucide-react";
import { ProfileEditDialog } from "@/components/contractor/ProfileEditDialog";
import { AccountDocuments } from "@/components/contractor/AccountDocuments";
import { ChangePasswordCard } from "@/components/contractor/ChangePasswordCard";
import { ContactSupport } from "@/components/ContactSupport";
import { SectionHeader } from "@/components/ui/section-header";
import type { HubSection } from "@/config/navigation";
import { useState } from "react";

interface AccountSectionProps {
  user: any;
  profile: any;
  onSectionChange: (section: HubSection) => void;
}

export function AccountSection({ user, profile, onSectionChange }: AccountSectionProps) {
  const [upgradePlanOpen, setUpgradePlanOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case "launch": return "LAUNCH Growth Starter";
      case "growth": return "Growth Business Builder";
      case "accel": return "Accel! Market Dominator";
      default: return "LAUNCH Growth Starter";
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case "launch": return "bg-blue-500";
      case "growth": return "bg-green-500";
      case "accel": return "bg-purple-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
      <SectionHeader
        title="My Account"
        subtitle="Manage your business profile and branding"
        actions={
          <>
            <ProfileEditDialog />
            <Badge variant="outline" className="text-xs md:text-sm">
              ID: {user?.id?.substring(0, 8)}
            </Badge>
          </>
        }
      />

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
          <Button className="w-full shadow-md hover:shadow-lg transition-shadow" size="lg" asChild>
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
          <Button variant="outline" className="w-full hover:bg-primary/10 transition-colors" size="lg" onClick={() => setUpgradePlanOpen(true)}>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </div>
      </div>

      {/* Connections Card */}
      <div
        className="group flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
        onClick={() => onSectionChange("connections" as HubSection)}
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
          onClick={(e) => { e.stopPropagation(); onSectionChange("connections" as HubSection); }}
        >
          Manage
        </Button>
      </div>

      {/* Change Password */}
      <ChangePasswordCard />

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
                <p className="font-medium">{profile?.contact_name || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                <p className="font-medium">{profile?.phone || "Not set"}</p>
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
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="h-16 w-16 rounded-lg border flex items-center justify-center bg-background overflow-hidden">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{profile?.company_name || "Your Company"}</p>
                {profile?.trade && <p className="text-sm text-muted-foreground">{profile.trade}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business Address</p>
                <p className="font-medium text-sm">
                  {profile?.business_address || "Not set"}
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
                  <p className="font-medium text-sm truncate">{profile?.business_email || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Website</p>
                  <p className="font-medium text-sm truncate">{profile?.website_url || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">License Number</p>
                  <p className="font-medium">{profile?.license_number || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tax ID</p>
                  <p className="font-medium">{profile?.tax_id || "Not set"}</p>
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
          onSectionChange("leads" as HubSection);
          sessionStorage.setItem("ct1CrmActiveSection", "documents");
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
              <p className="font-mono font-bold text-lg">#{profile?.ct1_contractor_number || "Not assigned"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Dialog */}
      <Dialog open={upgradePlanOpen} onOpenChange={setUpgradePlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>Choose an option to continue:</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button className="w-full" size="lg" asChild onClick={() => setUpgradePlanOpen(false)}>
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

      {/* Contact Support Dialog */}
      <ContactSupport open={contactSupportOpen} onOpenChange={setContactSupportOpen} />
    </div>
  );
}
