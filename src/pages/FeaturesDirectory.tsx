import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import featurePages from "@/data/seoFeaturePages";

export default function FeaturesDirectory() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Platform Features | myCT1 Business-in-a-Box";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Explore every feature inside the myCT1 Business-in-a-Box contractor platform. CRM, estimating, job scheduling, invoicing, payments, Forge AI, reporting, and more.");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/features";
  }, []);

  const coreFeatures = [
    { to: "/features/crm", label: "CRM & Lead Management", desc: "Track leads, manage customers, and visualize your sales pipeline." },
    { to: "/features/estimating", label: "Estimating & Proposals", desc: "Build professional estimates with line items, send for e-signature approval." },
    { to: "/features/jobs", label: "Job Scheduling", desc: "Schedule jobs, assign crews, and track project timelines." },
    { to: "/features/voice-ai", label: "Voice AI Assistant", desc: "AI-powered call answering that captures leads 24/7." },
    { to: "/features/reporting", label: "Reporting Dashboards", desc: "Track revenue, profitability, and business KPIs in real time." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Platform Features
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              Everything contractors need to run their business from one platform. Explore the full feature set of the myCT1 Business-in-a-Box system.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Features", href: "/features" }]} />
      </div>

      {/* Core Features */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Core Platform Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((f) => (
              <Link key={f.to} to={f.to} className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group">
                <Zap className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">{f.label}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deep-Dive Feature Pages */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Feature Deep Dives</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featurePages.map((fp) => (
              <Link key={fp.slug} to={`/features/${fp.slug}`} className="p-5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all">
                <h3 className="font-semibold text-foreground mb-1">{fp.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{fp.metaDescription}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic SEO Landing Pages */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">In-Depth Software Guides</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            {[
              { to: "/contractor-crm-software", label: "Contractor CRM Software", desc: "Complete guide to CRM for contractors" },
              { to: "/contractor-estimating-software", label: "Contractor Estimating Software", desc: "How estimating software helps contractors win more jobs" },
              { to: "/ai-answering-service-for-contractors", label: "AI Answering Service", desc: "Never miss a call with AI-powered answering" },
              { to: "/forge-ai-invoice-assistant", label: "Forge AI Invoice Assistant", desc: "Automate invoicing and payment follow-ups" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all">
                <span className="font-semibold text-foreground">{item.label}</span>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Explore More</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline"><Link to="/trades">Browse by Trade</Link></Button>
            <Button asChild variant="outline"><Link to="/cities">Browse by City</Link></Button>
            <Button asChild variant="outline"><Link to="/blog">Contractor Blog</Link></Button>
            <Button asChild><Link to="/pricing">See Pricing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
      <FloatingTrialButton />
    </div>
  );
}
