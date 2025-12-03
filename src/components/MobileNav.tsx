import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  onContactClick?: () => void;
}

export function MobileNav({ onContactClick }: MobileNavProps) {
  const [open, setOpen] = useState(false);

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
          <Link 
            to="/pricing" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            Products
          </Link>
          <Link 
            to="/pricing" 
            className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>
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