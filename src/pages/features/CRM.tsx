import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import {
  ArrowRight,
  Users,
  ClipboardList,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";

export function CRM() {
  const stats = [
    { number: "30%", label: "More Deals Closed" },
    { number: "15+", label: "Hours Saved Weekly" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "3x", label: "Crew Efficiency" },
  ];

  const storyCards = [
    { icon: Users, title: "Customer Hub", description: "All customer info, history, and preferences in one place" },
    { icon: ClipboardList, title: "Job Tracking", description: "Real-time status updates and milestone tracking" },
    { icon: TrendingUp, title: "Pipeline View", description: "Visualize your sales pipeline and forecast revenue" },
    { icon: DollarSign, title: "Quote & Invoice", description: "Create professional quotes and track payments" },
  ];

  const features = [
    { icon: Users, title: "Customer Management", description: "Keep all customer information, communication history, and preferences organized in one place" },
    { icon: ClipboardList, title: "Job Tracking", description: "Track every job from quote to completion with real-time status updates and milestone tracking" },
    { icon: Calendar, title: "Smart Scheduling", description: "Optimize your team's schedule with intelligent dispatching and resource allocation" },
    { icon: FileText, title: "Document Management", description: "Store and access contracts, invoices, photos, and important documents instantly" },
    { icon: DollarSign, title: "Quote & Invoice", description: "Create professional quotes and invoices in minutes, track payments automatically" },
    { icon: TrendingUp, title: "Pipeline Analytics", description: "Visualize your sales pipeline and forecast revenue with powerful reporting tools" },
    { icon: Phone, title: "Lead to Customer", description: "Capture leads, track follow-ups, send quotes, and convert prospects into paying customers" },
    { icon: Mail, title: "Customer Retention", description: "Build lasting relationships with automated follow-ups and maintenance reminders" },
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
              <Briefcase className="h-5 w-5 mr-2" />
              CRM & Job Management
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Manage Customers & Jobs <span className="text-primary">All-in-One</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage customers, track jobs, and grow your business with powerful, easy-to-use tools designed specifically for contractors.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Everything You Need to <span className="text-primary">Manage & Grow</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Stop juggling spreadsheets, sticky notes, and disconnected tools. CT1's CRM gives you a single command center for your entire operation—from the first lead call to the final invoice.
                </p>
                <p>
                  Track every customer interaction, manage job progress in real-time, and automate the follow-ups that keep your pipeline full. Built by contractors, for contractors.
                </p>
                <p>
                  Join thousands of contractors who have streamlined their operations and increased revenue by 30% with CT1's all-in-one CRM and job management system.
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
              Built for <span className="text-primary">Contractor Workflows</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every feature is designed around how contractors actually work—from lead capture to job completion.
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
            Ready to Streamline Your Business?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of contractors managing customers and jobs more effectively with CT1 CRM.
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
