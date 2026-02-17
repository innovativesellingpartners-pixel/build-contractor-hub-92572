import { PublicFooter } from "@/components/PublicFooter";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { SEOHead } from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import heroBg from '@/assets/hero-crm-business.jpg';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="bg-card border border-primary/20 border-t-[3px] border-t-primary p-6 text-center">
    <div className="text-4xl md:text-5xl font-bold text-primary mb-1">{number}</div>
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

const CheckItem = ({ title, description }: { title: string; description: string }) => (
  <li className="flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0">
    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
    <span className="text-muted-foreground"><strong className="text-foreground">{title}</strong> {description}</span>
  </li>
);

const FeatureGrid = ({ title, items }: { title: string; items: string[] }) => (
  <div className="bg-card border border-border p-8 my-8">
    <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-3">
      {title}
      <span className="flex-1 h-px bg-primary/30" />
    </div>
    <ul className="grid md:grid-cols-2 gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
          <ChevronRight className="h-3 w-3 text-primary mt-1.5 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const PullQuote = ({ children }: { children: string }) => (
  <blockquote className="border-l-4 border-primary bg-primary/5 p-6 my-8 relative">
    <span className="absolute top-0 left-4 text-6xl text-primary/20 font-serif leading-none">"</span>
    <p className="text-lg font-semibold text-foreground italic leading-relaxed pt-4">{children}</p>
  </blockquote>
);

const tocItems = [
  { id: "what-is-crm", label: "What Is a Contractor CRM?" },
  { id: "signs", label: "5 Signs You've Outgrown Your System" },
  { id: "lean-fast-scalable", label: "Lean. Fast. Scalable." },
  { id: "what-to-look-for", label: "What to Look For" },
  { id: "family-community", label: "Building a Life Worth Having" },
  { id: "myct1", label: "How myCT1 Fits In" },
  { id: "getting-started", label: "Making the Transition" },
  { id: "conclusion", label: "The Bottom Line" },
];

