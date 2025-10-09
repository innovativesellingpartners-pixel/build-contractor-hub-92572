import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Shield, Target, Users, Lightbulb, Trophy, Download } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-main.png';
import joeCipriano from '@/assets/joe-cipriano.png';

export const CoreValues = () => {
  const values = [
    {
      icon: Heart,
      title: 'Integrity First',
      description: 'We believe in honest work, fair pricing, and treating every customer and contractor with respect and dignity.'
    },
    {
      icon: Shield,
      title: 'Quality Over Quantity',
      description: 'We focus on delivering real value and qualified leads rather than overwhelming you with unqualified prospects.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'Our success is measured by your success. We are committed to helping you reach $250k cash on hand after expenses.'
    },
    {
      icon: Users,
      title: 'Community & Support',
      description: 'You are not alone. We build a community of contractors who support each other and grow together.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation & Growth',
      description: 'We continuously improve our tools, training, and services to keep you ahead of the competition.'
    },
    {
      icon: Trophy,
      title: 'Excellence in Everything',
      description: 'From our training programs to our AI tools, we strive for excellence in every aspect of what we do.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
              <Link to="/what-we-do" className="text-sm hover:text-primary transition-colors">What We Do</Link>
              <Link to="/core-values" className="text-sm font-semibold text-primary">Core Values</Link>
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

      {/* Hero Section with Founder Quote */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
              <div className="flex-shrink-0">
                <img 
                  src={joeCipriano} 
                  alt="Joe Cipriano, Founder of CT1" 
                  className="w-64 h-64 rounded-full object-cover shadow-2xl"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  "Do what you say you are going to do, Always, Even if it hurts."
                </h1>
                <p className="text-xl text-muted-foreground">
                  — Joe Cipriano, Founder of CT1
                </p>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                These principles guide everything we do at CT1. They shape how we serve contractors, 
                develop our tools, and build our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <value.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              To empower contractors across America with the training, tools, and leads they need to build 
              thriving, profitable businesses. We believe every hardworking contractor deserves the opportunity 
              to achieve financial freedom and build lasting wealth through their craft.
            </p>
            <div className="border-l-4 border-primary pl-6 text-left">
              <p className="text-lg italic text-muted-foreground">
                "We don't just teach you how to work harder—we teach you how to work smarter, grow faster, 
                and build a business that supports the life you want to live."
              </p>
              <p className="text-sm font-semibold mt-4">— The CT1 Team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Agreement Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">CT1 Service Agreement</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our service agreement outlines the commitment and standards we uphold for every contractor partner.
            </p>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Download Our Service Agreement</h3>
                <p className="text-muted-foreground mb-6">
                  Review our complete service agreement that details our commitments, your benefits, 
                  and the standards we maintain for all CT1 contractors.
                </p>
                <Link to="/legal/terms" target="_blank">
                  <Button size="lg" className="gap-2">
                    <Download className="h-5 w-5" />
                    View Service Agreement
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Join a Community Built on These Values</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Become part of a network of contractors who are committed to excellence and mutual success.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Contact Us</Button>
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
