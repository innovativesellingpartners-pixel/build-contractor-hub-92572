import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Lock, ArrowLeft, UserCheck, Shield, Clock, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import constructeamLogo from "@/assets/ct1-logo-main.png";

export function Subscribe() {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Service Agreement to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    const { error } = await signUp(email, password, companyName);

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration Successful!",
        description: "Please check your email to confirm your account.",
      });
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
      setForgotPassword(false);
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <header className="bg-black border-b border-white/10 shadow-sm sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <img src={constructeamLogo} alt="CT1" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white">CT1</h1>
              <p className="text-xs text-gray-400 font-medium">One-Up Your Business</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2 text-gray-400">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Secure Platform</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12 pt-8">
          <div className="mb-6 inline-flex items-center bg-red-500/10 rounded-full px-6 py-3 border border-red-500/20">
            <img src={constructeamLogo} alt="CT1" className="h-6 w-6 mr-2" />
            <span className="text-white font-medium">Professional Contractor Management Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Access Your Business
            <span className="block bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join thousands of contractors using our enterprise platform to scale their operations and increase profitability.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Authentication Section */}
          <Card className="lg:col-span-1 bg-zinc-900 border-white/10 shadow-lg">
            <CardHeader className="text-center pb-6 border-b border-white/10">
              <CardTitle className="text-2xl mb-2 text-white flex items-center justify-center">
                <Lock className="h-5 w-5 mr-2 text-red-500" />
                Access Portal
              </CardTitle>
              <CardDescription className="text-gray-400">Login or create your account</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {forgotPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email" className="text-gray-300 font-medium">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@company.com"
                      className="mt-1 bg-black border-white/10 text-white"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setForgotPassword(false)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email" className="text-gray-300 font-medium">Business Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@company.com"
                          className="mt-1 bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password" className="text-gray-300 font-medium">Password</Label>
                        <PasswordInput
                          id="login-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="mt-1 bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In to Dashboard"}
                      </Button>
                      <div className="text-center space-y-2">
                        <button
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="text-sm text-red-500 hover:underline block"
                        >
                          Forgot your password?
                        </button>
                        <div className="text-xs text-gray-400">
                          Need help? Call <span className="font-medium">(248) 752-7308</span>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <Label htmlFor="signup-email" className="text-gray-300 font-medium">Business Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@company.com"
                          className="mt-1 bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password" className="text-gray-300 font-medium">Password</Label>
                        <PasswordInput
                          id="signup-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          className="mt-1 bg-black border-white/10 text-white"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company-name" className="text-gray-300 font-medium">Company Name (Optional)</Label>
                        <Input
                          id="company-name"
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your company name"
                          className="mt-1 bg-black border-white/10 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300 font-medium mb-2 block">Billing Frequency</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={billingFrequency === 'monthly' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => setBillingFrequency('monthly')}
                          >
                            Monthly
                          </Button>
                          <Button
                            type="button"
                            variant={billingFrequency === 'quarterly' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => setBillingFrequency('quarterly')}
                          >
                            Quarterly
                          </Button>
                          <Button
                            type="button"
                            variant={billingFrequency === 'yearly' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => setBillingFrequency('yearly')}
                          >
                            Yearly
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2 p-3 border border-white/10 rounded-lg bg-white/5">
                        <Checkbox 
                          id="terms" 
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                          >
                            I agree to the Service Agreement
                          </label>
                          <p className="text-xs text-gray-400">
                            By checking this box, you agree to our{' '}
                            <Link to="/legal/terms" target="_blank" className="text-red-500 hover:underline">
                              Service Agreement and Terms of Service
                            </Link>
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3" 
                        disabled={isLoading || !agreedToTerms}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                      <div className="text-center">
                        <div className="text-xs text-steel-light">
                          Need help? Call <span className="font-medium">(248) 752-7308</span>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Plans Section */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {/* LAUNCH Growth Starter */}
            <Card className="relative bg-zinc-900 border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-full mb-3">
                  Tier 1
                </div>
                <CardTitle className="text-2xl mb-2 text-white">CT1 LAUNCH Growth Starter</CardTitle>
                <CardDescription className="text-base text-gray-400">Build your foundation with our training and management system</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">$99</span>
                    <span className="text-gray-400">.99/mo</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    $299.97/quarter or $1,079/year (10% off)
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">CT1 5-Star Contractor Business & Sales Training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Full Customer & Jobs Management system</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">1 personal monthly business training session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Marketplace access to vetted tech vendors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">24/7 AI Business Assistant (Pocket Bot)</span>
                  </li>
                </ul>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white" size="lg">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Growth Business Builder */}
            <Card className="relative bg-zinc-900 border-2 border-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-full mb-3">
                  Tier 2
                </div>
                <CardTitle className="text-2xl mb-2 text-white">CT1 Growth Business Builder</CardTitle>
                <CardDescription className="text-base text-gray-400">Scale faster with AI tools and qualified leads</CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">$250</span>
                    <span className="text-gray-400">/mo</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    $750/quarter or $2,700/year (10% off)
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                  <p className="text-sm font-medium text-center text-gray-300">Everything in LAUNCH, plus:</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">AI Phone Assistant for call answering and screening</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">2 personal monthly business training sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">5 qualified leads per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Complete AI toolset (Pocket Bot, Sales Bot, Project Manager Bot, Admin Bot)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Priority marketplace support</span>
                  </li>
                </ul>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white" size="lg">
                  Get Started Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Accel! Market Dominator - Full Width Below */}
          <div className="lg:col-span-3 mt-6">
            <Card className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-white/10 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🚀 COMING SOON
                </span>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-white/10 text-gray-400 text-xs font-semibold rounded-full mb-3">
                  Tier 3
                </div>
                <CardTitle className="text-3xl mb-2 text-white">CT1 Market Dominator</CardTitle>
                <CardDescription className="text-xl text-gray-400">Premium lead generation and weekly coaching for market leaders</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-400">Pricing TBD</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-300">Premium Features:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">Premium lead generation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">High-intent or closed job leads weekly (80/20 split)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">Full AI toolset (Project Manager Bot, Sales Bot, Admin Bot)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-300">Elite Support:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">Weekly one-on-one growth & leadership coaching</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-400">Enhanced AI Phone Assistant with qualification & scheduling</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    This premium tier is currently under development. Contact us to join the waitlist.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center bg-zinc-900 rounded-lg p-6 border border-white/10 shadow-sm">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Enterprise Security</h3>
            <p className="text-gray-400 text-sm">SOC 2 Type II compliant with 256-bit SSL encryption and regular security audits</p>
          </div>
          <div className="text-center bg-zinc-900 rounded-lg p-6 border border-white/10 shadow-sm">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Industry Leading</h3>
            <p className="text-gray-400 text-sm">Trusted by 15,000+ contractors with 99.9% uptime SLA guarantee</p>
          </div>
          <div className="text-center bg-zinc-900 rounded-lg p-6 border border-white/10 shadow-sm">
            <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">24/7 Support</h3>
            <p className="text-gray-400 text-sm">Round-the-clock technical support with average response time under 2 hours</p>
          </div>
        </div>

        <div className="text-center bg-zinc-900 rounded-lg p-8 border border-white/10 shadow-sm">
          <h3 className="text-2xl font-semibold mb-4 text-white">Ready to Transform Your Business?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Join the thousands of contractors who have increased their revenue by an average of 40% within 6 months using our platform.
          </p>
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-400">30-day money-back guarantee</span>
            </div>
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-400">No setup fees</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-400">Cancel anytime</span>
            </div>
          </div>
          <Link to="/subscribe">
            <Button variant="outline" className="border-white/20 text-white hover:bg-red-600 hover:border-red-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Subscribe;