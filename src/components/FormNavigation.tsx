import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface FormNavigationProps {
  className?: string;
}

export function FormNavigation({ className = "" }: FormNavigationProps) {
  const navigate = useNavigate();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        asChild
      >
        <Link to="/" className="flex items-center gap-1.5">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>
    </div>
  );
}
