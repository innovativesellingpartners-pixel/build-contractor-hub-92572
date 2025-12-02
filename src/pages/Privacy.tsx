import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { ArrowLeft } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-main.png';

export const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
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
        <h1 className="text-4xl font-bold mb-2">MYCT1.COM Privacy Policy</h1>
        <p className="text-muted-foreground mb-2">Effective Date: December 2, 2025</p>
        <p className="text-muted-foreground mb-2">Company: CT1 (MyCT1.com)</p>
        <p className="text-muted-foreground mb-2">Contact: Patrick Montgomery, COO</p>
        <p className="text-muted-foreground mb-8">Address: 31780 Groesbeck Hwy, Fraser, MI 48026</p>

        <p className="text-muted-foreground mb-8">
          This Privacy Policy explains how CT1 collects, uses, stores, and protects personal information. 
          CT1 is committed to protecting your data and complies with Google OAuth, Gmail API, and Google Calendar API 
          requirements, as well as applicable data privacy laws.
        </p>

        <div className="space-y-8 text-muted-foreground">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. About CT1</h2>
            <p>
              CT1 provides contractors with a suite of tools to manage their business operations. These tools include 
              Customer Relationship Management (CRM), lead management, estimating, scheduling, training modules, 
              AI-assisted call handling, and communication features.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-4">
              CT1 collects only the information necessary to operate our services and improve user experience.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2">2.1 Account Information</h3>
            <p className="mb-2">We collect the following to set up your account:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business name and details</li>
              <li>Profile settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">2.2 Google Data (Restricted & Sensitive Scopes)</h3>
            <p className="mb-2">Users may choose to connect their Google accounts to CT1. We only access data that you explicitly authorize.</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Gmail:</strong> We access email headers, sender/recipient details, message bodies, and attachments only when relevant to syncing leads or CRM records.</li>
              <li><strong>Google Calendar:</strong> We access event titles, dates, times, attendees, and updates to manage your schedule.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">2.3 Communication Data</h3>
            <p className="mb-2">To provide our communication features, we process:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Calls and call metadata</li>
              <li>Voicemails</li>
              <li>Call recordings (only when enabled by you)</li>
              <li>SMS messages</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">2.4 Usage Data</h3>
            <p className="mb-2">We collect technical data to ensure stability:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Login activity</li>
              <li>Device and browser type</li>
              <li>System error logs</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">2.5 Payment Data</h3>
            <p>
              All payment processing is handled by trusted third-party providers (e.g., Stripe). 
              CT1 does not store full credit card numbers on our servers.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Information</h2>
            <p className="mb-4">We use your data strictly to deliver the CT1 service.</p>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.1 Core Functions</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Managing your user account and authentication.</li>
              <li>Organizing leads and customer data in the CRM.</li>
              <li>Generating estimates and scheduling jobs.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.2 Email and Calendar Integration</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Reading:</strong> We read incoming emails to automatically update lead status or client history in your CRM.</li>
              <li><strong>Writing:</strong> We send emails on your behalf only when you explicitly request it (e.g., sending an estimate).</li>
              <li><strong>Syncing:</strong> We sync calendar events to ensure you do not double-book appointments.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.3 Voice AI & Call Handling</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Answering incoming calls and scheduling visits based on your availability.</li>
              <li>Transcribing conversations and logging voicemails into the CRM.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">3.4 Support & Security</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Troubleshooting technical issues you report.</li>
              <li>Monitoring for suspicious activity to keep your account safe.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Google API Limited Use Disclosure</h2>
            <p className="mb-4">
              CT1's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mb-4">Crucially, in compliance with Google's Restricted Scope policies:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>No Prohibited Advertising:</strong> CT1 does not use Google Workspace data (Gmail/Calendar) for advertisements. 
                We do not sell your data, nor do we allow third-party advertisers to use your data for targeting.
              </li>
              <li>
                <strong>No Human Access:</strong> CT1 does not allow humans to read your Google data (emails/calendar events) unless:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>We have obtained your affirmative agreement to view specific messages (e.g., for technical support).</li>
                  <li>It is necessary for security purposes (such as investigating abuse).</li>
                  <li>It is necessary to comply with applicable law.</li>
                  <li>Our use is limited to internal operations and the data (including derivations) have been aggregated and anonymized.</li>
                </ul>
              </li>
              <li>
                <strong>AI & Machine Learning Restrictions:</strong> We do not use your personal Google Workspace data to train 
                generalized/non-personalized foundation AI models that are shared with other users.
              </li>
              <li>
                <strong>Prohibited Transfer:</strong> We do not transfer your Google data to third parties unless it is necessary 
                to provide or improve the features of our application (e.g., using a cloud provider for hosting), or as required by law.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. How We Share Information</h2>
            <p className="mb-4">CT1 shares data only when required to operate the service.</p>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.1 Service Providers</h3>
            <p className="mb-2">
              We engage trusted third-party vendors to perform functions on our behalf. These vendors are contractually 
              obligated to protect your data and only use it for the purposes we specify.
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Cloud Hosting:</strong> To store data securely.</li>
              <li><strong>Payment Processors:</strong> To handle billing.</li>
              <li><strong>AI Providers:</strong> To process voice and text for CRM automation (strictly for feature functionality).</li>
              <li><strong>Telephony Services:</strong> To route calls and texts.</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2">5.2 Legal Requirements</h3>
            <p>
              We may disclose information if required by law, regulation, or a valid legal request (e.g., a subpoena), 
              or to protect the safety and rights of CT1 and its users.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Security</h2>
            <p>
              CT1 employs industry-standard security measures, including encryption of data at rest and in transit, 
              secure credential storage, and strict access controls. We perform regular security audits to ensure 
              the safety of your information.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to provide our services or as required by law. 
              Users may request the deletion of their data at any time.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. User Controls</h2>
            <p className="mb-2">You have control over your data. You may:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>View, correct, or export your information.</li>
              <li>Disconnect Google access at any time via CT1 Account Settings.</li>
              <li>
                Revoke access directly via Google's security settings at:{' '}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://myaccount.google.com/permissions
                </a>
              </li>
              <li>Request full account deletion by contacting support.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Children</h2>
            <p>
              CT1 is a business tool and is not intended for use by children under the age of 13. 
              We do not knowingly collect data from children.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>
              CT1 may update this policy from time to time. If we make material changes, we will notify you 
              via email or a prominent notice on our dashboard.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this policy or wish to exercise your data rights, please contact us:
            </p>
            <ul className="space-y-1">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:sales@myct1.com" className="text-primary hover:underline">sales@myct1.com</a>
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <a href="https://myct1.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://myct1.com
                </a>
              </li>
              <li><strong>Attn:</strong> Patrick Montgomery, COO</li>
              <li><strong>Mailing Address:</strong> 31780 Groesbeck Hwy, Fraser, MI 48026</li>
            </ul>
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
