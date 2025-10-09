import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ct1Logo from "@/assets/ct1-logo-main.png";

export function FloatingTrialButton() {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-24 z-40 hidden md:block">
      <Link to="/trial-signup">
        <Button 
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <img src={ct1Logo} alt="CT1 Logo" className="h-5 w-5" />
          Try CT1 For Free
        </Button>
      </Link>
    </div>
  );
}
