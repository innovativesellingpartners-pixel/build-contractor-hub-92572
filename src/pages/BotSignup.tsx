import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { Loader2, Award, Shield, Store, Calendar } from "lucide-react";
import { FormNavigation } from "@/components/FormNavigation";

export function BotSignup() {
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
    phone: "",
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

      // Create profile for bot user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          contact_name: `${formData.firstName} ${formData.lastName}`,
          company_name: formData.businessName,
          phone: formData.phone,
          subscription_tier: 'bot_user',
        });

      if (profileError) throw profileError;

      // Create bot user subscription (Training, CRM, Marketplace, Monthly Call)
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier_id: 'bot_user',
          billing_cycle: 'monthly',
          status: 'active',
        });

      if (subError) throw subError;

      // Send notification email to sales team
      await supabase.functions.invoke('send-trial-notification', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          businessName: formData.businessName,
          phone: formData.phone,
          signupType: 'bot_user',
        },
      });

      toast({
        title: "Welcome to CT1!",
        description: "Your account has been created. You now have full access to Training, CRM, Marketplace, and Monthly 1:1 Calls!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Bot signup error:", error);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">CT1</h1>
              <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
            </div>
          </Link>
          <FormNavigation />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Sign Up for Full Pocket Agent Access
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Get unlimited Pocket Agent plus complete contractor portal access
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                <Award className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">5-Star Training</p>
                  <p className="text-xs text-muted-foreground">Complete training library</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Full CRM Access</p>
                  <p className="text-xs text-muted-foreground">Manage your business</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                <Store className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Marketplace</p>
                  <p className="text-xs text-muted-foreground">Access services & vendors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                <Calendar className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Monthly 1:1 Call</p>
                  <p className="text-xs text-muted-foreground">Personal coaching</p>
                </div>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-card border border-border/50 rounded-xl shadow-lg p-8">
            {/* Pricing Information */}
            <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Pocket Agent Full Access</h3>
                <div className="flex items-baseline justify-center gap-2 mb-3">
                  <span className="text-4xl font-bold text-primary">$200</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Includes unlimited Pocket Agent access plus:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-left">
                    <Award className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>5-Star Training Library</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Complete CRM Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <Store className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Marketplace Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Monthly 1:1 Coaching Call</span>
                  </div>
                </div>
              </div>
            </div>

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

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
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
                    Creating Your Account...
                  </>
                ) : (
                  "Sign Up & Get Full Access"
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
