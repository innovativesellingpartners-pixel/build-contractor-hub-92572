import { useState, useEffect } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-estimating-software.jpg";
import screenshotBuilder from "@/assets/screenshots/estimating-builder.jpg";
import screenshotCustomerView from "@/assets/screenshots/estimating-customer-view.jpg";
import screenshotDashboard from "@/assets/screenshots/estimating-dashboard.jpg";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  ArrowRight,
  Calculator,
  FileText,
  Send,
  CreditCard,
  Clock,
  Pen,
  DollarSign,
  Eye,
  Layers,
} from "lucide-react";

export default function Estimating() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor Estimating Software — Professional Proposals & E-Signatures | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Contractor estimating software that builds professional proposals, collects e-signatures, and converts approved estimates into jobs. Try myCT1 free.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/features/estimating";
  }, []);

  const stats = [
    { number: "5 min", label: "Average Estimate Time" },
    { number: "100%", label: "Digital Delivery" },
    { number: "24 hr", label: "Avg Signature Time" },
    { number: "+28%", label: "Close Rate Increase" },
  ];

  const storyCards = [
    { icon: Layers, title: "Pro Templates", description: "Pre-built estimate templates for every trade" },
    { icon: Pen, title: "E-Signatures", description: "Collect legally binding signatures digitally" },
    { icon: Eye, title: "View Tracking", description: "Know when customers open your estimates" },
    { icon: CreditCard, title: "Online Payments", description: "Accept deposits directly from estimates" },
  ];

  const features = [
    { icon: Layers, title: "Professional Templates", description: "Pre-built estimate templates for every trade. Customize once, use forever." },
    { icon: Calculator, title: "Line Item Pricing", description: "Add materials, labor, and fees with automatic totals and tax calculations." },
    { icon: Send, title: "Digital Delivery", description: "Send estimates via email with one click. Customers view and sign online." },
    { icon: Pen, title: "E-Signatures", description: "Collect legally binding signatures digitally. No printing required." },
    { icon: CreditCard, title: "Online Payments", description: "Accept deposits and payments directly from the estimate with Stripe." },
    { icon: Eye, title: "View Tracking", description: "Know when customers open and view your estimates in real-time." },
    { icon: FileText, title: "Auto Conversion", description: "Convert signed estimates to jobs with one click for seamless workflow." },
    { icon: DollarSign, title: "Smart Calculations", description: "Automatically calculate tax, generate totals, and track margins." },
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
              <Calculator className="h-5 w-5 mr-2" />
              Estimating & Proposals
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Win More Jobs with <span className="text-primary">Better Estimates</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build professional estimates fast, send them digitally, and get paid faster. From line items to e-signatures, everything in one place.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">From Estimate to <span className="text-primary">Payment</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Create professional, detailed estimates in under 5 minutes—right from your phone on the job site. No more going back to the office to write up quotes.
                </p>
                <p>
                  Send estimates digitally with one click. Customers can view, sign, and pay their deposit online. You'll know the moment they open it, so you can follow up at the perfect time.
                </p>
                <p>
                  Contractors using CT1 estimating have increased their close rate by 28% with professional presentation and faster turnaround times.
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
              Professional Estimates <span className="text-primary">Made Easy</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what building and sending estimates looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: screenshotBuilder, label: "Estimate Builder - Line items, templates, and automatic calculations" },
              { img: screenshotCustomerView, label: "Digital Delivery - Customer view with e-signature and payment" },
              { img: screenshotDashboard, label: "Estimate Dashboard - Track status, views, and conversions" },
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
              Professional Estimates, <span className="text-primary">Effortlessly</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, send, and track estimates that win more jobs.
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
            Ready to Create Better Estimates?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who've increased their close rate by 28% with professional estimates.
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
          <p className="mt-6 text-sm opacity-80">
            Learn more: <Link to="/contractor-estimating-software" className="underline hover:opacity-100">Contractor Estimating Software</Link> · <Link to="/contractor-crm-software" className="underline hover:opacity-100">CRM Software</Link> · <Link to="/forge-ai-invoice-assistant" className="underline hover:opacity-100">AI Invoice Assistant</Link>
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
