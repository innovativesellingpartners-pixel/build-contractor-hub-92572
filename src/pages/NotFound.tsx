import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with Logo */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">CT1</h1>
              <p className="text-xs text-muted-foreground font-medium">One-Up Your Business</p>
            </div>
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center px-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-24 w-24 mx-auto mb-8 opacity-50" />
          <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Oops! Page not found</h2>
          <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-5 w-5" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
