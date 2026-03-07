import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, ClipboardList, Zap, BarChart3, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-crm-dashboard.jpg";

const faqItems = [
  {
    question: "What is contractor CRM software?",
    answer:
      "Contractor CRM software is a customer relationship management platform designed specifically for contractors and home service businesses. It helps you track leads, manage customer information, follow up on estimates, schedule jobs, and maintain organized communication ... all from one central system built for how contractors actually work.",
  },
  {
    question: "Why do contractors use CRM systems?",
    answer:
      "Contractors use CRM systems to stop losing leads, speed up follow-up, and keep every customer interaction organized. Without a CRM, leads fall through the cracks, estimates go unfollowed, and revenue is left on the table. A contractor-specific CRM replaces spreadsheets and sticky notes with a streamlined workflow that helps close more jobs.",
  },
  {
    question: "Can contractor CRM track estimates and jobs?",
    answer:
      "Yes. A purpose-built contractor CRM like myCT1 tracks every estimate from creation to signature, then converts accepted estimates directly into active jobs. You can monitor job status, assign crews, log daily progress, and manage change orders ... all connected to the original customer record.",
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

export function ContractorCrmSoftware() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor CRM Software | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Contractor CRM software built for home service businesses. Track leads, manage jobs, send estimates, and close more work with myCT1.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/contractor-crm-software";
    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);
    return () => { script?.remove(); };
  }, []);

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
            CRM
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Contractor CRM Software for <span className="text-primary">Home Service Businesses</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Stop losing leads. Close more jobs. The CRM built from the ground up for contractors who want to grow.
          </p>
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

      {/* Section 1 - The Problem */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Leads Slip Through the Cracks Every Day
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Most contractors rely on phone calls, texts, sticky notes, and memory to track prospects. When a new lead
              comes in during a busy workday, following up fast is nearly impossible. Studies show that responding within
              five minutes makes you 21x more likely to qualify a lead, but the average contractor takes hours or even
              days. That delay costs real revenue.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Users, title: "Scattered contacts", desc: "Customer info spread across phones, emails, and paper." },
              { icon: ClipboardList, title: "Missed follow-ups", desc: "No system to remind you when a lead needs attention." },
              { icon: BarChart3, title: "No visibility", desc: "You cannot measure what you cannot see or track." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="card-ct1 text-center p-6">
                <CardContent className="p-0">
                  <Icon className="mx-auto h-10 w-10 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2 - How CRM Organizes */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Every Lead, Job, and Customer in One Place
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                The myCT1 CRM gives you a single command center for your business. New leads automatically appear in your
                pipeline. Customer contact details, estimate history, job status, and communication logs are all connected
                so nothing gets lost.
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

      {/* Section 3 - Connected Tools */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CRM That Connects to Everything You Need
          </h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Your CRM should not live in a silo. myCT1 connects lead management directly to estimating, job scheduling,
            invoicing, and even your AI phone assistant so your workflow stays seamless from first call to final payment.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ClipboardList, label: "Estimating", desc: "Create and send estimates from any lead record.", link: "/features/estimating" },
              { icon: Clock, label: "Scheduling", desc: "Convert won estimates into scheduled jobs instantly.", link: "/features/jobs" },
              { icon: Zap, label: "AI Phone Agent", desc: "Capture leads 24/7 with PocketBot voice AI.", link: "/products/pocketbot" },
              { icon: Shield, label: "Invoicing", desc: "Bill customers tied to the original estimate and job.", link: "/features/estimating" },
            ].map(({ icon: Icon, label, desc, link }) => (
              <Card key={label} className="card-ct1 p-6">
                <CardContent className="p-0">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  <Link to={link} className="mt-3 inline-block text-sm text-primary hover:underline">
                    Learn more <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Why Contractor-Specific */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for Contractors, Not Generic Sales Teams
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Generic CRM tools were designed for inside sales teams sitting at desks. Contractors work in the field,
              juggle multiple job sites, and need tools that match their workflow. myCT1 is built around trades-specific
              terminology, estimate-to-job conversion, crew management, and change orders ... things a generic CRM will
              never understand.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {[
              {
                title: "Generic CRM", bad: true,
                points: ["Designed for office-based sales teams", "No concept of estimates, jobs, or trades", "Complex setup with features you will never use", "No integration with field operations"],
              },
              {
                title: "myCT1 Contractor CRM", bad: false,
                points: ["Purpose-built for home service contractors", "Estimate-to-job workflow out of the box", "Crew scheduling, daily logs, and change orders", "AI phone agent captures leads while you work"],
              },
            ].map(({ title, bad, points }) => (
              <Card key={title} className={`p-8 ${bad ? "card-ct1" : "border-primary bg-primary/5"}`}>
                <CardContent className="p-0">
                  <h3 className={`text-xl font-bold ${bad ? "text-muted-foreground" : "text-primary"}`}>{title}</h3>
                  <ul className="mt-6 space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className={`mt-1 block h-2 w-2 shrink-0 rounded-full ${bad ? "bg-muted-foreground" : "bg-primary"}`} />
                        <span className="text-foreground">{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 - Speed to Lead */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Faster Follow-Up Means More Closed Jobs
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Speed is everything in contracting. The first contractor to respond usually wins the job. With myCT1, new
              leads trigger instant notifications, AI-powered call handling captures details even when you are on a
              ladder, and automated follow-up reminders keep your pipeline moving. Contractors using structured CRM
              follow-up see close rate improvements of 30% or more.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { stat: "21x", label: "More likely to qualify a lead when you respond in under 5 minutes" },
              { stat: "30%+", label: "Close rate improvement with structured CRM follow-up" },
              { stat: "24/7", label: "Lead capture with PocketBot AI handling calls after hours" },
            ].map(({ stat, label }) => (
              <Card key={stat} className="card-ct1 p-8 text-center">
                <CardContent className="p-0">
                  <p className="text-4xl font-extrabold text-primary">{stat}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 - CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
            Ready to Stop Losing Leads?
          </h2>
          <p className="mt-6 text-lg text-background/70">
            Join thousands of contractors who manage their entire business with myCT1. Start your free trial today or
            explore pricing to find the right plan.
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

      <PublicFooter />
    </div>
  );
}
