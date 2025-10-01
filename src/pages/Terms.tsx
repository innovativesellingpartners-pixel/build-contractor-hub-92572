import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-bordered.png';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12" />
            </Link>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CT1's services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Services</h2>
            <p>
              CT1 provides training, tools, lead generation, and business management services for contractors. 
              Service availability and features may vary by subscription tier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Subscription and Payment</h2>
            <p>
              All subscriptions are billed monthly. Payments are processed through Stripe. 
              You may cancel your subscription at any time, but refunds are not provided for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account. You agree to use our services in compliance 
              with all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Lead Generation</h2>
            <p>
              CT1 provides qualified leads based on your subscription tier. While we strive to deliver 
              high-quality leads, we cannot guarantee specific results or conversion rates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Limitation of Liability</h2>
            <p>
              CT1 is not liable for any indirect, incidental, special, or consequential damages arising 
              from your use of our services. Our total liability shall not exceed the amount you paid 
              for the services in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective 
              immediately upon posting. Your continued use of our services constitutes acceptance of 
              the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at <a href="mailto:sales@myct1.com" className="text-primary hover:underline">sales@myct1.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link to="/contact">
            <Button>Contact Us</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 CT1. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
