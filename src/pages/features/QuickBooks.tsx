import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-tech-dashboard.jpg";
import {
  DollarSign,
  FileText,
  PieChart,
  TrendingUp,
  Calculator,
  CreditCard,
  Users,
  Target,
  ArrowRight,
  BarChart3,
  Wallet,
  CheckCircle2,
} from "lucide-react";

export function QuickBooks() {
  const stats = [
    { number: "15+ hrs", label: "Saved Monthly" },
    { number: "2x", label: "Faster Payments" },
    { number: "50%", label: "Tax Prep Savings" },
    { number: "Real-Time", label: "Financial Visibility" },
  ];

  const storyCards = [
    { icon: TrendingUp, title: "Know Your Numbers", description: "Read financial reports and guide growth decisions" },
    { icon: Wallet, title: "Cash Flow", description: "Maintain healthy cash flow and avoid shortfalls" },
    { icon: Target, title: "Profitability", description: "Identify which services make money" },
    { icon: BarChart3, title: "Strategic Planning", description: "Use financial data to set realistic goals" },
  ];

  const features = [
    { icon: FileText, title: "Automated Invoicing", description: "Create professional invoices in seconds and get paid faster with automatic payment reminders." },
    { icon: Calculator, title: "Expense Tracking", description: "Snap photos of receipts, categorize expenses automatically, and maximize tax deductions." },
    { icon: Users, title: "Payroll Management", description: "Pay your team on time with automated payroll processing, tax filing, and benefits." },
    { icon: PieChart, title: "Financial Reports", description: "Get real-time insights with profit & loss statements, cash flow reports, and custom dashboards." },
    { icon: CreditCard, title: "Tax Preparation", description: "Stay compliant and maximize deductions with organized records and quarterly tax estimates." },
    { icon: Target, title: "Project Profitability", description: "Track costs per job to identify your most profitable projects and price future work accurately." },
    { icon: CheckCircle2, title: "Auto-Sync", description: "Invoices created in CT1 CRM automatically sync to QuickBooks for seamless workflow." },
    { icon: DollarSign, title: "Unified Reporting", description: "View job profitability with data from both CT1 and QuickBooks in one place." },
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
              QuickBooks Integration
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Master Your Finances with <span className="text-primary">QuickBooks</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seamless QuickBooks integration with expert financial guidance to help you manage your money like a pro and develop a business financial mindset.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Develop a <span className="text-primary">Business Financial Mindset</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Understanding your finances is just the start. CT1 helps you think like a successful business owner with tools and guidance for job costing, cash flow management, and profitability analysis.
                </p>
                <p>
                  We don't just give you software—we help you become a smarter business owner. Learn to manage seasonal cash flow, price services profitably, and build long-term financial stability.
                </p>
                <p>
                  Contractors using CT1's QuickBooks integration save 15+ hours per month on bookkeeping and get paid 2x faster with online payments.
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
              Complete Financial <span className="text-primary">Management Suite</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to manage your money like a pro.
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
            Take Control of Your Finances
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start managing your money like a pro with QuickBooks integration and expert financial guidance.
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
