import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function FloatingTrialButton() {
  return (
    <>
      {/* Desktop only - left side */}
      <div className="fixed left-4 top-28 z-50 hidden md:block">
        <Link to="/trial-signup">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 min-w-[160px] px-6 rounded-full font-semibold shadow-[0_6px_24px_rgba(220,38,38,0.5)] transition-all duration-300 hover:scale-105"
          >
            <img src={ct1Logo} alt="CT1" className="h-5 w-5 mr-2" />
            Try CT1 Free
          </Button>
        </Link>
      </div>

      {/* Mobile - top left */}
      <div className="fixed top-3 left-4 z-50 md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Link to="/trial-signup">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5 rounded-full font-semibold shadow-[0_6px_24px_rgba(220,38,38,0.5)] transition-all duration-300 hover:scale-105"
          >
            <img src={ct1Logo} alt="CT1" className="h-5 w-5 mr-2" />
            Try CT1 Free
          </Button>
        </Link>
      </div>
    </>
  );
}
