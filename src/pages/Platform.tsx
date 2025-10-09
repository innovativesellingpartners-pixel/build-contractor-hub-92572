import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  BarChart3, 
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

export default function Platform() {
  const features = [
    {
      icon: <Users className="h-10 w-10" />,
      title: "CRM & Lead Management",
      description: "Track every lead from inquiry to close. Never miss a follow-up. Convert more leads into paying customers.",
      benefits: ["Automated follow-ups", "Lead scoring", "Pipeline tracking"]
    },
    {
      icon: <FileText className="h-10 w-10" />,
      title: "Estimating & Job Costing",
      description: "Create accurate, professional proposals in minutes. Track costs in real-time. Win more jobs with competitive, profitable bids.",
      benefits: ["Template-based estimates", "Material cost tracking", "Profit margin analysis"]
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: "Scheduling & Dispatching",
      description: "Optimize crew schedules. Reduce downtime. Get the right people to the right job at the right time.",
      benefits: ["Drag-and-drop scheduling", "Crew availability tracking", "Mobile notifications"]
    },
    {
      icon: <Briefcase className="h-10 w-10" />,
      title: "Project & Field Management",
      description: "Real-time job updates from the field. Photo documentation. Task tracking. Change order management.",
      benefits: ["Mobile field app", "Photo & document capture", "Change order workflow"]
    },
    {
      icon: <DollarSign className="h-10 w-10" />,
      title: "Invoicing & Payments",
      description: "Send invoices instantly. Accept online payments. Automated payment reminders. Get paid 15 days faster.",
      benefits: ["Online payment processing", "Automated reminders", "Payment tracking"]
    },
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: "Reporting & Analytics",
      description: "See your business performance at a glance. Track profitability by job, crew, and time period. Make data-driven decisions.",
      benefits: ["Profitability dashboards", "Job cost analysis", "Cash flow forecasting"]
    },
    {
      icon: <FileCheck className="h-10 w-10" />,
      title: "Document & Compliance",
      description: "Store all contracts, permits, insurance documents, and certifications in one secure place. Never lose critical paperwork.",
      benefits: ["Cloud document storage", "Expiration tracking", "Quick access from anywhere"]
    }
  ];

  const impactStats = [
    { value: "$30K+", label: "Annual Cost Savings", icon: <DollarSign className="h-8 w-8" /> },
    { value: "300+", label: "Admin Hours Saved Yearly", icon: <Clock className="h-8 w-8" /> },
    { value: "15+", label: "Days Faster Cash Flow", icon: <TrendingUp className="h-8 w-8" /> },
    { value: "1-2", label: "Extra Jobs Won Per Year", icon: <CheckCircle2 className="h-8 w-8" /> }
  ];

  const comparison = [
    {
      category: "Cost",
      scattered: "Multiple subscriptions: $200-500/month",
      ct1: "One platform: Starting at $50/month",
      winner: true
    },
    {
      category: "Integration",
      scattered: "Manual data entry between tools",
      ct1: "Seamless data flow across modules",
      winner: true
    },
    {
      category: "Training",
      scattered: "Learn 5+ different systems",
      ct1: "One intuitive platform + free training",
      winner: true
    },
    {
      category: "Support",
      scattered: "Different support teams for each tool",
      ct1: "One dedicated support team",
      winner: true
    },
    {
      category: "Mobile Access",
      scattered: "Different apps for each function",
      ct1: "One mobile app for everything",
      winner: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <img src={ct1Logo} alt="CT1 Logo" className="h-10" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                <Zap className="h-4 w-4" />
                Industry Leading Platform
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Only Platform Contractors Need to{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Build and Scale Their Business
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              CT1 is an all-in-one business management suite built specifically for contractors. 
              Replace scattered tools with one connected system. Start. Grow. Sustain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" className="px-8">
                  See Pricing & Plans
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="px-8">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {impactStats.map((stat, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-3 text-primary">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop juggling multiple tools. CT1 connects every part of your business in one powerful system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              One Platform vs. Scattered Tools
            </h2>
            <p className="text-xl text-muted-foreground">
              See why contractors are switching to CT1
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-left font-semibold">Multiple Tools</th>
                    <th className="px-6 py-4 text-left font-semibold bg-primary/10">
                      <span className="flex items-center gap-2">
                        CT1 Platform
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparison.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{row.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.scattered}</td>
                      <td className="px-6 py-4 bg-primary/5">
                        <span className="flex items-center gap-2">
                          {row.ct1}
                          {row.winner && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Proven Results for Contractors Like You
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of contractors who have transformed their business with CT1
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-2">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-primary mb-2">$32K+</div>
                <div className="text-lg font-semibold mb-2">Average Annual Savings</div>
                <p className="text-sm text-muted-foreground">
                  Through time savings, reduced labor costs, faster payments, and fewer disputes
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-primary mb-2">300+</div>
                <div className="text-lg font-semibold mb-2">Hours Saved Per Year</div>
                <p className="text-sm text-muted-foreground">
                  Automated workflows eliminate manual tasks and paperwork
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-primary mb-2">15+</div>
                <div className="text-lg font-semibold mb-2">Days Faster Cash Flow</div>
                <p className="text-sm text-muted-foreground">
                  Digital invoicing and payment reminders accelerate collections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Testimonial */}
          <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-lg text-muted-foreground italic mb-4">
                "CT1 completely transformed how we run our business. We used to juggle 5 different tools and spend hours every week on admin work. Now everything is in one place, we're getting paid faster, and I actually have time to focus on growing the company. Best investment we've made."
              </div>
              <div className="font-semibold">— Mike Johnson</div>
              <div className="text-sm text-muted-foreground">Owner, Johnson Construction Services</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Run Your Contracting Business Smarter with CT1
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start saving time and money today. No long-term contracts. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="px-8">
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="px-8">
                    Talk to Our Team
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • Full platform access • Free training included
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
