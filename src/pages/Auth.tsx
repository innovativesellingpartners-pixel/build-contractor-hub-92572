import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Mail, Lock, User, Phone, ChevronDown, ChevronUp, Chrome } from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, user, resetPassword } = useAuth();

  // Detect custom domain (not lovable preview/localhost)
  const isCustomDomain =
    !window.location.hostname.includes("lovable.app") &&
    !window.location.hostname.includes("lovableproject.com") &&
    !window.location.hostname.includes("localhost");

  // On mount: detect OAuth error params in URL and display them
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") || params.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      // Clean up URL
      window.history.replaceState({}, "", "/auth");
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkSubscriptionAndRedirect = async () => {
      try {
        // Check if user has an active subscription
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (sub) {
          // For paying Google users, check if they have Gmail/Calendar connections
          const isOAuthUser = user.app_metadata?.provider === "google" || user.app_metadata?.providers?.includes("google");
          if (isOAuthUser) {
            const [{ data: emailConn }, { data: calConn }] = await Promise.all([
              supabase.from("email_connections").select("id").eq("user_id", user.id).eq("provider", "google").maybeSingle(),
              supabase.from("calendar_connections").select("id").eq("user_id", user.id).eq("provider", "google").maybeSingle(),
            ]);
            
            if (!emailConn || !calConn) {
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;
                if (accessToken) {
                  const { data: oauthData, error: oauthError } = await supabase.functions.invoke(
                    'google-oauth-init-combined',
                    {
                      body: {},
                      headers: { Authorization: `Bearer ${accessToken}` },
                    }
                  );
                  if (!oauthError && oauthData?.url) {
                    sessionStorage.setItem('ct1_post_oauth_redirect', '/dashboard');
                    window.location.href = oauthData.url;
                    return;
                  }
                }
              } catch {
                // Silently fail — user can connect later from Connections Hub
              }
            }
          }
          navigate("/dashboard");
          return;
        }

        // Check if user has a profile with a subscription tier (manually provisioned accounts)
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.subscription_tier && profile.subscription_tier !== 'none') {
          // Existing user with a tier but missing subscription row — let them in
          navigate("/dashboard");
          return;
        }

        // Check how the user signed in — only redirect Google users to trial
        const isOAuthUser = user.app_metadata?.provider === "google" || user.app_metadata?.providers?.includes("google");
        
        if (isOAuthUser) {
          const email = user.email || "";
          const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
          navigate(`/trial-signup?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&from=google`);
        } else {
          // Email/password user — just go to dashboard
          navigate("/dashboard");
        }
      } catch {
        navigate("/dashboard");
      }
    };

    checkSubscriptionAndRedirect();
  }, [user, navigate]);

  // Listen for password recovery event to show new password form
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowNewPasswordForm(true);
        setShowResetPassword(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await signIn(email, password, rememberMe);
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

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });
      
      if (error) {
        // Fallback to built-in reset if function fails
        const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (fallbackError) {
          setError(fallbackError.message);
        } else {
          setMessage("If an account exists with this email, you will receive a password reset link");
          setTimeout(() => {
            setShowResetPassword(false);
            setMessage("");
          }, 3000);
        }
      } else {
        setMessage(data?.message || "If an account exists with this email, you will receive a password reset link");
        setTimeout(() => {
          setShowResetPassword(false);
          setMessage("");
        }, 3000);
      }
    } catch (err) {
      // Fallback to built-in reset on unexpected errors
      try {
        const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (fallbackError) {
          setError(fallbackError.message);
        } else {
          setMessage("If an account exists with this email, you will receive a password reset link");
          setTimeout(() => {
            setShowResetPassword(false);
            setMessage("");
          }, 3000);
        }
      } catch (e) {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("new-password") as string;
    const confirm = formData.get("confirm-new-password") as string;

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully. Signing you in...");
      setShowNewPasswordForm(false);
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground mb-8"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
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
                {/* Google Sign-In Button */}
                {!showNewPasswordForm && !showResetPassword && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={googleLoading || isLoading}
                      onClick={async () => {
                        setGoogleLoading(true);
                        setError("");
                        try {
                          if (isCustomDomain) {
                            // On custom domains, bypass the auth-bridge to avoid redirect to preview URL
                            const { data, error } = await supabase.auth.signInWithOAuth({
                              provider: "google",
                              options: {
                                redirectTo: window.location.origin + "/auth",
                                skipBrowserRedirect: true,
                              },
                            });
                            if (error) {
                              setError(error.message || "Google sign-in failed");
                            } else if (data?.url) {
                              // Validate the OAuth URL before redirecting
                              const oauthUrl = new URL(data.url);
                              const allowedHosts = ["accounts.google.com", `${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`];
                              if (!allowedHosts.some((host) => oauthUrl.hostname.includes(host))) {
                                throw new Error("Invalid OAuth redirect URL");
                              }
                              window.location.href = data.url;
                              return;
                            }
                          } else {
                            // On Lovable preview domains, use the managed auth bridge
                            const { error } = await lovable.auth.signInWithOAuth("google", {
                              redirect_uri: window.location.origin + "/auth",
                            });
                            if (error) {
                              setError(error.message || "Google sign-in failed");
                            }
                          }
                        } catch (err: any) {
                          setError(err?.message || "Google sign-in failed");
                        } finally {
                          setGoogleLoading(false);
                        }
                      }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {googleLoading ? "Signing in..." : "Sign in with Google"}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                      </div>
                    </div>
                  </>
                )}

                {showNewPasswordForm ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Set New Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a new password for your account.
                      </p>
                    </div>

                    <form onSubmit={handleSetNewPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <PasswordInput
                            id="new-password"
                            name="new-password"
                            placeholder="Enter new password"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <PasswordInput
                            id="confirm-new-password"
                            name="confirm-new-password"
                            placeholder="Confirm new password"
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

                      {message && (
                        <Alert>
                          <AlertDescription>{message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </div>
                ) : !showResetPassword ? (
                  <>
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
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <PasswordInput
                            id="signin-password"
                            name="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="remember-me" 
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          />
                          <label
                            htmlFor="remember-me"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetPassword(true);
                            setError("");
                            setMessage("");
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
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
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">Reset Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email and we'll send you a link to reset your password.
                        </p>
                      </div>

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="reset-email"
                              name="reset-email"
                              type="email"
                              placeholder="Enter your email"
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

                        {message && (
                          <Alert>
                            <AlertDescription>{message}</AlertDescription>
                          </Alert>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setShowResetPassword(false);
                            setError("");
                            setMessage("");
                          }}
                        >
                          Back to Sign In
                        </Button>
                      </form>
                    </div>
                  </>
                )}
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