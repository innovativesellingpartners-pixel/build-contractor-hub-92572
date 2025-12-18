import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronDown, Bot, Mic, Rocket, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MobileNavProps {
  onContactClick?: () => void;
}

export function MobileNav({ onContactClick }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-zinc-800 hover:text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
        <nav className="flex flex-col space-y-4 mt-8">
          {/* Contractor Login at top for easy access */}
          <Link to="/auth" onClick={() => setOpen(false)}>
            <Button className="w-full text-lg font-medium" size="lg">
              Contractor Login
            </Button>
          </Link>
          
          <div className="border-t border-border my-2" />
          
          <Link 
            to="/what-we-do" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            What We Do
          </Link>
          
          {/* Products Dropdown */}
          <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-lg font-medium text-foreground hover:text-primary transition-colors py-2">
              Products
              <ChevronDown className={`h-5 w-5 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-3 mt-2">
              <Link 
                to="/products/pocketbot" 
                className="flex items-center gap-3 py-2 hover:bg-muted rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-base font-medium text-foreground">MyCT1 Pocketbot</div>
                  <p className="text-xs text-muted-foreground">Complete AI business assistant</p>
                </div>
              </Link>
              <Link 
                to="/products/voice-ai" 
                className="flex items-center gap-3 py-2 hover:bg-muted rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Mic className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-base font-medium text-foreground">AI Voice Assistant</div>
                  <p className="text-xs text-muted-foreground">24/7 AI call handling</p>
                </div>
              </Link>
              <div className="border-t border-border my-2" />
              <Link 
                to="/products/tier-launch" 
                className="flex items-center gap-3 py-2 hover:bg-muted rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Rocket className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-base font-medium text-foreground">myCT1 Launch Growth Starter</div>
                  <p className="text-xs text-muted-foreground">Perfect for getting started</p>
                </div>
              </Link>
              <Link 
                to="/products/tier-growth" 
                className="flex items-center gap-3 py-2 hover:bg-muted rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-base font-medium text-foreground">myCT1 Growth Business Builder</div>
                  <p className="text-xs text-muted-foreground">Scale your operations</p>
                </div>
              </Link>
              <Link 
                to="/products/tier-market" 
                className="flex items-center gap-3 py-2 hover:bg-muted rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-base font-medium text-foreground">myCT1 Market Dominator</div>
                  <p className="text-xs text-muted-foreground">Maximum growth potential</p>
                </div>
              </Link>
              <div className="border-t border-border my-2" />
              <Link 
                to="/pricing" 
                className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg px-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="text-base font-medium text-primary">View All Pricing</span>
              </Link>
            </CollapsibleContent>
          </Collapsible>
          
          <Link 
            to="/trades-we-serve" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            Trades We Serve
          </Link>
          <Link 
            to="/core-values" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            Core Values
          </Link>
          <Link 
            to="/blog-podcast" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            Blog & Podcast
          </Link>
          
          {onContactClick && (
            <Button 
              variant="outline" 
              className="w-full justify-start text-lg font-medium"
              onClick={() => {
                onContactClick();
                setOpen(false);
              }}
            >
              Contact Sales
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
