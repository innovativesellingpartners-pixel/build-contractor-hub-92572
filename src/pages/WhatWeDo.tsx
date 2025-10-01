import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Users, TrendingUp, Award, Phone, Bot } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-bordered.png';

export const WhatWeDo = () => {
  const services = [
    {
      icon: Award,
      title: 'CT1 5-Star Training',
      description: 'Comprehensive business and sales training designed specifically for contractors to build a professional, profitable operation.'
    },
    {
      icon: Users,
      title: 'Customer & Jobs Management',
      description: 'Complete CRM system to manage your customers, track jobs, and streamline your operations all in one place.'
    },
    {
      icon: TrendingUp,
      title: 'Qualified Lead Generation',
      description: 'Get warm, qualified leads delivered directly to you. Focus on closing jobs, not chasing prospects.'
    },
    {
      icon: Phone,
      title: 'AI Phone Assistant',
      description: 'Never miss a call again. Our AI assistant answers, screens, and qualifies leads 24/7.'
    },
    {
      icon: Bot,
      title: 'Complete AI Toolset',
      description: 'Pocket Bot, Sales Bot, Project Manager Bot, and Admin Bot to automate and optimize your business operations.'
    },
    {
      icon: Wrench,
      title: 'Vetted Vendor Marketplace',
      description: 'Access trusted technology vendors and service providers to support your business growth.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
              <Link to="/what-we-do" className="text-sm font-semibold text-primary">What We Do</Link>
              <Link to="/core-values" className="text-sm hover:text-primary transition-colors">Core Values</Link>
              <Link to="/trades-we-serve" className="text-sm hover:text-primary transition-colors">Trades We Serve</Link>
              <Link to="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link>
              <Link to="/blog-podcast" className="text-sm hover:text-primary transition-colors">Blog & Podcast</Link>
              <Link to="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">What We Do</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We provide contractors with the training, tools, and qualified leads needed to build a thriving business. 
            Everything you need in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <service.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Goal */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Our Goal for You</h2>
          <p className="text-2xl text-primary font-bold mb-4">$250,000 Cash on Hand After Expenses</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            We're not just about growth for growth's sake. We're focused on helping you build real wealth 
            and financial security through your contracting business.
          </p>
          <Link to="/pricing">
            <Button size="lg">See Our Plans</Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of contractors who are building better businesses with CT1.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Start Your Free Trial</Button>
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
