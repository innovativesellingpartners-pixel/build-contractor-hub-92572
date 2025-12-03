import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import {
  ArrowRight,
  CheckCircle,
  Calculator,
  FileText,
  Send,
  CreditCard,
  Clock,
  Pen,
  DollarSign,
  Eye,
  Phone,
  Layers,
} from "lucide-react";

export default function Estimating() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const features = [
    { icon: Layers, title: "Professional Templates", description: "Pre-built estimate templates for every trade. Customize once, use forever." },
    { icon: Calculator, title: "Line Item Pricing", description: "Add materials, labor, and fees with automatic totals and tax calculations." },
    { icon: Send, title: "Digital Delivery", description: "Send estimates via email with one click. Customers view and sign online." },
    { icon: Pen, title: "E-Signatures", description: "Collect legally binding signatures digitally. No printing required." },
    { icon: CreditCard, title: "Online Payments", description: "Accept deposits and payments directly from the estimate with Stripe." },
    { icon: Eye, title: "View Tracking", description: "Know when customers open and view your estimates in real-time." },
  ];

  const benefits = [
    "Create professional estimates in under 5 minutes",
    "Send estimates directly from your phone on the job site",
    "Track which estimates are viewed, signed, and paid",
    "Automatically calculate tax and generate totals",
    "Convert signed estimates to jobs with one click",
    "Build estimate templates with reusable line items",
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
                <Calculator className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Estimating & <span className="text-primary">Proposals</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Build professional estimates fast, send them digitally, and get paid faster. 
                From line items to e-signatures, everything in one place.
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
                      title="Book an Estimating Demo"
                      description="See how CT1 can streamline your estimating process"
                      ctaText="Schedule Demo"
                      formType="estimating-demo"
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
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimate #EST-2024-0142</p>
                    <p className="text-xl font-bold text-foreground">Kitchen Remodel</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded-full text-sm">Signed</span>
                </div>
                <p className="text-sm text-muted-foreground">John & Mary Davis • 123 Oak Street</p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cabinets & Installation</span>
                  <span className="text-foreground">$12,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Countertops (Granite)</span>
                  <span className="text-foreground">$4,800</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor & Finishing</span>
                  <span className="text-foreground">$8,200</span>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">$25,500</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Deposit Required (30%)</span>
                  <span>$7,650</span>
                </div>
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
              Professional Estimates, <span className="text-primary">Effortlessly</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, send, and track estimates that win more jobs.
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

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From Estimate to <span className="text-primary">Payment</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A streamlined workflow that gets you paid faster.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, step: "1", title: "Create", description: "Build your estimate with templates and line items" },
              { icon: Send, step: "2", title: "Send", description: "Email the estimate directly to your customer" },
              { icon: Pen, step: "3", title: "Sign", description: "Customer reviews and signs digitally" },
              { icon: DollarSign, step: "4", title: "Get Paid", description: "Collect deposit via credit card or ACH" },
            ].map((item, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all relative">
                <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary-foreground">{item.step}</span>
                </div>
                <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
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
                Win More Jobs with <span className="text-primary">Better Estimates</span>
              </h2>
              <ul className="space-y-4">
                {benefits.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">5 min</p>
                <p className="text-sm text-muted-foreground">Average Estimate Time</p>
              </Card>
              <Card className="p-6 text-center">
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Digital Delivery</p>
              </Card>
              <Card className="p-6 text-center">
                <Pen className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">24 hr</p>
                <p className="text-sm text-muted-foreground">Avg Signature Time</p>
              </Card>
              <Card className="p-6 text-center">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">+28%</p>
                <p className="text-sm text-muted-foreground">Close Rate Increase</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Create Better Estimates?
          </h2>
          <p className="text-xl text-background/80 mb-8">
            Join contractors who've increased their close rate by 28% with professional estimates.
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
                  title="Book an Estimating Demo"
                  description="See how CT1 can help you create winning estimates"
                  ctaText="Schedule Demo"
                  formType="estimating-demo"
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
    </div>
  );
}
