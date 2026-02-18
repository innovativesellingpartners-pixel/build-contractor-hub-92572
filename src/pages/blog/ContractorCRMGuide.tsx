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
  { id: "vision", label: "The Vision Behind CT1" },
  { id: "what-is-platform", label: "What Does It Mean to Run on a Single Platform?" },
  { id: "signs", label: "5 Signs Your Business Needs a Better System" },
  { id: "lean-fast-scalable", label: "Lean. Fast. Scalable." },
  { id: "what-to-look-for", label: "What to Look For" },
  { id: "financial-layer", label: "The Financial Layer Most Contractors Are Missing" },
  { id: "marketplace", label: "The Technology Marketplace Advantage" },
  { id: "family-community", label: "Building a Life Worth Having" },
  { id: "how-ct1-delivers", label: "How CT1 Delivers on This" },
  { id: "conclusion", label: "The Bottom Line" },
];

export const ContractorCRMGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Complete Guide to Running a Modern Contractor Business | myCT1"
        description="Why every growing contractor needs a single platform, and how choosing the right one can put more money in your bank, more time with your family, and more strength back into your community."
        ogImage="https://build-contractor-hub-92572.lovable.app/og-blog-creative-3.png"
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
              <span className="text-primary">Running a Modern Contractor Business</span><br />The Complete Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Why every growing contractor needs a single platform, and how choosing the right one can put more money in your bank, more time with your family, and more strength back into your community.
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
                Over the last few years working alongside contractors, one pattern is clear. The ones who scale fast, bank serious money, and still make it home for dinner... they don't work harder than the rest. They work leaner. At the center of every lean operation is a platform that actually works for them, one that runs the entire business, not just one piece of it.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 my-10">
                <StatCard number="68%" label="of contractors using disconnected tools report lost revenue" />
                <StatCard number="11hrs" label="average time wasted weekly on admin tasks" />
                <StatCard number="3×" label="faster growth for contractors using integrated business platforms" />
              </div>

              <h2 id="vision" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">The Vision Behind CT1</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">That philosophy comes straight from our CEO, <strong className="text-foreground">Joe Cipriano</strong>, and it's worth understanding where it comes from. Joe didn't start CONSTRUCTEAM by studying the software industry. He started it because he lived the problem firsthand. That experience is baked into every feature we ship, and it's why our platform feels different from anything else in the market.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Joe founded CONSTRUCTEAM with a vision that goes far beyond software. His mission has always been to support the trades, to mentor contractors, and to build a community where tradespeople lift each other up. That conviction, that the trades deserve world-class tools and genuine investment in their success, is what drives our entire team every single day. It's the reason we don't just build features. We build a platform that helps contractors start, grow, scale, and sustain businesses that let them live their best lives.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">At CT1, we set out to build something the industry had never had: a true single pane of glass for the entire contractor business. Not a CT1 product with some extras bolted on. Not a job management tool that sort of handles invoicing. A complete business command center, built from the ground up for the trades.</p>

              <h2 id="what-is-platform" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">What Does It Mean to Run on a Single Platform?</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Most contractors are running their business across five, six, maybe ten different tools. One app for scheduling. Another for invoicing. A spreadsheet for job tracking. A separate system for estimates. A bank they can barely connect to anything. And somehow, they're supposed to see the full picture of their business in real time.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">They can't. And that's the problem.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">A true business platform for contractors brings all of it together: voice AI, job management, estimating, invoicing, lead generation, financial tools, and a marketplace of over 400 technology partners, all accessible from a single dashboard. No more switching between apps. No more data living in three different places. No more guessing where your business actually stands.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">This is what contractors today call a single pane of glass. One login. Full visibility. Total control.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">For trade professionals, generic software built for retail or corporate teams won't cut it. You need something that understands the rhythm of how contractors actually work: the early morning call from a new lead, the job site chaos at 2pm, the crew scheduling headache, the invoice that should have gone out Tuesday. A platform built specifically for the trades fills that gap in a way no general-purpose tool ever will.</p>

              <p className="text-muted-foreground leading-relaxed mb-5"><strong className="text-foreground">Here's the hard truth:</strong> most contractors are running their business out of a combination of their head, a notepad, a few text threads, and maybe a spreadsheet. That works until you hit a wall. And when it stops working, you're not just losing efficiency. You're losing jobs, revenue, and sleep.</p>

              <PullQuote>The contractors winning right now aren't the ones working longer hours. They're the ones who built a lean, fast, scalable operation, and a great platform is the engine underneath it. - Joe Cipriano, CEO, myCT1.com</PullQuote>

              <h2 id="signs" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">5 Signs Your Business Needs a Better System</h2>

              <ul className="list-none space-y-0 mb-6">
                <CheckItem title="You don't have a clear picture of your finances." description="Your invoicing, banking, and job costs live in different places and reconciling them takes hours you don't have." />
                <CheckItem title="You can't track job status without making calls." description="You're texting your crew to find out where things stand instead of seeing it on a dashboard." />
                <CheckItem title="Your tools don't talk to each other." description="You're re-entering the same data in multiple places and things still fall through the cracks." />
                <CheckItem title="You can't see your profit clearly." description="You're busy, but you're not sure if you're actually making good money or just moving money around." />
                <CheckItem title="Growth feels like more chaos." description="Every new job adds stress instead of confidence because you have no scalable process behind it." />
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-5">If two or more of those hit home, you're not just inefficient. You're actively leaving money on the table. The right platform addresses all five simultaneously.</p>

              <h2 id="lean-fast-scalable" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">Lean. Fast. Scalable. The New Standard for Trades.</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">The trades are going through a transformation. The contractors thriving today aren't just the best at the craft. They're the best at running a business. That means building systems that let you operate lean, respond fast, and scale without proportionally adding headache.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Think about what a truly lean operation looks like: every lead is captured and responded to automatically, every job has a clear status, every estimate converts cleanly into an invoice, your finances sync in real time with your bank and your accounting software, and your team knows exactly what to do without you managing every detail. That's not a fantasy. It's what the right platform makes possible.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Operating Lean Means Doing More With Less</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">An integrated platform removes the redundancy in your business: the double-entry, the phone tag, the manual updates, the end-of-month scramble to figure out where the money went. When you're not wasting motion, you can take on more jobs without hiring more office staff. Your overhead stays tight while your revenue grows.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Moving Fast Wins More Business</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Speed is the number one differentiator in contracting right now. Studies show that contacting a lead within five minutes is 100x more effective than waiting 30 minutes. Most contractors are calling back hours later, or the next morning. AI-powered voice technology closes that gap automatically, answering calls, responding to clients, and keeping your business moving even when you're on a job site and can't pick up the phone.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Scalable Systems Build Real Wealth</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Here's the conversation I have with contractors all the time: "I want to grow, but every time I take on more, I'm more stressed." That's a systems problem, not a capacity problem. When your operation is built on scalable software, where adding a new job or a new crew member doesn't require you to rebuild how you work, growth becomes additive, not exhausting. That's when real wealth starts to build.</p>

              <div className="bg-primary/5 border border-primary/30 p-6 my-10 flex flex-col sm:flex-row items-center gap-6">
                <span className="text-4xl">⚡</span>
                <div className="flex-1">
                  <h4 className="font-bold uppercase tracking-wide text-foreground mb-1">See How CT1 Works for Your Trade</h4>
                  <p className="text-sm text-muted-foreground">Get a personalized walkthrough of the platform built specifically for contractors like you.</p>
                </div>
                <Link to="/contact">
                  <Button>Book a Demo</Button>
                </Link>
              </div>

              <h2 id="what-to-look-for" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">What to Look For in a Contractor Business Platform</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Not every platform is created equal, and for contractors, the wrong tool is almost worse than no tool at all. Here's what separates a genuinely useful contractor platform from expensive software that just creates more work.</p>

              <FeatureGrid title="Essential Capabilities Checklist" items={[
                "Voice AI to handle calls and client communication",
                "Lead generation and pipeline management",
                "Job scheduling and crew management",
                "Estimating and quote generation",
                "Invoicing and payment tracking",
                "Real-time financial visibility and banking connections",
                "Accounting integration (QuickBooks and others)",
                "Mobile access from the field",
                "Customer communication history",
                "Real-time job status tracking",
                "Reporting and profit visibility",
                "A marketplace of technology partners to extend what's possible",
                "Dedicated onboarding and training support"
              ]} />

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Industry-Specific vs. Generic Software</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Salesforce and HubSpot are powerful, but they're built for software sales teams and marketing departments. QuickBooks is useful, but it's an accounting tool, not a business command center. Generic platforms require extensive customization, expensive add-ons, and weeks of setup, all without ever understanding what a punch list or a change order is. Contractor-specific platforms come pre-configured for how you actually work, cutting your setup time and learning curve dramatically.</p>

              <h2 id="financial-layer" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">The Financial Layer Most Contractors Are Missing</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Here's what separates a real business platform from a basic job management tool: financial integration that actually works. That means a direct connection to your bank, seamless syncing with QuickBooks, and the ability to see your cash position, outstanding invoices, and job-level profitability all in one place.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">When your financials are disconnected from your operations, you're always flying blind. You finish a busy month and you're not sure if you made money. You have invoices sitting unpaid that you forgot to follow up on. You're making hiring decisions without knowing what your margins actually look like. An integrated financial layer fixes all of that. Your numbers are always current, always connected, and always visible.</p>

              <h2 id="marketplace" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">The Technology Marketplace Advantage</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">The right contractor platform doesn't try to do everything itself. It connects you to the best tools in the industry through an open marketplace. Over 400 technology partners means you're never locked into one way of doing things. Whether you need specialized tools for your trade, insurance products, financing options for your customers, or software your crews already use, the right marketplace keeps your operation connected and growing without forcing you to abandon what already works.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">This is how modern contractor businesses stay on the cutting edge without constantly chasing new software. The platform grows with you, and the ecosystem grows with the industry.</p>

              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mt-8 mb-3">Training and Onboarding Matter More Than Features</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">The best platform in the world doesn't help if your team won't use it. Look for platforms that include real onboarding support, not just video tutorials, but actual human beings who understand your industry. The difference between adoption and abandonment is usually how well a contractor was trained in those first 30 days.</p>

              <h2 id="family-community" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">More Than Business: Building a Life Worth Having</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">I want to say something that doesn't get talked about enough in the contractor world: the goal isn't just a bigger business. The goal is a better life.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">When your business is running on systems instead of running on you, something shifts. You stop being on the phone at dinner. You start making your kid's games. You take a weekend off and the business doesn't collapse. That's not a luxury reserved for big companies. It's what scalable systems make possible for every contractor willing to invest in them.</p>

              <p className="text-muted-foreground leading-relaxed mb-5"><strong className="text-foreground">There's also a community dimension here.</strong> Contractors are the backbone of every neighborhood in America. When your business is healthy, you hire locally. You support your crews' families. You invest back into the towns you serve. A thriving contractor business isn't just good for the owner, it ripples outward into the entire community. We take that seriously at CT1, and we build our platform with that bigger picture in mind.</p>

              <PullQuote>When you're not buried in busywork, you become a better business owner, a better parent, and a stronger member of your community. That's the real return on building a great operation. - Joe Cipriano, CEO, myCT1.com</PullQuote>

              <h2 id="how-ct1-delivers" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">How CT1 Delivers on This</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">Our <strong className="text-foreground">Voice AI</strong> means your business never stops, even when you do. Calls get answered, clients get responses, and opportunities get captured whether you're on a roof, in a crawl space, or at your kid's soccer game. Our <strong className="text-foreground">financial integrations</strong> connect directly to your bank and sync with QuickBooks, so your numbers are always accurate and always current. Our <strong className="text-foreground">marketplace</strong> gives you access to over 400 technology partners, from specialized trade tools to customer financing to insurance, keeping your operation connected to the best the industry has to offer.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Every job, every dollar, every client, and every opportunity lives in one place. That's what contractors have always needed, and that's what we built.</p>

              <FeatureGrid title="Some of myCT1's Offerings" items={[
                "Full business management platform (start, run, manage, and scale)",
                "Voice AI to handle calls and client communication",
                "Job scheduling and crew management",
                "Estimating and invoicing tools",
                "Lead generation and pipeline management",
                "Real-time financial visibility with direct banking connections",
                "QuickBooks and accounting software integration",
                "Marketplace access with 400+ technology partners",
                "Real-time profit and pipeline reporting",
                "Step-by-step training from industry experts",
                "Industry certifications",
                "Nationwide contractor network access",
                "Dedicated onboarding support"
              ]} />

              <h2 id="conclusion" className="text-2xl md:text-3xl font-bold mt-12 mb-4 border-l-4 border-primary pl-4">The Bottom Line</h2>

              <p className="text-muted-foreground leading-relaxed mb-5">The contracting industry is more competitive than ever, but it's also full of more opportunity than ever. The contractors who win in the next decade will be the ones who build lean, fast, scalable businesses backed by smart systems. A great platform isn't an expense. It's the infrastructure of a high-performance operation.</p>

              <p className="text-muted-foreground leading-relaxed mb-5">Whether you're starting your first company or scaling your fiftieth crew, you deserve tools built for the way you work, financial visibility that actually helps you make decisions, a technology ecosystem that keeps you growing, and training from people who understand your world. That's what we built at CT1, and it's available to every contractor in America, starting today.</p>

              <p className="text-foreground font-semibold leading-relaxed mb-5">More money in the bank. More time for your family. More strength for your community. The trades built this country. Let's make sure the business side matches the craft.</p>

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
                <p className="text-sm text-muted-foreground mb-5">Join contractors running their entire operation on myCT1, launching in Michigan and expanding nationwide.</p>
                <Link to="/contact" className="block">
                  <Button className="w-full mb-2">Contact Sales</Button>
                </Link>
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
                  <Link to="/contact" className="block mb-2">
                    <Button className="w-full">Contact Sales</Button>
                  </Link>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">Visit myCT1.com</Button>
                  </Link>
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
            Whether you're a solo operator or managing a growing crew, myCT1 gives you the platform, training, and leads to take your business to the next level. Launching in Michigan and expanding nationwide, contractors are running leaner, earning more, and getting their time back.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/contact">
              <Button size="lg">Talk to Our Team</Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline">Explore myCT1</Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Interested in the CT1 platform? <Link to="/contact" className="text-primary hover:underline">Contact Sales</Link> | <Link to="/" className="text-primary hover:underline">www.myct1.com</Link>
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
