import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Building, Lock, ArrowLeft, UserCheck, Shield, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function Subscribe() {
  return (
    <div className="min-h-screen bg-concrete-gray">
      {/* Professional Header */}
      <header className="bg-white border-b border-construction shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-construction-orange" />
            <h1 className="text-2xl font-bold text-steel">ContractorScale</h1>
            <span className="text-xs bg-construction-orange/10 text-construction-orange px-2 py-1 rounded">Portal</span>
          </Link>
          <div className="flex items-center space-x-2 text-sm text-steel-light">
            <Lock className="h-4 w-4" />
            <span>Secure Contractor Platform</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12 pt-8">
          <div className="mb-6 inline-flex items-center bg-construction-orange/10 rounded-full px-6 py-3 border border-construction-orange/20">
            <UserCheck className="h-5 w-5 text-construction-orange mr-2" />
            <span className="text-steel font-medium">Professional Contractor Management Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-steel">
            Access Your Business
            <span className="block bg-gradient-to-r from-construction-orange to-steel bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-xl text-steel-light max-w-3xl mx-auto">
            Join thousands of contractors using our enterprise platform to scale their operations and increase profitability.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Login Section */}
          <Card className="lg:col-span-1 bg-white border-construction shadow-lg">
            <CardHeader className="text-center pb-6 border-b border-gray-100">
              <CardTitle className="text-2xl mb-2 text-steel flex items-center justify-center">
                <Lock className="h-5 w-5 mr-2 text-construction-orange" />
                Member Portal
              </CardTitle>
              <CardDescription className="text-steel-light">Access your contractor dashboard</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-steel font-medium">Business Email</Label>
                  <Input id="email" type="email" placeholder="your@company.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-steel font-medium">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" className="mt-1" />
                </div>
                <Button className="w-full bg-construction-orange hover:bg-construction-orange/90 text-white font-semibold py-3">
                  Sign In to Dashboard
                </Button>
                <div className="text-center space-y-2">
                  <a href="#" className="text-sm text-construction-orange hover:underline block">Forgot your password?</a>
                  <div className="text-xs text-steel-light">
                    Need help? Call <span className="font-medium">(555) 123-4567</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Section */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {/* Professional Plan */}
            <Card className="card-industrial relative bg-white border-construction shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl mb-2 text-steel">Professional</CardTitle>
                <CardDescription className="text-lg text-steel-light">Complete contractor toolkit</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-steel">$199</span>
                  <span className="text-steel-light ml-2">/month</span>
                </div>
                <div className="text-xs text-construction-orange font-medium mt-2">Most Popular Choice</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Advanced CRM & Lead Management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Project Tracking & Scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Financial Management Suite</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Training Library Access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Marketplace Integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Priority Support</span>
                  </li>
                </ul>
                <Button className="w-full bg-construction-orange hover:bg-construction-orange/90 text-white font-semibold py-3">
                  Start 30-Day Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="card-industrial relative border-2 border-construction-orange bg-white shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-construction-orange text-white px-4 py-2 rounded-full text-sm font-semibold">
                  ENTERPRISE
                </span>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl mb-2 text-steel">Enterprise</CardTitle>
                <CardDescription className="text-lg text-steel-light">Full-service business solution</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-steel">$399</span>
                  <span className="text-steel-light ml-2">/month</span>
                </div>
                <div className="text-xs text-construction-orange font-medium mt-2">White-Glove Service</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Everything in Professional</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Dedicated Sales Team</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">24/7 Concierge Support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Custom Integrations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">White-label Platform</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-construction-orange mr-3" />
                    <span className="text-steel-light">Dedicated Account Manager</span>
                  </li>
                </ul>
                <Button className="w-full bg-steel hover:bg-steel/90 text-white font-semibold py-3">
                  Contact Enterprise Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center bg-white rounded-lg p-6 border border-construction shadow-sm">
            <Shield className="h-12 w-12 text-construction-orange mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-steel">Enterprise Security</h3>
            <p className="text-steel-light text-sm">SOC 2 Type II compliant with 256-bit SSL encryption and regular security audits</p>
          </div>
          <div className="text-center bg-white rounded-lg p-6 border border-construction shadow-sm">
            <Users className="h-12 w-12 text-construction-orange mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-steel">Industry Leading</h3>
            <p className="text-steel-light text-sm">Trusted by 15,000+ contractors with 99.9% uptime SLA guarantee</p>
          </div>
          <div className="text-center bg-white rounded-lg p-6 border border-construction shadow-sm">
            <Clock className="h-12 w-12 text-construction-orange mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-steel">24/7 Support</h3>
            <p className="text-steel-light text-sm">Round-the-clock technical support with average response time under 2 hours</p>
          </div>
        </div>

        <div className="text-center bg-white rounded-lg p-8 border border-construction shadow-sm">
          <h3 className="text-2xl font-semibold mb-4 text-steel">Ready to Transform Your Business?</h3>
          <p className="text-steel-light mb-6 max-w-2xl mx-auto">
            Join the thousands of contractors who have increased their revenue by an average of 40% within 6 months using our platform.
          </p>
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-construction-orange mr-2" />
              <span className="text-sm text-steel-light">30-day money-back guarantee</span>
            </div>
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-construction-orange mr-2" />
              <span className="text-sm text-steel-light">No setup fees</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-construction-orange mr-2" />
              <span className="text-sm text-steel-light">Cancel anytime</span>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" className="border-construction text-steel hover:bg-construction-orange hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Subscribe;