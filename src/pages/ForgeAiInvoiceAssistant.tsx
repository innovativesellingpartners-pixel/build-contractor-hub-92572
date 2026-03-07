import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, Receipt, Zap, Clock, DollarSign, BarChart3, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-accounting-finance.jpg";
import forgeLogoIcon from "@/assets/forgeailogo2.png";

const faqItems = [
  {
    question: "What is an AI invoice assistant for contractors?",
    answer:
      "An AI invoice assistant is software that automates the invoicing process for contractors. It generates professional invoices from approved estimates and completed jobs, tracks payment status, sends reminders to clients, and gives you a clear picture of your accounts receivable ... all without manual data entry.",
  },
  {
    question: "How does AI invoicing save contractors time?",
    answer:
      "Instead of manually creating invoices from scratch, the AI assistant pulls line items, pricing, and customer details directly from your estimates and jobs. It auto-calculates totals, tax, and balances due. Automated payment reminders reduce the time you spend chasing payments, so you get paid faster with less effort.",
  },
  {
    question: "Can the AI invoice assistant handle change orders?",
    answer:
      "Yes. When a change order is approved on a job, the AI invoice assistant automatically reflects the updated scope and pricing in the next invoice. This ensures billing accuracy and eliminates disputes over what was agreed upon.",
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

export function ForgeAiInvoiceAssistant() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Forge AI Invoice Assistant for Contractors | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Forge AI invoice assistant for contractors automates billing, tracks payments, and sends reminders so you get paid faster with myCT1.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/forge-ai-invoice-assistant";
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={forgeLogoIcon} alt="Forge AI" className="h-10 w-10" />
            <Badge className="bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Receipt className="h-5 w-5 mr-2" />
              Forge AI
            </Badge>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AI Invoice Assistant for <span className="text-primary">Contractors</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Automate invoicing, track payments, and get paid faster. Forge AI turns completed work into professional invoices without the paperwork.
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
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Manual Invoicing Slows Down Your Cash Flow</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              After finishing a job, the last thing a contractor wants to do is sit down and build an invoice from scratch.
              But delays in billing mean delays in getting paid. Most contractors wait days or weeks to send invoices,
              and then spend more time chasing payments. That gap between completed work and collected payment creates
              cash flow problems that hold your business back.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Clock, title: "Billing delays", desc: "Invoices sent days or weeks after job completion." },
              { icon: FileText, title: "Manual data entry", desc: "Retyping estimate details into invoice templates." },
              { icon: DollarSign, title: "Unpaid balances", desc: "No system to track or follow up on overdue payments." },
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

      {/* Section 2 - Auto Invoice Generation */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Invoices Generated Automatically from Your Jobs</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Forge AI pulls line items, pricing, customer info, and scope of work directly from your estimates and
                jobs. When work is completed, a professional invoice is ready to send in one click. No retyping, no
                errors, no wasted time.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Auto-populates from approved estimates and job records",
                  "Includes line items, tax, deposits, and balance due",
                  "Professional branded invoices with your logo",
                  "Change orders automatically reflected in billing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/estimating">See estimating integration <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0 space-y-3">
                {[
                  { label: "Kitchen Demo and Rebuild", qty: "1 JOB", price: "$8,500.00" },
                  { label: "Plumbing Rough-In", qty: "1 EA", price: "$2,200.00" },
                  { label: "Electrical Update", qty: "1 EA", price: "$1,800.00" },
                  { label: "Change Order: Backsplash Upgrade", qty: "1 CO", price: "$650.00" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="ml-3 text-xs text-muted-foreground">{item.qty}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{item.price}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
                  <span className="font-semibold">Total Due</span>
                  <span className="text-lg font-bold text-primary">$13,150.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 - Payment Tracking */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Track Every Dollar Owed and Collected</h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Know exactly which invoices are paid, pending, or overdue at a glance. Forge AI gives you a real-time
            accounts receivable dashboard so you always know where your money stands.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Send, label: "Sent", desc: "Invoices delivered to clients instantly." },
              { icon: BarChart3, label: "Viewed", desc: "Know when clients open your invoice." },
              { icon: DollarSign, label: "Paid", desc: "Payments tracked and recorded automatically." },
              { icon: Clock, label: "Overdue", desc: "Automated reminders for late payments." },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="card-ct1 p-6">
                <CardContent className="p-0">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Automated Reminders */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stop Chasing Payments Manually</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Forge AI sends professional payment reminders on your behalf. Set your preferred schedule, and the system
              handles the rest. Clients receive polite, branded reminders with a direct link to pay online. You focus
              on the next job while your invoices collect themselves.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Invoice sent", desc: "Client receives a branded invoice with payment link." },
              { step: "2", title: "Reminder scheduled", desc: "Automated follow-ups at intervals you choose." },
              { step: "3", title: "Payment collected", desc: "Online payment processed and recorded." },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="card-ct1 text-center p-6">
                <CardContent className="p-0">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{step}</div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 - Connected Workflow */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Connected to Your Entire Workflow</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Forge AI is not a standalone invoicing tool. It lives inside the myCT1 platform, connected to your CRM,
                estimates, jobs, and change orders. Every invoice traces back to the original estimate and customer record,
                giving you a complete financial picture of every project.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Invoices linked to estimates, jobs, and change orders",
                  "Customer payment history in one place",
                  "Revenue reporting across all projects",
                  "Integrates with your existing myCT1 workflow",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/crm">CRM features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/jobs">Job management <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/products/pocketbot">PocketBot AI <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0 space-y-4">
                {[
                  { label: "Lead Captured", icon: Zap, color: "text-[hsl(var(--blue-vibrant))]" },
                  { label: "Estimate Approved", icon: FileText, color: "text-[hsl(var(--orange-vibrant))]" },
                  { label: "Job Completed", icon: ShieldCheck, color: "text-[hsl(var(--green-vibrant))]" },
                  { label: "Invoice Sent", icon: Send, color: "text-primary" },
                  { label: "Payment Received", icon: DollarSign, color: "text-[hsl(var(--green-vibrant))]" },
                ].map(({ label, icon: Icon, color }, i) => (
                  <div key={label}>
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className="font-medium">{label}</span>
                    </div>
                    {i < 4 && <div className="flex justify-center py-1"><div className="h-4 w-px bg-border" /></div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 6 - CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">Get Paid Faster. Invoice Smarter.</h2>
          <p className="mt-6 text-lg text-background/70">
            Let Forge AI handle your invoicing so you can focus on the work that matters. Try myCT1 free for 30 days.
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
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
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
