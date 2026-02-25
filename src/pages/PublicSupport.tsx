import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEOHead } from "@/components/SEOHead";
import { HelpSupportForm } from "@/components/help/HelpSupportForm";
import { useNavigate } from "react-router-dom";

export default function PublicSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Submit a Support Ticket | CT1"
        description="Need help? Submit a support ticket and our team will get back to you."
        canonical="/support"
      />
      <MainSiteHeader />
      <main className="flex-1 p-4 md:p-6">
        <HelpSupportForm onBack={() => navigate("/help")} />
      </main>
      <PublicFooter />
    </div>
  );
}
