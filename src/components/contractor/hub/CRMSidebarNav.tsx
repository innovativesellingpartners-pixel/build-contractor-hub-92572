import { Button } from "@/components/ui/button";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { crmNavItemsMobile } from "@/config/navigation";

interface CRMSidebarNavProps {
  onSectionChange: (section: string) => void;
}

export function CRMSidebarNav({ onSectionChange }: CRMSidebarNavProps) {
  return (
    <nav className="space-y-1 p-3">
      <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-border/50">
        <img src={ct1Logo} alt="CT1" className="h-6 w-6" />
        <span className="font-semibold text-sm">CT1 CRM</span>
      </div>
      {crmNavItemsMobile.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          className="w-full justify-start transition-all hover:bg-red-50 hover:border-red-500 hover:text-black border border-transparent"
          onClick={() => onSectionChange(item.id)}
        >
          <item.icon className="h-4 w-4 mr-3" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
