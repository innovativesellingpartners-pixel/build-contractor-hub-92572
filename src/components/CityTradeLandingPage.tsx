import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin, Users, ClipboardList, Zap, Phone, FileText, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import type { TradeCrmConfig } from "@/data/tradeCrmPages";
import type { CityConfig } from "@/data/seoCities";

interface Props {
  trade: TradeCrmConfig;
  city: CityConfig;
}

export function CityTradeLandingPage({ trade, city }: Props) {
  const pageTitle = `${trade.keyword} in ${city.name}, ${city.stateCode}`;
  const metaDesc = `${trade.trade} CRM software for contractors in ${city.name}, ${city.stateCode}. Manage leads, estimates, jobs, invoices, and payments with the myCT1 Business-in-a-Box platform.`;
  const canonicalUrl = `/crm-for-${trade.slug}-in-${city.slug}`;

  const faqItems = [
    {
      question: `What is the best CRM for ${trade.tradePlural.toLowerCase()} contractors in ${city.name}?`,
      answer: `myCT1 is the Business-in-a-Box platform built for ${trade.tradePlural.toLowerCase()} contractors in ${city.name}, ${city.stateCode}. It includes lead management, estimating, job scheduling, invoicing, payment processing, and Forge AI automation in one system.`,
    },
    {
      question: `How can ${trade.tradePlural.toLowerCase()} businesses in ${city.name} get more leads?`,
      answer: `With myCT1, ${trade.tradePlural.toLowerCase()} contractors in ${city.name} capture leads from phone calls, web forms, and referrals automatically. Forge AI follows up with leads instantly, ensuring faster response times and higher conversion rates.`,
    },
    {
      question: `Does myCT1 work for ${trade.tradePlural.toLowerCase()} companies in ${city.state}?`,
      answer: `Yes. myCT1 is a nationwide platform that serves ${trade.tradePlural.toLowerCase()} contractors across ${city.state} and all 50 states. The system is cloud-based and accessible from any device, making it perfect for ${city.name}-area contractors.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${pageTitle} | myCT1`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", metaDesc);

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = `https://myct1.com${canonicalUrl}`;

    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);
    return () => { script?.remove(); };
  }, [trade.slug, city.slug]);

  const capabilities = [
    { icon: Users, title: "Lead Management", desc: `Capture and track every lead from ${city.name}-area customers automatically.` },
    { icon: ClipboardList, title: "Professional Estimating", desc: `Send professional estimates with e-signature approval to ${city.name} homeowners.` },
    { icon: Calendar, title: "Job Scheduling", desc: `Schedule and manage ${trade.tradePlural.toLowerCase()} jobs across the ${city.name} metro area.` },
    { icon: FileText, title: "Invoicing & Payments", desc: `Send invoices and collect payments online from ${city.name} clients.` },
    { icon: Phone, title: "Forge AI Answering", desc: `Never miss a call from a ${city.name} homeowner. Forge AI answers 24/7.` },
    { icon: BarChart3, title: "Business Reporting", desc: `Track revenue, profitability, and growth metrics for your ${city.name} operations.` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">{city.name}, {city.stateCode}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {trade.keyword} in {city.name}
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              The complete Business-in-a-Box platform for {trade.tradePlural.toLowerCase()} contractors in {city.name}, {city.stateCode}. Manage leads, estimates, jobs, invoices, and payments from one system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why local contractors need myCT1 */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Why {trade.tradePlural} Contractors in {city.name} Choose myCT1
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Running a {trade.tradePlural.toLowerCase()} business in {city.name} means competing for every job. Homeowners expect fast responses, professional estimates, and clear communication. The myCT1 Business-in-a-Box system gives {city.name} {trade.tradePlural.toLowerCase()} contractors the tools to respond faster, close more jobs, and grow their business without adding office staff.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">Respond to {city.name} leads in seconds with Forge AI call answering</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">Send professional estimates that {city.name} homeowners can sign digitally</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">Schedule jobs and assign crews across the {city.name} metro area</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">Collect payments online and sync with QuickBooks automatically</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">Track business performance with real-time reporting dashboards</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Everything {city.name} {trade.tradePlural} Contractors Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {capabilities.map((cap) => (
              <Card key={cap.title} className="border-border/50 bg-card">
                <CardContent className="pt-6">
                  <cap.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Explore the myCT1 Platform</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to={`/crm-for-${trade.slug}`} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">{trade.keyword}</span>
                <p className="text-sm text-muted-foreground mt-1">Learn how myCT1 serves {trade.tradePlural.toLowerCase()} contractors nationwide</p>
              </Link>
              <Link to="/features/contractor-crm" className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">CRM Features</span>
                <p className="text-sm text-muted-foreground mt-1">Explore the full CRM capabilities</p>
              </Link>
              <Link to="/features/contractor-estimating" className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Estimating Software</span>
                <p className="text-sm text-muted-foreground mt-1">Professional estimates with e-signature</p>
              </Link>
              <Link to="/features/forge-ai-automation" className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Forge AI Automation</span>
                <p className="text-sm text-muted-foreground mt-1">AI-powered call answering and follow-ups</p>
              </Link>
              <Link to="/pricing" className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Pricing Plans</span>
                <p className="text-sm text-muted-foreground mt-1">Find the right plan for your business</p>
              </Link>
              <Link to="/blog-podcast" className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Contractor Blog</span>
                <p className="text-sm text-muted-foreground mt-1">Tips and strategies for growing your business</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Grow Your {trade.tradePlural} Business in {city.name}?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join contractors across {city.state} who use myCT1 to manage their entire business from one platform.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
            <Link to="/trial-signup">Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((item, i) => (
                <div key={i} className="border-b border-border pb-6">
                  <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <FloatingTrialButton />
    </div>
  );
}
