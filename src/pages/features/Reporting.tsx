import { useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import {
  ArrowRight,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Download,
  Calendar,
  Phone,
  Target,
} from "lucide-react";

export default function Reporting() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const features = [
    { icon: TrendingUp, title: "Sales Pipeline", description: "Track leads through every stage from first contact to closed job." },
    { icon: DollarSign, title: "Revenue Tracking", description: "See revenue by month, quarter, or year with trend analysis." },
    { icon: Target, title: "Close Rate Analytics", description: "Monitor conversion rates and identify improvement opportunities." },
    { icon: PieChart, title: "Job Profitability", description: "Analyze profit margins by job type, crew, or time period." },
    { icon: Users, title: "Team Performance", description: "Track individual and team metrics for sales and production." },
    { icon: Download, title: "Export Reports", description: "Download reports as PDF or CSV for accounting and planning." },
  ];

  const dashboardMetrics = [
    { label: "Revenue This Month", value: "$127,450", change: "+12%", positive: true },
    { label: "Jobs Completed", value: "14", change: "+3", positive: true },
    { label: "Close Rate", value: "68%", change: "+5%", positive: true },
    { label: "Avg Job Value", value: "$9,103", change: "+8%", positive: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-6">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Dashboard & <span className="text-primary">Reporting</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                See your entire business at a glance. Track revenue, close rates, job profitability, 
                and team performance in real-time dashboards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={activeContactForm === "demo"} onOpenChange={(open) => setActiveContactForm(open ? "demo" : null)}>
                  <DialogTrigger asChild>
                    <Button className="btn-ct1 text-lg px-8 py-4">
                      Book a Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ContactForm
                      title="Book a Reporting Demo"
                      description="See how CT1's dashboards can give you visibility into your business"
                      ctaText="Schedule Demo"
                      formType="reporting-demo"
                      onClose={() => setActiveContactForm(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Link to="/trial-signup">
                  <Button variant="outline" className="text-lg px-8 py-4">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="p-6 bg-card border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground">Business Dashboard</h3>
                <span className="text-sm text-muted-foreground">December 2024</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {dashboardMetrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <span className={`text-sm ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Data-Driven <span className="text-primary">Decisions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Stop guessing. Know exactly how your business is performing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reports Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Reports That <span className="text-primary">Matter</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Pre-built reports for every aspect of your contracting business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, title: "P&L Statement", description: "Revenue, expenses, and profit" },
              { icon: TrendingUp, title: "Sales Report", description: "Pipeline and conversion metrics" },
              { icon: BarChart3, title: "Job Profitability", description: "Margin analysis by job" },
              { icon: Users, title: "Team Performance", description: "Individual and team metrics" },
              { icon: Calendar, title: "Monthly Summary", description: "All key metrics in one view" },
              { icon: Target, title: "Win/Loss Analysis", description: "Why you won or lost jobs" },
              { icon: PieChart, title: "Expense Breakdown", description: "Spending by category" },
              { icon: FileText, title: "Tax Reports", description: "Quarterly tax summaries" },
            ].map((report, index) => (
              <Card key={index} className="p-4 hover:shadow-lg transition-all">
                <report.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold text-foreground mb-1">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Know Your Numbers, <span className="text-primary">Grow Your Business</span>
              </h2>
              <ul className="space-y-4">
                {[
                  "See real-time revenue and profit without spreadsheets",
                  "Identify your most profitable job types",
                  "Track which lead sources produce the best ROI",
                  "Monitor team performance and productivity",
                  "Make data-backed decisions on pricing and capacity",
                  "Export reports for accountants and lenders",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <BarChart3 className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">Real-Time</p>
                <p className="text-sm text-muted-foreground">Data Updates</p>
              </Card>
              <Card className="p-6 text-center">
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">20+</p>
                <p className="text-sm text-muted-foreground">Report Types</p>
              </Card>
              <Card className="p-6 text-center">
                <Download className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">1-Click</p>
                <p className="text-sm text-muted-foreground">PDF/CSV Export</p>
              </Card>
              <Card className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">+22%</p>
                <p className="text-sm text-muted-foreground">Avg Profit Increase</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to See Your Business Clearly?
          </h2>
          <p className="text-xl text-background/80 mb-8">
            Join contractors who've increased profits by 22% with data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={activeContactForm === "cta-demo"} onOpenChange={(open) => setActiveContactForm(open ? "cta-demo" : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4">
                  <Phone className="mr-2 h-5 w-5" />
                  Book a Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Book a Reporting Demo"
                  description="See how CT1's dashboards can transform your business visibility"
                  ctaText="Schedule Demo"
                  formType="reporting-demo"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
            <Link to="/trial-signup">
              <Button variant="outline" className="border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
