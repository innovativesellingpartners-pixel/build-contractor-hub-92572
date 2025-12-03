import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Star, ArrowLeft, Users, BookOpen, ShoppingBag, Bot, Calendar } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { MobileNav } from "@/components/MobileNav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Bot as BotIcon, Mic, Rocket, TrendingUp, Crown } from "lucide-react";

export default function TierLaunch() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/what-we-do" className="text-muted-foreground hover:text-foreground transition-colors">
                What We Do
              </Link>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground bg-transparent">
                      Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4 bg-popover">
                        <div className="space-y-2">
                          <Link to="/products/pocketbot" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <BotIcon className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">MyCT1 Pocketbot</div>
                              <p className="text-xs text-muted-foreground">Complete AI business assistant</p>
                            </div>
                          </Link>
                          <Link to="/products/voice-ai" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Mic className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">AI Voice Assistant</div>
                              <p className="text-xs text-muted-foreground">24/7 AI call handling</p>
                            </div>
                          </Link>
                          <div className="border-t border-border my-2" />
                          <Link to="/products/tier-launch" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Rocket className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Launch Growth Starter</div>
                              <p className="text-xs text-muted-foreground">Perfect for getting started</p>
                            </div>
                          </Link>
                          <Link to="/products/tier-growth" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Growth Business Builder</div>
                              <p className="text-xs text-muted-foreground">Scale your operations</p>
                            </div>
                          </Link>
                          <Link to="/products/tier-market" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Crown className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Market Dominator</div>
                              <p className="text-xs text-muted-foreground">Maximum growth potential</p>
                            </div>
                          </Link>
                          <div className="border-t border-border my-2" />
                          <Link to="/pricing" className="flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                            <span className="font-medium text-primary">View All Pricing</span>
                          </Link>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Link to="/trades-we-serve" className="text-muted-foreground hover:text-foreground transition-colors">
                Trades We Serve
              </Link>
              <Link to="/core-values" className="text-muted-foreground hover:text-foreground transition-colors">
                Core Values
              </Link>
              <Link to="/blog-podcast" className="text-muted-foreground hover:text-foreground transition-colors">
                Blog & Podcast
              </Link>
              <Link to="/contact">
                <Button variant="outline">Contact Sales</Button>
              </Link>
              <Link to="/auth">
                <Button>Contractor Login</Button>
              </Link>
            </nav>
            
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Star className="h-10 w-10 text-primary" />
            </div>
          </div>
          <p className="text-primary font-semibold mb-2">Tier 1</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            myCT1 Launch Growth Starter
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build your foundation with our comprehensive training and management system. Perfect for contractors ready to professionalize their operations.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-5xl font-bold text-foreground">$99.99</span>
            <span className="text-xl text-muted-foreground">/month</span>
          </div>
          <Link to="/auth">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg">
              Get Started with Launch
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything Included in Launch</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">CT1 5-Star Contractor Business & Sales Training</h3>
                <p className="text-muted-foreground mb-4">
                  Our comprehensive training program covers everything from sales techniques to business management, customer service excellence, and growth strategies.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Professional sales methodology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Customer communication mastery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Business operations best practices</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Full Customer & Jobs Management System</h3>
                <p className="text-muted-foreground mb-4">
                  Complete CRM solution to manage your leads, customers, estimates, jobs, and follow-ups all in one place.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Lead tracking and conversion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Professional estimate creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Job management and scheduling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">1 Personal Monthly Business Training Session</h3>
                <p className="text-muted-foreground mb-4">
                  One-on-one coaching session each month with an experienced business coach to address your specific challenges and goals.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Personalized business guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Goal setting and accountability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Strategy and problem-solving</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Marketplace Access to Vetted Tech Vendors</h3>
                <p className="text-muted-foreground mb-4">
                  Exclusive access to our curated marketplace of technology partners offering special pricing on tools and services for contractors.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Pre-negotiated discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Vetted, contractor-focused vendors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Easy integration support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">24/7 AI Business Assistant (Pocket Bot)</h3>
                <p className="text-muted-foreground mb-4">
                  Your personal AI assistant available around the clock to help with estimates, proposals, customer communication, and business questions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Instant business answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Estimate and proposal generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Professional communication drafting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Launch Your Growth?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start building your foundation today with our comprehensive training and management system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8">
                Get Started - $99.99/month
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8">
                Compare All Tiers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
