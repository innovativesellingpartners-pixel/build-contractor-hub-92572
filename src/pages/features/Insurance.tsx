import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import {
  Shield,
  FileText,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2,
  BarChart3,
} from "lucide-react";

export function Insurance() {
  const stats = [
    { number: "30%", label: "Cost Savings" },
    { number: "1-Click", label: "Certificate Generation" },
    { number: "100%", label: "Compliance Tracking" },
    { number: "Real-Time", label: "Rate Comparison" },
  ];

  const storyCards = [
    { icon: Shield, title: "All Policies", description: "View and manage every policy in one dashboard" },
    { icon: Clock, title: "Renewal Alerts", description: "Never miss a renewal date with auto reminders" },
    { icon: DollarSign, title: "Payment Tracking", description: "Monitor all premiums and payment due dates" },
    { icon: FileText, title: "Document Storage", description: "Secure cloud storage for all insurance docs" },
  ];

  const features = [
    { icon: FileText, title: "Document Management", description: "Store all insurance policies, certificates, and documents in one secure, organized location." },
    { icon: Clock, title: "Renewal Tracking", description: "Never miss a renewal date with automatic reminders and expiration alerts." },
    { icon: DollarSign, title: "Payment Management", description: "Track premiums, manage payment schedules, and monitor your insurance expenses." },
    { icon: CheckCircle2, title: "Compliance Monitoring", description: "Ensure you meet all state and contract insurance requirements automatically." },
    { icon: Building2, title: "Certificate Generation", description: "Instantly generate and send certificates of insurance to clients and GCs." },
    { icon: BarChart3, title: "Rate Comparison", description: "Compare quotes from multiple providers to find the best coverage at the best price." },
    { icon: Shield, title: "Trade-Specific Coverage", description: "Get quotes from insurers who specialize in your specific trade and risks." },
    { icon: Building2, title: "Right-Sized Protection", description: "Coverage that matches your business size—don't pay for protection you don't need." },
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
              <Shield className="h-5 w-5 mr-2" />
              Insurance Management
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Protect Your Business <span className="text-primary">The Smart Way</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage all your insurance from one place and find the best coverage for your trade, size, and location.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Everything in <span className="text-primary">One Place</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Stop juggling multiple insurance portals, agent emails, and paper files. CT1 gives you a single pane of glass to manage every aspect of your insurance.
                </p>
                <p>
                  From policies and payments to certificates and compliance—everything is organized, searchable, and always up to date. Generate certificates of insurance in seconds.
                </p>
                <p>
                  Contractors using CT1's insurance management save up to 30% on insurance costs by comparing rates and ensuring they're not overpaying for coverage they don't need.
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
              Complete Insurance <span className="text-primary">Platform</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to manage, compare, and optimize your insurance coverage.
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
            Ready to Simplify Your Insurance?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Stop overpaying for insurance. Manage everything in one place and find coverage that fits.
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
