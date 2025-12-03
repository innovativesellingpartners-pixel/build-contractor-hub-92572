import { Link } from "react-router-dom";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageSquare,
  Headphones,
  Users,
  Globe
} from "lucide-react";

export function Contact() {
  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our sales team",
      contact: "(248) 752-7308",
      hours: "Mon-Fri 8AM-6PM EST"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Get detailed answers to your questions",
      contact: "sales@myct1.com",
      hours: "Response within 24 hours"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Instant support during business hours",
      contact: "Available on website",
      hours: "Mon-Fri 8AM-6PM EST"
    },
    {
      icon: Headphones,
      title: "Technical Support",
      description: "Help with platform and technical issues",
      contact: "support@myct1.com",
      hours: "24/7 Support Available"
    }
  ];

  const offices = [
    {
      city: "Fraser, MI",
      address: "31780 Groesbeck Hwy, Fraser, MI 48026",
      phone: "(248) 752-7308",
      region: "Flagship Location",
      website: "https://restoreitright.com/",
      coverage: "And surrounding areas"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <MessageSquare className="h-5 w-5 mr-2" />
              Contact Us
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Get in Touch with <span className="text-primary">CT1</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ready to transform your contracting business? Our team is here to help you get started with CT1's comprehensive platform.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <ContactForm
                title="Let's Start a Conversation"
                description="Tell us about your business and how we can help you succeed with CT1"
                ctaText="Send Message"
                formType="contact-page"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Multiple Ways to Connect</h2>
                <p className="text-muted-foreground mb-8">
                  Choose the contact method that works best for you. Our team is committed to providing exceptional support.
                </p>
              </div>

              <div className="grid gap-6">
                {contactMethods.map((method, index) => (
                  <Card key={index} className="card-ct1 p-6">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <method.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{method.description}</p>
                          <p className="font-semibold text-primary">{method.contact}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {method.hours}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Our <span className="text-primary">Locations</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              CT1 operates nationwide with regional offices to better serve contractors across the United States.
            </p>
          </div>

          <div className="flex justify-center">
            {offices.map((office, index) => (
              <Card key={index} className="card-ct1 p-8 text-center max-w-md">
                <CardContent className="pt-6">
                  <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">{office.city}</h3>
                  <Badge className="mb-4 bg-primary/10 text-primary">{office.region}</Badge>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="text-sm">{office.address}</p>
                    <p className="font-semibold text-primary">{office.phone}</p>
                    <a 
                      href={office.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </a>
                    <p className="text-sm italic text-muted-foreground mt-4">{office.coverage}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to common questions about CT1 and our services.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="card-ct1 p-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">How quickly can I get started with CT1?</h3>
                <p className="text-muted-foreground">
                  Most contractors can be fully set up and trained on the CT1 platform within 1-2 weeks. Our onboarding team provides personalized support to ensure a smooth transition.
                </p>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">What kind of support do you provide?</h3>
                <p className="text-muted-foreground">
                  We offer comprehensive support including phone, email, live chat, and technical assistance. Our team also provides training resources, webinars, and one-on-one coaching sessions.
                </p>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">Do you work with contractors of all sizes?</h3>
                <p className="text-muted-foreground">
                  Yes! CT1 is designed to scale with your business, whether you're a solo contractor just starting out or a large contracting company with multiple teams and locations.
                </p>
              </CardContent>
            </Card>

            <Card className="card-ct1 p-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">What makes CT1 different from other platforms?</h3>
                <p className="text-muted-foreground">
                  CT1 is the only platform built specifically for contractors that combines AI-powered automation, comprehensive business management tools, professional training, and a supportive community all in one place.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
                <div>
                  <h3 className="text-xl font-bold text-background">CT1</h3>
                  <p className="text-xs text-muted">One-Up Your Business</p>
                </div>
              </div>
              <p className="text-muted text-sm">
                Empowering contractors to build better businesses with comprehensive tools and professional support.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/for-contractors" className="hover:text-primary transition-colors">For Contractors</Link></li>
                <li><Link to="/find-contractor" className="hover:text-primary transition-colors">Find Contractors</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Get Started</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="tel:(248)752-7308" className="hover:text-primary transition-colors">Phone Support</a></li>
                <li><a href="mailto:support@myct1.com" className="hover:text-primary transition-colors">Email Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Training Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">Contact Info</h4>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>(248) 752-7308</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>sales@myct1.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Nationwide Service</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted">© 2024 CT1. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/legal/privacy" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
              <a href="#" className="text-sm text-muted hover:text-primary transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}