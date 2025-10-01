import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Star, Zap, Crown } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

export function Pricing() {
  const tiers = [
    {
      id: "launch",
      name: "LAUNCH Growth Starter",
      subtitle: "Tier 1",
      price: 50,
      originalPrice: null,
      description: "Build your foundation with our training and management system",
      icon: <Star className="h-8 w-8" />,
      popular: false,
      features: [
        "CT1 5-Star Contractor Business & Sales Training",
        "Full Customer & Jobs Management system",
        "1 personal monthly business training session",
        "Marketplace access to vetted tech vendors"
      ]
    },
    {
      id: "growth",
      name: "Growth Business Builder", 
      subtitle: "Tier 2",
      price: 200,
      originalPrice: null,
      description: "Scale faster with AI tools and qualified leads",
      icon: <Zap className="h-8 w-8" />,
      popular: true,
      features: [
        "CT1 5-Star Contractor Business & Sales Training",
        "Full Customer & Jobs Management system", 
        "AI Phone Assistant for call answering and screening",
        "2 personal monthly business training sessions",
        "5 qualified leads per month",
        "Complete AI toolset (Pocket Bot, Sales Bot, Project Manager Bot, Admin Bot)",
        "Marketplace access to vetted vendors"
      ]
    },
    {
      id: "accel",
      name: "Accel! Market Dominator",
      subtitle: "Tier 3 - Coming Soon",
      price: null,
      originalPrice: null,
      description: "Premium lead generation and weekly coaching for market leaders",
      icon: <Crown className="h-8 w-8" />,
      popular: false,
      comingSoon: true,
      features: [
        "Premium lead generation",
        "High-intent or closed job leads weekly (80/20 split)",
        "Full AI toolset (Project Manager Bot, Sales Bot, Admin Bot)",
        "Weekly one-on-one growth & leadership coaching",
        "Enhanced AI Phone Assistant with qualification & scheduling"
      ]
    }
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
                <p className="text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your Growth Path
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our tiered approach ensures you get exactly what you need at your current stage while providing a clear path for growth as your business expands.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative p-6 ${
                  tier.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
                } ${tier.comingSoon ? "opacity-75" : ""}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4 text-primary">
                    {tier.icon}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">{tier.subtitle}</p>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  </div>
                  
                  <div className="mt-4">
                    {tier.comingSoon ? (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-muted-foreground">Coming Soon</p>
                        <p className="text-sm text-muted-foreground line-through">
                          ${tier.originalPrice}/month
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            ${tier.price}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mt-4">
                    {tier.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    {tier.comingSoon ? (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        disabled
                      >
                        Coming Soon
                      </Button>
                    ) : (
                      <Link to="/subscribe" className="block">
                        <Button 
                          className={`w-full ${
                            tier.popular 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : ""
                          }`}
                          variant={tier.popular ? "default" : "outline"}
                        >
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Start Your Growth Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of contractors already growing with CT1's proven systems and AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-8">
                Get Started Today
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="px-8">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}