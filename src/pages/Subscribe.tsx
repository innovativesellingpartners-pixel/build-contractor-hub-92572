import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Subscribe() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Choose Your 
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Growth Plan
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full platform and transform your contractor business today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="card-industrial">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription className="text-lg">Perfect for solo contractors getting started</CardDescription>
              <div className="text-3xl font-bold text-primary mt-4">
                $99<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Access to Training Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Basic Lead Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Marketplace Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Email Support</span>
                </div>
              </div>
              <Button variant="contractor" className="w-full" asChild>
                <Link to="/dashboard">
                  Start Free Trial <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-industrial border-primary shadow-hero">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                  POPULAR
                </span>
              </div>
              <CardDescription className="text-lg">Complete solution for growing contractor businesses</CardDescription>
              <div className="text-3xl font-bold text-primary mt-4">
                $299<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Everything in Starter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Dedicated Back-Office Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Full CRM & Project Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Priority Phone Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Custom Integrations</span>
                </div>
              </div>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/dashboard">
                  Start Free Trial <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            14-day free trial • No setup fees • Cancel anytime
          </p>
          <Button variant="outline" asChild>
            <Link to="/">
              ← Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Subscribe;