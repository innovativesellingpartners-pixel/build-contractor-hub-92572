import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronUp
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
              <a href="#pocketbots" className="text-foreground hover:text-primary transition-colors font-medium">PocketBots</a>
              <a href="#training" className="text-foreground hover:text-primary transition-colors font-medium">Training</a>
              <a href="#websites" className="text-foreground hover:text-primary transition-colors font-medium">Websites</a>
              <Link 
                to="/subscribe" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Contractor Portal
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
                Join the CT1 Network
                <span className="text-primary block mt-2 arrow-up">Start, Build, Scale Your Business</span>
              </h1>
              
              <p className="text-xl mb-8 leading-relaxed drop-shadow-md opacity-90">
                The complete contractor business suite with AI-powered tools, proven training, 
                and professional websites. Join thousands of contractors already growing with CT1.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="btn-hero text-lg px-8 py-4">
                  Join the CT1 Network Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-foreground">
                  See How It Works
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-current" />
                  <span className="font-semibold text-white">Trusted by 15,000+ contractors</span>
                </div>
              </div>
            </div>
            
            {/* Remove the separate image since it's now the background */}
          </div>
        </div>
      </section>

      {/* PocketBots Features */}
      <section id="pocketbots" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Bot className="h-5 w-5 mr-2" />
              CT1 PocketBots
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              AI-Powered Tools for <span className="text-primary">Your Business Growth</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Focus on what you do best while our AI PocketBots handle the administrative work, 
              client communication, and business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Sales Bot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Streamline client communication and grow your sales pipeline with intelligent automation.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Lead qualification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Automated follow-ups
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Calculator className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Estimating Bot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Generate accurate estimates faster with AI-powered calculations.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Instant estimates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Profit optimization
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6 hover:shadow-red-glow transition-all">
              <CardHeader className="pb-4">
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl font-bold">Project Bot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Keep projects on track with automated scheduling and progress tracking.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Smart scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Client updates
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
              Ready to <span className="text-primary-foreground">Build Your Future?</span>
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto text-primary-foreground">
              Join the CT1 network and start building the contracting business you've always wanted.
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