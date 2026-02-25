import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEOHead } from "@/components/SEOHead";
import HelpCenter from "@/components/help/HelpCenter";
import { useNavigate } from "react-router-dom";

export default function PublicHelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Help Center | CT1"
        description="Find answers, browse articles, and get support for your CT1 account."
        canonical="/help"
      />
      <MainSiteHeader />
      <main className="flex-1">
        <HelpCenter
          onNavigateToSection={(section) => navigate(`/dashboard?section=${section}`)}
        />
      </main>
    </div>
  );
}
