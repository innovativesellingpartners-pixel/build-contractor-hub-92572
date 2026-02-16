import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MobileNav } from "@/components/MobileNav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Bot, Mic, Rocket, TrendingUp, Crown } from "lucide-react";
import ct1Logo from "@/assets/ct1-main-logo.png";

interface MainSiteHeaderProps {
  onContactClick?: () => void;
}

export function MainSiteHeader({ onContactClick }: MainSiteHeaderProps) {
  const [showContactDialog, setShowContactDialog] = useState(false);

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      setShowContactDialog(true);
    }
  };

  return (
    <header className="sticky top-0 bg-zinc-900 z-50 border-b border-zinc-800 shadow-lg shadow-black/20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity group gap-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-16 sm:h-20 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-base sm:text-xl lg:text-2xl tracking-wide">MYCT1.COM</span>
              <span className="text-zinc-400 text-xs sm:text-sm lg:text-base tracking-wide">One-up the competition</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-5">
            <Link to="/what-we-do" className="text-zinc-300 hover:text-white transition-colors font-medium text-sm">About Us</Link>
            
            {/* Products Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-zinc-300 hover:text-white font-medium text-sm bg-transparent data-[state=open]:bg-zinc-800">
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[320px] p-4 bg-popover">
                      <div className="space-y-1">
                        <Link to="/products/pocket-agent" className="block">
                          <NavigationMenuLink className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Bot className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Pocket Agent</div>
                              <p className="text-sm text-muted-foreground">AI-powered business assistant</p>
                            </div>
                          </NavigationMenuLink>
                        </Link>
                        <Link to="/products/voice-ai" className="block">
                          <NavigationMenuLink className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Mic className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-foreground">AI Voice Assistant</div>
                              <p className="text-sm text-muted-foreground">24/7 call answering & lead capture</p>
                            </div>
                          </NavigationMenuLink>
                        </Link>
                        <div className="border-t my-2" />
                        <Link to="/products/tier-launch" className="block">
                          <NavigationMenuLink className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Rocket className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Launch Growth Starter</div>
                              <p className="text-sm text-muted-foreground">Build your foundation</p>
                            </div>
                          </NavigationMenuLink>
                        </Link>
                        <Link to="/products/tier-growth" className="block">
                          <NavigationMenuLink className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Growth Business Builder</div>
                              <p className="text-sm text-muted-foreground">Scale with AI tools</p>
                            </div>
                          </NavigationMenuLink>
                        </Link>
                        <Link to="/products/tier-market" className="block">
                          <NavigationMenuLink className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Crown className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-foreground">myCT1 Market Dominator</div>
                              <p className="text-sm text-muted-foreground">Dominate your market</p>
                            </div>
                          </NavigationMenuLink>
                        </Link>
                        <div className="border-t my-2" />
                        <Link to="/pricing" className="block">
                          <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-primary font-medium">
                            View All Pricing
                          </NavigationMenuLink>
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link to="/trades-we-serve" className="text-zinc-300 hover:text-white transition-colors font-medium text-sm">Trades We Serve</Link>
            <Link to="/core-values" className="text-zinc-300 hover:text-white transition-colors font-medium text-sm">Core Values</Link>
            <Link to="/blog-podcast" className="text-zinc-300 hover:text-white transition-colors font-medium text-sm">Blog & Podcast</Link>
            
            <Button 
              variant="ghost" 
              onClick={handleContactClick}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium text-sm"
            >
              Contact Sales
            </Button>
            
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2 rounded-lg">
                Contractor Login
              </Button>
            </Link>
          </nav>

          <div className="flex lg:hidden items-center gap-2">
            <MobileNav onContactClick={handleContactClick} />
          </div>
        </div>
      </div>

      {/* Contact Dialog for when no custom handler is provided */}
      {!onContactClick && (
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <ContactForm />
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
