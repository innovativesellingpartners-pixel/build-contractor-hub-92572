import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, PhoneCall, PhoneMissed, Clock, CalendarCheck, UserCheck, BellRing, Moon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-voice-ai.jpg";

const faqItems = [
  {
    question: "What is an AI answering service for contractors?",
    answer:
      "An AI answering service for contractors is an automated phone system that answers incoming calls using conversational AI. It greets callers professionally, captures their name, contact info, and job details, and can book appointments or send notifications to the contractor. It works around the clock so no call goes unanswered, even when you are on a job site or after business hours.",
  },
  {
    question: "Why do contractors use AI call answering?",
    answer:
      "Contractors miss up to 40% of incoming calls because they are working in the field. Each missed call is a potential lost job. AI call answering ensures every caller reaches a professional response, lead details are captured instantly, and follow-up happens faster. It costs a fraction of hiring a receptionist and works nights, weekends, and holidays.",
  },
  {
    question: "Does AI replace office staff?",
    answer:
      "No. AI answering works alongside your team, not instead of them. It handles overflow calls, after-hours inquiries, and initial lead capture so your staff can focus on higher-value tasks like scheduling, customer service, and job coordination. Think of it as a backup that never calls in sick.",
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

export function AiAnsweringServiceForContractors() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "AI Answering Service for Contractors | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "AI answering service for contractors captures missed calls, books appointments, and qualifies leads automatically.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/ai-answering-service-for-contractors";
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
            <PhoneCall className="h-5 w-5 mr-2" />
            Voice AI
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AI Answering Service for <span className="text-primary">Contractors</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Never miss another call. AI captures every lead, books appointments, and qualifies prospects while you focus on the job.
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

      {/* Section 1 - Missed Calls */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Every Missed Call Is a Lost Job</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Homeowners call one contractor, and if nobody picks up, they call the next one on the list. Research
              shows that 85% of callers who reach voicemail will not call back. When you are on a roof, under a
              house, or running a crew, answering the phone is not an option. But losing the lead should not be either.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { icon: PhoneMissed, title: "40% of calls missed", desc: "Contractors working in the field cannot answer every ring." },
              { icon: Clock, title: "85% never call back", desc: "Callers who hit voicemail move on to the next contractor." },
              { icon: MessageSquare, title: "No message left", desc: "Most prospects hang up without leaving a voicemail." },
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

      {/* Section 2 - How AI Answers */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Picks Up, Greets, and Captures Every Detail</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                When a call comes in, the myCT1 AI agent answers with a professional greeting customized to your
                business. It engages the caller in a natural conversation, captures their name, phone number, address,
                and project details, then sends you a complete summary instantly.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Custom greeting using your business name and voice",
                  "Natural conversation that captures caller details",
                  "Instant lead notification via text and dashboard",
                  "Full call transcript and AI summary available",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/features/voice-ai">Explore Voice AI features <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0 space-y-4">
                <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
                  <p className="font-medium text-primary">AI Agent</p>
                  <p className="mt-1 text-foreground">"Thank you for calling Smith Roofing. How can I help you today?"</p>
                </div>
                <div className="rounded-lg bg-secondary px-4 py-3 text-sm">
                  <p className="font-medium text-muted-foreground">Caller</p>
                  <p className="mt-1 text-foreground">"I need a roof inspection. We had some storm damage last week."</p>
                </div>
                <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
                  <p className="font-medium text-primary">AI Agent</p>
                  <p className="mt-1 text-foreground">"I am sorry to hear that. Let me get some details so we can schedule an inspection for you..."</p>
                </div>
                <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Lead Captured</p>
                  <p className="mt-1 text-sm text-foreground">Name, phone, address, and project details recorded.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 - After-Hours */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Capture Leads After Hours, Weekends, and Holidays</h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Homeowners search for contractors at night and on weekends. If your phone goes to voicemail at 8 PM, that
            lead goes to a competitor who answers. The myCT1 AI agent works 24/7, 365 days a year.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Moon, label: "After hours", desc: "Captures leads while you sleep." },
              { icon: CalendarCheck, label: "Weekends", desc: "Never miss a Saturday inquiry." },
              { icon: PhoneCall, label: "Overflow calls", desc: "Handles surges when lines are busy." },
              { icon: BellRing, label: "Instant alerts", desc: "Get notified of every new lead." },
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

      {/* Section 4 - Appointment Booking */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Book Appointments Without Lifting a Finger</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              The AI agent does not just take messages. It checks your calendar availability and offers appointment
              times to callers in real time. When a caller picks a slot, the booking is confirmed, added to your
              calendar, and a confirmation message is sent.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Caller requests appointment", desc: "AI asks about preferred date and time." },
              { step: "2", title: "AI checks availability", desc: "Syncs with your calendar to find open slots." },
              { step: "3", title: "Booking confirmed", desc: "Both you and the caller receive confirmation." },
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

      {/* Section 5 - Lead Qualification */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Qualified Leads Before You Call Back</h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Not every call is worth your time. The AI agent asks qualifying questions based on your preferences.
                It identifies the type of work, project timeline, location, and budget range. By the time you follow
                up, you already know if the lead is a good fit.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Custom qualification questions for your trade",
                  "Service area filtering to avoid out-of-range leads",
                  "Project type and urgency classification",
                  "Priority scoring so you call the best leads first",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link to="/products/voice-ai">Learn more about Voice AI <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <Card className="card-ct1 p-8">
              <CardContent className="p-0">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lead Summary</h3>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Name", value: "Sarah Johnson" },
                    { label: "Phone", value: "(555) 234-5678" },
                    { label: "Service", value: "Kitchen remodel" },
                    { label: "Timeline", value: "Within 2 weeks" },
                    { label: "Location", value: "Within service area" },
                    { label: "Priority", value: "High" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`text-sm font-medium ${label === "Priority" ? "text-primary" : "text-foreground"}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[hsl(var(--green-vibrant))]" />
                  <span className="text-sm font-medium text-[hsl(var(--green-vibrant))]">Qualified - Ready for follow-up</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 6 - CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">Stop Missing Calls. Start Closing More Jobs.</h2>
          <p className="mt-6 text-lg text-background/70">
            Let AI handle your phones so you can focus on the work. Every call answered, every lead captured, every
            appointment booked. Try myCT1 free for 30 days.
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
