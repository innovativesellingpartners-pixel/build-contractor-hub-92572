import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, ClipboardList, Zap, BarChart3, Clock, Shield, Phone, FileText, Calendar, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import type { TradeCrmConfig } from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";
import heroBg from "@/assets/hero-crm-dashboard.jpg";

interface Props {
  config: TradeCrmConfig;
}

export function TradeCrmLandingPage({ config }: Props) {
  const { trade, tradePlural, keyword, slug, metaDescription, heroSubtitle, challenges, faqItems } = config;

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
    document.title = `${keyword} | myCT1`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", metaDescription);

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = `https://myct1.com/crm-for-${slug}`;

    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);
    return () => { script?.remove(); };
  }, [slug]);

  const challengeIcons = [Users, ClipboardList, BarChart3];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
            <Users className="h-5 w-5 mr-2" />
            {tradePlural} CRM
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            {keyword.replace(" Software", "")} <span className="text-primary">Software</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">{heroSubtitle}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
              <Link to="/trial-signup">Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 – Challenges */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Common Challenges for {tradePlural} Businesses
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {trade} businesses face unique operational challenges every day. Missed calls, unorganized estimates, and scheduling conflicts cost real revenue. Here is what most {tradePlural.toLowerCase()} businesses struggle with.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {challenges.map(({ title, desc }, i) => {
              const Icon = challengeIcons[i % challengeIcons.length];
              return (
                <Card key={title} className="card-ct1 text-center p-6">
                  <CardContent className="p-0">
                    <Icon className="mx-auto h-10 w-10 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2 – Lead & Customer Management */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Manage Every Lead and Customer in One Place
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                myCT1 gives {tradePlural.toLowerCase()} businesses a single command center. New leads automatically appear in your pipeline. Contact details, estimate history, job status, and communication logs are all connected so nothing gets lost.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Visual pipeline to track every lead from inquiry to close",
                  "Full customer profiles with history and notes",
                  "Automated lead capture from calls, forms, and referrals",
                  "Real-time status updates across your team",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/crm">Explore CRM features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0 space-y-4">
                {["New Lead", "Estimate Sent", "Follow-up Needed", "Job Scheduled", "Completed"].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
                    <div className={`h-3 w-3 rounded-full ${i < 3 ? "bg-primary" : i === 3 ? "bg-[hsl(var(--blue-vibrant))]" : "bg-[hsl(var(--green-vibrant))]"}`} />
                    <span className="font-medium">{stage}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{[12, 8, 5, 3, 24][i]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 – Estimating & Quoting */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Card className="card-ct1 p-8 order-2 lg:order-1">
              <CardContent className="p-0 space-y-5">
                {[
                  { icon: FileText, label: "Professional Estimates", desc: "Create branded, itemized estimates in minutes" },
                  { icon: Zap, label: "One-Click Send", desc: "Email estimates directly from the platform" },
                  { icon: CheckCircle2, label: "E-Signatures", desc: "Clients approve and sign estimates digitally" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-4 rounded-lg border border-border bg-background px-4 py-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Send Estimates Faster, Close More Jobs
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Speed wins in {tradePlural.toLowerCase()}. With myCT1, create professional, branded estimates with line items, send them instantly for digital approval, and convert accepted estimates directly into scheduled jobs. No more retyping or lost paperwork.
              </p>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/estimating">Explore estimating features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 – Scheduling & Jobs */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Job Scheduling Built for the Field
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Convert won estimates into scheduled jobs instantly. Assign crews, track daily progress, log notes, and manage change orders — all from your phone or desktop. myCT1 keeps your {tradePlural.toLowerCase()} projects moving forward.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Calendar, label: "Drag-and-Drop Scheduling", desc: "Visual calendar with crew assignment and conflict detection." },
              { icon: ClipboardList, label: "Daily Logs", desc: "Capture work completed, hours, weather, and materials used each day." },
              { icon: Shield, label: "Change Orders", desc: "Create, send, and get signatures on change orders from the field." },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="card-ct1 p-6 text-center">
                <CardContent className="p-0">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="link" className="text-primary">
              <Link to="/features/jobs">Explore job management <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 5 – Invoicing & Payments */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get Paid Faster with Built-In Invoicing
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Generate invoices directly from completed jobs. Track payment status, send reminders, and accept online payments — all connected to the customer record and original estimate. No more chasing checks or wondering who owes what.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Generate invoices from job records in one click",
                  "Accept online payments via credit card or ACH",
                  "Automatic payment reminders for outstanding balances",
                  "Full payment history tied to customer profiles",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "$0", label: "Outstanding", sub: "All invoices paid" },
                { stat: "24h", label: "Avg. payment time", sub: "With online payments" },
                { stat: "98%", label: "Collection rate", sub: "With automated reminders" },
                { stat: "1-click", label: "Invoice creation", sub: "From job records" },
              ].map(({ stat, label, sub }) => (
                <Card key={label} className="card-ct1 p-4 text-center">
                  <CardContent className="p-0">
                    <p className="text-2xl font-extrabold text-primary">{stat}</p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 – AI Tools */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI-Powered Tools That Work While You Don't
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              myCT1 includes AI tools designed for {tradePlural.toLowerCase()} businesses. From a voice AI assistant that answers calls 24/7 to automated follow-ups and smart scheduling, your business keeps running even when you are on a job site.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Phone, label: "Voice AI Assistant", desc: "PocketBot answers calls, captures lead info, and books appointments 24/7.", link: "/products/pocketbot" },
              { icon: Bot, label: "Smart Follow-Up", desc: "Automated reminders for unsigned estimates and pending leads." },
              { icon: Zap, label: "AI Estimating Help", desc: "Generate scope descriptions and line items faster with AI assistance." },
            ].map(({ icon: Icon, label, desc, link }) => (
              <Card key={label} className="card-ct1 p-6">
                <CardContent className="p-0">
                  <Icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  {link && (
                    <Link to={link} className="mt-3 inline-block text-sm text-primary hover:underline">
                      Learn more <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 – CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
            Ready to Grow Your {tradePlural} Business?
          </h2>
          <p className="mt-6 text-lg text-background/70">
            Join thousands of contractors who manage their entire business with myCT1. Start your free trial today or explore pricing to find the right plan.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
              <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
              <Link to="/pricing">See Pricing Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-8">
            {faqItems.map(({ question, answer }) => (
              <div key={question} className="border-b border-border pb-8 last:border-0">
                <h3 className="text-lg font-semibold">{question}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/features/crm" className="text-primary hover:underline">CRM Features</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/features/estimating" className="text-primary hover:underline">Estimating</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/features/jobs" className="text-primary hover:underline">Job Management</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/products/pocketbot" className="text-primary hover:underline">PocketBot Voice AI</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/pricing" className="text-primary hover:underline">Pricing</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/contractor-crm-software" className="text-primary hover:underline">Contractor CRM</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
