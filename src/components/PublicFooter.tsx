import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function PublicFooter() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
              <div>
                <h3 className="text-xl font-bold text-background">CT1</h3>
                <p className="text-xs text-background/60">One-Up Your Business</p>
              </div>
            </div>
            <p className="text-background/70 text-sm">
              Empowering contractors to build better businesses with comprehensive tools and professional support.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-background mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/business-suite" className="hover:text-primary transition-colors">Business Suite</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/products/pocketbot" className="hover:text-primary transition-colors">Pocketbot</Link></li>
              <li><Link to="/products/voice-ai" className="hover:text-primary transition-colors">Voice AI</Link></li>
              <li><Link to="/savings" className="hover:text-primary transition-colors">Savings</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/what-we-do" className="hover:text-primary transition-colors">What We Do</Link></li>
              <li><Link to="/core-values" className="hover:text-primary transition-colors">Core Values</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog &amp; Podcast</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                Fraser, Michigan
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:2487527308" className="hover:text-primary transition-colors">(248) 752-7308</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:sales@myct1.com" className="hover:text-primary transition-colors">sales@myct1.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">© {new Date().getFullYear()} CT1. All rights reserved.</p>
          <div className="flex gap-6 text-background/50 text-sm">
            <Link to="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
