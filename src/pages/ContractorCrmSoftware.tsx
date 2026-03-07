import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, ClipboardList, Zap, BarChart3, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
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
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ct1-black py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-ct1-white sm:text-5xl lg:text-6xl">
              Contractor CRM Software for Home Service Businesses
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Stop losing leads. Close more jobs. The CRM built from the ground up for contractors who want to grow.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
                <Link to="/trial-signup">Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-ct1-white hover:bg-ct1-white/10">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 1 - The Problem */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
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
                <div key={title} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                  <Icon className="mx-auto h-10 w-10 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2 - How CRM Organizes */}
        <section className="bg-secondary/40 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6">
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
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="space-y-4">
                  {["New Lead", "Estimate Sent", "Follow-up Needed", "Job Scheduled", "Completed"].map((stage, i) => (
                    <div
                      key={stage}
                      className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <div
                        className={`h-3 w-3 rounded-full ${
                          i < 3 ? "bg-primary" : i === 3 ? "bg-[hsl(var(--blue-vibrant))]" : "bg-[hsl(var(--green-vibrant))]"
                        }`}
                      />
                      <span className="font-medium">{stage}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{[12, 8, 5, 3, 24][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 - Connected Tools */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              CRM That Connects to Everything You Need
            </h2>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
              Your CRM should not live in a silo. myCT1 connects lead management directly to estimating, job scheduling,
              invoicing, and even your AI phone assistant so your workflow stays seamless from first call to final payment.
            </p>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ClipboardList, label: "Estimating", desc: "Create and send estimates from any lead record." },
                { icon: Clock, label: "Scheduling", desc: "Convert won estimates into scheduled jobs instantly." },
                { icon: Zap, label: "AI Phone Agent", desc: "Capture leads 24/7 with PocketBot voice AI." },
                { icon: Shield, label: "Invoicing", desc: "Bill customers tied to the original estimate and job." },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Button asChild variant="link" className="px-0 text-primary">
                <Link to="/products/pocketbot">Learn about PocketBot AI <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 4 - Why Contractor-Specific */}
        <section className="bg-secondary/40 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
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
                  title: "Generic CRM",
                  bad: true,
                  points: [
                    "Designed for office-based sales teams",
                    "No concept of estimates, jobs, or trades",
                    "Complex setup with features you will never use",
                    "No integration with field operations",
                  ],
                },
                {
                  title: "myCT1 Contractor CRM",
                  bad: false,
                  points: [
                    "Purpose-built for home service contractors",
                    "Estimate-to-job workflow out of the box",
                    "Crew scheduling, daily logs, and change orders",
                    "AI phone agent captures leads while you work",
                  ],
                },
              ].map(({ title, bad, points }) => (
                <div
                  key={title}
                  className={`rounded-xl border p-8 ${
                    bad ? "border-border bg-card" : "border-primary bg-primary/5"
                  }`}
                >
                  <h3 className={`text-xl font-bold ${bad ? "text-muted-foreground" : "text-primary"}`}>{title}</h3>
                  <ul className="mt-6 space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className={`mt-1 block h-2 w-2 shrink-0 rounded-full ${bad ? "bg-muted-foreground" : "bg-primary"}`} />
                        <span className="text-foreground">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 - Speed to Lead */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
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
                <div key={stat} className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                  <p className="text-4xl font-extrabold text-primary">{stat}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6 - CTA */}
        <section className="bg-ct1-black py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ct1-white sm:text-4xl">
              Ready to Stop Losing Leads?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Join thousands of contractors who manage their entire business with myCT1. Start your free trial today or
              explore pricing to find the right plan.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
                <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-ct1-white hover:bg-ct1-white/10">
                <Link to="/pricing">See Pricing Plans</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6">
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
      </div>
    </>
  );
}