export const ContractorCRMGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Complete Guide to Contractor CRM Systems | myCT1"
        description="Why every growing contractor needs a CRM and how choosing the right one can put more money in your bank, more time with your family, and more strength back into your community."
      />
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Link to="/blog-podcast" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Blog & Podcast
            </Link>
            <div className="flex justify-center mb-4">
              <Badge className="bg-primary text-primary-foreground px-4 py-2 text-lg">
                <FileText className="h-5 w-5 mr-2" />
                Business Tools
              </Badge>
            </div>
            <img src={ct1Logo} alt="CT1" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold text-foreground mb-6">
              The Complete Guide to <span className="text-primary">Contractor CRM Systems</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Why every growing contractor needs a CRM, and how choosing the right one can put more money in your bank, more time with your family, and more strength back into your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 text-center border border-border/60">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">PM</div>
                <div className="text-left">
                  <div className="font-semibold text-foreground text-sm">Patrick Montgomery</div>
                  <div className="text-xs text-muted-foreground">COO, myCT1.com</div>
                </div>
              </div>
            </div>
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 text-center border border-border/60">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Published</div>
              <div className="text-lg font-bold text-foreground">February 2026</div>
            </div>
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 text-center border border-border/60">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Read Time</div>
              <div className="text-lg font-bold text-foreground">12 Minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12">

            {/* Article */}
            <article className="prose-article">
              <p className="text-lg text-muted-foreground border-l-[3px] border-primary pl-6 leading-relaxed mb-8">
                Over the last few years working alongside contractors across all 50 states, one pattern is clear. The ones who scale fast, bank serious money, and still make it home for dinner? They don't work harder than the rest. They work leaner. They've built systems, and at the center of every one of those systems is a CRM that actually works for them.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 my-10">
                <StatCard number="68%" label="of contractor leads lost due to slow follow-up" />
                <StatCard number="11hrs" label="average time wasted weekly on admin tasks" />
                <StatCard number="3×" label="faster growth for CRM-using contractors" />
              </div>

              <h2 id="what-is-crm" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">What Is a CRM — And Why Does It Matter for Contractors?</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">A Customer Relationship Management system, or CRM, is the digital backbone of your customer pipeline. It tracks every lead, every quote, every job, and every invoice—keeping you from falling through the cracks that cost real money.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">For trade professionals, a generic CRM built for retail salespeople or software companies won't cut it. You need something that understands the rhythm of how contractors actually work: the morning call from a new lead, the job site chaos at 2pm, the crew scheduling headache, the follow-up you meant to send but never did. That's the gap a contractor-specific CRM fills—and fills well.</p>

              <p className="text-muted-foreground leading-relaxed mb-5"><strong className="text-foreground">Here's the hard truth:</strong> most contractors are running their business out of a combination of their head, a notepad, a few text threads, and maybe a spreadsheet. That works until it doesn't. And when it stops working, you're not just losing efficiency—you're losing jobs, revenue, and sleep.</p>

              <PullQuote>The contractors winning right now aren't the ones working longer hours. They're the ones who built a lean, fast, scalable operation—and a CRM is the engine underneath it.</PullQuote>

              <h2 id="signs" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">5 Signs You've Outgrown Your Current System</h2>

              <ul className="list-none space-y-0 mb-6">
                <CheckItem title="Leads fall through the cracks." description="Someone called Monday, you meant to call back, and by Friday you've lost the job to a competitor who followed up in 20 minutes." />
                <CheckItem title="You can't track job status without making calls." description="You're texting your crew to find out where things stand instead of seeing it on a dashboard." />
                <CheckItem title="Invoicing is chaotic." description="You're chasing payments, unsure what's been sent, what's been paid, and what's been ignored." />
                <CheckItem title="You can't see your profit clearly." description="You're busy, but you're not sure if you're actually making good money—or just moving money around." />
                <CheckItem title="Growth feels like more chaos." description="Every new job adds stress instead of confidence because you have no scalable process behind it." />
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-5">If two or more of those hit home, you're not just inefficient—you're actively leaving money on the table. The right CRM addresses all five simultaneously.</p>

              <h2 id="lean-fast-scalable" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">Lean. Fast. Scalable. The New Standard for Trades.</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">The trades are going through a transformation. The contractors thriving today aren't just the best at the craft—they're the best at running a business. That means building systems that let you operate lean, respond fast, and scale without proportionally adding headache.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Think about what a truly lean operation looks like: every lead is captured automatically, every follow-up happens on schedule, every job has a clear status, every invoice goes out on time, and your team knows exactly what to do without you managing every detail. That's not a fantasy—it's what the right platform makes possible.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Operating Lean Means Doing More With Less</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">A CRM removes the redundancy in your business—the double-entry, the phone tag, the manual updates. When you're not wasting motion, you can take on more jobs without hiring more office staff. Your overhead stays tight while your revenue grows.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Moving Fast Wins More Business</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Speed is the number one differentiator in the lead game right now. Studies show that contacting a lead within five minutes is 100× more effective than waiting 30 minutes. Most contractors are calling back hours later, or the next morning. An AI-powered CRM closes that gap automatically—responding to leads instantly, booking appointments, and keeping you first in the customer's mind.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Scalable Systems Build Real Wealth</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Here's the conversation I have with contractors all the time: "I want to grow, but every time I take on more, I'm more stressed." That's a systems problem, not a capacity problem. When your operation is built on scalable software—where adding a new job or a new crew member doesn't require you to rebuild how you work—growth becomes additive, not exhausting. That's when real wealth starts to build.</p>

              <div className="bg-primary/5 border border-primary/30 p-6 my-10 flex flex-col sm:flex-row items-center gap-6">
                <span className="text-4xl">⚡</span>
                <div className="flex-1">
                  <h4 className="font-bold uppercase tracking-wide text-foreground mb-1">See How myCT1 Works for Your Trade</h4>
                  <p className="text-sm text-muted-foreground">Get a personalized walkthrough of the platform built specifically for contractors like you.</p>
                </div>
                <a href="mailto:pwm@myct1.com">
                  <Button>Book a Demo</Button>
                </a>
              </div>

              <h2 id="what-to-look-for" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">What to Look For in a Contractor CRM</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Not every CRM is created equal—and for contractors, the wrong tool is almost worse than no tool at all. Here's what separates a genuinely useful contractor CRM from expensive software that just creates more work:</p>

              <FeatureGrid title="Essential Features Checklist" items={[
                "Lead capture and pipeline management",
                "Automated follow-up and drip sequences",
                "Estimate and quote generation",
                "Job scheduling and crew management",
                "Invoicing and payment tracking",
                "Mobile access from the field",
                "Customer communication history",
                "Real-time job status tracking",
                "Reporting and profit visibility",
                "AI-assisted client responses",
                "Integration with your existing tools",
                "Qualified lead delivery"
              ]} />

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Industry-Specific vs. Generic CRMs</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Salesforce and HubSpot are powerful, but they're built for software sales teams and marketing departments. They require extensive customization, expensive add-ons, and weeks of setup—all without ever understanding what a punch list or a change order is. Contractor-specific platforms come pre-configured for how you actually work, cutting your setup time and learning curve dramatically.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Training and Onboarding Matter More Than Features</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">The best CRM in the world doesn't help if your team won't use it. Look for platforms that include real onboarding support—not just video tutorials—but actual human beings who understand your industry. The difference between adoption and abandonment is usually how well a contractor was trained in those first 30 days.</p>

              <h2 id="family-community" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">More Than Business: Building a Life Worth Having</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">I want to say something that doesn't get talked about enough in the contractor world: the goal isn't just a bigger business. The goal is a better life.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">When your business is running on systems instead of running on you, something shifts. You stop being on the phone at dinner. You start making your kid's games. You take a weekend off and the business doesn't collapse. That's not a luxury reserved for big companies—it's what scalable systems make possible for every contractor willing to invest in them.</p>

              <p className="text-muted-foreground leading-relaxed mb-5"><strong className="text-foreground">There's also a community dimension here.</strong> Contractors are the backbone of every neighborhood in America. When your business is healthy, you hire locally. You support your crews' families. You invest back into the towns you serve. A thriving contractor business isn't just good for the owner, it ripples outward into the entire community. We take that seriously at myCT1, and we build our platform with that bigger picture in mind.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">That philosophy comes straight from our CEO, <strong className="text-foreground">Joe Cipriano</strong>. Joe founded ConstructTeam with a vision that goes far beyond software. His mission has always been to support the trades, to mentor contractors, and to build a community where tradespeople lift each other up. That conviction, that the trades deserve world class tools and genuine investment in their success, is what drives our entire team every single day. It's the reason we don't just build features. We build a platform that helps contractors start, grow, scale, and sustain businesses that let them live their best lives.</p>

              <PullQuote>When you're not buried in busywork, you become a better business owner, a better parent, and a stronger member of your community. That's the real return on a good CRM.</PullQuote>

              <h2 id="myct1" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">How myCT1 Approaches All of This</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">At myCT1, we didn't build a CRM and call it a day. We built a complete business command center. That ambition stems directly from Joe Cipriano's leadership and his relentless belief that contractors deserve a single platform powerful enough to run their entire operation, yet simple enough to use from a job site at 7 AM. His passion for mentoring the trades through ConstructTeam has fueled our team to create something truly comprehensive, not just another piece of software, but a launchpad for contractors ready to take control of their future.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Our <strong className="text-foreground">AI Phone Assistant</strong> means you never miss a lead again, even when you're on a job site. Our <strong className="text-foreground">Pocket Agents</strong> respond to clients instantly, so your response time is measured in seconds, not hours. Our dashboard gives you real-time visibility into every job, every dollar, and every opportunity in your pipeline.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">But here's what truly separates us: every subscription includes step-by-step training from industry experts who've actually run contractor businesses. We deliver warm, qualified leads straight to your dashboard. We offer industry certifications that make you stand out. And we give you access to a technology marketplace that keeps your operation on the cutting edge.</p>

              <FeatureGrid title="What's Included in Every myCT1 Subscription" items={[
                "All-in-one contractor CRM platform",
                "AI Phone Assistant (never miss a call)",
                "Pocket Agents for instant client response",
                "Job scheduling & crew management",
                "Estimating & invoicing tools",
                "Real-time profit & pipeline reporting",
                "Warm, qualified leads to your dashboard",
                "Step-by-step training from industry experts",
                "Industry certifications",
                "Technology marketplace integrations",
                "Nationwide contractor network access",
                "Dedicated onboarding support"
              ]} />

              <h2 id="getting-started" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">Making the Transition: How to Adopt a New System Without Losing Your Mind</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Here's the objection I hear most often: "Patrick, I don't have time to learn a new system." I get it. You're busy. The irony is that you don't have time <em>not</em> to. Every week you run on a broken process is another week of leaked leads, late invoices, and unnecessary stress.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">The key to a smooth transition is choosing a platform that does the heavy lifting for you. Look for a system that imports your existing customer data, provides real onboarding support, and has a mobile-first interface your crew can actually use in the field. Don't try to implement everything at once—start with lead management and follow-up, get that locked in, then build from there.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">30-Day Adoption Roadmap</h3>
              <ul className="list-none space-y-0 mb-6">
                <CheckItem title="Week 1:" description="Import existing contacts, set up your pipeline stages, and activate automated lead follow-up." />
                <CheckItem title="Week 2:" description="Move all active jobs into the platform. Start tracking job status and crew assignments in one place." />
                <CheckItem title="Week 3:" description="Activate invoicing. Send your first batch of invoices through the system and get comfortable with the payment tracking." />
                <CheckItem title="Week 4:" description="Review your first dashboard report. You'll start seeing your pipeline, profit, and performance with clarity you didn't have before." />
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-5">By day 30, most contractors tell us the same thing: they can't believe they ran their business any other way. The clarity is addictive, and the extra time in the day is priceless.</p>

              <h2 id="conclusion" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">The Bottom Line</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">The contracting industry is more competitive than ever—but it's also full of more opportunity than ever. The contractors who win in the next decade will be the ones who build lean, fast, scalable businesses backed by smart systems. A CRM isn't an expense; it's the infrastructure of a high-performance operation.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Whether you're closing your fifth job or your five-hundredth, you deserve tools built for the way you work, training from people who understand your world, and a platform that grows with you. That's what we built at myCT1—and it's available to every contractor in America, starting today.</p>

              <p className="text-foreground font-semibold leading-relaxed mb-5">More money in the bank. More time for your family. More strength for your community. That's not just a tagline—it's the measurable result of running a smarter operation. Let's build it together.</p>

              <div className="flex items-center gap-4 my-10">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <span className="text-primary">★</span>
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* CTA Card */}
              <div className="bg-card border border-primary/40 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                <img src={ct1Logo} alt="CT1" className="w-16 h-16 mx-auto mb-3" />
                <h4 className="text-xl font-bold mb-2">Ready to Scale Your Business?</h4>
                <p className="text-sm text-muted-foreground mb-5">Join contractors across all 50 states running their entire operation on myCT1.</p>
                <a href="mailto:pwm@myct1.com" className="block">
                  <Button className="w-full mb-2">Contact Patrick</Button>
                </a>
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </div>

              {/* TOC */}
              <div className="bg-card border border-border overflow-hidden">
                <div className="bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
                  In This Guide
                </div>
                <div className="p-4">
                  <ol className="space-y-0">
                    {tocItems.map((item, i) => (
                      <li key={item.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-b-0 text-sm">
                        <span className="text-primary font-bold text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground transition-colors">{item.label}</a>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-card border border-border overflow-hidden">
                <div className="bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
                  Contact Us
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">Questions about the CT1 platform? Reach out directly to our team.</p>
                  <a href="mailto:pwm@myct1.com" className="block mb-2">
                    <Button className="w-full">Email Patrick</Button>
                  </a>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">Visit myCT1.com</Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center mt-3">pwm@myct1.com</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 border-y-2 border-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background" />
        <div className="relative container mx-auto px-4 text-center max-w-2xl">
          <img src={ct1Logo} alt="CT1" className="w-24 h-24 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Build a <span className="text-primary">Smarter</span> Operation?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're a solo operator or managing a growing crew, myCT1 gives you the platform, training, and leads to take your business to the next level. Contractors across all 50 states are running leaner, earning more, and getting their time back.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="mailto:pwm@myct1.com">
              <Button size="lg">Talk to Our Team</Button>
            </a>
            <Link to="/">
              <Button size="lg" variant="outline">Explore myCT1</Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Interested in the CT1 platform? Contact us at <a href="mailto:pwm@myct1.com" className="text-primary hover:underline">pwm@myct1.com</a> | <Link to="/" className="text-primary hover:underline">www.myct1.com</Link>
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
