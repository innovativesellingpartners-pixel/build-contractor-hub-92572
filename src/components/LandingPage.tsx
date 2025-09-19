import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Users, TrendingUp, DollarSign, Calendar, Briefcase, GraduationCap, Settings, ShoppingCart, Building, LogIn, UserCheck, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-concrete-gray">
      {/* Professional Header */}
      <header className="bg-white border-b border-construction shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-construction-orange" />
            <h1 className="text-2xl font-bold text-steel">ContractorScale</h1>
            <span className="text-xs bg-construction-orange/10 text-construction-orange px-2 py-1 rounded">Professional</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="#solutions" className="text-steel-light hover:text-construction-orange transition-colors font-medium">Solutions</Link>
            <Link to="#pricing" className="text-steel-light hover:text-construction-orange transition-colors font-medium">Pricing</Link>
            <Link to="#marketplace" className="text-steel-light hover:text-construction-orange transition-colors font-medium">Marketplace</Link>
            <Link to="/subscribe" className="flex items-center space-x-2 bg-construction-orange hover:bg-construction-orange/90 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md">
              <LogIn className="h-4 w-4" />
              <span>Contractor Portal</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-primary/30" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <UserCheck className="h-5 w-5 text-construction-orange mr-3" />
            <span className="text-white/90 font-medium">Trusted by 15,000+ contractors nationwide</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Professional Tools for
            <span className="block bg-gradient-to-r from-construction-orange to-primary bg-clip-text text-transparent">
              Smart Contractors
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto font-medium">
            Complete business management platform with CRM, project tracking, financial tools, and exclusive contractor marketplace access.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Shield className="h-8 w-8 text-construction-orange mb-3" />
              <h3 className="font-semibold text-white mb-2">Enterprise Security</h3>
              <p className="text-white/80 text-sm">Bank-grade encryption & SOC 2 compliance</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Clock className="h-8 w-8 text-construction-orange mb-3" />
              <h3 className="font-semibold text-white mb-2">24/7 Support</h3>
              <p className="text-white/80 text-sm">Dedicated success team & priority support</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <TrendingUp className="h-8 w-8 text-construction-orange mb-3" />
              <h3 className="font-semibold text-white mb-2">Proven Results</h3>
              <p className="text-white/80 text-sm">Average 40% revenue increase in 6 months</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg"
              asChild
            >
              <Link to="/subscribe">
                Access Portal Now <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-foreground">
              View Platform Demo
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