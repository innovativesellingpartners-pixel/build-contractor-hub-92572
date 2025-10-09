import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { Loader2, Shield, Award, Store } from "lucide-react";

export function TrialSignup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessName: "",
    cardNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up the user
      const { error: signUpError } = await signUp(formData.email, formData.password);
      
      if (signUpError) {
        throw signUpError;
      }

      // Get the newly created user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not found after signup");
      }

      // Calculate trial end date (30 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // Create profile with trial info
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          contact_name: `${formData.firstName} ${formData.lastName}`,
          company_name: formData.businessName,
          business_address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          subscription_tier: 'trial',
        });

      if (profileError) throw profileError;

      // Create trial subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier_id: 'trial',
          billing_cycle: 'monthly',
          status: 'active',
          trial_end_date: trialEndDate.toISOString(),
        });

      if (subError) throw subError;

      // Send notification email to sales team
      await supabase.functions.invoke('send-trial-notification', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          businessName: formData.businessName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          cardNumber: formData.cardNumber.slice(-4), // Only send last 4 digits
          trialEndDate: trialEndDate.toISOString(),
        },
      });

      toast({
        title: "Welcome to CT1!",
        description: "Your 30-day free trial has started. Enjoy full access to Training, CRM, and Marketplace!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Trial signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">CT1</h1>
              <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Start Your 30-Day Free Trial
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Get instant access to 5-Star Training, CRM, and Marketplace
            </p>
            <div className="flex justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">5-Star Training</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Full CRM Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Marketplace</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-card border border-border/50 rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="ABC Construction LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Detroit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        type="text"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="MI"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="48201"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    required
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="•••• •••• •••• ••••"
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground">
                    You won't be charged during your 30-day trial
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting Your Trial...
                  </>
                ) : (
                  "Start My Free Trial"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link to="/legal/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>

          {/* Already have an account */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
