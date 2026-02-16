import { Link } from 'react-router-dom';
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from '@/components/ui/button';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Content */}
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">CT1 Terms of Service</h1>
        <p className="text-muted-foreground mb-2">Effective Date: December 2, 2025</p>
        <p className="text-muted-foreground mb-2">Company: CT1 (MyCT1.com)</p>
        <p className="text-muted-foreground mb-8">
          Contact: <a href="mailto:sales@myct1.com" className="text-primary hover:underline">sales@myct1.com</a>
        </p>

        <div className="space-y-8 text-muted-foreground">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CT1 ("the Service"), provided by CT1 ("we," "us," or "our"), you agree to be bound 
              by these Terms of Service ("Terms"). If you do not agree, strictly do not use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>
              CT1 provides a suite of business management tools for contractors, including Customer Relationship 
              Management (CRM), estimating, scheduling, training, and AI-assisted communication features.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <p className="mb-3">To use CT1, you must register for an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete business information.</li>
              <li>Maintain the confidentiality of your login credentials.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Artificial Intelligence (AI) Disclaimer</h2>
            <p className="mb-3">
              CT1 utilizes Artificial Intelligence (AI) to assist with call handling, drafting emails, and providing 
              business insights. By using these features, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>AI is Not Infallible:</strong> AI-generated content may contain errors, inaccuracies, or 
                "hallucinations." You should always verify estimates, generated emails, and scheduling details before 
                finalizing them with your customers.
              </li>
              <li>
                <strong>No Professional Advice:</strong> AI suggestions are for informational purposes only and do not 
                constitute legal, financial, or engineering advice.
              </li>
              <li>
                <strong>Liability:</strong> CT1 is not liable for any errors in estimates, lost leads, or scheduling 
                conflicts resulting from reliance on AI-generated content.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Payment and Subscription</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Billing:</strong> Services are billed on a subscription basis (monthly or annually). Payments 
                are processed securely via third-party providers (e.g., Stripe).
              </li>
              <li>
                <strong>Changes:</strong> We reserve the right to change pricing with 30 days' notice.
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel your subscription at any time via your account settings. 
                Access will continue until the end of the current billing cycle. No refunds are provided for partial months.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Acceptable Use Policy</h2>
            <p className="mb-3">You agree not to use CT1 to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send unsolicited spam or violate the TCPA (Telephone Consumer Protection Act).</li>
              <li>Upload malware, viruses, or harmful code.</li>
              <li>Harass, abuse, or threaten others.</li>
              <li>Reverse engineer or attempt to copy the Service's underlying code.</li>
              <li>Use the Service for any illegal purpose.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Google Integration</h2>
            <p className="mb-3">If you connect your Google Account:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You grant CT1 permission to access your Gmail and Calendar data strictly as described in our{' '}
                <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link> and Google API 
                Limited Use Disclosure.
              </li>
              <li>We do not use your Google Workspace data to train general AI models for other customers.</li>
              <li>
                You may revoke this access at any time via{' '}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Security Settings
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Your Data:</strong> You retain ownership of all data, leads, and content you upload to CT1.
              </li>
              <li>
                <strong>Our IP:</strong> CT1 retains all rights to the software, design, code, and training materials 
                provided within the Service.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account immediately if you violate these Terms, 
              specifically regarding illegal activity, non-payment, or abuse of the Service.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CT1 shall not be liable for any indirect, incidental, special, 
              or consequential damages, including loss of profits, data, or business opportunities, arising from your 
              use of the Service.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Michigan. Any disputes shall be resolved in the 
              courts located in Macomb County, Michigan.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Contact Information</h2>
            <ul className="space-y-1">
              <li><strong>CT1</strong></li>
              <li>31780 Groesbeck Hwy</li>
              <li>Fraser, MI 48026</li>
              <li>
                Email: <a href="mailto:sales@myct1.com" className="text-primary hover:underline">sales@myct1.com</a>
              </li>
            </ul>
          </section>

          {/* Link to Privacy Policy */}
          <section className="pt-4">
            <p>
              Please also review our{' '}
              <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>{' '}
              for information on how we collect, use, and protect your data.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <a href="mailto:sales@myct1.com">
            <Button>Contact Us</Button>
          </a>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
