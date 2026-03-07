import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { Loader2, Shield, Award, Store } from "lucide-react";
import { ContractorAccountSetup } from "@/components/ContractorAccountSetup";
import { FormNavigation } from "@/components/FormNavigation";

export function TrialSignup() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showContractorSetup, setShowContractorSetup] = useState(false);
  const [newUserId, setNewUserId] = useState<string>("");

  // Detect if user arrived from Google OAuth
  const isGoogleUser = searchParams.get("from") === "google";
  const prefillEmail = searchParams.get("email") || "";
  const prefillName = searchParams.get("name") || "";
  const nameParts = prefillName.split(" ");

  const [formData, setFormData] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: prefillEmail,
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
      let currentUserId: string;

      if (isGoogleUser && user) {
        // Google user already authenticated — skip signUp
        currentUserId = user.id;
      } else {
        // Standard email signup
        const { error: signUpError } = await signUp(formData.email, formData.password);
        
        if (signUpError) {
          throw signUpError;
        }

        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (!newUser) {
          throw new Error("User not found after signup");
        }
        currentUserId = newUser.id;
      }

      // Calculate trial end date (30 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // Update profile with trial info (profile already exists from handle_new_user trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          contact_name: `${formData.firstName} ${formData.lastName}`,
          company_name: formData.businessName,
          business_address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          subscription_tier: 'trial',
        })
        .eq('id', currentUserId);

      if (profileError) throw profileError;

      // Create trial subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: currentUserId,
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
          email: formData.email || user?.email,
          businessName: formData.businessName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          cardNumber: formData.cardNumber.slice(-4),
          trialEndDate: trialEndDate.toISOString(),
        },
      });

      toast({
        title: "Welcome to CT1!",
        description: "Your 30-day free trial has started. Enjoy full access to Training, CRM, and Marketplace!",
      });

      // Show contractor account setup
      setNewUserId(currentUserId);
      setShowContractorSetup(true);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex flex-col">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg"></div>
              <img src={ct1Logo} alt="CT1 Logo" className="relative h-12 w-12" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">CT1</h1>
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
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                <img src={ct1Logo} alt="CT1" className="relative h-20 w-20 mx-auto drop-shadow-2xl" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
              Start Your 30-Day Free Trial
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get instant access to 5-Star Training, CRM, and Marketplace
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">5-Star Training</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Full CRM Access</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Marketplace</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  Personal Information
                </h3>
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
                      className="border-2 border-border focus:border-primary transition-colors"
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
                      className="border-2 border-border focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  Account Information
                </h3>
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
                      readOnly={isGoogleUser}
                      className={`border-2 border-border focus:border-primary transition-colors ${isGoogleUser ? "bg-muted cursor-not-allowed" : ""}`}
                    />
                    {isGoogleUser && (
                      <p className="text-xs text-muted-foreground">Signed in with Google</p>
                    )}
                  </div>
                  {!isGoogleUser && (
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
                        className="border-2 border-border focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  Business Information
                </h3>
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
                      className="border-2 border-border focus:border-primary transition-colors"
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
                      className="border-2 border-border focus:border-primary transition-colors"
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
                        className="border-2 border-border focus:border-primary transition-colors"
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
                        className="border-2 border-border focus:border-primary transition-colors"
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
                        className="border-2 border-border focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  Payment Information
                </h3>
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
                    className="border-2 border-border focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    You won't be charged during your 30-day trial
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
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

      {showContractorSetup && newUserId && (
        <ContractorAccountSetup
          isOpen={showContractorSetup}
          userId={newUserId}
          onClose={() => setShowContractorSetup(false)}
        />
      )}
    </div>
  );
}
