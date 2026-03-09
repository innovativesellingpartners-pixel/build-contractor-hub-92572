import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MapPin, Wrench, BarChart3, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";
import { allBlogPosts } from "@/data/blogPosts";

export default function ContractorBusinessResources() {
  const faqItems = [
    {
      question: "What is the myCT1 Business-in-a-Box system?",
      answer: "The myCT1 Business-in-a-Box is a complete contractor operating system that replaces disconnected tools with one platform. It includes CRM, lead management, estimating, job scheduling, invoicing, payment processing, QuickBooks integration, customer portal, reporting dashboards, Forge AI automation, and a contractor training platform.",
    },
    {
      question: "Which contractor trades does myCT1 support?",
      answer: "myCT1 supports over 30 contractor trades including plumbing, electrical, HVAC, roofing, general contracting, remodeling, painting, landscaping, flooring, concrete, solar, and many more. Each trade gets a tailored experience inside the same powerful platform.",
    },
    {
      question: "Is myCT1 available in my city?",
      answer: "Yes. myCT1 is a cloud-based platform available nationwide. Contractors in every U.S. city can use the full platform from any device. We have contractors actively using myCT1 across all 50 states.",
    },
    {
      question: "How does Forge AI help contractors?",
      answer: "Forge AI is the intelligent automation engine inside myCT1. It answers missed calls, follows up with leads automatically, sends appointment reminders, and handles routine customer communication so contractors can focus on field work instead of administrative tasks.",
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
    document.title = "Contractor Business Resources | myCT1";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Guides, tools, and software resources for contractors including CRM, estimating, job management, and business growth strategies.");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/contractor-business-resources";

    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);
    return () => { script?.remove(); };
  }, []);

  const featureLinks = [
    { to: "/features/crm", label: "Contractor CRM", desc: "Manage leads, customers, and your sales pipeline" },
    { to: "/features/estimating", label: "Estimating Software", desc: "Build and send professional estimates with e-signatures" },
    { to: "/features/jobs", label: "Job Management", desc: "Schedule jobs, assign crews, and track progress" },
    { to: "/features/voice-ai", label: "Voice AI", desc: "Never miss a call with AI-powered call answering" },
    { to: "/features/reporting", label: "Reporting Dashboards", desc: "Track revenue, profitability, and business performance" },
    { to: "/features/contractor-crm", label: "CRM Deep Dive", desc: "Complete guide to the myCT1 contractor CRM" },
    { to: "/features/contractor-estimating", label: "Estimating Deep Dive", desc: "How myCT1 estimating helps you win more jobs" },
    { to: "/features/job-scheduling", label: "Job Scheduling", desc: "Eliminate double-bookings and scheduling conflicts" },
    { to: "/features/invoice-automation", label: "Invoice Automation", desc: "Generate invoices and collect payments automatically" },
    { to: "/features/customer-portal", label: "Customer Portal", desc: "Give clients a branded portal for approvals and payments" },
    { to: "/features/forge-ai-automation", label: "Forge AI Automation", desc: "AI-powered lead follow-ups and call answering" },
    { to: "/features/contractor-payments", label: "Payment Processing", desc: "Accept credit cards and ACH payments online" },
    { to: "/features/contractor-lead-generation", label: "Lead Generation", desc: "Capture and convert more leads from every source" },
    { to: "/features/contractor-training", label: "Training Platform", desc: "On-demand courses for contractor teams" },
    { to: "/features/contractor-reporting", label: "Business Reporting", desc: "Real-time dashboards for contractor KPIs" },
  ];

  // Select representative trades for the grid
  const topTrades = trades.slice(0, 30);

  // Select representative city+trade combos
  const topCities = cities.slice(0, 20);
  const cityTradeExamples = [
    { trade: "plumbers", city: "dallas", label: "Plumber CRM in Dallas" },
    { trade: "electricians", city: "chicago", label: "Electrician CRM in Chicago" },
    { trade: "hvac-contractors", city: "phoenix", label: "HVAC CRM in Phoenix" },
    { trade: "roofing-contractors", city: "houston", label: "Roofing CRM in Houston" },
    { trade: "plumbers", city: "miami", label: "Plumber CRM in Miami" },
    { trade: "electricians", city: "atlanta", label: "Electrician CRM in Atlanta" },
    { trade: "general-contractors", city: "los-angeles", label: "GC CRM in Los Angeles" },
    { trade: "landscaping-contractors", city: "denver", label: "Landscaping CRM in Denver" },
    { trade: "painting-contractors", city: "nashville", label: "Painting CRM in Nashville" },
    { trade: "hvac-contractors", city: "dallas", label: "HVAC CRM in Dallas" },
    { trade: "remodeling-contractors", city: "seattle", label: "Remodeling CRM in Seattle" },
    { trade: "flooring-contractors", city: "tampa", label: "Flooring CRM in Tampa" },
    { trade: "concrete-contractors", city: "austin", label: "Concrete CRM in Austin" },
    { trade: "plumbers", city: "new-york", label: "Plumber CRM in New York" },
    { trade: "electricians", city: "san-diego", label: "Electrician CRM in San Diego" },
    { trade: "roofing-contractors", city: "charlotte", label: "Roofing CRM in Charlotte" },
  ];

  // Blog categories with representative posts
  const blogCategories = [
    { label: "Lead Generation", posts: allBlogPosts.filter(p => p.category === "Sales & Marketing").slice(0, 4) },
    { label: "Estimating & Bidding", posts: allBlogPosts.filter(p => p.category === "Estimating & Bidding").slice(0, 4) },
    { label: "Job Management", posts: allBlogPosts.filter(p => p.category === "Job Management").slice(0, 4) },
    { label: "Cash Flow", posts: allBlogPosts.filter(p => p.category === "Cash Flow & Invoicing").slice(0, 4) },
    { label: "Customer Experience", posts: allBlogPosts.filter(p => p.category === "Customer Experience").slice(0, 4) },
    { label: "Operations", posts: allBlogPosts.filter(p => p.category === "Operations & Scheduling").slice(0, 4) },
    { label: "Growth & Scaling", posts: allBlogPosts.filter(p => p.category === "Growth & Scaling").slice(0, 4) },
    { label: "Automation", posts: allBlogPosts.filter(p => p.category === "Automation & Efficiency").slice(0, 4) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Contractor Business Resources
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              Everything contractors need to run a better business. Explore software guides, trade-specific CRM solutions, city resources, and business growth strategies powered by the myCT1 Business-in-a-Box platform.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1 - Introduction */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground leading-[1.8] text-lg">
              myCT1 provides the tools, training, and systems contractors need to manage every part of their business from one platform. Whether you are a plumber in Dallas, an electrician in Chicago, or an HVAC contractor in Phoenix, the myCT1 Business-in-a-Box system helps you capture more leads, send professional estimates, schedule jobs, collect payments, and grow your business without hiring extra office staff.
            </p>
            <p className="text-muted-foreground leading-[1.8] text-lg mt-4">
              Explore the resources below to find guides, software features, and strategies designed specifically for contractor businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 - Contractor Software Guides */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Contractor Software Guides</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Deep-dive guides explaining how each feature inside the myCT1 platform helps contractors manage their business more efficiently.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <span className="font-semibold text-foreground">{link.label}</span>
                <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 - Contractor CRM by Trade */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Wrench className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Contractor CRM by Trade</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Every contractor trade has unique challenges. Explore how the myCT1 Business-in-a-Box system is tailored for your specific trade.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topTrades.map((trade) => (
              <Link
                key={trade.slug}
                to={`/crm-for-${trade.slug}`}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all text-center"
              >
                <span className="text-sm font-medium text-foreground">{trade.keyword}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/trades-we-serve" className="text-primary hover:text-primary/80 text-sm font-medium">
              View all trades we serve →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4 - Contractor CRM by City */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Contractor CRM by City</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Find contractor CRM and business management solutions localized for your city. myCT1 serves contractors nationwide across all 50 states.
          </p>

          {/* Featured city+trade combos */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {cityTradeExamples.map((item) => (
              <Link
                key={`${item.trade}-${item.city}`}
                to={`/crm-for-${item.trade}-in-${item.city}`}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all text-center"
              >
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Cities directory */}
          <h3 className="text-lg font-semibold text-foreground mb-4">Browse by City</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                to={`/crm-for-plumbers-in-${city.slug}`}
                className="p-2 rounded border border-border/50 hover:border-primary/30 transition-colors text-center"
              >
                <span className="text-xs font-medium text-muted-foreground">{city.name}, {city.stateCode}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 - Contractor Business Guides (Blog) */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Contractor Business Guides</h2>
          </div>
          <p className="text-muted-foreground mb-10 max-w-3xl">
            Actionable articles covering the real problems contractors face every day. From getting more leads to improving cash flow, these guides are written for contractors by people who understand the trades.
          </p>

          <div className="space-y-10">
            {blogCategories.filter(c => c.posts.length > 0).map((category) => (
              <div key={category.label}>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-l-4 border-primary pl-3">
                  {category.label}
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {category.posts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <span className="text-sm font-medium text-foreground leading-snug line-clamp-2">{post.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/blog-podcast" className="text-primary hover:text-primary/80 text-sm font-medium">
              Browse all articles →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6 - Business-in-a-Box Explainer + CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">The myCT1 Business-in-a-Box System</h2>
            </div>
            <p className="text-muted-foreground leading-[1.8] text-lg mb-6">
              Most contractors use five or more disconnected tools to run their business. A separate CRM, a spreadsheet for estimates, a calendar for scheduling, an invoicing app, and maybe a notebook for tracking leads. Each tool creates a silo where information gets lost, follow-ups get missed, and money slips through the cracks.
            </p>
            <p className="text-muted-foreground leading-[1.8] text-lg mb-6">
              The myCT1 Business-in-a-Box system replaces all of those disconnected tools with one contractor operating platform. From the moment a lead calls to the final invoice payment, everything flows through a single system. Leads connect to estimates. Estimates convert to jobs. Jobs generate invoices. Invoices sync to QuickBooks. And Forge AI handles the follow-ups and calls you miss while you are on the job site.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "Lead generation and CRM",
                "Professional estimating with e-signatures",
                "Job scheduling and crew management",
                "Invoicing and online payment processing",
                "QuickBooks integration",
                "Customer portal for approvals and payments",
                "Reporting dashboards and KPIs",
                "Forge AI call answering and follow-ups",
                "Contractor training platform",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">Explore Pricing</Link>
              </Button>
            </div>
          </div>
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
