import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="lg:hidden">
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
            <CollapsibleContent className="pl-4 space-y-2 mt-2">
              <Link 
                to="/products/pocketbot" 
                className="block text-base text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                myCT1 Pocketbot
              </Link>
              <Link 
                to="/products/voice-ai" 
                className="block text-base text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                AI Voice Assistant
              </Link>
              <div className="border-t border-border my-2" />
              <Link 
                to="/pricing#tier-launch" 
                className="block text-base text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                myCT1 Launch (Tier 1)
              </Link>
              <Link 
                to="/pricing#tier-growth" 
                className="block text-base text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                myCT1 Growth (Tier 2)
              </Link>
              <Link 
                to="/pricing#tier-market" 
                className="block text-base text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                myCT1 Market (Tier 3)
              </Link>
              <div className="border-t border-border my-2" />
              <Link 
                to="/pricing" 
                className="block text-base font-medium text-primary hover:text-primary/80 transition-colors py-2"
                onClick={() => setOpen(false)}
              >
                View All Pricing
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
