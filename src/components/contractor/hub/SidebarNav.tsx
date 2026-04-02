import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpCircle, Building2 } from "lucide-react";
import { LegalLinks } from "@/components/LegalLinks";
import { sidebarHubNavItems, sidebarBottomItems, type HubSection, type TierFeatures } from "@/config/navigation";

interface SidebarNavProps {
  activeSection: HubSection;
  setActiveSection: (section: HubSection) => void;
  tierFeatures: TierFeatures;
}

export function SidebarNav({ activeSection, setActiveSection, tierFeatures }: SidebarNavProps) {
  return (
    <nav className="space-y-1 p-3">
      {sidebarHubNavItems
        .filter((item) => !item.feature || tierFeatures[item.feature as keyof TierFeatures])
        .map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            className={`w-full justify-start transition-all ${
              activeSection === item.id
                ? "shadow-md"
                : "hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
            }`}
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </Button>
        ))}

      {sidebarBottomItems
        .filter((item) => tierFeatures[item.feature as keyof TierFeatures])
        .map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
            asChild
          >
            {item.href.startsWith("/") ? (
              <Link to={item.href}>
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Link>
            ) : (
              <a href={item.href}>
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </a>
            )}
          </Button>
        ))}

      {tierFeatures.myAccount && (
        <Button
          variant={activeSection === "account" ? "default" : "ghost"}
          className={`w-full justify-start transition-all ${
            activeSection === "account"
              ? "shadow-md"
              : "hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
          }`}
          onClick={() => setActiveSection("account")}
        >
          <Building2 className="h-4 w-4 mr-3" />
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
      <LegalLinks />
    </nav>
  );
}
