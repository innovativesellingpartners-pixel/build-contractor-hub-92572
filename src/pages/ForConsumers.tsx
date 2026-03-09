import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { Shield, CheckCircle, Star, Clock, Award, Users, ThumbsUp, MessageCircle } from 'lucide-react';
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import joeCipriano from '@/assets/joe-cipriano.png';

export default function ForConsumers() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Customer Portal for Contractors — Track Jobs & Pay Online | myCT1";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "The myCT1 customer portal lets homeowners view estimates, approve change orders, track job progress, and pay invoices online. Hire a CT1 contractor today.");
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/for-consumers";
  }, []);

  const benefits = [
    {
      icon: Shield,
      title: 'Vetted Professionals',
      description: 'Every CT1 contractor is thoroughly screened, trained, and committed to excellence in their craft.'
    },
    {
      icon: CheckCircle,
      title: 'We Do What We Say',
      description: 'Our contractors are bound by our core value: "Do what you say you are going to do, Always, Even if it hurts."'
    },
    {
      icon: Star,
      title: '5-Star Service Standards',
      description: 'All CT1 contractors complete our comprehensive 5-Star Training program to ensure exceptional service.'
    },
    {
      icon: Clock,
      title: 'On-Time, Every Time',
      description: 'Reliability is our promise. CT1 contractors respect your time and deliver projects as scheduled.'
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'We stand behind our work with quality guarantees that give you peace of mind.'
    },
    {
      icon: ThumbsUp,
      title: 'Fair & Transparent Pricing',
      description: 'No surprises. CT1 contractors provide clear, honest quotes and communicate openly throughout your project.'
    }
  ];

  const features = [
    {
      title: 'Advanced Technology',
      description: 'Our contractors use cutting-edge project management tools to keep you informed every step of the way.',
      icon: Users
    },
    {
      title: 'Better Communication',
      description: 'Stay connected with real-time updates, AI-powered customer service, and direct access to your contractor.',
      icon: MessageCircle
    },
    {
      title: 'Professional Training',
      description: 'Every CT1 contractor completes ongoing training in communication, leadership, and customer service excellence.',
      icon: Award
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
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
              <Link to="/what-we-do" className="text-sm hover:text-primary transition-colors">About Us</Link>
              <Link to="/core-values" className="text-sm hover:text-primary transition-colors">Core Values</Link>
              <Link to="/trades-we-serve" className="text-sm hover:text-primary transition-colors">Trades We Serve</Link>
              <Link to="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link>
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
                <Badge className="mb-4 text-lg px-4 py-2">
                  <Shield className="h-5 w-5 mr-2" />
                  For Consumers
                </Badge>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  "Do what you say you are going to do, Always, Even if it hurts."
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  — Joe Cipriano, Founder of CT1
                </p>
                <p className="text-lg text-muted-foreground">
                  This isn't just a quote—it's the foundation of every CT1 contractor's commitment to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why CT1 Contractors Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose a <span className="text-primary">CT1 Contractor?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              When you hire a CT1 contractor, you're not just getting someone to do a job. 
              You're partnering with a professional who's committed to excellence, reliability, and your complete satisfaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <benefit.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Better Service Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Better Service, <span className="text-primary">Better Results</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              CT1 contractors use advanced technology and professional training to deliver 
              a superior customer experience from start to finish.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <feature.icon className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Star Training Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-10 w-10 text-yellow-500 fill-yellow-500 mx-1" />
                  ))}
                </div>
                <h2 className="text-4xl font-bold mb-6">5-Star Training Certified</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Every CT1 contractor completes our comprehensive 5-Star Training program covering:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Effective Communication</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Leadership Excellence</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Performance Optimization</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Scalable Systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Super-Effective Selling</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">Customer Service Excellence</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground italic">
                  This training ensures you receive professional, reliable service every single time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reliability Promise */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">Our Reliability Promise</h2>
            <div className="bg-card border-2 border-primary/20 rounded-lg p-8 mb-8">
              <p className="text-2xl font-bold text-primary mb-4">
                "We do what we say we're going to do."
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                When you work with a CT1 contractor, you can count on clear communication, 
                honest pricing, reliable scheduling, and quality workmanship. We don't just promise 
                great service—we deliver it, backed by our founder's personal commitment and our 
                comprehensive training program.
              </p>
            </div>
            <p className="text-xl text-muted-foreground">
              That's the CT1 difference. That's the reliability you deserve.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Work with a <span className="text-primary">Trusted Professional?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find a CT1-certified contractor in your area who's committed to delivering 
            exceptional service and results you can count on.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="text-lg px-8">
                Find a Contractor Near You
              </Button>
            </Link>
            <Link to="/what-we-do">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More About CT1
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
