import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-bordered.png';

export const Privacy = () => {
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
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, phone number, and company information</li>
              <li>Account credentials and profile information</li>
              <li>Payment and billing information (processed through Stripe)</li>
              <li>Communications with us and use of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process payments and fulfill your subscription</li>
              <li>Send you training materials, leads, and service updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Analyze usage patterns and optimize our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with service providers 
              who assist us in operating our platform (e.g., payment processors, email services), and when 
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, and 
              deliver personalized content. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your information, 
              please contact us at <a href="mailto:sales@myct1.com" className="text-primary hover:underline">sales@myct1.com</a>
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
