import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, Send, Clock, CalendarCheck, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-estimating-software.jpg";

const faqItems = [
  {
    question: "What is contractor estimating software?",
    answer:
      "Contractor estimating software is a digital tool that helps contractors create accurate, professional estimates and proposals. Instead of handwriting quotes or building spreadsheets from scratch, estimating software lets you build line-item estimates, apply markup and tax calculations, attach scope of work details, and send polished proposals that clients can review and approve online.",
  },
  {
    question: "Why does estimating speed matter?",
    answer:
      "Homeowners and general contractors typically request quotes from multiple contractors at once. The first contractor to deliver a clear, professional estimate has a significant advantage. Studies show that responding within 24 hours dramatically increases your win rate. Slow estimates signal disorganization and give competitors time to close the deal first.",
  },
  {
    question: "Can estimating connect with job scheduling?",
    answer:
      "Yes. With myCT1, when a client approves an estimate, it converts directly into a scheduled job. Customer details, scope of work, line items, and pricing all carry over automatically. This eliminates double entry and ensures nothing gets lost between the sales process and the actual work.",
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

export function ContractorEstimatingSoftware() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor Estimating Software | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Contractor estimating software that creates professional quotes fast. Send estimates, win approvals, and convert leads into jobs with myCT1.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/contractor-estimating-software";
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
            <FileText className="h-5 w-5 mr-2" />
            Estimating
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Contractor Estimating Software That <span className="text-primary">Wins More Jobs</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Build professional estimates in minutes, deliver them digitally, and convert approvals into scheduled jobs automatically.
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

      {/* Section 1 - Slow Estimates */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Slow Estimates Cost You Real Money</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Every day a quote sits unfinished is a day your competitor gets closer to closing that deal. Most
              contractors lose jobs not because their price is wrong, but because they took too long to respond. When
              you are juggling active job sites, writing estimates after hours on a laptop feels impossible. The result
              is missed deadlines, lost leads, and revenue that walks out the door.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Clock, title: "Delayed responses", desc: "Handwritten quotes take days to reach customers." },
              { icon: FileText, title: "Unprofessional formats", desc: "Spreadsheet estimates undermine your credibility." },
              { icon: BarChart3, title: "No follow-up system", desc: "Sent quotes disappear with no tracking or reminders." },
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

      {/* Section 2 - Create Estimates Fast */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Professional Estimates in Minutes, Not Hours</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                myCT1 gives you line-item estimate templates built for your trade. Add materials, labor, permits, and
                markup with a few taps. Reuse saved templates for common jobs so you never start from scratch. Every
                estimate includes your branding, scope of work, terms, and warranty details.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Line-item builder with quantity, unit pricing, and markup",
                  "Reusable templates for your most common job types",
                  "Automatic tax calculation and deposit requirements",
                  "Branded proposals with your logo and company details",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/estimating">Explore estimating features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0 space-y-3">
                {[
                  { label: "Roof Tear-Off and Replacement", qty: "32 SQ", price: "$285.00" },
                  { label: "Synthetic Underlayment", qty: "32 SQ", price: "$45.00" },
                  { label: "Ice and Water Shield", qty: "6 SQ", price: "$95.00" },
                  { label: "Ridge Vent Installation", qty: "48 LF", price: "$18.50" },
                  { label: "Permit and Dumpster", qty: "1 EA", price: "$850.00" },
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
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">$11,738.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 - Digital Delivery */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Send, Track, and Get Approved Digitally</h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            No more printing, mailing, or chasing signatures. With myCT1, estimates are delivered instantly via email
            with a secure link. Clients review every line item, sign electronically, and you get notified the moment
            they approve. You can even collect deposits online before work begins.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Send, label: "Instant delivery", desc: "Estimates sent by email in one click." },
              { icon: FileText, label: "E-signatures", desc: "Clients sign and approve from any device." },
              { icon: Zap, label: "Real-time alerts", desc: "Get notified when clients view or sign." },
              { icon: BarChart3, label: "Deposit collection", desc: "Collect payments before work starts." },
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

      {/* Section 4 - Track and Follow Up */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Know Exactly Where Every Quote Stands</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Sending an estimate is only half the job. The money is in the follow-up. myCT1 shows you which estimates
              have been viewed, which are waiting for a response, and which need a follow-up call. Automated reminders
              keep prospects engaged so fewer quotes go cold.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { status: "Viewed", count: 8, color: "bg-[hsl(var(--blue-vibrant))]" },
              { status: "Awaiting Signature", count: 5, color: "bg-[hsl(var(--orange-vibrant))]" },
              { status: "Approved", count: 12, color: "bg-[hsl(var(--green-vibrant))]" },
              { status: "Follow-up Due", count: 3, color: "bg-primary" },
              { status: "Expired", count: 2, color: "bg-muted-foreground" },
              { status: "Declined", count: 1, color: "bg-destructive" },
            ].map(({ status, count, color }) => (
              <Card key={status} className="card-ct1">
                <CardContent className="flex items-center gap-4 px-6 py-4">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <span className="font-medium">{status}</span>
                  <span className="ml-auto text-2xl font-bold text-foreground">{count}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 - Estimate to Job */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 space-y-4">
              {[
                { step: "1", label: "Estimate created", detail: "Build and send a professional proposal." },
                { step: "2", label: "Client approves", detail: "E-signature and optional deposit collected." },
                { step: "3", label: "Job auto-created", detail: "All details transfer to a new active job." },
                { step: "4", label: "Crew assigned", detail: "Schedule the work and assign your team." },
              ].map(({ step, label, detail }) => (
                <Card key={step} className="card-ct1">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{step}</div>
                    <div>
                      <h3 className="font-semibold">{label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Approved Estimates Become Scheduled Jobs Instantly</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                When a client signs your estimate, myCT1 automatically converts it into an active job. Customer info,
                line items, scope of work, and pricing all carry forward. No retyping, no copy-paste errors, no lost
                details. Your office stays organized and your crew knows exactly what was promised.
              </p>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/jobs">See job management features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">Start Winning More Jobs Today</h2>
          <p className="mt-6 text-lg text-background/70">
            Build estimates faster, deliver them instantly, and convert approvals into real work. Try myCT1 free for
            30 days and see how professional estimating changes your close rate.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
              <Link to="/trial-signup">Try Estimating Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
