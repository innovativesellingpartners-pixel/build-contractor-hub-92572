import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  Users,
  Zap,
  MessageSquare,
  Phone,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Bot,
  Clock,
  DollarSign
} from "lucide-react";

export function Leads() {
  const features = [
    {
      icon: Target,
      title: "Trade-Specific Leads",
      description: "Get pre-qualified leads matched to your exact trade and service area—ready to sell into immediately"
    },
    {
      icon: Zap,
      title: "Instant Lead Delivery",
      description: "Receive hot leads in real-time via text, email, and app notifications the moment they're available"
    },
    {
      icon: Bot,
      title: "AI Voice Assistant",
      description: "Our AI voice assistant qualifies leads 24/7, answers questions, and books appointments automatically"
    },
    {
      icon: CheckCircle2,
      title: "Pre-Qualified & Verified",
      description: "Every lead is screened for project fit, budget, and timeline before it reaches you"
    },
    {
      icon: MessageSquare,
      title: "Automated Follow-Up",
      description: "Never miss a follow-up with automated text, email, and voice message sequences"
    },
    {
      icon: TrendingUp,
      title: "High-Intent Projects",
      description: "Only homeowners actively looking for contractors in your trade—no tire-kickers"
    }
  ];

  const benefits = [
    "Respond to leads in under 60 seconds",
    "Increase lead conversion by 40%",
    "Never miss a lead opportunity",
    "Reduce cost per acquisition",
    "24/7 lead qualification",
    "More time for selling"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
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
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-purple-500/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img src={ct1Logo} alt="CT1" className="h-32 w-32 drop-shadow-2xl" />
                <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Lead Generation
              <span className="block text-primary mt-2">That Never Sleeps</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get trade-specific, pre-qualified leads delivered instantly—ready for you to bid on and win
            </p>
          </div>
        </div>
      </section>

      {/* Trade-Specific Leads Section */}
      <section className="py-20 bg-gradient-to-br from-purple-500/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Leads Matched to <span className="text-primary">Your Trade</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stop wasting time on unqualified prospects. Get actionable leads specific to your expertise that you can start selling into immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-2 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Your Trade Only</h3>
                <p className="text-muted-foreground mb-4">
                  Plumber? HVAC? Electrician? Roofing? Get leads exclusively for your specific trade and services.
                </p>
                <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  100% Relevant
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Ready to Buy</h3>
                <p className="text-muted-foreground mb-4">
                  These aren't research inquiries—they're homeowners with real projects, budgets, and timelines ready to hire.
                </p>
                <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  High Intent
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Instant Delivery</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to respond. Leads are delivered to you in real-time via text and email the second they're qualified.
                </p>
                <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  Real-Time
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-6 text-center">What Makes Our Leads Different</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">Pre-Screened Projects</h4>
                      <p className="text-muted-foreground">Every lead is verified for project scope, budget range, and decision-maker contact before delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">Service Area Match</h4>
                      <p className="text-muted-foreground">Leads are geographically matched to your service area—no wasted time on out-of-range projects</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">Project Details Included</h4>
                      <p className="text-muted-foreground">Get complete project specs, timeline requirements, and homeowner contact info upfront</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">Exclusive Opportunities</h4>
                      <p className="text-muted-foreground">Many leads are sent to limited contractors, giving you less competition and higher win rates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">No Long-Term Contracts</h4>
                      <p className="text-muted-foreground">Pay only for leads you want, pause anytime—no commitments or hidden fees</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-1">AI-Assisted Follow-Up</h4>
                      <p className="text-muted-foreground">Our AI voice assistant can contact leads on your behalf to schedule estimates automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Voice Assistant Highlight */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/50 overflow-hidden">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-6">
                    <Bot className="h-5 w-5" />
                    <span>AI-Powered</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6">
                    Voice AI That <span className="text-primary">Handles Your Leads</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our advanced voice AI assistant answers calls 24/7, qualifies leads by asking the right questions, 
                    schedules appointments automatically, and escalates hot leads to your team instantly.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Natural Conversations</span>
                        <span className="text-muted-foreground">Sounds human and understands context</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Smart Qualification</span>
                        <span className="text-muted-foreground">Asks questions to identify best opportunities</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Instant Scheduling</span>
                        <span className="text-muted-foreground">Books appointments based on your availability</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                      <Bot className="h-32 w-32 text-primary" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>
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
              Complete Lead <span className="text-primary">Management System</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform">
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
          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-background">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                Convert More Leads Into Revenue
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-primary mb-2">24/7</div>
                <p className="text-lg font-semibold mb-2">Always Available</p>
                <p className="text-muted-foreground">Never miss a lead, even after hours or on weekends</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-primary mb-2">&lt;60s</div>
                <p className="text-lg font-semibold mb-2">Response Time</p>
                <p className="text-muted-foreground">AI responds instantly while competitors wait hours</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-primary mb-2">40%</div>
                <p className="text-lg font-semibold mb-2">Higher Conversion</p>
                <p className="text-muted-foreground">Fast response + qualification = more closed deals</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-500/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Start Converting <span className="text-primary">More Leads Today</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let AI handle lead qualification while you focus on growing your business.
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
    </div>
  );
}
