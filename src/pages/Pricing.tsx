import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Star, Zap, Crown, Bot, Phone, MessageSquare } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { TierCheckout } from "@/components/TierCheckout";
import { SignupAfterPayment } from "@/components/SignupAfterPayment";

export function Pricing() {
  const [selectedTier, setSelectedTier] = useState<{ id: string; name: string; price: number } | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [paymentData, setPaymentData] = useState<{ tierId: string; billingCycle: string; paymentId: string } | null>(null);

  const handlePaymentSuccess = (tierId: string, billingCycle: string) => {
    setPaymentData({
      tierId,
      billingCycle,
      paymentId: `clover_${Date.now()}`,
    });
    setSelectedTier(null);
    setShowSignup(true);
  };

  const tiers = [
    {
      id: "launch",
      name: "myCT1 Launch Growth Starter",
      subtitle: "Tier 1",
      price: 99.99,
      originalPrice: null,
      description: "Build your foundation with our training and management system",
      icon: <Star className="h-8 w-8" />,
      popular: false,
      features: [
        "CT1 5-Star Contractor Business & Sales Training",
        "Full Customer & Jobs Management system",
        "1 personal monthly business training session",
        "Marketplace access to vetted tech vendors",
        "24/7 AI Business Assistant (Pocket Bot)"
      ]
    },
    {
      id: "growth",
      name: "myCT1 Growth Business Builder", 
      subtitle: "Tier 2",
      price: 250,
      originalPrice: null,
      description: "Scale faster with AI tools and qualified leads",
      icon: <Zap className="h-8 w-8" />,
      popular: true,
      features: [
        "Everything in Launch Growth Starter, plus:",
        "AI Phone Assistant for call answering and screening",
        "2 personal monthly business training sessions",
        "5 qualified leads per month",
        "Complete AI toolset (Pocket Bot, Sales Bot, Project Manager Bot, Admin Bot)",
        "Priority marketplace support"
      ]
    },
    {
      id: "accel",
      name: "myCT1 Market Dominator",
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

  const addOns = [
    {
      id: "voice-ai",
      name: "Voice AI Assistant",
      price: 50,
      icon: <Phone className="h-10 w-10" />,
      description: "Your 24/7 AI-powered phone receptionist that answers calls, captures leads, schedules appointments, and handles customer inquiries with a natural, professional voice. Never miss a call again - your AI assistant works around the clock so you can focus on the job.",
      features: [
        "24/7 call answering with natural AI voice",
        "Automatic lead capture and CRM integration",
        "Appointment scheduling with calendar sync",
        "Custom greeting and business profile",
        "Call forwarding with configurable timeout",
        "Bilingual support (English & Spanish)"
      ]
    },
    {
      id: "pocketbot",
      name: "Pocket Bot AI Assistant",
      price: 20,
      icon: <Bot className="h-10 w-10" />,
      description: "Your personal AI business assistant available 24/7 to help with estimates, proposals, customer communication, and business questions. Get instant answers and generate professional content without leaving your dashboard.",
      features: [
        "Instant answers to business questions",
        "Generate professional estimates and proposals",
        "Draft customer communications",
        "Business advice and guidance",
        "Available in your dashboard 24/7",
        "Unlimited conversations"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
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
          <h2 className="text-3xl font-bold text-center mb-12">Subscription Tiers</h2>
          
          {/* First 2 tiers side by side */}
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {tiers.slice(0, 2).map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative p-6 ${
                  tier.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">{tier.subtitle}</p>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          ${tier.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </div>
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
                    <Button 
                      onClick={() => setSelectedTier({ id: tier.id, name: tier.name, price: tier.price })}
                      className="w-full bg-red-600 text-white hover:bg-red-700"
                    >
                      Sign up for {tier.name.split(' ').slice(0, 2).join(' ')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Third tier below */}
          <div className="max-w-2xl mx-auto mb-20">
            {tiers.slice(2).map((tier) => (
              <Card 
                key={tier.id} 
                className="relative p-6 opacity-75"
              >
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">{tier.subtitle}</p>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-muted-foreground">Coming Soon</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Pricing TBD
                      </p>
                    </div>
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
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      disabled
                    >
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add-On Products */}
          <div className="border-t border-border pt-16">
            <h2 className="text-3xl font-bold text-center mb-4">Add-On Products</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Enhance your CT1 experience with standalone AI-powered tools. Available as add-ons to any tier or as standalone products.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {addOns.map((addon) => (
                <Card 
                  key={addon.id} 
                  className="relative p-6 border-2 hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        {addon.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{addon.name}</CardTitle>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-primary">${addon.price}</span>
                          <span className="text-muted-foreground text-sm">/month per user</span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {addon.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {addon.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      <Button 
                        onClick={() => setSelectedTier({ id: addon.id, name: addon.name, price: addon.price })}
                        className="w-full"
                        variant="outline"
                      >
                        Add {addon.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      {selectedTier && (
        <TierCheckout
          tier={selectedTier}
          isOpen={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {showSignup && paymentData && (
        <SignupAfterPayment
          isOpen={showSignup}
          tierId={paymentData.tierId}
          billingCycle={paymentData.billingCycle}
          cloverPaymentId={paymentData.paymentId}
        />
      )}
    </div>
  );
}