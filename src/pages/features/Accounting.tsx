import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-tech-dashboard.jpg";
import {
  ArrowRight,
  DollarSign,
  Receipt,
  PieChart,
  TrendingUp,
  CreditCard,
  FileText,
  Wallet,
  BarChart3,
  ImageIcon,
} from "lucide-react";

export default function Accounting() {
  const stats = [
    { number: "10+ hrs", label: "Saved Weekly" },
    { number: "Real-Time", label: "P&L Reports" },
    { number: "100%", label: "Job Cost Visibility" },
    { number: "+18%", label: "Margin Improvement" },
  ];

  const storyCards = [
    { icon: Receipt, title: "Invoice Management", description: "Create, send, and track invoices from one dashboard" },
    { icon: Wallet, title: "Expense Tracking", description: "Capture receipts and categorize expenses by job" },
    { icon: PieChart, title: "Job Costing", description: "Track costs against budget for every project" },
    { icon: TrendingUp, title: "Profit & Loss", description: "Real-time P&L statements across all jobs" },
  ];

  const features = [
    { icon: Receipt, title: "Invoice Management", description: "Create professional invoices, send digitally, and track payment status automatically." },
    { icon: Wallet, title: "Expense Tracking", description: "Capture receipts, categorize expenses by job, and keep your books clean." },
    { icon: PieChart, title: "Job Costing", description: "Track materials, labor, and overhead against budget for every project." },
    { icon: TrendingUp, title: "Profit & Loss", description: "Real-time P&L statements so you always know where your money is going." },
    { icon: CreditCard, title: "Payment Processing", description: "Accept payments online, track deposits, and manage payment schedules." },
    { icon: FileText, title: "Tax Reports", description: "Organized quarterly and annual reports that make tax time painless." },
    { icon: DollarSign, title: "Budget Tracking", description: "Set budgets per job and get alerts before costs exceed estimates." },
    { icon: BarChart3, title: "Financial Dashboards", description: "At-a-glance financial health with revenue, expenses, and margins." },
  ];

  const screenshots = [
    { label: "Accounting Dashboard - Revenue, expenses, and profitability at a glance" },
    { label: "Invoice Management - Create, send, and track invoices" },
    { label: "Profit & Loss Reports - Real-time financial statements by job" },
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
              <DollarSign className="h-5 w-5 mr-2" />
              Accounting & Financials
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Take Control of Your <span className="text-primary">Finances</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Track every dollar across every job. From invoicing to job costing to real-time P&L, CT1 gives you the financial clarity to grow with confidence.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Financial Clarity for <span className="text-primary">Every Job</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Most contractors don't know if a job was profitable until weeks after it's done. CT1 changes that with real-time financial tracking that shows you exactly where you stand on every project.
                </p>
                <p>
                  Create and send professional invoices in seconds, track expenses by job with receipt capture, and see your profit margins update in real time. No more spreadsheets, no more guessing.
                </p>
                <p>
                  Contractors using CT1's accounting tools save 10+ hours per week on bookkeeping and see an average 18% improvement in profit margins through better job costing.
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
              Your Financial <span className="text-primary">Command Center</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what your accounting dashboard looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {screenshots.map((shot, index) => (
              <div key={index} className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-4">
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">{shot.label}</p>
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
              Complete Financial <span className="text-primary">Toolkit</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to manage the financial side of your contracting business.
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
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors saving 10+ hours per week on bookkeeping with CT1.
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