import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-construction.jpg";
import ct1Logo from "@/assets/ct1-logo-circle.png";
import constructeamLogo from "@/assets/ct1-logo-circle.png";
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
  FileText,
  DollarSign
} from "lucide-react";

export function LandingPage() {
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
                <p className="text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#business-suite" className="text-foreground hover:text-primary transition-colors font-medium">Business Suite</a>
              <a href="#modules" className="text-foreground hover:text-primary transition-colors font-medium">Modules</a>
              <a href="#integration" className="text-foreground hover:text-primary transition-colors font-medium">Integration</a>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors font-medium">Pricing</Link>
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
      <section className="section-hero py-24 relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left text-white">
              <div className="mb-8 flex justify-center lg:justify-start">
                <img src={constructeamLogo} alt="CONSTRUCTEAM CT1" className="h-20 w-20 drop-shadow-lg" />
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
                CT1 Unified Business Suite
                <span className="text-primary block mt-2 arrow-up">Everything You Need to Run Your Business</span>
              </h1>
              
              <p className="text-xl mb-8 leading-relaxed drop-shadow-md opacity-90">
                Complete contractor management platform combining proposals, job tracking, billing, 
                client communication, scheduling, and team coordination in one unified system.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="btn-hero text-lg px-8 py-4">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-foreground">
                  View Demo
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-current" />
                  <span className="font-semibold text-white">A nationwide network of trusted and elite contractors, "Powered by CT1"</span>
                </div>
              </div>
            </div>
            
            {/* Remove the separate image since it's now the background */}
          </div>
        </div>
      </section>

      {/* Business Suite Modules */}
      <section id="business-suite" className="py-20 bg-muted/30">
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
            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Proposals & Estimates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create professional proposals quickly with templates and accurate pricing.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Template library
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Digital approvals
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Job Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Track projects from lead to completion with phases, tasks, and milestones.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Team coordination
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Billing & Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automate invoicing, track payments, and manage financial reporting.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Automated invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Payment tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Client Portal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Secure client access to proposals, project status, and communications.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Real-time updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Document sharing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Reporting & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Monitor performance with cost analysis, revenue tracking, and margins.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Performance metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Financial insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Bot className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">AI Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  AI-powered PocketBots handle routine tasks and client communication.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Automated workflows
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Smart scheduling
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-cta py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img src={ct1Logo} alt="CT1" className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-5xl font-bold mb-6 text-primary-foreground">
              Ready to <span className="text-primary-foreground">Unify Your Business?</span>
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto text-primary-foreground">
              Start your free trial and experience how CT1's unified platform transforms contractor operations.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/subscribe">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-xl px-12 py-6 font-bold">
                Start Building Today
                <ChevronUp className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}