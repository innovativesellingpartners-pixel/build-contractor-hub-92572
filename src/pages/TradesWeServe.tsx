import { Link } from 'react-router-dom';
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { SEOHead } from '@/components/SEOHead';
import { Wrench, Zap, Droplet, Wind, Hammer, Paintbrush, Home, Fence } from 'lucide-react';
import heroBg from '@/assets/hero-construction-aerial.jpg';

export const TradesWeServe = () => {
  const trades = [
    {
      icon: Wrench,
      title: 'General Contracting',
      description: 'Full-service contractors managing residential and commercial projects from start to finish.'
    },
    {
      icon: Zap,
      title: 'Electrical',
      description: 'Licensed electricians providing installation, repair, and maintenance services.'
    },
    {
      icon: Droplet,
      title: 'Plumbing',
      description: 'Professional plumbers handling residential and commercial plumbing systems.'
    },
    {
      icon: Wind,
      title: 'HVAC',
      description: 'Heating, ventilation, and air conditioning specialists keeping homes comfortable year-round.'
    },
    {
      icon: Hammer,
      title: 'Roofing',
      description: 'Expert roofers providing installation, repair, and maintenance for all roofing systems.'
    },
    {
      icon: Paintbrush,
      title: 'Painting',
      description: 'Professional painters delivering quality interior and exterior painting services.'
    },
    {
      icon: Home,
      title: 'Remodeling',
      description: 'Home remodeling specialists transforming kitchens, bathrooms, and entire homes.'
    },
    {
      icon: Fence,
      title: 'Landscaping & Fencing',
      description: 'Outdoor specialists creating beautiful landscapes and installing quality fencing.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Trades We Serve - Software for Roofers, Plumbers, HVAC, Electricians & More"
        description="myCT1 contractor software serves all major trades nationwide: roofing, plumbing, HVAC, electrical, painting, remodeling, landscaping & general contracting. Get industry-specific tools."
        canonical="/trades-we-serve"
        keywords="roofing contractor software, plumbing software, HVAC contractor management, electrical contractor CRM, painting contractor software, remodeling contractor tools, landscaping business software, general contractor management"
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
            CT1 is built for contractors across all major trades. Whether you're just starting out or ready to dominate your market, 
            we have the tools, training, and leads to help you succeed.
          </p>
          <Link to="/pricing">
            <Button size="lg">Get Started Today</Button>
          </Link>
        </div>
      </section>

      {/* Trades Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trades.map((trade, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors group">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <trade.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{trade.title}</h3>
                  <p className="text-sm text-muted-foreground">{trade.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why CT1 Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Why CT1 Works for All Trades</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <div className="flex gap-4">
                <div className="text-primary font-bold">•</div>
                <p><strong>Universal Business Principles:</strong> Our training covers business fundamentals that apply to any trade—sales, operations, customer service, and financial management.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-primary font-bold">•</div>
                <p><strong>Trade-Specific Lead Routing:</strong> We match leads to your specific trade and service area, ensuring you only get opportunities that fit your business.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-primary font-bold">•</div>
                <p><strong>Flexible Tools:</strong> Our CRM, AI assistants, and management tools adapt to your trade's unique workflow and terminology.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-primary font-bold">•</div>
                <p><strong>Cross-Trade Community:</strong> Learn from contractors in other trades and discover opportunities for collaboration and referrals.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Your Trade. Your Success. Our Platform.</h2>
          <p className="text-xl text-muted-foreground mb-8">
            No matter what trade you're in, CT1 has the tools and training to help you build a better business.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
