import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Target, Users, Bot, Calendar, Phone, TrendingUp } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";
import ct1LogoColor from "@/assets/ct1-logo-color.png";
import { MobileNav } from "@/components/MobileNav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Bot as BotIcon, Mic, Rocket } from "lucide-react";

export default function TierMarket() {
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
      <section className="py-20 bg-gradient-to-br from-amber-500/5 via-background to-amber-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-amber-500/20 text-amber-600 border-amber-500/30 px-4 py-1">Coming Soon</Badge>
          <div className="flex justify-center mb-6">
            <img src={ct1Logo} alt="CT1 Logo" className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-full mb-4">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Tier 3</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            myCT1 Market Dominator
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Premium lead generation and weekly coaching for contractors ready to dominate their market. The ultimate growth package.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-3xl font-bold text-muted-foreground">Pricing TBD</span>
          </div>
          <Button size="lg" variant="outline" disabled className="px-12 py-6 text-lg">
            Coming Soon
          </Button>
        </div>
      </section>

      {/* What's Included Banner */}
      <section className="py-8 bg-amber-500/5 border-y border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-foreground">
            <span className="font-bold">Everything in Growth Business Builder, plus:</span> Premium lead generation, weekly coaching, and enhanced AI capabilities.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What's Coming in Market Dominator</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-2 border-muted">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-muted text-muted-foreground">Included from Growth</Badge>
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">All Growth Features</h3>
                <p className="text-muted-foreground">
                  Everything from Launch and Growth tiers including AI Phone Assistant, 5 leads/month, complete AI toolset, and bi-monthly coaching.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-amber-500/30">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-amber-500/20 text-amber-600">New in Market</Badge>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Premium Lead Generation</h3>
                <p className="text-muted-foreground mb-4">
                  High-intent or closed job leads delivered weekly. Our 80/20 revenue split means you only pay when you close deals.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Weekly lead delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">High-intent homeowners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">80/20 revenue split model</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-amber-500/30">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-amber-500/20 text-amber-600">New in Market</Badge>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Weekly One-on-One Coaching</h3>
                <p className="text-muted-foreground mb-4">
                  Intensive weekly growth and leadership coaching sessions to help you scale rapidly and build a dominant business.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Weekly accountability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Leadership development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Rapid growth strategies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-amber-500/30">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-amber-500/20 text-amber-600">New in Market</Badge>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Full AI Toolset</h3>
                <p className="text-muted-foreground mb-4">
                  Complete access to Project Manager Bot, Sales Bot, and Admin Bot working in harmony to run your business.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Automated project management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">AI-powered sales assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Administrative automation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-amber-500/30">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-amber-500/20 text-amber-600">New in Market</Badge>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enhanced AI Phone Assistant</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced AI phone capabilities with lead qualification, appointment scheduling, and seamless CRM integration.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Advanced lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Automated scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Real-time CRM sync</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-amber-500/30">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-amber-500/20 text-amber-600">New in Market</Badge>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Market Dominance Strategy</h3>
                <p className="text-muted-foreground mb-4">
                  Exclusive strategies and tools designed to help you become the dominant contractor in your local market.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Competitive analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Market positioning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                    <span className="text-sm">Brand building support</span>
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
            Want to Be Notified When Market Dominator Launches?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get started with Growth today and be first in line when our premium tier becomes available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products/tier-growth">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8">
                Start with Growth - $250/month
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
