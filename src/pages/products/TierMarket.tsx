import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-tech-dashboard.jpg";
import {
  Crown,
  Target,
  Users,
  Bot,
  Calendar,
  Phone,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function TierMarket() {
  const stats = [
    { number: "TBD", label: "Pricing Coming" },
    { number: "Weekly", label: "Lead Delivery" },
    { number: "4x", label: "Monthly Coaching" },
    { number: "Full", label: "AI Toolset" },
  ];

  const storyCards = [
    { icon: Target, title: "Premium Leads", description: "High-intent leads delivered weekly with 80/20 split" },
    { icon: Calendar, title: "Weekly Coaching", description: "Intensive weekly growth and leadership sessions" },
    { icon: Bot, title: "Enhanced AI", description: "Advanced AI phone with lead qualification" },
    { icon: Users, title: "Market Strategy", description: "Exclusive tools to dominate your local market" },
  ];

  const features = [
    { icon: CheckCircle, title: "All Growth Features", description: "Everything from Launch and Growth tiers including AI Phone, 5 leads/month, and complete AI toolset." },
    { icon: Target, title: "Premium Lead Gen", description: "High-intent or closed job leads delivered weekly. Our 80/20 revenue split means you pay when you close." },
    { icon: Calendar, title: "Weekly Coaching", description: "Intensive weekly growth and leadership coaching sessions to help you scale rapidly." },
    { icon: Bot, title: "Full AI Toolset", description: "Complete access to Project Manager Bot, Sales Bot, and Admin Bot working in harmony." },
    { icon: Phone, title: "Enhanced AI Phone", description: "Advanced AI phone capabilities with lead qualification, scheduling, and seamless CRM integration." },
    { icon: Users, title: "Market Dominance", description: "Exclusive strategies and tools designed to help you become the dominant contractor locally." },
    { icon: TrendingUp, title: "Growth Strategy", description: "Competitive analysis, market positioning, and brand building support." },
    { icon: Crown, title: "Premium Support", description: "Highest priority support with dedicated account management and onboarding." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Crown className="h-5 w-5 mr-2" />
              Coming Soon • Tier 3
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              myCT1 <span className="text-primary">Market Dominator</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Premium lead generation and weekly coaching for contractors ready to dominate their market. The ultimate growth package.
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

      {/* Two-Column Story Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Everything in Growth, <span className="text-primary">And Beyond</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Market Dominator includes everything from Launch and Growth tiers—plus premium lead generation, weekly coaching, and enhanced AI capabilities designed for contractors ready to own their market.
                </p>
                <p>
                  Our 80/20 revenue split model on premium leads means you only pay when you close deals. Combined with weekly one-on-one coaching, you'll have the strategy and pipeline to dominate.
                </p>
                <p>
                  Get exclusive competitive analysis, market positioning strategies, and brand building support to become the go-to contractor in your area.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {storyCards.slice(0, 2).map((card, index) => (
                  <Card key={index} className="p-4 card-ct1">
                    <card.icon className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">{card.title}</h4>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </Card>
                ))}
              </div>
              <div className="space-y-4 mt-8">
                {storyCards.slice(2, 4).map((card, index) => (
                  <Card key={index} className="p-4 card-ct1">
                    <card.icon className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">{card.title}</h4>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              What's Coming in <span className="text-primary">Market Dominator</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The ultimate package for contractors ready to own their local market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-ct1 p-6">
                <CardContent className="pt-6 text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
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
            Want to Be First When Market Dominator Launches?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Get started with Growth today and be first in line when our premium tier becomes available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products/tier-growth">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Start with Growth
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4 font-bold">
                Compare All Tiers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
