import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Users, TrendingUp, DollarSign, Calendar, Briefcase, GraduationCap, Settings, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-primary/30" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Scale Your
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Construction Business
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto font-medium">
            Back-office solutions, training, and marketplace access designed specifically for contractors who want to grow beyond the job site.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg"
              asChild
            >
              <Link to="/subscribe">
                Get Started Today <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-foreground">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Learn & Train Section */}
      <section className="py-20 section-contractor">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground border-construction pl-4">
              Learn & <span className="accent-orange">Train</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Master the business side of construction with our comprehensive training programs designed by industry experts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-industrial">
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-construction-orange mb-4" />
                <CardTitle className="text-xl">Business Fundamentals</CardTitle>
                <CardDescription>
                  Essential skills every contractor needs to run a profitable business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Financial Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Project Bidding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Client Relations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-construction-orange mb-4" />
                <CardTitle className="text-xl">Growth Strategies</CardTitle>
                <CardDescription>
                  Proven methods to scale your operations and increase revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Team Building</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Market Expansion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Operational Efficiency</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <Settings className="h-12 w-12 text-construction-orange mb-4" />
                <CardTitle className="text-xl">Tech Integration</CardTitle>
                <CardDescription>
                  Modern tools and systems to streamline your business operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Digital Project Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Customer Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Automated Invoicing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Back-Office Support Section */}
      <section className="py-20 section-steel text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white border-construction pl-4">
              Back-Office <span className="accent-orange">Support</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Focus on what you do best while our team handles the administrative work that keeps your business running smoothly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-industrial">
              <CardHeader>
                <Users className="h-12 w-12 text-construction-orange mb-4" />
                <CardTitle className="text-xl">Administrative Support</CardTitle>
                <CardDescription>
                  Dedicated admins to handle paperwork, scheduling, and coordination
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Sales Representatives</CardTitle>
                <CardDescription>
                  Professional sales team to follow up on leads and close deals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <Briefcase className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Project Managers</CardTitle>
                <CardDescription>
                  Experienced PMs to oversee timelines, budgets, and deliverables
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Scheduling</CardTitle>
                <CardDescription>
                  Efficient coordination of crews, materials, and client meetings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Financial Management</CardTitle>
                <CardDescription>
                  Bookkeeping, invoicing, and financial reporting services
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-industrial">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Quality Assurance</CardTitle>
                <CardDescription>
                  Systematic quality checks and customer satisfaction monitoring
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Marketplace Preview Section */}
      <section className="py-20 section-contractor">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground border-construction pl-4">
              Contractor <span className="accent-orange">Marketplace</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to run and grow your business in one place. From legal setup to marketing tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <ShoppingCart className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">LLC Formation</h3>
              <p className="text-sm text-muted-foreground">Legal business setup and compliance support</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <CheckCircle className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Insurance</h3>
              <p className="text-sm text-muted-foreground">Liability, workers comp, and equipment coverage</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <Settings className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Websites</h3>
              <p className="text-sm text-muted-foreground">Professional contractor websites that convert</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Marketing</h3>
              <p className="text-sm text-muted-foreground">Lead generation and digital marketing tools</p>
            </div>

            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">CRM Systems</h3>
              <p className="text-sm text-muted-foreground">Customer relationship management tools</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <DollarSign className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Invoicing</h3>
              <p className="text-sm text-muted-foreground">Professional billing and payment processing</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <Briefcase className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Project Tools</h3>
              <p className="text-sm text-muted-foreground">Estimating, scheduling, and project management</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-lg border border-border shadow-industrial">
              <Calendar className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Equipment</h3>
              <p className="text-sm text-muted-foreground">Tools, machinery, and equipment sourcing</p>
            </div>
          </div>

          <div className="text-center">
            <Button variant="contractor" size="lg" asChild>
              <Link to="/subscribe">
                Unlock Full Marketplace Access <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-industrial">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Scale Your Business?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join hundreds of contractors who have transformed their operations with our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/subscribe">
                Start Your Subscription <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-foreground">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}