import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ct1Logo from "@/assets/ct1-logo-main.png";

// Market locations with coordinates (relative to Fraser, MI at center)
const markets = {
  hub: { name: "Fraser, MI", x: 50, y: 45, isHub: true },
  local: [
    { name: "Detroit, MI", x: 48, y: 47 },
    { name: "Grand Rapids, MI", x: 45, y: 43 },
    { name: "Ann Arbor, MI", x: 47, y: 48 },
    { name: "Lansing, MI", x: 46, y: 44 },
  ],
  national: [
    { name: "New York, NY", x: 70, y: 40 },
    { name: "Los Angeles, CA", x: 15, y: 55 },
    { name: "Chicago, IL", x: 45, y: 50 },
    { name: "Houston, TX", x: 35, y: 70 },
    { name: "Phoenix, AZ", x: 20, y: 60 },
    { name: "Philadelphia, PA", x: 72, y: 42 },
    { name: "San Antonio, TX", x: 33, y: 72 },
    { name: "Dallas, TX", x: 37, y: 68 },
    { name: "Miami, FL", x: 65, y: 80 },
    { name: "Seattle, WA", x: 10, y: 25 },
    { name: "Boston, MA", x: 75, y: 35 },
    { name: "Denver, CO", x: 25, y: 45 },
  ],
};

