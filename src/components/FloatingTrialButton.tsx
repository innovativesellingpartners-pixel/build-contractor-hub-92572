import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function FloatingTrialButton() {
  return (
    <div className="fixed left-4 top-28 z-50 hidden md:block">
      <Link to="/trial-signup">
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 min-w-[160px] px-6 rounded-full font-semibold shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <img src={ct1Logo} alt="CT1 Logo" className="h-4 w-4" />
          Try CT1 Free
        </Button>
      </Link>
    </div>
  );
}
