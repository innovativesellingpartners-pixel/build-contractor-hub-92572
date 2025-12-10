import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { ArrowLeft, Clock, DollarSign, TrendingUp, Zap, Package, Shield, Calculator } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

export default function Savings() {
  const savingsData = [
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Admin Labor Savings",
      amount: "$9,100",
      period: "per year",
      detail: "260 hours saved annually",
      description: "Automate scheduling, invoicing, and customer communications"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Estimating Efficiency",
      amount: "$5,000",
      period: "per year",
      detail: "+ $10K-$30K extra revenue",
      description: "Faster, more accurate estimates mean more won jobs"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Field Productivity",
      amount: "$8,200",
      period: "per year",
      detail: "234 hours saved annually",
      description: "Digital job tracking eliminates paperwork and callbacks"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Faster Payments",
      amount: "$2,500",
      period: "per year",
      detail: "15 days faster cash flow",
      description: "Digital invoicing and payment reminders speed up collections"
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Material Waste Reduction",
      amount: "$6,000",
      period: "per year",
      detail: "Better inventory tracking",
      description: "Accurate job costing prevents over-ordering and material waste"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Dispute & Risk Reduction",
      amount: "$1,500",
      period: "per year",
      detail: "Documentation protection",
      description: "Digital records and photo documentation prevent costly disputes"
    }
  ];

  const totalSavings = 32000;
  const totalHoursSaved = 300;
  const extraRevenue = "10K-30K";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Save $30K+ Every Year with CT1
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Small contractors using CT1's business management suite save an average of $32,000 annually while gaining 300+ hours back
            </p>
          </div>

          {/* Summary Card */}
          <Card className="mb-12 border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    ${totalSavings.toLocaleString()}
                  </div>
                  <div className="text-lg text-muted-foreground">Annual Savings</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    {totalHoursSaved}+
                  </div>
                  <div className="text-lg text-muted-foreground">Hours Saved</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    ${extraRevenue}
                  </div>
                  <div className="text-lg text-muted-foreground">Extra Revenue Potential</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Savings Breakdown */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-10">
              Where Your Savings Come From
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsData.map((item, index) => (
                <Card 
                  key={index}
                  className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/30"
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        {item.icon}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-primary mb-1">
                        {item.amount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.period}
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-2">
                        {item.detail}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="mb-12 bg-gradient-to-br from-muted/30 to-background">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold text-center mb-10">
                How CT1 Delivers These Savings
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold mb-3">The Problem</h3>
                  <p className="text-muted-foreground">
                    Manual processes, paperwork, missed follow-ups, and inefficient scheduling drain time and money
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-bold mb-3">The Savings</h3>
                  <p className="text-muted-foreground">
                    CT1 automates workflows, streamlines communication, and provides real-time insights
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-xl font-bold mb-3">The Benefit</h3>
                  <p className="text-muted-foreground">
                    More time for growth, better cash flow, happier customers, and a more profitable business
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-8 md:p-12 text-center">
              <Calculator className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Saving?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of contractors who are already saving time and money with CT1's proven business management system
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="px-8">
                    See Pricing & Plans
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="px-8">
                    Calculate Your Savings
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                * Savings based on average small contractor (2-10 employees) using CT1 for 12 months
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
