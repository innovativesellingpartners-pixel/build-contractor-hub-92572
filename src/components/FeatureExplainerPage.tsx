import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import type { FeaturePageConfig } from "@/data/seoFeaturePages";

interface Props {
  config: FeaturePageConfig;
}

export function FeatureExplainerPage({ config }: Props) {
  const { slug, title, keyword, metaDescription, heroSubtitle, overview, benefits, howItWorks, faqItems } = config;

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
    document.title = `${title} | myCT1 Business-in-a-Box`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", metaDescription);

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = `https://myct1.com/features/${slug}`;

    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);
    return () => { script?.remove(); };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">myCT1 Feature</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">{title}</h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">{heroSubtitle}</p>
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

      {/* Breadcrumb */}
      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Features", href: "/features" }, { label: title }]} />
      </div>

      {/* Overview */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">How {keyword} Works Inside myCT1</h2>
            <p className="text-muted-foreground leading-[1.8] text-lg mb-8">{overview}</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/50 bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">How It Works</h2>
            <div className="space-y-8">
              {howItWorks.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.step}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Explore the Full Platform</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/pricing" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Pricing Plans</span>
                <p className="text-sm text-muted-foreground mt-1">Find the right plan for your business</p>
              </Link>
              <Link to="/features/contractor-crm" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Contractor CRM</span>
                <p className="text-sm text-muted-foreground mt-1">Manage leads and customers</p>
              </Link>
              <Link to="/features/contractor-estimating" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Estimating</span>
                <p className="text-sm text-muted-foreground mt-1">Professional estimates and proposals</p>
              </Link>
              <Link to="/features/job-scheduling" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Job Scheduling</span>
                <p className="text-sm text-muted-foreground mt-1">Schedule jobs and assign crews</p>
              </Link>
              <Link to="/features/forge-ai-automation" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Forge AI</span>
                <p className="text-sm text-muted-foreground mt-1">AI-powered automation</p>
              </Link>
              <Link to="/trades-we-serve" className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <span className="font-semibold text-foreground">Trades We Serve</span>
                <p className="text-sm text-muted-foreground mt-1">See all supported contractor trades</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to Try {title}?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your free trial and see how the myCT1 Business-in-a-Box platform transforms your contractor business.
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
