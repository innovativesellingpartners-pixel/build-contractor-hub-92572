import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-leads-generation.jpg";
import {
  ImageIcon,
  Target,
  Zap,
  MessageSquare,
  Bot,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";

export function Leads() {
  const stats = [
    { number: "24/7", label: "Always Available" },
    { number: "<60s", label: "Response Time" },
    { number: "40%", label: "Higher Conversion" },
    { number: "100%", label: "Relevant Leads" },
  ];

  const storyCards = [
    { icon: Target, title: "Trade-Specific", description: "Leads matched to your exact trade and service area" },
    { icon: DollarSign, title: "Ready to Buy", description: "Homeowners with real projects, budgets, and timelines" },
    { icon: Clock, title: "Instant Delivery", description: "Leads delivered in real-time via text and email" },
    { icon: Bot, title: "AI Follow-Up", description: "AI assistant contacts leads and books estimates" },
  ];

  const features = [
    { icon: Target, title: "Trade-Specific Leads", description: "Get pre-qualified leads matched to your exact trade and service area—ready to sell into immediately." },
    { icon: Zap, title: "Instant Lead Delivery", description: "Receive hot leads in real-time via text, email, and app notifications the moment they're available." },
    { icon: Bot, title: "AI Voice Assistant", description: "Our AI voice assistant qualifies leads 24/7, answers questions, and books appointments automatically." },
    { icon: CheckCircle2, title: "Pre-Qualified & Verified", description: "Every lead is screened for project fit, budget, and timeline before it reaches you." },
    { icon: MessageSquare, title: "Automated Follow-Up", description: "Never miss a follow-up with automated text, email, and voice message sequences." },
    { icon: TrendingUp, title: "High-Intent Projects", description: "Only homeowners actively looking for contractors in your trade—no tire-kickers." },
    { icon: Users, title: "Exclusive Opportunities", description: "Many leads sent to limited contractors, giving you less competition and higher win rates." },
    { icon: DollarSign, title: "No Long-Term Contracts", description: "Pay only for leads you want, pause anytime—no commitments or hidden fees." },
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
              <Target className="h-5 w-5 mr-2" />
              Lead Generation
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Lead Generation That <span className="text-primary">Never Sleeps</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get trade-specific, pre-qualified leads delivered instantly—ready for you to bid on and win.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Leads Matched to <span className="text-primary">Your Trade</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Stop wasting time on unqualified prospects. CT1 delivers actionable leads specific to your expertise—plumbing, HVAC, electrical, roofing, and more—that you can start selling into immediately.
                </p>
                <p>
                  Every lead is verified for project scope, budget range, and decision-maker contact before delivery. They're geographically matched to your service area so there's no wasted time.
                </p>
                <p>
                  Our AI voice assistant can even contact leads on your behalf to schedule estimates automatically, so you're always first to respond.
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

      {/* Screenshot Showcase */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary px-4 py-2 text-lg">
              <ImageIcon className="h-5 w-5 mr-2" />
              See It In Action
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Lead <span className="text-primary">Pipeline</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what lead management looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              "Lead Dashboard - Incoming leads with status and source tracking",
              "Lead Detail - Full contact info, project scope, and follow-up history",
              "AI Follow-Up - Automated sequences that convert leads to jobs",
            ].map((label, index) => (
              <div key={index} className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-4">
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Complete Lead <span className="text-primary">Management System</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From lead delivery to conversion, everything you need to grow your pipeline.
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
            Ready to Fill Your Pipeline?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who've increased lead conversion by 40% with CT1's lead generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4 font-bold">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
