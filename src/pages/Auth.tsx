import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Lock, User, Phone, ChevronDown, ChevronUp } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for the confirmation link");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground">Contractor Portal</h2>
          <p className="text-muted-foreground mt-2">Access your CT1 business tools</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Join CT1 Network</h3>
                    <p className="text-muted-foreground">
                      To create an account, please choose a subscription tier or contact our sales team.
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Account creation is available after selecting a subscription plan. Our team will set up your account once payment is processed.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => navigate("/pricing")}
                    >
                      View Pricing & Subscribe
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/contact")}
                    >
                      Contact Sales Team
                    </Button>

                    <div className="text-center pt-2">
                      <a 
                        href="tel:+12487527308"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Or call us: <span className="font-medium">(248) 752-7308</span>
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                New to CT1? <Link to="/pricing" className="text-primary hover:underline font-medium">View our pricing plans</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Join CT1 Network Section */}
        <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="pt-6">
            <Collapsible open={showJoinOptions} onOpenChange={setShowJoinOptions}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer">
                  <div className="text-left">
                    <p className="font-semibold text-lg">Not currently in the CT1 Contractor Network?</p>
                    <p className="text-sm text-muted-foreground">Click here to join and grow your business</p>
                  </div>
                  {showJoinOptions ? (
                    <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-4 space-y-4 p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Sign Up Now */}
                    <div className="group p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all">
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Sign Up Now</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Join the CT1 network and start accessing powerful business tools today.
                      </p>
                      <Button 
                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                        onClick={() => navigate("/pricing")}
                      >
                        View Plans & Subscribe
                      </Button>
                    </div>

                    {/* Contact Sales */}
                    <div className="group p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-border hover:border-primary/30 hover:shadow-lg transition-all">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Contact Sales</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Have questions? Our sales team is here to help you get started.
                      </p>
                      <div className="space-y-3">
                        <a 
                          href="mailto:sales@myct1.com"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">sales@myct1.com</span>
                        </a>
                        <a 
                          href="tel:+12487527308"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">(248) 752-7308</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}