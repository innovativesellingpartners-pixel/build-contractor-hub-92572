import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MobileNav } from "@/components/MobileNav";
import { Pocketbot } from "@/components/contractor/Pocketbot";
import heroImage from "@/assets/hero-construction.jpg";
import ct1Logo from "@/assets/ct1-logo-main.png";
import constructeamLogo from "@/assets/ct1-logo-main.png";
import { 
  ArrowRight, 
  Bot, 
  Calculator, 
  Calendar, 
  Target, 
  Users,
  Globe,
  TrendingUp,
  CheckCircle,
  Star,
  Zap,
  Award,
  ChevronUp,
  Search,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  GraduationCap,
  DollarSign,
  Clock,
  Gauge,
  FileText
} from "lucide-react";

export function NewLandingPage() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);
  const [showPocketbot, setShowPocketbot] = useState(false);

  const testimonials = [
    {
      name: "Mike Johnson",
      company: "Johnson Construction",
      text: "CT1 transformed my business. The PocketBots handle all my estimates and client communication automatically. I've increased my revenue by 40% in just 6 months.",
      rating: 5,
      location: "Dallas, TX"
    },
    {
      name: "Sarah Martinez",
      company: "Elite Roofing Solutions",
      text: "The training modules helped me get certified and the marketplace connected me with quality suppliers. CT1 is a complete game-changer for contractors.",
      rating: 5,
      location: "Phoenix, AZ"
    },
    {
      name: "David Chen",
      company: "Chen Electrical Services",
      text: "From lead generation to project management, CT1 handles everything. I can focus on quality work while my business runs itself.",
      rating: 5,
      location: "Seattle, WA"
    }
  ];

  const features = [
    {
      icon: FileText,
      title: "Proposals & Estimates",
      description: "Create professional proposals quickly with templates and line items"
    },
    {
      icon: Calendar,
      title: "Job Management",
      description: "Track projects from lead to completion with phases and tasks"
    },
    {
      icon: DollarSign,
      title: "Billing & Payments",
      description: "Automate invoicing, track payments, and manage financial reporting"
    },
    {
      icon: Users,
      title: "Client Portal",
      description: "Secure client access to proposals, project status, and updates"
    },
    {
      icon: TrendingUp,
      title: "Reporting & Analytics",
      description: "Monitor cost, revenue, margins with performance metrics"
    },
    {
      icon: Bot,
      title: "AI Automation",
      description: "PocketBots handle routine tasks and client communication"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">One-Up Your Business</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/what-we-do" className="text-foreground hover:text-primary transition-colors font-medium">What We Do</Link>
              <Link to="/core-values" className="text-foreground hover:text-primary transition-colors font-medium">Core Values</Link>
              <Link to="/trades-we-serve" className="text-foreground hover:text-primary transition-colors font-medium">Trades We Serve</Link>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors font-medium">Pricing</Link>
              <Link to="/blog-podcast" className="text-foreground hover:text-primary transition-colors font-medium">Blog & Podcast</Link>
              
              <Dialog open={activeContactForm === "contact-sales"} onOpenChange={(open) => setActiveContactForm(open ? "contact-sales" : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="font-semibold">Contact Sales</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Contact Our Sales Team"
                    description="Let's discuss how CT1 can transform your contracting business"
                    ctaText="Contact Sales"
                    formType="sales-inquiry"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
              
              <Link 
                to="/auth" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Contractor Login
              </Link>
            </nav>

            <MobileNav onContactClick={() => setActiveContactForm("contact-sales")} />
          </div>
        </div>
      </header>

      {/* CT1 Pocketbot - Floating Button (Enlarged) */}
      <div className="fixed bottom-6 right-4 md:top-20 md:bottom-auto md:right-6 z-50">
        <div
          onClick={() => setShowPocketbot(true)}
          className="group relative cursor-pointer"
        >
          {/* Main Button */}
          <div className="flex items-center gap-2 md:gap-4 bg-foreground/95 backdrop-blur-md text-background px-4 py-3 md:px-8 md:py-5 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 border-2 border-primary/30">
            <div className="relative">
              <div className="h-10 w-10 md:h-14 md:w-14 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <img src={ct1Logo} alt="CT1" className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 bg-primary rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col hidden md:flex">
              <span className="font-bold text-lg whitespace-nowrap">Try CT1 Pocketbot</span>
              <span className="text-sm text-background/70 whitespace-nowrap">Get instant answers</span>
            </div>
            <span className="font-bold text-sm md:hidden">CT1 Bot</span>
            <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block">
            <div className="bg-foreground text-background text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>3 Free Prompts • $10/month after</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="section-hero py-12 sm:py-16 md:py-20 relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white mb-12">
            <div className="mb-8 flex justify-center">
              <img src={constructeamLogo} alt="CONSTRUCTEAM CT1" className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-lg" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight drop-shadow-lg">
              A nationwide network of contractors,
            </h1>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight drop-shadow-lg">
              <span className="text-primary">Powered by CT1</span>
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-10 leading-relaxed drop-shadow-md opacity-90 max-w-4xl mx-auto">
              Complete contractor management combining proposals, job tracking, billing, client communication, 
              scheduling, and team coordination. Everything connected. Nothing missing.
            </p>
          </div>

          {/* Feature Cards - Moved Higher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-6xl mx-auto">
            <Link to="/business-suite" className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20 hover:bg-white/20 hover:border-primary/50 transition-all cursor-pointer group">
              <TrendingUp className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white text-lg mb-2 group-hover:text-primary transition-colors">Complete Business Suite</h4>
              <p className="text-white/80 text-sm">A complete suite of innovative tools to manage your business</p>
            </Link>
            <Link to="/network-map" className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20 hover:bg-white/20 hover:border-primary/50 transition-all cursor-pointer group">
              <Users className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white text-lg mb-2 group-hover:text-primary transition-colors">Nationwide Network</h4>
              <p className="text-white/80 text-sm">A Network of the Nations leading contractors</p>
            </Link>
            <Link to="/savings" className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20 hover:bg-white/20 hover:border-primary/50 transition-all cursor-pointer group">
              <Clock className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white text-lg mb-2 group-hover:text-primary transition-colors">Save 20+ Hours/Week</h4>
              <p className="text-white/80 text-sm">Automated workflows</p>
            </Link>
            <Link to="/platform" className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20 hover:bg-white/20 hover:border-primary/50 transition-all cursor-pointer group">
              <Award className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white text-lg mb-2 group-hover:text-primary transition-colors">Industry Leading</h4>
              <p className="text-white/80 text-sm">Contractor platform</p>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Dialog open={activeContactForm === "join-network"} onOpenChange={(open) => setActiveContactForm(open ? "join-network" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-hero text-lg px-8 py-4">
                  Join the CT1 Network
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl mx-4">
                <ContactForm
                  title="Join the CT1 Network"
                  description="Start building your future with CT1's powerful contractor platform"
                  ctaText="Join Network"
                  formType="network-signup"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={activeContactForm === "one-up-today"} onOpenChange={(open) => setActiveContactForm(open ? "one-up-today" : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground px-8 py-4">
                  One-Up Today
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl mx-4">
                <ContactForm
                  title="One-Up Your Business Today"
                  description="Get started with CT1 and transform your contracting business"
                  ctaText="Get Started"
                  formType="get-started"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Contractor Login Section */}
          <div className="max-w-md mx-auto bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-3 text-white">Already a CT1 Contractor?</h3>
            <p className="text-white/80 mb-4 text-sm">Access your dashboard, manage leads, and grow your business.</p>
            <Link to="/auth">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-foreground w-full">
                <Briefcase className="mr-2 h-4 w-4" />
                Contractor Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How CT1 Helps Contractors */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base md:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Unified Business Suite
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 px-4">
              Everything Connected, <span className="text-primary">Nothing Missing</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Stop juggling multiple tools. CT1 combines all contractor business functions 
              in one professional, no-nonsense platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-ct1 p-6 hover:shadow-red-glow transition-all">
                <CardHeader className="pb-4">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Contractors Section */}
      <section id="for-contractors" className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2">
                <Building className="h-4 w-4 mr-2" />
                For Contractors
              </Badge>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Everything You Need to <span className="text-primary">Scale Your Business</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Stop juggling multiple tools and platforms. CT1 integrates everything into one powerful system designed specifically for contractors.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                <h4 className="font-semibold text-foreground">Proposals to Payment</h4>
                    <p className="text-muted-foreground">Complete workflow from estimates through invoicing and payment tracking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                <h4 className="font-semibold text-foreground">Job Management</h4>
                    <p className="text-muted-foreground">Track projects through phases, manage tasks, and coordinate field and office teams</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                <h4 className="font-semibold text-foreground">Client Portal</h4>
                    <p className="text-muted-foreground">Secure branded portals for clients to review proposals and track project status</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                <h4 className="font-semibold text-foreground">Reporting & Analytics</h4>
                    <p className="text-muted-foreground">Monitor performance with cost analysis, revenue tracking, and margin reporting</p>
                  </div>
                </div>
              </div>

              <Dialog open={activeContactForm === "contractor-demo"} onOpenChange={(open) => setActiveContactForm(open ? "contractor-demo" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-ct1">
                    Get Contractor Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Get Your Contractor Demo"
                    description="See how CT1 can transform your contracting business with a personalized demo"
                    ctaText="Schedule Demo"
                    formType="contractor-demo"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card className="p-4 card-ct1">
                  <DollarSign className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Revenue Growth</h4>
                  <p className="text-sm text-muted-foreground">Increase profits with better lead conversion</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <Gauge className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Efficiency</h4>
                  <p className="text-sm text-muted-foreground">Automate administrative tasks</p>
                </Card>
              </div>
              <div className="space-y-4 mt-8">
                <Card className="p-4 card-ct1">
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Online Presence</h4>
                  <p className="text-sm text-muted-foreground">Professional websites and listings</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Compliance</h4>
                  <p className="text-sm text-muted-foreground">Track licenses and insurance</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find Contractor Section */}
      <section id="find-contractor" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Search className="h-5 w-5 mr-2" />
              For Consumers
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Find a <span className="text-primary">Trusted Contractor</span> Powered by CT1
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Connect with vetted, professional contractors who use CT1's advanced platform to deliver exceptional service and results.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Verified & Trusted</h4>
                    <p className="text-muted-foreground">All CT1 contractors are verified, licensed, and insured professionals</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Quality Guaranteed</h4>
                    <p className="text-muted-foreground">CT1 contractors deliver professional results with transparent pricing</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Modern Technology</h4>
                    <p className="text-muted-foreground">AI-powered project management and communication tools</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-background to-muted/50 p-8 rounded-lg border border-primary/20">
              <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Find Your Contractor</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Service Needed</label>
                  <select className="w-full p-3 border border-border rounded-lg bg-background">
                    <option>Select a service...</option>
                    <option>Roofing</option>
                    <option>Electrical</option>
                    <option>Plumbing</option>
                    <option>HVAC</option>
                    <option>General Construction</option>
                    <option>Landscaping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Enter city, state or zip code" 
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
                
                <Dialog open={activeContactForm === "find-contractor"} onOpenChange={(open) => setActiveContactForm(open ? "find-contractor" : null)}>
                  <DialogTrigger asChild>
                    <Button className="w-full btn-ct1">
                      <Search className="mr-2 h-5 w-5" />
                      Find Contractors
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ContactForm
                      title="Find Your Perfect Contractor"
                      description="Tell us about your project and we'll connect you with verified CT1 contractors"
                      ctaText="Find Contractors"
                      formType="find-contractor"
                      onClose={() => setActiveContactForm(null)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Star className="h-5 w-5 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              What <span className="text-primary">Contractors</span> Are Saying
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how CT1 is transforming contractor businesses across the country.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-ct1 p-6">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-primary fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    <p className="text-sm text-primary">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-cta py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img src={ct1Logo} alt="CT1" className="h-20 w-20 mx-auto mb-6" />
            <h2 className="text-5xl font-bold mb-6 text-primary-foreground">
              Ready to <span className="text-primary-foreground">Build Your Future?</span>
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto text-primary-foreground">
              Join a nationwide network of trusted and elite contractors, "Powered by CT1" comprehensive platform.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Dialog open={activeContactForm === "start-building"} onOpenChange={(open) => setActiveContactForm(open ? "start-building" : null)}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-xl px-12 py-6 font-bold">
                  Start Building Today
                  <ChevronUp className="ml-2 h-6 w-6" />
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
            
            <Dialog open={activeContactForm === "learn-more"} onOpenChange={(open) => setActiveContactForm(open ? "learn-more" : null)}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground text-xl px-12 py-6 font-bold">
                  Learn More
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Learn More About CT1"
                  description="Get detailed information about how CT1 can transform your business"
                  ctaText="Get Information"
                  formType="learn-more"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={constructeamLogo} alt="CONSTRUCTEAM Logo" className="h-10 w-10" />
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
                <li><Link to="/for-contractors" className="hover:text-primary transition-colors">Platform Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/training" className="hover:text-primary transition-colors">Training</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">For Consumers</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/find-contractor" className="hover:text-primary transition-colors">Find Contractors</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Quality Guarantee</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Customer Support</a></li>
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
                  <span>Nationwide Service</span>
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