import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, User, HelpCircle, Smartphone, Shield, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/contractor/NotificationBell";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import type { HubSection, TierFeatures } from "@/config/navigation";

interface TopNavBarProps {
  profile: any;
  user: any;
  isAdmin: boolean;
  isTeamMember: boolean;
  ownerProfile: any;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeSection: HubSection;
  onSectionChange: (section: HubSection) => void;
  onLogout: () => void;
  /** Render the mobile menu content */
  mobileMenuContent: React.ReactNode;
}

export function TopNavBar({
  profile,
  user,
  isAdmin,
  isTeamMember,
  ownerProfile,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSectionChange,
  onLogout,
  mobileMenuContent,
}: TopNavBarProps) {
  return (
    <div
      className="bg-card/95 backdrop-blur-md border-b border-border/50 z-40"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden border-border">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
                <div className="py-4">{mobileMenuContent}</div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity">
              <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 md:h-10 md:w-10" />
              <div className="hidden sm:block">
                <h1 className="text-sm md:text-base font-semibold text-foreground">CT1 Contractor Hub</h1>
                <p className="text-xs text-muted-foreground">
                  Hello, {profile?.contact_name || "Contractor"}
                  {isTeamMember && ownerProfile?.company_name && (
                    <span className="ml-1 text-primary/80">— {ownerProfile.company_name}</span>
                  )}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell />
            <Button variant="outline" size="sm" asChild className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors">
              <Link to="/home">
                <Home className="h-4 w-4" />
                <span className="text-xs">Home</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSectionChange("account" as HubSection)}
              className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Acct</span>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors">
              <Link to="/dashboard/helpcenter">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">Help</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-1 px-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
