import { useState, useEffect } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-reporting-dashboard.jpg";
import screenshotRevenue from "@/assets/screenshots/reporting-revenue-dashboard.jpg";
import screenshotProfitability from "@/assets/screenshots/reporting-job-profitability.jpg";
import screenshotTeamPerf from "@/assets/screenshots/reporting-team-performance.jpg";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  ArrowRight,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Download,
  Target,
  Calendar,
  Eye,
} from "lucide-react";

export default function Reporting() {
  const stats = [
    { number: "Real-Time", label: "Data Updates" },
    { number: "20+", label: "Report Types" },
    { number: "1-Click", label: "PDF/CSV Export" },
    { number: "+22%", label: "Avg Profit Increase" },
  ];

  const storyCards = [
    { icon: TrendingUp, title: "Revenue Tracking", description: "See revenue by month, quarter, or year with trends" },
    { icon: Target, title: "Close Rate Analytics", description: "Monitor conversion rates and improvement areas" },
    { icon: PieChart, title: "Job Profitability", description: "Analyze profit margins by job type or crew" },
    { icon: Download, title: "Export Reports", description: "Download reports as PDF or CSV instantly" },
  ];

  const features = [
    { icon: TrendingUp, title: "Sales Pipeline", description: "Track leads through every stage from first contact to closed job." },
    { icon: DollarSign, title: "Revenue Tracking", description: "See revenue by month, quarter, or year with trend analysis." },
    { icon: Target, title: "Close Rate Analytics", description: "Monitor conversion rates and identify improvement opportunities." },
    { icon: PieChart, title: "Job Profitability", description: "Analyze profit margins by job type, crew, or time period." },
    { icon: Users, title: "Team Performance", description: "Track individual and team metrics for sales and production." },
    { icon: Download, title: "Export Reports", description: "Download reports as PDF or CSV for accounting and planning." },
    { icon: Calendar, title: "Monthly Summary", description: "All key metrics in one view for quick business health checks." },
    { icon: FileText, title: "Tax Reports", description: "Quarterly tax summaries with organized records for tax time." },
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
              <BarChart3 className="h-5 w-5 mr-2" />
              Dashboard & Reporting
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Know Your Numbers, <span className="text-primary">Grow Your Business</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See your entire business at a glance. Track revenue, close rates, job profitability, and team performance in real-time dashboards.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Data-Driven <span className="text-primary">Decisions</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Stop guessing and start knowing. CT1's reporting dashboard gives you real-time visibility into every aspect of your business—revenue, profitability, team performance, and more.
                </p>
                <p>
                  Identify your most profitable job types, track which lead sources produce the best ROI, and make data-backed decisions on pricing and capacity.
                </p>
                <p>
                  Contractors who use CT1's reporting tools see an average 22% increase in profits by identifying inefficiencies and doubling down on what works.
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
              <Eye className="h-5 w-5 mr-2" />
              See It In Action
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Reporting <span className="text-primary">Dashboard</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what real-time reporting looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: screenshotRevenue, label: "Revenue Dashboard - Monthly trends, pipeline value, and forecasts" },
              { img: screenshotProfitability, label: "Job Profitability - Margins by job type, crew, and time period" },
              { img: screenshotTeamPerf, label: "Team Performance - Individual and team metrics at a glance" },
            ].map((shot, index) => (
              <div key={index} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="aspect-video rounded-lg overflow-hidden mb-3">
                  <img src={shot.img} alt={shot.label} className="w-full h-full object-cover" />
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
              Reports That <span className="text-primary">Matter</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pre-built reports for every aspect of your contracting business.
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
            Ready to See Your Business Clearly?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who've increased profits by 22% with data-driven decisions.
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
