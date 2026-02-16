import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { GraduationCap, Target, BarChart3, ShoppingBag, ArrowRight, Users, Briefcase, Calculator, FileText, DollarSign } from 'lucide-react';
import heroImage from '@/assets/hero-construction.jpg';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

export const WhatWeDo = () => {
  const inclusions = [
    {
      icon: GraduationCap,
      title: 'Expert Training',
      description: 'Step by step training from industry experts who have been in your boots.'
    },
    {
      icon: Users,
      title: 'Full CRM',
      description: 'Complete customer relationship management to track every interaction from first call to repeat business.'
    },
    {
      icon: Briefcase,
      title: 'Jobs Management',
      description: 'Schedule crews, assign tasks, and track progress from first visit to job completion.'
    },
    {
      icon: Calculator,
      title: 'Estimates & Invoices',
      description: 'Build professional estimates, send invoices, and get paid faster with digital approvals and payments.'
    },
    {
      icon: DollarSign,
      title: 'Financial Reporting',
      description: 'Real time visibility into revenue, expenses, margins, and profitability across every job.'
    },
    {
      icon: Target,
      title: 'Qualified Leads',
      description: 'Warm, qualified leads delivered directly to your dashboard.'
    },
    {
      icon: BarChart3,
      title: 'Real Time Insights',
      description: "Real time insights into what's driving profit and what's costing you money."
    },
    {
      icon: ShoppingBag,
      title: 'Technology Marketplace',
      description: 'Partnered with 400+ technology providers to ensure our contractors have the right communication, visibility, and business tools they need to succeed.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section with contractor background */}
      <section
        className="relative py-16 sm:py-20 lg:py-24"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <img src={ct1Logo} alt="CT1" className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
            Your Complete Business Command Center
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 px-4">
            myCT1 is the all in one business platform built specifically for contractors who want peace of mind, time back in their day, and the ability to manage and scale their business effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Contractors Choose myCT1 */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Why Contractors Choose <span className="text-primary">myCT1</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Running a contracting business means juggling estimates, managing crews, tracking jobs, handling invoices, and somehow finding time to answer the phone. We built myCT1 to handle all of it in one place, giving you back hours every week. Our platform gives you the tools enterprise contractors use, at a price that makes sense for growing businesses.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From our AI Phone Assistant that never misses a call to our PocketBots that help you respond to clients instantly, we automate the busywork so you can focus on what matters: delivering great work and growing your bottom line. Communicate with clients, manage your team, and track every job, all without jumping between apps.
          </p>
        </div>
      </section>

      {/* More Than Software */}
      <section className="py-10 sm:py-14 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">More Than Software</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We are not just handing you a login and wishing you luck. Every myCT1 subscription includes:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
            {inclusions.map((item, index) => (
              <Card key={index} className="border hover:border-primary/50 transition-colors rounded-xl shadow-sm">
                <CardContent className="p-5">
                  <div className="bg-primary/10 p-2.5 rounded-lg w-fit mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* A Nationwide Network */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">A Nationwide Network</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            myCT1 serves contractors across all 50 states, from solo operators to growing teams. Whether you are closing your fifth job or your five hundredth, we give you access to enterprise level technology and a single platform to manage it all, helping you work smarter, win more, and build the business you have been working toward.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-14 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of contractors who are building better businesses with myCT1.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Schedule a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 CT1. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/legal/terms" className="hover:text-primary">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
