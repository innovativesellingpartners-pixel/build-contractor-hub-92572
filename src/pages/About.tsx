import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  ArrowRight, 
  Users, 
  Target, 
  Globe, 
  TrendingUp,
  Building,
  Award,
  Heart,
  Zap
} from "lucide-react";

export function About() {
  const values = [
    {
      icon: Heart,
      title: "Contractor-First",
      description: "Every decision we make is guided by what's best for contractors and their success."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We leverage cutting-edge technology to solve real problems in the construction industry."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a supportive network where contractors can learn, grow, and succeed together."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We're committed to delivering the highest quality platform and support services."
    }
  ];

  const stats = [
    { number: "15,000+", label: "Active Contractors" },
    { number: "98%", label: "Faster Operations" },
    { number: "50+", label: "States Served" },
    { number: "98%", label: "Customer Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">Home</Link>
              <Link to="/for-contractors" className="text-foreground hover:text-primary transition-colors font-medium">For Contractors</Link>
              <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">Contact</Link>
              <Link 
                to="/subscribe" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Building className="h-5 w-5 mr-2" />
              About CT1
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Empowering Contractors to <span className="text-primary">Build Better Businesses</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              CT1 was founded with a simple mission: to give contractors the tools, training, and support they need to grow, manage, and scale their businesses in the modern economy.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 card-ct1">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  CT1 was born from the frustration of watching talented contractors struggle with outdated tools and fragmented systems. Our founders, who came from both the construction industry and technology backgrounds, saw an opportunity to bridge this gap.
                </p>
                <p>
                  We realized that contractors needed more than just another app or tool – they needed a complete ecosystem that could handle everything from lead generation and customer management to project execution and business growth.
                </p>
                <p>
                  Today, CT1 serves over 15,000 contractors across the United States, helping them increase revenue by an average of 40% while saving 20+ hours per week through automation and intelligent workflows.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card className="p-4 card-ct1">
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Our Mission</h4>
                  <p className="text-sm text-muted-foreground">Empower every contractor to build a thriving, scalable business</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Our Vision</h4>
                  <p className="text-sm text-muted-foreground">Transform the construction industry through technology and community</p>
                </Card>
              </div>
              <div className="space-y-4 mt-8">
                <Card className="p-4 card-ct1">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Our Impact</h4>
                  <p className="text-sm text-muted-foreground">Helping contractors grow revenue and build sustainable businesses</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Our Community</h4>
                  <p className="text-sm text-muted-foreground">15,000+ contractors strong and growing every day</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Our <span className="text-primary">Values</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These core values guide everything we do at CT1, from product development to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="card-ct1 p-6">
                <CardContent className="pt-6 text-center">
                  <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the CT1 Community?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Discover how CT1 can transform your contracting business and help you achieve your goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/subscribe">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4 font-bold"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
              <div>
                <h3 className="text-xl font-bold text-background">CT1</h3>
                <p className="text-xs text-muted">One-Up Your Business</p>
              </div>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/contact" className="text-sm text-muted hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
          
          <div className="border-t border-muted mt-8 pt-8 text-center">
            <p className="text-sm text-muted">© 2024 CT1. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}