export default function NetworkMap() {
  const [animatedConnections, setAnimatedConnections] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedConnections((prev) => {
        if (prev < markets.local.length + markets.national.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const allMarkets = [...markets.local, ...markets.national];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <img src={ct1Logo} alt="CT1 Logo" className="h-10" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              CT1 Nationwide Network
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              A Network of the Nation's Leading Contractors
            </p>
            <p className="text-base md:text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              From our hub in Fraser, Michigan, we connect with top contractors across local and national markets
            </p>
          </div>

          {/* Network Map Visualization */}
          <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-2">
            <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg overflow-hidden">
              {/* SVG Map */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* US Map Outline - Simplified */}
                <g opacity="0.15" stroke="hsl(var(--foreground))" strokeWidth="0.3" fill="hsl(var(--muted))">
                  {/* West Coast */}
                  <path d="M 10 30 L 12 25 L 13 28 L 12 35 L 14 40 L 16 45 L 18 52 L 17 58 L 15 62 L 13 60 L 11 55 L 10 48 L 9 42 L 10 35 Z" />
                  {/* Mountain States */}
                  <path d="M 18 52 L 20 48 L 25 47 L 28 50 L 30 52 L 28 58 L 25 60 L 22 58 L 19 56 Z" />
                  {/* Southwest */}
                  <path d="M 18 58 L 22 60 L 28 62 L 32 68 L 35 72 L 33 75 L 28 73 L 23 70 L 20 66 L 17 62 Z" />
                  {/* Texas */}
                  <path d="M 33 75 L 38 76 L 42 74 L 45 70 L 48 68 L 48 72 L 45 78 L 42 80 L 38 82 L 35 80 L 32 77 Z" />
                  {/* Great Plains */}
                  <path d="M 28 50 L 35 48 L 40 50 L 42 52 L 40 58 L 38 62 L 35 65 L 32 68 L 30 65 L 28 60 L 28 55 Z" />
                  {/* Midwest */}
                  <path d="M 40 50 L 48 48 L 52 50 L 50 55 L 48 58 L 45 60 L 42 58 L 40 55 Z" />
                  {/* Great Lakes */}
                  <path d="M 48 42 L 52 40 L 56 42 L 58 45 L 56 48 L 52 50 L 48 48 Z" />
                  {/* Northeast */}
                  <path d="M 65 35 L 70 33 L 75 35 L 76 38 L 74 42 L 70 44 L 65 42 L 63 38 Z" />
                  {/* Mid-Atlantic */}
                  <path d="M 63 42 L 68 44 L 72 46 L 73 50 L 70 52 L 65 50 L 62 48 Z" />
                  {/* Southeast */}
                  <path d="M 55 55 L 60 58 L 65 62 L 68 68 L 70 75 L 68 78 L 65 80 L 60 78 L 55 72 L 52 65 L 50 60 L 52 56 Z" />
                  {/* Florida */}
                  <path d="M 65 78 L 68 82 L 67 88 L 65 90 L 63 88 L 62 82 L 63 78 Z" />
                  {/* Michigan (emphasized) */}
                  <path d="M 48 40 L 52 38 L 56 40 L 58 43 L 56 46 L 52 48 L 48 46 L 46 43 Z" strokeWidth="0.5" stroke="hsl(var(--primary))" opacity="0.3" />
                </g>
                
                {/* Connection Lines */}
                {allMarkets.map((market, index) => {
                  if (index < animatedConnections) {
                    const dx = market.x - markets.hub.x;
                    const dy = market.y - markets.hub.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const controlX = (markets.hub.x + market.x) / 2 + (dy * 0.3);
                    const controlY = (markets.hub.y + market.y) / 2 - (dx * 0.2);
                    
                    return (
                      <g key={market.name}>
                        <path
                          d={`M ${markets.hub.x} ${markets.hub.y} Q ${controlX} ${controlY} ${market.x} ${market.y}`}
                          stroke="hsl(var(--primary))"
                          strokeWidth="0.3"
                          fill="none"
                          opacity="0.4"
                          className="animate-fade-in"
                        />
                        <path
                          d={`M ${markets.hub.x} ${markets.hub.y} Q ${controlX} ${controlY} ${market.x} ${market.y}`}
                          stroke="hsl(var(--primary))"
                          strokeWidth="0.5"
                          fill="none"
                          opacity="0.8"
                          strokeDasharray="2,2"
                          className="animate-pulse"
                        />
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Market Points */}
                {allMarkets.map((market, index) => {
                  if (index < animatedConnections) {
                    return (
                      <g key={market.name} className="animate-scale-in">
                        <circle
                          cx={market.x}
                          cy={market.y}
                          r="1.5"
                          fill="hsl(var(--primary))"
                          opacity="0.6"
                        />
                        <circle
                          cx={market.x}
                          cy={market.y}
                          r="0.8"
                          fill="hsl(var(--primary))"
                          className="animate-pulse"
                        />
                        <text
                          x={market.x}
                          y={market.y - 2.5}
                          textAnchor="middle"
                          fontSize="2"
                          fill="hsl(var(--foreground))"
                          className="font-medium"
                        >
                          {market.name}
                        </text>
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Hub Point - Fraser, MI */}
                <g className="animate-scale-in">
                  <circle
                    cx={markets.hub.x}
                    cy={markets.hub.y}
                    r="3"
                    fill="hsl(var(--primary))"
                    opacity="0.3"
                    className="animate-pulse"
                  />
                  <circle
                    cx={markets.hub.x}
                    cy={markets.hub.y}
                    r="2"
                    fill="hsl(var(--primary))"
                  />
                  <text
                    x={markets.hub.x}
                    y={markets.hub.y - 4}
                    textAnchor="middle"
                    fontSize="2.5"
                    fill="hsl(var(--primary))"
                    className="font-bold"
                  >
                    {markets.hub.name}
                  </text>
                  <text
                    x={markets.hub.x}
                    y={markets.hub.y - 1}
                    textAnchor="middle"
                    fontSize="1.8"
                    fill="hsl(var(--muted-foreground))"
                  >
                    CT1 HQ
                  </text>
                </g>
              </svg>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="text-4xl font-bold text-primary mb-2">1</div>
              <div className="text-muted-foreground">Central Hub</div>
              <div className="text-sm text-muted-foreground mt-1">Fraser, Michigan</div>
            </Card>
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="text-4xl font-bold text-primary mb-2">{markets.local.length}</div>
              <div className="text-muted-foreground">Local Markets</div>
              <div className="text-sm text-muted-foreground mt-1">Michigan Region</div>
            </Card>
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="text-4xl font-bold text-primary mb-2">{markets.national.length}</div>
              <div className="text-muted-foreground">National Markets</div>
              <div className="text-sm text-muted-foreground mt-1">Coast to Coast</div>
            </Card>
          </div>

          {/* Market Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Local Markets */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Local Markets
              </h3>
              <div className="space-y-2">
                {markets.local.map((market) => (
                  <div
                    key={market.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-foreground">{market.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* National Markets */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                National Markets
              </h3>
              <div className="space-y-2">
                {markets.national.map((market) => (
                  <div
                    key={market.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-foreground">{market.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join Our Network
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect with the nation's leading contractors and grow your business with CT1
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Today
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

