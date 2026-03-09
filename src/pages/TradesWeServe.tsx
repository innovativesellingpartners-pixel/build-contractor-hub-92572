import { Link } from 'react-router-dom';
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { SEOHead } from '@/components/SEOHead';
import { SeoBreadcrumb } from '@/components/SeoBreadcrumb';
import { ArrowRight, Wrench, Zap, Droplet, Wind, Hammer, Paintbrush, Home, Fence } from 'lucide-react';
import heroBg from '@/assets/hero-construction-aerial.jpg';
import trades from '@/data/tradeCrmPages';
import cities from '@/data/seoCities';

export const TradesWeServe = () => {
  const featuredTrades = [
    { icon: Wrench, title: 'General Contracting', slug: 'general-contractors', description: 'Full-service contractors managing residential and commercial projects from start to finish.' },
    { icon: Zap, title: 'Electrical', slug: 'electricians', description: 'Licensed electricians providing installation, repair, and maintenance services.' },
    { icon: Droplet, title: 'Plumbing', slug: 'plumbers', description: 'Professional plumbers handling residential and commercial plumbing systems.' },
    { icon: Wind, title: 'HVAC', slug: 'hvac-contractors', description: 'Heating, ventilation, and air conditioning specialists keeping homes comfortable year-round.' },
    { icon: Hammer, title: 'Roofing', slug: 'roofing-contractors', description: 'Expert roofers providing installation, repair, and maintenance for all roofing systems.' },
    { icon: Paintbrush, title: 'Painting', slug: 'painting-contractors', description: 'Professional painters delivering quality interior and exterior painting services.' },
    { icon: Home, title: 'Remodeling', slug: 'remodeling-contractors', description: 'Home remodeling specialists transforming kitchens, bathrooms, and entire homes.' },
    { icon: Fence, title: 'Landscaping', slug: 'landscaping-contractors', description: 'Outdoor specialists creating beautiful landscapes and installing quality fencing.' },
  ];

  const topCities = cities.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contractor Software by Trade — Tools for Every Home Service Business | myCT1"
        description="Whether you are a roofer, plumber, electrician, or HVAC tech — myCT1 has trade-specific CRM, estimating, and job management built for how you work. Find your trade."
        canonical="/trades-we-serve"
        keywords="contractor software by trade, roofing CRM, plumbing software, HVAC contractor software, electrician CRM, painting contractor tools"
      />
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">The Trades We Serve</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            The myCT1 Business-in-a-Box platform is built for contractors across all major trades. Manage leads, estimates, jobs, invoices, and payments from one system — no matter your trade.
          </p>
          <Link to="/pricing">
            <Button size="lg">Get Started Today</Button>
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Trades We Serve", href: "/trades-we-serve" }]} />
      </div>

      {/* Featured Trades Grid — with CRM links */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">CRM Software by Trade</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Click your trade to explore how myCT1 helps you manage leads, estimates, jobs, and payments specific to your work.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTrades.map((trade) => (
              <Link key={trade.slug} to={`/crm-for-${trade.slug}`} className="group">
                <Card className="border-2 hover:border-primary transition-colors h-full">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <trade.icon className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{trade.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{trade.description}</p>
                    <span className="text-sm text-primary font-medium group-hover:underline">
                      View {trade.title} CRM <ArrowRight className="inline h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* All trades directory link */}
          <div className="mt-8 text-center">
            <Link to="/trades" className="text-primary hover:text-primary/80 font-medium">
              Browse all 30+ contractor trade pages →
            </Link>
          </div>
        </div>
      </section>

      {/* Full Trade Directory */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-6">All Supported Trades</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {trades.map((t) => (
              <Link
                key={t.slug}
                to={`/crm-for-${t.slug}`}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all text-center"
              >
                <span className="text-sm font-medium text-foreground">{t.trade}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* City+Trade Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Find Contractor CRM by City</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            myCT1 serves contractors across the country. Find resources specific to your city and trade below.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { trade: 'plumbers', city: 'dallas', label: 'Plumber CRM in Dallas' },
              { trade: 'electricians', city: 'chicago', label: 'Electrician CRM in Chicago' },
              { trade: 'hvac-contractors', city: 'phoenix', label: 'HVAC CRM in Phoenix' },
              { trade: 'roofing-contractors', city: 'houston', label: 'Roofing CRM in Houston' },
              { trade: 'general-contractors', city: 'los-angeles', label: 'GC CRM in Los Angeles' },
              { trade: 'painting-contractors', city: 'nashville', label: 'Painting CRM in Nashville' },
              { trade: 'plumbers', city: 'miami', label: 'Plumber CRM in Miami' },
              { trade: 'electricians', city: 'atlanta', label: 'Electrician CRM in Atlanta' },
            ].map((item) => (
              <Link
                key={`${item.trade}-${item.city}`}
                to={`/crm-for-${item.trade}-in-${item.city}`}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all text-center"
              >
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
          <Link to="/cities" className="text-primary hover:text-primary/80 font-medium text-sm">
            Browse all cities →
          </Link>
        </div>
      </section>

      {/* Why CT1 Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Why myCT1 Works for All Trades</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              {[
                { label: "Business-in-a-Box System", desc: "CRM, estimating, job scheduling, invoicing, payments, and Forge AI automation — all in one platform built for contractors." },
                { label: "Trade-Specific Lead Routing", desc: "We match leads to your specific trade and service area, ensuring you only get opportunities that fit your business." },
                { label: "Flexible Tools", desc: "The myCT1 CRM, Forge AI, and management tools adapt to your trade's unique workflow and terminology." },
                { label: "Cross-Trade Community", desc: "Learn from contractors in other trades and discover opportunities for collaboration and referrals." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-4">
                  <div className="text-primary font-bold">•</div>
                  <p><strong>{label}:</strong> {desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Your Trade. Your Success. Our Platform.</h2>
          <p className="text-xl text-muted-foreground mb-8">
            No matter what trade you're in, myCT1 has the tools and training to help you build a better business.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-10">
            <Link to="/trial-signup">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
          {/* Directory links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/trades" className="text-primary hover:underline">Trade Directory</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/cities" className="text-primary hover:underline">City Directory</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/features" className="text-primary hover:underline">Platform Features</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/blog" className="text-primary hover:underline">Contractor Blog</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/contractor-business-resources" className="text-primary hover:underline">Business Resources</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
