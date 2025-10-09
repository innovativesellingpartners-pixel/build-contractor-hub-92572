import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function FloatingTrialButton() {
  return (
    <div className="fixed left-4 top-24 z-40 hidden md:block">
      <Link to="/trial-signup">
        <Button 
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none flex items-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Try CT1 For Free
        </Button>
      </Link>
    </div>
  );
}
