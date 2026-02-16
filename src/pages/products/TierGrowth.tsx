import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  CheckCircle,
  Zap,
  Phone,
  Bot,
  Calendar,
  Target,
  Headphones,
  ArrowRight,
} from "lucide-react";

export default function TierGrowth() {
  const stats = [
    { number: "$250", label: "Per Month" },
    { number: "5", label: "Qualified Leads/Mo" },
    { number: "2x", label: "Monthly Coaching" },
    { number: "24/7", label: "AI Phone Assistant" },
  ];

  const storyCards = [
    { icon: Phone, title: "AI Phone", description: "24/7 AI-powered call answering and screening" },
    { icon: Target, title: "Qualified Leads", description: "5 pre-qualified leads delivered monthly" },
    { icon: Calendar, title: "More Coaching", description: "Two one-on-one sessions per month" },
    { icon: Bot, title: "Full AI Suite", description: "Sales, Project Manager, and Admin bots" },
  ];

  const features = [
    { icon: CheckCircle, title: "All Launch Features", description: "CT1 Training, Customer & Jobs Management, Marketplace access, and Pocket Agent AI Assistant." },
    { icon: Phone, title: "AI Phone Assistant", description: "24/7 AI-powered call answering and screening. Never miss a lead—handled professionally around the clock." },
    { icon: Calendar, title: "2 Monthly Sessions", description: "Double the coaching! Two one-on-one sessions per month to accelerate your business growth." },
    { icon: Target, title: "5 Qualified Leads", description: "We deliver 5 pre-qualified leads every month directly to your dashboard. No tire-kickers." },
    { icon: Bot, title: "Complete AI Toolset", description: "Full suite of AI assistants: Pocket Agent, Sales Bot, Project Manager Bot, and Admin Bot." },
    { icon: Headphones, title: "Priority Support", description: "Get priority access and dedicated support for all marketplace integrations and vendor connections." },
    { icon: Zap, title: "Growth Accelerator", description: "Advanced strategy sessions focused on scaling your business and increasing revenue." },
    { icon: Target, title: "Lead Qualification", description: "Pre-screened leads in your service area from ready-to-buy homeowners." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Zap className="h-5 w-5 mr-2" />
              Most Popular • Tier 2
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              myCT1 <span className="text-primary">Growth Business Builder</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Scale faster with AI-powered tools and qualified leads. The perfect tier for contractors ready to accelerate their growth.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Everything in Launch, <span className="text-primary">Plus More</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Growth includes everything from the Launch tier—CT1 Training, Customer & Jobs Management, Marketplace access, and Pocket Agent—plus powerful new tools to accelerate your business.
                </p>
                <p>
                  Get an AI Phone Assistant that answers calls 24/7, 5 pre-qualified leads delivered monthly, double the coaching sessions, and the complete AI toolset including Sales Bot, Project Manager Bot, and Admin Bot.
                </p>
                <p>
                  This is the most popular tier chosen by contractors who are ready to stop working in their business and start working on it.
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
              Everything Included in <span className="text-primary">Growth</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A complete growth package designed to scale your contracting business.
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
            Ready to Accelerate Your Growth?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the most popular tier chosen by contractors ready to scale their business with AI and qualified leads.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Get Started - $250/month
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
