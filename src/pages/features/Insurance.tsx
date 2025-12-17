import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { 
  Shield,
  FileText,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingDown,
  Building2,
  MapPin,
  Users,
  AlertCircle,
  BarChart3
} from "lucide-react";

export function Insurance() {
  const features = [
    {
      icon: FileText,
      title: "Document Management",
      description: "Store all insurance policies, certificates, and documents in one secure, organized location"
    },
    {
      icon: Clock,
      title: "Renewal Tracking",
      description: "Never miss a renewal date with automatic reminders and expiration alerts"
    },
    {
      icon: DollarSign,
      title: "Payment Management",
      description: "Track premiums, manage payment schedules, and monitor your insurance expenses"
    },
    {
      icon: CheckCircle2,
      title: "Compliance Monitoring",
      description: "Ensure you meet all state and contract insurance requirements automatically"
    },
    {
      icon: Building2,
      title: "Certificate Generation",
      description: "Instantly generate and send certificates of insurance to clients and GCs"
    },
    {
      icon: BarChart3,
      title: "Rate Comparison",
      description: "Compare quotes from multiple providers to find the best coverage at the best price"
    }
  ];

  const coverageTypes = [
    {
      type: "General Liability",
      description: "Protection against third-party claims for bodily injury and property damage"
    },
    {
      type: "Workers' Compensation",
      description: "Coverage for employee injuries and illnesses sustained on the job"
    },
    {
      type: "Commercial Auto",
      description: "Insurance for vehicles used in your business operations"
    },
    {
      type: "Professional Liability",
      description: "Coverage for claims related to professional services and advice"
    },
    {
      type: "Tools & Equipment",
      description: "Protection for your valuable tools, equipment, and machinery"
    },
    {
      type: "Umbrella Coverage",
      description: "Extra liability protection beyond your primary policy limits"
    }
  ];

  const benefits = [
    "Save up to 30% on insurance costs",
    "Single dashboard for all policies",
    "Find trade-specific coverage",
    "Instant certificate generation",
    "Automated compliance tracking",
    "Compare rates in real-time"
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/business-suite" className="text-foreground hover:text-primary transition-colors font-medium">Back to Suite</Link>
              <Link 
                to="/pricing" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Get Started
              </Link>
            </nav>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-indigo-500/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img src={ct1Logo} alt="CT1" className="h-32 w-32 drop-shadow-2xl" />
                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Insurance Management
              <span className="block text-primary mt-2">Made Simple</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Manage all your insurance from one place and find the best coverage for your trade, size, and location
            </p>
          </div>
        </div>
      </section>

      {/* Single Pane of Glass */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/50 overflow-hidden">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Shield className="h-16 w-16 text-primary mb-6" />
                  <h2 className="text-4xl font-bold mb-6">
                    Everything in <span className="text-primary">One Place</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Stop juggling multiple insurance portals, agent emails, and paper files. CT1 gives you a single 
                    pane of glass to manage every aspect of your insurance—from policies and payments to certificates 
                    and compliance.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">All Policies Organized</span>
                        <span className="text-muted-foreground">View and manage every insurance policy in one dashboard</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Payment Tracking</span>
                        <span className="text-muted-foreground">Monitor all premiums and payment due dates</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Document Storage</span>
                        <span className="text-muted-foreground">Secure cloud storage for all insurance documents</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                      <Shield className="h-32 w-32 text-primary" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Complete Insurance <span className="text-primary">Management Platform</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 group-hover:scale-110 transition-transform">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits */}
          <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-background">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-indigo-500" />
                Save Money & Stay Protected
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Find Best Coverage */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Find the <span className="text-primary">Right Coverage</span>
            </h2>
            <p className="text-xl text-muted-foreground">Tailored to your trade, business size, and location</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Trade-Specific</h3>
                <p className="text-muted-foreground">
                  Get quotes from insurers who specialize in your specific trade and understand your unique risks
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Right-Sized</h3>
                <p className="text-muted-foreground">
                  Coverage that matches your business size—don't pay for protection you don't need
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">Location-Based</h3>
                <p className="text-muted-foreground">
                  Rates optimized for your state and local requirements—no overpaying
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-primary/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Coverage Types We Help You Find</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {coverageTypes.map((coverage, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <AlertCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-1">{coverage.type}</h4>
                      <p className="text-sm text-muted-foreground">{coverage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-500/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Protect Your Business <span className="text-primary">The Smart Way</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop overpaying for insurance. Manage everything in one place and find coverage that fits your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 font-bold">
                Get Started Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/business-suite">
              <Button size="lg" variant="outline" className="text-xl px-12 py-6 font-bold">
                Back to Suite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
