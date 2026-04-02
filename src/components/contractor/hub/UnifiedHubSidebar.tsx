import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/LegalLinks";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { crmNavItemsCompact, hubNavItems, type HubSection, type TierFeatures } from "@/config/navigation";

interface UnifiedHubSidebarProps {
  activeHubSection: HubSection;
  onHubSectionChange: (section: HubSection) => void;
  onCrmSectionChange: (section: string) => void;
  tierFeatures: TierFeatures;
}

export function UnifiedHubSidebar({
  activeHubSection,
  onHubSectionChange,
  onCrmSectionChange,
  tierFeatures,
}: UnifiedHubSidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-card border-r overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" as any }}>
      <div className="flex items-center gap-2 p-4 border-b">
        <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
        <span className="font-semibold">CT1 CRM</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {crmNavItemsCompact.map((item) => (
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
          .filter((item) => !item.feature || tierFeatures[item.feature as keyof TierFeatures])
          .map((item) => (
            <Button
              key={item.id}
              variant={activeHubSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start transition-all ${
                activeHubSection === item.id
                  ? "shadow-md"
                  : "hover:bg-accent text-muted-foreground border border-transparent"
              }`}
              onClick={() => onHubSectionChange(item.id)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
      </nav>
      <LegalLinks />
    </aside>
  );
}
