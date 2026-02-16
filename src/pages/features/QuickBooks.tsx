import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { 
  DollarSign,
  FileText,
  PieChart,
  TrendingUp,
  Calculator,
  CreditCard,
  Users,
  Target,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Wallet
} from "lucide-react";

const QuickBooksLogo = () => (
  <div className="inline-flex px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500">
    <span className="text-white font-bold text-4xl tracking-tight">QuickBooks</span>
  </div>
);

export function QuickBooks() {
  const features = [
    {
      icon: FileText,
      title: "Automated Invoicing",
      description: "Create professional invoices in seconds and get paid faster with automatic payment reminders"
    },
    {
      icon: Calculator,
      title: "Expense Tracking",
      description: "Snap photos of receipts, categorize expenses automatically, and maximize tax deductions"
    },
    {
      icon: Users,
      title: "Payroll Management",
      description: "Pay your team on time with automated payroll processing, tax filing, and benefits administration"
    },
    {
      icon: PieChart,
      title: "Financial Reports",
      description: "Get real-time insights with profit & loss statements, cash flow reports, and custom dashboards"
    },
    {
      icon: CreditCard,
      title: "Tax Preparation",
      description: "Stay compliant and maximize deductions with organized records and quarterly tax estimates"
    },
    {
      icon: Target,
      title: "Project Profitability",
      description: "Track costs per job to identify your most profitable projects and price future work accurately"
    }
  ];

  const benefits = [
    "Save 15+ hours per month on bookkeeping",
    "Get paid 2x faster with online payments",
    "Reduce tax preparation costs by 50%",
    "Improve cash flow visibility",
    "Eliminate manual data entry errors",
    "Make data-driven business decisions"
  ];

  const mindsetTopics = [
    {
      icon: TrendingUp,
      title: "Understand Your Numbers",
      description: "Learn to read financial reports and use data to guide business growth decisions"
    },
    {
      icon: Wallet,
      title: "Cash Flow Management",
      description: "Master the art of maintaining healthy cash flow and avoiding financial shortfalls"
    },
    {
      icon: Target,
      title: "Profitability Analysis",
      description: "Identify which services make money and which ones drain resources"
    },
    {
      icon: BarChart3,
      title: "Strategic Planning",
      description: "Use financial data to set realistic goals and create actionable growth plans"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/business-suite" className="text-foreground hover:text-primary transition-colors font-medium">Back to Suite</Link>
              <Link 
                to="/pricing" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Get Started
              </Link>
            </nav>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-green-500/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <QuickBooksLogo />
                <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              QuickBooks Online
              <span className="block text-primary mt-2">Financial Excellence</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Master your finances with seamless QuickBooks integration and develop the business mindset to thrive
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Complete Financial <span className="text-primary">Management Suite</span>
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need to manage your money like a pro</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 group-hover:scale-110 transition-transform">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits */}
          <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-background">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                Transform Your Financial Management
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Business & Financial Mindset Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Develop a <span className="text-primary">Business Financial Mindset</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Understanding your finances is just the start—we help you think like a successful business owner
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {mindsetTopics.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <Card key={idx} className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-primary/10">
                        <Icon className="h-10 w-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3">{topic.title}</h3>
                        <p className="text-muted-foreground">{topic.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-12">
              <div className="text-center">
                <DollarSign className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-6">Built for Contractors, By Contractors</h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                  We understand the unique financial challenges of running a contracting business. That's why our QuickBooks 
                  integration comes with expert guidance on managing job costs, handling seasonal cash flow, pricing services 
                  profitably, and building long-term financial stability. We don't just give you software—we help you become 
                  a smarter business owner.
                </p>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">Job Costing</div>
                    <p className="text-sm text-muted-foreground">Track every expense per project</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">Tax Ready</div>
                    <p className="text-sm text-muted-foreground">Organized records for tax time</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">Growth Planning</div>
                    <p className="text-sm text-muted-foreground">Data-driven expansion decisions</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">Profit First</div>
                    <p className="text-sm text-muted-foreground">Ensure every job is profitable</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="mb-6">
              <QuickBooksLogo />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Seamless Integration with <span className="text-primary">CT1 Platform</span>
            </h2>
            <p className="text-xl text-muted-foreground">Your financial data flows automatically between systems</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Auto-Sync Invoices</h3>
                <p className="text-muted-foreground">Invoices created in CT1 CRM automatically sync to QuickBooks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Payment Tracking</h3>
                <p className="text-muted-foreground">Payments recorded in one system update everywhere instantly</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Unified Reporting</h3>
                <p className="text-muted-foreground">View job profitability with data from both CT1 and QuickBooks</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-500/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <QuickBooksLogo />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Take Control of <span className="text-primary">Your Finances</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start managing your money like a pro with QuickBooks Online integration and expert financial guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 font-bold">
                Get Started Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/business-suite">
              <Button size="lg" variant="outline" className="text-xl px-12 py-6 font-bold">
                Back to Suite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
      <PublicFooter />
    </div>
  );
}
