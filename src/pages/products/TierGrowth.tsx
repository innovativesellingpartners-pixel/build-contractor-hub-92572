import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Phone, Users, Bot, Calendar, Target, Headphones } from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { MainSiteHeader } from "@/components/MainSiteHeader";

export default function TierGrowth() {
  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
          <div className="flex justify-center mb-6">
            <img src={ct1Logo} alt="CT1 Logo" className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Tier 2</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            myCT1 Growth Business Builder
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Scale faster with AI-powered tools and qualified leads. The perfect tier for contractors ready to accelerate their growth.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-5xl font-bold text-foreground">$250</span>
            <span className="text-xl text-muted-foreground">/month</span>
          </div>
          <Link to="/auth">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg">
              Get Started with Growth
            </Button>
          </Link>
        </div>
      </section>

      {/* What's Included Banner */}
      <section className="py-8 bg-primary/5 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-foreground">
            <span className="font-bold">Everything in Launch Growth Starter, plus:</span> AI Phone Assistant, 5 qualified leads/month, complete AI toolset, and more coaching sessions.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything Included in Growth</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-2 border-primary/20">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary/10 text-primary">Included from Launch</Badge>
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">All Launch Features</h3>
                <p className="text-muted-foreground">
                  CT1 Training, Customer & Jobs Management, Marketplace access, and Pocket Bot AI Assistant.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary text-primary-foreground">New in Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Phone Assistant</h3>
                <p className="text-muted-foreground mb-4">
                  24/7 AI-powered call answering and screening. Never miss a lead again - your AI assistant handles calls professionally around the clock.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Natural, professional voice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Lead qualification and capture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Appointment scheduling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary text-primary-foreground">New in Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">2 Monthly Training Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Double the coaching! Two one-on-one sessions per month to accelerate your business growth and tackle challenges faster.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Bi-weekly accountability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Advanced strategy sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Growth planning and execution</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary text-primary-foreground">New in Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">5 Qualified Leads Per Month</h3>
                <p className="text-muted-foreground mb-4">
                  We deliver 5 pre-qualified leads every month directly to your dashboard. No more wasting time on tire-kickers.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Pre-screened for quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">In your service area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Ready-to-buy homeowners</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary text-primary-foreground">New in Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Complete AI Toolset</h3>
                <p className="text-muted-foreground mb-4">
                  Full suite of AI assistants: Pocket Bot, Sales Bot, Project Manager Bot, and Admin Bot working together to automate your business.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Sales Bot for closing deals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Project Manager Bot for scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Admin Bot for paperwork</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-primary text-primary-foreground">New in Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Priority Marketplace Support</h3>
                <p className="text-muted-foreground mb-4">
                  Get priority access and dedicated support for all marketplace integrations and vendor connections.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Priority response times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Dedicated integration support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Early access to new vendors</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Accelerate Your Growth?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the most popular tier chosen by contractors ready to scale their business with AI and qualified leads.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8">
                Get Started - $250/month
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8">
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
