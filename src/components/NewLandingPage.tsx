import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import heroImage from "@/assets/hero-construction.jpg";
import ct1Logo from "@/assets/ct1-logo.png";
import constructeamLogo from "@/assets/constructeam-logo-circle.png";
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
            <div className="flex items-center space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">Business Suite</a>
              <a href="#for-contractors" className="text-foreground hover:text-primary transition-colors font-medium">For Contractors</a>
              <a href="#modules" className="text-foreground hover:text-primary transition-colors font-medium">Key Modules</a>
              <a href="#testimonials" className="text-foreground hover:text-primary transition-colors font-medium">Case Studies</a>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors font-medium">Pricing</Link>
              
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-hero py-24 relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left text-white">
              <div className="mb-8 flex justify-center lg:justify-start">
                <img src={constructeamLogo} alt="CONSTRUCTEAM CT1" className="h-24 w-24 drop-shadow-lg" />
              </div>
              
              <h1 className="text-7xl lg:text-8xl font-bold mb-4 leading-tight drop-shadow-lg">
                A nationwide network of contractors,
                <span className="text-primary block mt-2">Powered by CT1</span>
              </h1>
              
              <h2 className="text-3xl lg:text-4xl font-semibold mb-6 leading-tight drop-shadow-lg opacity-90">
                Unified Business Suite
                <span className="text-white block mt-1">For Contractors</span>
              </h2>
              
              <p className="text-xl mb-8 leading-relaxed drop-shadow-md opacity-90 max-w-2xl">
                Complete contractor management combining proposals, job tracking, billing, client communication, 
                scheduling, and team coordination. Everything connected. Nothing missing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
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
                
                <Dialog open={activeContactForm === "one-up-today"} onOpenChange={(open) => setActiveContactForm(open ? "one-up-today" : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-foreground">
                      One-Up Today
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
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
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-3 text-white">Already a CT1 Contractor?</h3>
                <p className="text-white/80 mb-4 text-sm">Access your dashboard, manage leads, and grow your business.</p>
                <Link to="/auth">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-foreground">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Contractor Portal
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-white">Increase Your Revenue</h4>
                    <p className="text-white/80 text-sm">By saving time, money, and energy. "Work on your business, not in your business"</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-white">Save 20+ Hours/Week</h4>
                    <p className="text-white/80 text-sm">Automated workflows</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-white">Nationwide Network</h4>
                    <p className="text-white/80 text-sm">Trusted and elite contractors, "Powered by CT1"</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <Award className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold text-white">Industry Leading</h4>
                    <p className="text-white/80 text-sm">Contractor platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CT1 Helps Contractors */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Target className="h-5 w-5 mr-2" />
              Unified Business Suite
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Everything Connected, <span className="text-primary">Nothing Missing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stop juggling multiple tools. CT1 combines all contractor business functions 
              in one professional, no-nonsense platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section id="for-contractors" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                  <span>(555) 123-4567</span>
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
            <p className="text-sm text-muted">© 2024 CT1. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/contact" className="text-sm text-muted hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}