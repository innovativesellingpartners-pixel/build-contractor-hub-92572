import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { 
  Briefcase,
  Users,
  ClipboardList,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

export function CRM() {
  const features = [
    {
      icon: Users,
      title: "Customer Management",
      description: "Keep all customer information, communication history, and preferences organized in one place"
    },
    {
      icon: ClipboardList,
      title: "Job Tracking",
      description: "Track every job from quote to completion with real-time status updates and milestone tracking"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Optimize your team's schedule with intelligent dispatching and resource allocation"
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Store and access contracts, invoices, photos, and important documents instantly"
    },
    {
      icon: DollarSign,
      title: "Quote & Invoice",
      description: "Create professional quotes and invoices in minutes, track payments automatically"
    },
    {
      icon: TrendingUp,
      title: "Pipeline Analytics",
      description: "Visualize your sales pipeline and forecast revenue with powerful reporting tools"
    }
  ];

  const benefits = [
    "Close 30% more deals",
    "Save 15+ hours per week",
    "Never miss a follow-up",
    "Increase customer satisfaction",
    "Reduce administrative overhead",
    "Improve team coordination"
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
      <section className="relative py-12 overflow-hidden bg-gradient-to-br from-blue-500/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <img src={ct1Logo} alt="CT1" className="h-24 w-24 drop-shadow-2xl" />
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
              CRM & Job Management
              <span className="block text-primary mt-2">All-in-One Solution</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Manage customers, track jobs, and grow your business with powerful, easy-to-use tools
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="text-primary">Manage & Grow</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform">
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
          <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                Proven Business Impact
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for <span className="text-primary">Contractor Workflows</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Phone className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Lead to Customer</h3>
                <p className="text-muted-foreground mb-4">
                  Capture leads, track follow-ups, send quotes, and convert prospects into paying customers seamlessly.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Automatic lead capture from website/phone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Scheduled follow-up reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Quick quote generation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Briefcase className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Job Execution</h3>
                <p className="text-muted-foreground mb-4">
                  From scheduling to completion, manage every aspect of your jobs with precision and efficiency.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Smart team scheduling & dispatch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Progress tracking with photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Real-time job status updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Mail className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Customer Retention</h3>
                <p className="text-muted-foreground mb-4">
                  Build lasting relationships with automated follow-ups, satisfaction surveys, and maintenance reminders.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Post-job satisfaction surveys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Maintenance reminder scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Referral program management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-blue-500/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Ready to <span className="text-primary">Streamline Your Business?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of contractors managing customers and jobs more effectively with CT1 CRM.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/subscribe">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 font-bold">
                Start Free Trial
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
      <PublicFooter />
    </div>
  );
}
