import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  Star,
  Users,
  BookOpen,
  ShoppingBag,
  Bot,
  Calendar,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function TierLaunch() {
  const stats = [
    { number: "$99.99", label: "Per Month" },
    { number: "1", label: "Monthly Coaching" },
    { number: "290+", label: "Training Courses" },
    { number: "24/7", label: "AI Assistant" },
  ];

  const storyCards = [
    { icon: BookOpen, title: "5-Star Training", description: "Comprehensive business and sales training program" },
    { icon: Users, title: "Full CRM", description: "Complete customer and job management system" },
    { icon: Calendar, title: "Monthly Coach", description: "One-on-one business coaching session monthly" },
    { icon: ShoppingBag, title: "Marketplace", description: "Access to vetted tech vendors with special pricing" },
  ];

  const features = [
    { icon: BookOpen, title: "5-Star Training", description: "Comprehensive training covering sales techniques, business management, customer service, and growth." },
    { icon: Users, title: "Full CRM System", description: "Complete solution to manage leads, customers, estimates, jobs, and follow-ups in one place." },
    { icon: Calendar, title: "Monthly Coaching", description: "One-on-one session each month with an experienced business coach for your specific challenges." },
    { icon: ShoppingBag, title: "Marketplace Access", description: "Exclusive access to curated technology partners with pre-negotiated contractor pricing." },
    { icon: Bot, title: "Pocket Agent AI", description: "Your personal AI assistant available 24/7 for estimates, proposals, and business questions." },
    { icon: Star, title: "Sales Methodology", description: "Professional sales methodology and customer communication mastery training." },
    { icon: CheckCircle, title: "Business Operations", description: "Best practices for running a profitable and efficient contracting business." },
    { icon: Users, title: "Lead Management", description: "Complete lead tracking and conversion tools to fill your pipeline." },
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
              <Star className="h-5 w-5 mr-2" />
              Tier 1 • Launch
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              myCT1 <span className="text-primary">Launch Growth Starter</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build your foundation with comprehensive training, a full CRM, and AI-powered tools. Perfect for contractors ready to professionalize their operations.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Your Foundation for <span className="text-primary">Growth</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Launch gives you everything you need to professionalize your operations and start growing—comprehensive training, a complete CRM, monthly coaching, and AI assistance.
                </p>
                <p>
                  Our 5-Star Contractor Business & Sales Training covers professional sales methodology, customer communication mastery, and business operations best practices—all developed from real-world contractor success stories.
                </p>
                <p>
                  Plus, get access to our curated marketplace of vetted technology vendors with pre-negotiated pricing designed for contractors.
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
              Everything Included in <span className="text-primary">Launch</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A complete foundation to professionalize and grow your contracting business.
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
            Ready to Launch Your Growth?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start building your foundation today with comprehensive training and a complete management system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Get Started - $99.99/month
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
