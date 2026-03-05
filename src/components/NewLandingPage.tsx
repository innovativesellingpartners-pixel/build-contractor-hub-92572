import { useState } from "react";
import { RotatingHeroTitle } from "@/components/RotatingHeroTitle";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { SEOHead } from "@/components/SEOHead";
import heroImage from "@/assets/hero-home.jpg";
import ct1RoundLogo from "@/assets/ct1-round-logo-new.png";
import { 
  ArrowRight, 
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
  Rocket,
  Wifi,
} from "lucide-react";
import verizonLogo from "@/assets/partners/verizon-logo.png";
import appleLogo from "@/assets/partners/apple-logo.png";
import comcastLogo from "@/assets/partners/comcast-logo.png";
import tmobileLogo from "@/assets/partners/tmobile-logo.png";
import geotabLogo from "@/assets/partners/geotab-logo.png";
import spireonLogo from "@/assets/partners/spireon-logo.png";

export function NewLandingPage() {
  const navigate = useNavigate();
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const featureCards = [
    { icon: GraduationCap, title: "Business & Sales Training", description: "Structured sales training for owners, reps, and office staff, aligned with CT1 workflows.", link: "/features/training" },
    { icon: Users, title: "Full Customer Management Suite", description: "Store every contact, note, call, and job history. Keep relationships strong for repeat work.", link: "/features/crm" },
    { icon: Calculator, title: "Estimating & Proposals", description: "Build professional estimates fast, send digitally, and track approvals.", link: "/features/estimating" },
    { icon: HardHat, title: "Jobs Management", description: "Schedule crews, assign tasks, and track progress from first visit to job completion.", link: "/features/jobs" },
    { icon: Mic, title: "Voice AI", description: "Answer inbound calls with voice AI support, route them to the right person, and log outcomes.", link: "/features/voice-ai" },
    { icon: BarChart3, title: "Dashboard & Reporting", description: "See pipeline, close rate, revenue, and job status in one view.", link: "/features/reporting" },
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
      text: "CT1 transformed my business. The Pocket Agents handle all my estimates and client communication automatically. I've increased my revenue by 40% in just 6 months.",
      name: "Mike J.",
      company: "Owner at a large construction company in Michigan"
    },
    {
      text: "The training modules helped me get certified and the marketplace connected me with quality suppliers. CT1 is a complete game-changer for contractors.",
      name: "Sarah M.",
      company: "Owner at a roofing company in Texas"
    },
    {
      text: "From lead generation to project management, CT1 handles everything. I can focus on quality work while my business runs itself.",
      name: "David C.",
      company: "Owner at an electrical services company in California"
    }
  ];

  const steps = [
    { icon: MessageCircle, title: "Step 1 – Conversation", description: "Meet with CT1 to review your business, trades, and goals. Align on fit and growth targets." },
    { icon: Rocket, title: "Step 2 – Launch Plan", description: "Build a rollout plan for leads, jobs, CRM, and training. Set up pipeline, templates, and reporting." },
    { icon: TrendingUp, title: "Step 3 – Ongoing Growth", description: "Work with Contractor Success on training, hiring support, and process improvement as your volume grows." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contractor Business Software | CRM, Estimating & AI Tools Nationwide"
        description="America's leading contractor business suite. Professional CRM, estimating software, AI assistants, job management & invoicing for contractors across all 50 states. Start your free trial today."
        canonical="/"
        keywords="contractor software, contractor CRM, estimating software, contractor business management, roofing contractor software, HVAC contractor software, plumbing contractor software, electrical contractor software, construction management, AI for contractors"
      />
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Floating Buttons - Below header */}
      <Link to="/trial-signup" className="fixed top-28 left-4 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgba(220,38,38,0.6),0_2px_8px_rgba(0,0,0,0.3)] px-5 py-2.5 h-11 rounded-full font-semibold transition-all hover:scale-105">
          <img src={ct1RoundLogo} alt="CT1" className="h-5 w-5 mr-2" />
          Try CT1 Free
        </Button>
      </Link>

      {/* Contact Sales Dialog */}
      <Dialog open={activeContactForm === "contact-sales"} onOpenChange={(open) => setActiveContactForm(open ? "contact-sales" : null)}>
        <DialogContent className="max-w-2xl">
          <ContactForm
            title="Contact Sales"
            description="Connect with our team to learn how CT1 can help grow your contracting business"
            ctaText="Get In Touch"
            formType="contact-sales"
            onClose={() => setActiveContactForm(null)}
          />
        </DialogContent>
      </Dialog>

      {/* SECTION 1: Hero */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/85"></div>
        
        {/* Animated background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] lg:w-[1000px] lg:h-[1000px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 w-full">
          <div className="flex flex-col items-center text-center">
            {/* MASSIVE Logo with Multiple Glow Layers */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black mb-8 leading-none text-white tracking-tight min-h-[2.5em]" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)' }}>
              <RotatingHeroTitle />
            </h1>

            <div className="relative mb-12 group cursor-pointer" onClick={() => setShowContactDialog(true)}>
              {/* Outer glow ring */}
              <div className="absolute -inset-8 sm:-inset-12 lg:-inset-16 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-full blur-3xl opacity-70 animate-pulse"></div>
              {/* Middle glow */}
              <div className="absolute -inset-4 sm:-inset-6 lg:-inset-8 bg-primary/40 rounded-full blur-2xl"></div>
              {/* White ring border effect */}
              <div className="relative p-3 sm:p-4 lg:p-5 rounded-full border-4 border-white/30 backdrop-blur-sm bg-black/20">
                <img 
                  src={ct1RoundLogo} 
                  alt="CT1" 
                  className="h-48 w-48 sm:h-72 sm:w-72 lg:h-96 lg:w-96 xl:h-[28rem] xl:w-[28rem] drop-shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:rotate-3"
                  style={{ filter: 'drop-shadow(0 0 60px rgba(220, 38, 38, 0.6)) drop-shadow(0 0 120px rgba(220, 38, 38, 0.3))' }}
                />
              </div>
              {/* Hover button */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full pt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                <span className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-lg whitespace-nowrap text-sm sm:text-base animate-fade-in">
                  Contact CT1 Today!
                </span>
              </div>
            </div>
            
            <p className="text-xl sm:text-2xl lg:text-3xl mb-1 text-white/90 leading-relaxed max-w-4xl font-light">
              A nationwide network of contractors.
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl mb-4 text-white/80 leading-relaxed max-w-4xl font-light">
              Building, Scaling, and Sustaining their businesses!
            </p>
            <p className="text-4xl sm:text-5xl lg:text-6xl mb-12 font-bold text-white drop-shadow-md">
              Powered by <span className="text-primary" style={{ textShadow: '0 0 30px rgba(220, 38, 38, 0.5)' }}>CT1</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 mb-10">
              <Dialog open={activeContactForm === "join-network"} onOpenChange={(open) => setActiveContactForm(open ? "join-network" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-hero text-lg sm:text-xl px-10 py-6 shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:scale-105">
                    Join the CT1 Network
                    <ArrowRight className="ml-2 h-6 w-6" />
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
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground text-lg sm:text-xl px-10 py-6 hover:scale-105 transition-all"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
            </div>
            
            <p className="text-white/70 text-sm mb-6 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Headquartered in Fraser, Michigan. Supporting contractors across the United States.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-5 py-2.5 text-sm">
                Built for trades
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-5 py-2.5 text-sm">
                Business suite for contractors
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-5 py-2.5 text-sm">
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
                Why Contractors Choose <span className="text-primary">myCT1</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Running a contracting business means juggling estimates, managing crews, chasing invoices, and somehow finding time to answer the phone. CT1 handles all of it in one place - giving you back hours every week and the peace of mind to actually grow.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "A full CRM to track every client interaction from first call to repeat business.",
                  "Jobs management that lets you schedule crews, assign tasks, and monitor progress all in one dashboard.",
                  "Professional estimates and invoices with digital approvals so you get paid faster.",
                  "Real-time financial reporting across every job - revenue, expenses, margins, and profitability, always current.",
                  "Warm, qualified leads delivered directly to your dashboard.",
                  "Expert training from people who've actually been in your boots - included with every subscription.",
                  "Technology solutions from trusted brands to keep your operation connected, mobile, and running efficiently.",
                  "An AI Phone Assistant that never misses a call, so every lead is captured even when you're on the job site."
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
              <Link key={index} to={feature.link}>
                <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full group">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-4 transition-colors" />
                </Card>
              </Link>
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

      {/* SECTION: Technology Solutions */}
      <section className="py-16 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Technology Solutions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              We Also Deliver the <span className="text-primary">Technology</span> Your Business Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
              From mobile devices and fleet tracking to internet and connectivity, CT1 partners with industry-leading brands to equip your crew with the tools that keep you competitive, connected, and in control.
            </p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-4">
              Find out more about our technology marketplace built for contractors.
            </p>
            <Dialog open={activeContactForm === "tech-section-cta"} onOpenChange={(open) => setActiveContactForm(open ? "tech-section-cta" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1 px-6 py-3 h-auto">
                  Contact Us Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Technology Solutions for Contractors"
                  description="Tell us about your business needs and our team will connect you with the right technology solutions."
                  ctaText="Get Started"
                  formType="tech-partner"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Partner Logos Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
            {[
              { src: verizonLogo, name: "Verizon" },
              { src: appleLogo, name: "Apple" },
              { src: comcastLogo, name: "Comcast Business" },
              { src: tmobileLogo, name: "T-Mobile" },
              { src: geotabLogo, name: "Geotab" },
              { src: spireonLogo, name: "Spireon" },
            ].map((partner) => (
              <Dialog key={partner.name} open={activeContactForm === `tech-${partner.name}`} onOpenChange={(open) => setActiveContactForm(open ? `tech-${partner.name}` : null)}>
                <DialogTrigger asChild>
                  <button className="bg-card border-2 border-border rounded-2xl p-8 sm:p-10 flex items-center justify-center hover:shadow-xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-300 cursor-pointer group aspect-[4/3]">
                    <img
                      src={partner.src}
                      alt={partner.name}
                      className="max-h-24 sm:max-h-28 max-w-[90%] object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 dark:brightness-0 dark:invert"
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title={`Learn More About ${partner.name} Solutions`}
                    description={`Tell us about your business and we'll show you how ${partner.name} solutions can help your contracting operation.`}
                    ctaText="Contact Sales"
                    formType="tech-partner"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* "And More" + CTA */}
          <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-3">
              ...and many more technology partners
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Learn how we can help you <span className="text-primary">build, scale, and sustain</span> your contracting business today.
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Whether you need phones, tablets, fleet GPS, internet, or any other technology to power your operation, our team will find the right solution at the right price for your trade.
            </p>
            <Dialog open={activeContactForm === "tech-solutions"} onOpenChange={(open) => setActiveContactForm(open ? "tech-solutions" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1 text-lg px-8 py-6 h-auto">
                  <Rocket className="mr-2 h-5 w-5" />
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Technology Solutions for Contractors"
                  description="Tell us about your business needs and our team will connect you with the right technology solutions to help you build, scale, and sustain your operation."
                  ctaText="Get Started"
                  formType="tech-partner"
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
            <img src={ct1RoundLogo} alt="CT1" className="h-20 w-20 mx-auto mb-6" />
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

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={ct1RoundLogo} alt="CT1 Logo" className="h-10 w-10" />
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
                <li><Link to="/what-we-do" className="hover:text-primary transition-colors">About Us</Link></li>
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

      {/* Contact Dialog triggered by logo hover click */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <ContactForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
