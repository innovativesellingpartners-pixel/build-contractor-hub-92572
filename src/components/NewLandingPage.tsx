import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { Pocketbot } from "@/components/contractor/Pocketbot";
import heroImage from "@/assets/hero-home.jpg";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  ArrowRight, 
  Bot, 
  Calculator, 
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  GraduationCap,
  BarChart3,
  Headset,
  Mic,
  BookOpen,
  HardHat,
  Quote,
  Wrench,
  Zap,
  Flame,
  Hammer,
  PaintBucket,
  Wind,
  MessageCircle,
  Rocket
} from "lucide-react";

export function NewLandingPage() {
  const navigate = useNavigate();
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);
  const [showPocketbot, setShowPocketbot] = useState(false);

  const featureCards = [
    { icon: Users, title: "Lead Management", description: "Capture web leads, calls, and referrals in one place. Track source, status, and next steps." },
    { icon: HardHat, title: "Job Management", description: "Schedule crews, assign tasks, and track progress from first visit to job completion." },
    { icon: Calculator, title: "Estimating & Proposals", description: "Build professional estimates fast, send digitally, and track approvals." },
    { icon: Briefcase, title: "Customer Management & CRM", description: "Store every contact, note, call, and job history. Keep relationships strong for repeat work." },
    { icon: Mic, title: "Voice AI", description: "Answer inbound calls with voice AI support, route them to the right person, and log outcomes." },
    { icon: GraduationCap, title: "Full Sales Training Suite", description: "Structured sales training for owners, reps, and office staff, aligned with CT1 workflows." },
    { icon: BookOpen, title: "Business Training & Playbooks", description: "On-demand training on pricing, leadership, hiring, and process, tailored to contractors." },
    { icon: BarChart3, title: "Dashboards & Reporting", description: "See pipeline, close rate, revenue, and job status in one view." },
    { icon: Headset, title: "Support & Success", description: "Real people who understand trades, ready to help your team succeed on the platform." },
  ];

  const tradesBadges = [
    { icon: Wrench, label: "Roofing" },
    { icon: Wind, label: "HVAC" },
    { icon: Zap, label: "Electrical" },
    { icon: Flame, label: "Plumbing" },
    { icon: Hammer, label: "Remodeling" },
    { icon: PaintBucket, label: "Painting" },
    { icon: HardHat, label: "General Contracting" },
  ];

  const testimonials = [
    {
      text: "CT1 transformed my business. The PocketBots handle all my estimates and client communication automatically. I've increased my revenue by 40% in just 6 months.",
      name: "Mike Johnson",
      company: "Johnson Construction"
    },
    {
      text: "The training modules helped me get certified and the marketplace connected me with quality suppliers. CT1 is a complete game-changer for contractors.",
      name: "Sarah Martinez",
      company: "Elite Roofing Solutions"
    },
    {
      text: "From lead generation to project management, CT1 handles everything. I can focus on quality work while my business runs itself.",
      name: "David Chen",
      company: "Chen Electrical Services"
    }
  ];

  const steps = [
    { icon: MessageCircle, title: "Step 1 – Conversation", description: "Meet with CT1 to review your business, trades, and goals. Align on fit and growth targets." },
    { icon: Rocket, title: "Step 2 – Launch Plan", description: "Build a rollout plan for leads, jobs, CRM, and training. Set up pipeline, templates, and reporting." },
    { icon: TrendingUp, title: "Step 3 – Ongoing Growth", description: "Work with Contractor Success on training, hiring support, and process improvement as your volume grows." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Floating Try for Free Button - Top Left */}
      <Link to="/trial-signup" className="fixed top-20 left-4 z-50">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/50 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105">
          <Rocket className="mr-2 h-4 w-4" />
          Try CT1 Free
        </Button>
      </Link>

      {/* CT1 Pocketbot - Top Right */}
      <div className="fixed top-20 right-4 z-50">
        <div
          onClick={() => setShowPocketbot(true)}
          className="group relative cursor-pointer"
        >
          <div className="flex items-center gap-2 bg-foreground/95 backdrop-blur-md text-background px-4 py-3 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 border-2 border-primary/30">
            <div className="relative">
              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse"></div>
            </div>
            <span className="font-bold text-sm">Try Pocketbot</span>
          </div>
        </div>
      </div>

      {/* Sticky Floating CTA Button - Bottom Right */}
      <div className="fixed bottom-6 right-4 z-50">
        <Dialog open={activeContactForm === "floating-cta"} onOpenChange={(open) => setActiveContactForm(open ? "floating-cta" : null)}>
          <DialogTrigger asChild>
            <Button className="bg-foreground hover:bg-foreground/90 text-background shadow-2xl hover:shadow-primary/50 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105">
              <Phone className="mr-2 h-4 w-4" />
              Talk With CT1
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ContactForm
              title="Talk With CT1"
              description="Connect with our team to learn how CT1 can help grow your contracting business"
              ctaText="Get In Touch"
              formType="contact-sales"
              onClose={() => setActiveContactForm(null)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION 1: Hero */}
      <section 
        className="relative min-h-[80vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 pb-12">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 leading-tight drop-shadow-lg text-white">
              <span className="inline-flex items-center justify-center">
                <img src={ct1Logo} alt="CT1" className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 inline-block -mr-1 drop-shadow-lg" />
                <span>ne-Up</span>
              </span>
              <span className="block">The Competition</span>
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl mb-4 text-white/90 leading-relaxed max-w-4xl">
              A nationwide network of contractors building, scaling, and sustaining their businesses
            </p>
            <p className="text-3xl sm:text-4xl lg:text-5xl mb-8 font-bold text-primary">
              Powered by CT1
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Dialog open={activeContactForm === "join-network"} onOpenChange={(open) => setActiveContactForm(open ? "join-network" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-hero text-lg px-8 py-4">
                    Join the CT1 Network
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Join the CT1 Network"
                    description="Start building your future with CT1's powerful contractor platform"
                    ctaText="Join Network"
                    formType="network-signup"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground text-lg px-8 py-4"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
            </div>
            
            <p className="text-white/70 text-sm mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Headquartered in Fraser, Michigan. Supporting contractors across the United States.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                Built for trades
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                Business suite for contractors
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                Sales and operations in one place
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Why Contractors Choose CT1 */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Why Contractors Choose <span className="text-primary">CT1</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                You want consistent work, healthy margin, and time back. CT1 gives you the structure to run a serious business, not a collection of jobs.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "More quality leads tracked from first call to closed job.",
                  "Standard workflows from inbound lead to final invoice.",
                  "Fewer dropped balls with task tracking and automation.",
                  "Better visibility into margin, revenue, and crew workload.",
                  "Training built into the same platform your team uses every day."
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Dialog open={activeContactForm === "contractor-demo"} onOpenChange={(open) => setActiveContactForm(open ? "contractor-demo" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-ct1">
                    Get Your Free Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Get Your Free Demo"
                    description="See how CT1 can transform your contracting business with a personalized demo"
                    ctaText="Schedule Demo"
                    formType="contractor-demo"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Right: Feature Cards Grid */}
            <div className="grid gap-4">
              {/* Contractor Business Suite Card */}
              <Link to="/business-suite">
                <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        Contractor Business Suite
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Complete platform for leads, jobs, CRM, estimating, and training - all in one place.
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>

              {/* Nationwide Network Card */}
              <Link to="/nationwide-network">
                <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        Nationwide Network
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Join a growing network of trusted contractors across the United States.
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>

              {/* Already a Contractor Card */}
              <Card className="p-6 border shadow-lg">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground mb-3">Already a CT1 Contractor?</h3>
                  <p className="text-muted-foreground text-sm mb-4">Access your dashboard and manage your business.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/auth" className="flex-1">
                      <Button className="w-full btn-ct1">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Contractor Login
                      </Button>
                    </Link>
                    <Link to="/trial-signup" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Try CT1 Free
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Product Suite */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              An Entire Business Suite <span className="text-primary">For Contractors</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Replace scattered apps, spreadsheets, and sticky notes with one platform that supports every part of your operation.
            </p>
          </div>
          
          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featureCards.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
          
          {/* Trades Badge Strip */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 py-6 border-y border-border">
            {tradesBadges.map((trade, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 text-sm flex items-center gap-2">
                <trade.icon className="h-4 w-4" />
                {trade.label}
              </Badge>
            ))}
          </div>
          
          {/* CTA Strip */}
          <div className="bg-card rounded-xl p-8 text-center border">
            <p className="text-xl font-semibold text-foreground mb-4">
              Ready to run your contracting business on one platform?
            </p>
            <Dialog open={activeContactForm === "see-action"} onOpenChange={(open) => setActiveContactForm(open ? "see-action" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  See CT1 In Action
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="See CT1 In Action"
                  description="Get a personalized demo of the CT1 platform"
                  ctaText="Schedule Demo"
                  formType="demo"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 4: Testimonials */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built For Trades. <span className="text-primary">Trusted By Contractors.</span>
            </h2>
          </div>
          
          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 relative">
                <Quote className="h-10 w-10 text-primary/20 absolute top-4 right-4" />
                <p className="text-foreground mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Stats Row */}
          <div className="grid sm:grid-cols-3 gap-8 mb-12 py-8 border-y border-border">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">47%</p>
              <p className="text-muted-foreground">Higher lead response speed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">12+</p>
              <p className="text-muted-foreground">More booked jobs per month</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">50+</p>
              <p className="text-muted-foreground">Hours of training content</p>
            </div>
          </div>
          
          <div className="text-center">
            <Dialog open={activeContactForm === "success-coach"} onOpenChange={(open) => setActiveContactForm(open ? "success-coach" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  Talk With A Success Coach
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Talk With A Success Coach"
                  description="Connect with a coach who understands your business and can help you grow"
                  ctaText="Schedule Call"
                  formType="success-coach"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 5: How It Works */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Getting started with CT1 is simple. We meet you where you are and build from there.
            </p>
          </div>
          
          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Dialog open={activeContactForm === "start-conversation"} onOpenChange={(open) => setActiveContactForm(open ? "start-conversation" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  Start The Conversation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Start The Conversation"
                  description="Let's discuss how CT1 can help grow your contracting business"
                  ctaText="Get Started"
                  formType="start-conversation"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 6: Final CTA */}
      <section className="section-cta py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img src={ct1Logo} alt="CT1" className="h-20 w-20 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-primary-foreground">
              Ready to One-Up Your Business?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto text-primary-foreground">
              Join a nationwide network of trusted and elite contractors, powered by CT1's comprehensive platform.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Dialog open={activeContactForm === "start-building"} onOpenChange={(open) => setActiveContactForm(open ? "start-building" : null)}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-xl px-12 py-6 font-bold">
                  Start Building Today
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Start Building Your Future"
                  description="Take the first step towards growing your contracting business with CT1"
                  ctaText="Get Started"
                  formType="start-building"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
            
            <Link to="/nationwide-network">
              <Button size="lg" variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground text-xl px-12 py-6 font-bold">
                Explore The Network
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CT1 Pocketbot Modal */}
      <Dialog open={showPocketbot} onOpenChange={setShowPocketbot}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="h-[85vh]">
            <Pocketbot />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
                <div>
                  <h3 className="text-xl font-bold text-background">CT1</h3>
                  <p className="text-xs text-muted">One-Up Your Business</p>
                </div>
              </div>
              <p className="text-muted text-sm">
                Empowering contractors to build better businesses with comprehensive tools and professional support.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">For Contractors</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/business-suite" className="hover:text-primary transition-colors">Platform Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/training" className="hover:text-primary transition-colors">Training</Link></li>
                <li><Link to="/nationwide-network" className="hover:text-primary transition-colors">Nationwide Network</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/what-we-do" className="hover:text-primary transition-colors">What We Do</Link></li>
                <li><Link to="/core-values" className="hover:text-primary transition-colors">Core Values</Link></li>
                <li><Link to="/blog-podcast" className="hover:text-primary transition-colors">Blog & Podcast</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>(248) 752-7308</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>sales@myct1.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Fraser, Michigan</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted">© 2025 CT1. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/legal/privacy" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/contact" className="text-sm text-muted hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
