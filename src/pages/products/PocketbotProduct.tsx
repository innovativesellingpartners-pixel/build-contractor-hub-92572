import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bot, 
  Calculator, 
  ClipboardList, 
  Settings, 
  Share2, 
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import ct1Logo from "@/assets/ct1-logo.png";

const PocketbotProduct = () => {
  const modules = [
    {
      icon: Bot,
      title: "Sales Bot",
      description: "Master the art of selling with AI-powered sales coaching. Get real-time advice on customer communication, follow-up strategies, and closing techniques.",
      features: ["Customer communication scripts", "Follow-up scheduling", "Objection handling", "Closing strategies"]
    },
    {
      icon: Calculator,
      title: "Estimator Bot",
      description: "Create professional, accurate estimates in minutes. Get pricing guidance, line item suggestions, and markup calculations tailored to your trade.",
      features: ["Smart line item suggestions", "Material cost calculations", "Labor hour estimates", "Profit margin optimization"]
    },
    {
      icon: ClipboardList,
      title: "Project Manager Bot",
      description: "Keep every job on track with intelligent project management assistance. Task scheduling, progress tracking, and team coordination made simple.",
      features: ["Task breakdown & scheduling", "Progress milestone tracking", "Resource allocation", "Deadline management"]
    },
    {
      icon: Settings,
      title: "Administrator Bot",
      description: "Streamline your back-office operations. From data entry to compliance reminders, your AI administrator handles the paperwork so you don't have to.",
      features: ["Document organization", "Compliance reminders", "Report generation", "Data entry assistance"]
    },
    {
      icon: Share2,
      title: "Social Media Manager Bot",
      description: "Build your online presence without the hassle. Get content ideas, post suggestions, and engagement strategies designed for contractors.",
      features: ["Post content creation", "Hashtag optimization", "Engagement strategies", "Before/after showcases"]
    }
  ];

  const trainingModules = [
    "Sales & Customer Communication",
    "Estimating & Pricing Strategies",
    "Project Management Best Practices",
    "Business Administration",
    "Marketing & Social Media",
    "Financial Management"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={ct1Logo} alt="CT1" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing">
              <Button variant="outline">View Pricing</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Business Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            myCT1 Pocketbot
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Your complete AI business assistant. One bot that covers everything you need—sales, estimating, 
            project management, administration, and social media—all trained on proven contractor success strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                $20/month per user
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bot Modules Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Five Powerful AI Assistants in One
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pocketbot combines specialized AI modules that work together to run every aspect of your contracting business.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={`flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className="md:w-1/3 bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-4">
                          <module.icon className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">{module.title}</h3>
                      </div>
                    </div>
                    <div className="md:w-2/3 p-8">
                      <p className="text-muted-foreground mb-6">{module.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {module.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training Integration */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary/50 text-secondary-foreground px-4 py-2 rounded-full mb-6">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-medium">Training Powered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Built on Proven Success
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Pocketbot isn't just another AI—it's trained on our comprehensive contractor training modules 
                developed from real-world success stories. Every response is informed by decades of industry expertise.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trainingModules.map((module, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">{module}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8">
              <div className="bg-background rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Pocketbot</p>
                    <p className="text-foreground">
                      "Based on your job details, I recommend a 35% markup to hit your target profit margin. 
                      Would you like me to generate the line items for this bathroom remodel estimate?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">You</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">"Yes, include tile, fixtures, and labor"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of contractors using Pocketbot to work smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trial-signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View All Plans
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            Standalone: $20/month per user • Included in Growth & Market tiers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} myCT1. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PocketbotProduct;
