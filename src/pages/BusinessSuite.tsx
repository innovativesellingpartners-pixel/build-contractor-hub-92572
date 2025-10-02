import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  BookOpen, 
  Briefcase, 
  Users, 
  DollarSign, 
  Shield, 
  ShoppingBag,
  Mic,
  Phone,
  Headset,
  ArrowRight,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import { useState } from "react";

export function BusinessSuite() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const modules = [
    {
      id: "training",
      icon: BookOpen,
      title: "5-Star Training",
      description: "World-class training programs to elevate your team's skills and performance",
      color: "from-red-500 to-orange-500",
      features: ["Interactive Courses", "Certification Programs", "Video Library"]
    },
    {
      id: "crm",
      icon: Briefcase,
      title: "CRM/Jobs",
      description: "Complete job management and customer relationship tools in one place",
      color: "from-blue-500 to-cyan-500",
      features: ["Job Tracking", "Client Management", "Pipeline View"]
    },
    {
      id: "leads",
      icon: Users,
      title: "Leads",
      description: "Capture, nurture, and convert more leads into profitable projects",
      color: "from-purple-500 to-pink-500",
      features: ["Lead Capture", "Auto-Follow Up", "Conversion Analytics"]
    },
    {
      id: "quickbooks",
      icon: DollarSign,
      title: "QuickBooks",
      description: "Seamless integration with QuickBooks for effortless financial management",
      color: "from-green-500 to-emerald-500",
      features: ["Auto-Sync", "Invoice Management", "Financial Reports"]
    },
    {
      id: "insurance",
      icon: Shield,
      title: "Insurance",
      description: "Streamlined insurance management and compliance tracking",
      color: "from-indigo-500 to-blue-500",
      features: ["Policy Management", "Compliance Tracking", "Certificate Generation"]
    },
    {
      id: "marketplace",
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Connect with suppliers, find materials, and grow your network",
      color: "from-amber-500 to-yellow-500",
      features: ["Supplier Network", "Product Catalog", "Special Deals"]
    }
  ];

  const aiFeatures = [
    {
      icon: Mic,
      title: "Voice AI Assistant",
      description: "Natural conversation AI that understands your business needs and helps you work faster",
      highlight: "24/7 Available"
    },
    {
      icon: Phone,
      title: "Smart Appointment Scheduling",
      description: "AI-powered voice scheduling that books appointments while you focus on the job",
      highlight: "Automated"
    },
    {
      icon: Headset,
      title: "Live Expert Support",
      description: "North American-based trade professionals who know your business inside and out",
      highlight: "Real People"
    }
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
              <Link to="/#features" className="text-foreground hover:text-primary transition-colors font-medium">Features</Link>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors font-medium">Pricing</Link>
              <Link 
                to="/auth" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Login
              </Link>
            </nav>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img src={ct1Logo} alt="CT1" className="h-32 w-32 drop-shadow-2xl" />
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              Your Complete
              <span className="block text-primary mt-2">Business Suite</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A complete suite of innovative tools to manage your business—all in one powerful platform
            </p>
          </div>
        </div>
      </section>

      {/* Business Modules Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need, <span className="text-primary">In One Place</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful modules that work together seamlessly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {modules.map((module) => {
              const Icon = module.icon;
              const isHovered = hoveredCard === module.id;
              
              return (
                <Card
                  key={module.id}
                  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer transform hover:-translate-y-2"
                  onMouseEnter={() => setHoveredCard(module.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                   <CardContent className="p-8 relative">
                    <div className="mb-6 relative">
                      {module.id === 'quickbooks' ? (
                        <div className={`inline-flex px-6 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                          <span className="text-white font-bold text-2xl">QuickBooks</span>
                        </div>
                      ) : (
                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${module.color} transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {isHovered && (
                        <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-pulse" />
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors flex items-center gap-2">
                      {module.title}
                      {module.id === 'training' && (
                        <span className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </span>
                      )}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      {module.description}
                    </p>
                    
                    <div className="space-y-2">
                      {module.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link to={module.id === 'marketplace' ? '/marketplace' : `/business-suite/${module.id}`}>
                      <Button 
                        variant="ghost" 
                        className="mt-6 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      >
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI-Powered Support Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-6">
              <Sparkles className="h-5 w-5" />
              <span>AI-Powered Intelligence</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Always-On <span className="text-primary">Support & Automation</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI assistance combined with real human expertise when you need it most
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {aiFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              
              return (
                <Card 
                  key={idx}
                  className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50"
                >
                  <CardContent className="p-8">
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {feature.highlight}
                      </span>
                    </div>
                    
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our support team consists of experienced trade professionals who understand your industry. 
              Every assistant is an agent of your trade and company, providing personalized expertise.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
              Experience the Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={ct1Logo} alt="CT1" className="h-20 w-20 mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Transform <span className="text-primary">Your Business?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of contractors who are already using CT1 to streamline operations and grow their business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/subscribe">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 font-bold">
                Start Free Trial
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-xl px-12 py-6 font-bold">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Background Grid Pattern */}
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
