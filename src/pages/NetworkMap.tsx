import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ct1Logo from "@/assets/ct1-logo-main.png";

// Business lines with colors
const businessLines = {
  construction: { name: "Construction Services", color: "#e31e24" },
  training: { name: "Training & Certification", color: "#f59e0b" },
  equipment: { name: "Equipment & Supply", color: "#3b82f6" },
  consulting: { name: "Business Consulting", color: "#8b5cf6" },
};

type City = {
  name: string;
  x: number;
  y: number;
  revenue: number; // In millions
  customers: number;
  growth: number; // Percentage
  isHub?: boolean;
  businessLines: (keyof typeof businessLines)[];
};

// Market data with metrics
const cities: City[] = [
  // Hub
  { name: "Fraser, MI", x: 52, y: 42, revenue: 25, customers: 5000, growth: 45, isHub: true, businessLines: ["construction", "training", "equipment", "consulting"] },
  // Local Markets
  { name: "Detroit, MI", x: 51, y: 44, revenue: 18, customers: 3800, growth: 38, businessLines: ["construction", "equipment"] },
  { name: "Grand Rapids, MI", x: 48, y: 40, revenue: 12, customers: 2400, growth: 32, businessLines: ["construction", "training"] },
  { name: "Ann Arbor, MI", x: 50, y: 45, revenue: 10, customers: 2000, growth: 28, businessLines: ["training", "consulting"] },
  { name: "Lansing, MI", x: 49, y: 42, revenue: 8, customers: 1600, growth: 25, businessLines: ["construction"] },
  // National Markets
  { name: "New York, NY", x: 72, y: 38, revenue: 22, customers: 4200, growth: 42, businessLines: ["construction", "consulting"] },
  { name: "Los Angeles, CA", x: 12, y: 52, revenue: 20, customers: 4000, growth: 40, businessLines: ["construction", "equipment", "consulting"] },
  { name: "Chicago, IL", x: 46, y: 48, revenue: 19, customers: 3600, growth: 36, businessLines: ["construction", "training"] },
  { name: "Houston, TX", x: 36, y: 68, revenue: 16, customers: 3200, growth: 34, businessLines: ["equipment", "consulting"] },
  { name: "Phoenix, AZ", x: 18, y: 58, revenue: 14, customers: 2800, growth: 30, businessLines: ["construction"] },
  { name: "Philadelphia, PA", x: 73, y: 40, revenue: 13, customers: 2600, growth: 29, businessLines: ["training", "consulting"] },
  { name: "San Antonio, TX", x: 34, y: 70, revenue: 11, customers: 2200, growth: 27, businessLines: ["construction"] },
  { name: "Dallas, TX", x: 38, y: 66, revenue: 15, customers: 3000, growth: 33, businessLines: ["construction", "equipment"] },
  { name: "Miami, FL", x: 68, y: 78, revenue: 17, customers: 3400, growth: 35, businessLines: ["construction", "consulting"] },
  { name: "Seattle, WA", x: 8, y: 28, revenue: 14, customers: 2800, growth: 31, businessLines: ["training", "equipment"] },
  { name: "Boston, MA", x: 76, y: 36, revenue: 16, customers: 3200, growth: 37, businessLines: ["consulting", "training"] },
  { name: "Denver, CO", x: 26, y: 46, revenue: 12, customers: 2400, growth: 26, businessLines: ["construction", "equipment"] },
];

export default function NetworkMap() {
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "customers" | "growth">("revenue");

  const hub = cities.find(c => c.isHub)!;
  const otherCities = cities.filter(c => !c.isHub);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev < 100) return prev + 2;
        return 100;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const getMetricValue = (city: City) => {
    switch (selectedMetric) {
      case "revenue": return city.revenue;
      case "customers": return city.customers / 100;
      case "growth": return city.growth;
    }
  };

  const getMetricLabel = (city: City) => {
    switch (selectedMetric) {
      case "revenue": return `$${city.revenue}M`;
      case "customers": return `${city.customers.toLocaleString()}`;
      case "growth": return `${city.growth}%`;
    }
  };

  const maxMetric = Math.max(...cities.map(getMetricValue));
  const getHeight = (city: City) => {
    const value = getMetricValue(city);
    return city.isHub ? 12 : (value / maxMetric) * 8 + 2;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <img src={ct1Logo} alt="CT1 Logo" className="h-10" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Nationwide Network Overview
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Real-time performance across all markets
            </p>
          </div>

          {/* Metric Selector */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={selectedMetric === "revenue" ? "default" : "outline"}
              onClick={() => setSelectedMetric("revenue")}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Revenue
            </Button>
            <Button
              variant={selectedMetric === "customers" ? "default" : "outline"}
              onClick={() => setSelectedMetric("customers")}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Customers
            </Button>
            <Button
              variant={selectedMetric === "growth" ? "default" : "outline"}
              onClick={() => setSelectedMetric("growth")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Growth
            </Button>
          </div>

          {/* Network Visualization */}
          <Card className="p-6 md:p-10 bg-card/50 backdrop-blur-sm border-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* US Map Wireframe */}
                <g opacity="0.08" stroke="hsl(var(--foreground))" strokeWidth="0.15" fill="none">
                  <path d="M 10 30 L 12 25 L 13 28 L 12 35 L 14 40 L 16 45 L 18 52 L 17 58 L 15 62 L 13 60 L 11 55 L 10 48 L 9 42 L 10 35 Z" />
                  <path d="M 18 52 L 20 48 L 25 47 L 28 50 L 30 52 L 28 58 L 25 60 L 22 58 L 19 56 Z" />
                  <path d="M 18 58 L 22 60 L 28 62 L 32 68 L 35 72 L 33 75 L 28 73 L 23 70 L 20 66 L 17 62 Z" />
                  <path d="M 33 75 L 38 76 L 42 74 L 45 70 L 48 68 L 48 72 L 45 78 L 42 80 L 38 82 L 35 80 L 32 77 Z" />
                  <path d="M 28 50 L 35 48 L 40 50 L 42 52 L 40 58 L 38 62 L 35 65 L 32 68 L 30 65 L 28 60 L 28 55 Z" />
                  <path d="M 40 50 L 48 48 L 52 50 L 50 55 L 48 58 L 45 60 L 42 58 L 40 55 Z" />
                  <path d="M 48 42 L 52 40 L 56 42 L 58 45 L 56 48 L 52 50 L 48 48 Z" />
                  <path d="M 65 35 L 70 33 L 75 35 L 76 38 L 74 42 L 70 44 L 65 42 L 63 38 Z" />
                  <path d="M 63 42 L 68 44 L 72 46 L 73 50 L 70 52 L 65 50 L 62 48 Z" />
                  <path d="M 55 55 L 60 58 L 65 62 L 68 68 L 70 75 L 68 78 L 65 80 L 60 78 L 55 72 L 52 65 L 50 60 L 52 56 Z" />
                  <path d="M 65 78 L 68 82 L 67 88 L 65 90 L 63 88 L 62 82 L 63 78 Z" />
                </g>

                {/* Connection Lines */}
                {otherCities.map((city) => {
                  const sharedBusinessLines = city.businessLines.filter(bl => 
                    hub.businessLines.includes(bl)
                  );
                  
                  return sharedBusinessLines.map((businessLine, idx) => {
                    const color = businessLines[businessLine].color;
                    const offset = (idx - sharedBusinessLines.length / 2) * 0.3;
                    
                    return (
                      <g key={`${city.name}-${businessLine}`}>
                        <line
                          x1={hub.x}
                          y1={hub.y - getHeight(hub)}
                          x2={city.x + offset}
                          y2={city.y - getHeight(city)}
                          stroke={color}
                          strokeWidth="0.2"
                          opacity={animationProgress >= 50 ? "0.3" : "0"}
                          strokeDasharray="1,1"
                          className="transition-opacity duration-1000"
                          onMouseEnter={() => setHoveredLine(`${city.name}-${businessLine}`)}
                          onMouseLeave={() => setHoveredLine(null)}
                          style={{
                            filter: hoveredLine === `${city.name}-${businessLine}` ? 'drop-shadow(0 0 2px currentColor)' : 'none',
                            opacity: hoveredLine === `${city.name}-${businessLine}` ? 0.8 : animationProgress >= 50 ? 0.3 : 0,
                          }}
                        />
                        {hoveredLine === `${city.name}-${businessLine}` && (
                          <g>
                            <line
                              x1={hub.x}
                              y1={hub.y - getHeight(hub)}
                              x2={city.x + offset}
                              y2={city.y - getHeight(city)}
                              stroke={color}
                              strokeWidth="0.4"
                              opacity="0.6"
                              className="animate-pulse"
                            />
                          </g>
                        )}
                      </g>
                    );
                  });
                })}

                {/* Buildings */}
                {cities.map((city) => {
                  const height = getHeight(city);
                  const animatedHeight = (height * animationProgress) / 100;
                  const isHovered = hoveredCity?.name === city.name;
                  
                  return (
                    <g
                      key={city.name}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                      className="cursor-pointer transition-all duration-300"
                      style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)', transformOrigin: `${city.x}% ${city.y}%` }}
                    >
                      {/* Building shadow */}
                      <rect
                        x={city.x - (city.isHub ? 1.5 : 0.8)}
                        y={city.y + 0.5}
                        width={city.isHub ? 3 : 1.6}
                        height={animatedHeight}
                        fill="hsl(var(--foreground))"
                        opacity="0.1"
                        rx="0.2"
                      />
                      
                      {/* Building body */}
                      <rect
                        x={city.x - (city.isHub ? 1.5 : 0.8)}
                        y={city.y - animatedHeight}
                        width={city.isHub ? 3 : 1.6}
                        height={animatedHeight}
                        fill={city.isHub ? "url(#hubGradient)" : "url(#buildingGradient)"}
                        stroke={isHovered ? "hsl(var(--primary))" : "hsl(var(--border))"}
                        strokeWidth={isHovered ? "0.3" : "0.15"}
                        rx="0.2"
                        className="transition-all duration-300"
                        style={{
                          filter: isHovered ? 'drop-shadow(0 0 3px hsl(var(--primary)))' : 'none',
                        }}
                      />
                      
                      {/* Building windows */}
                      {Array.from({ length: Math.floor(animatedHeight / 1.5) }).map((_, i) => (
                        <g key={i}>
                          <rect
                            x={city.x - (city.isHub ? 1.2 : 0.5)}
                            y={city.y - animatedHeight + i * 1.5 + 0.5}
                            width={city.isHub ? 0.6 : 0.3}
                            height={0.8}
                            fill="hsl(var(--primary))"
                            opacity={isHovered ? "0.8" : "0.3"}
                            className="transition-opacity duration-300"
                          />
                          {city.isHub && (
                            <rect
                              x={city.x + 0.6}
                              y={city.y - animatedHeight + i * 1.5 + 0.5}
                              width={0.6}
                              height={0.8}
                              fill="hsl(var(--primary))"
                              opacity={isHovered ? "0.8" : "0.3"}
                              className="transition-opacity duration-300"
                            />
                          )}
                        </g>
                      ))}
                      
                      {/* City label */}
                      {(isHovered || city.isHub) && (
                        <text
                          x={city.x}
                          y={city.y - animatedHeight - 1.5}
                          textAnchor="middle"
                          fontSize={city.isHub ? "1.8" : "1.4"}
                          fill="hsl(var(--foreground))"
                          className="font-bold"
                        >
                          {city.name}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="hubGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Hover Tooltip */}
              {hoveredCity && (
                <div
                  className="absolute bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-xl pointer-events-none z-50 animate-fade-in"
                  style={{
                    left: `${hoveredCity.x}%`,
                    top: `${hoveredCity.y - getHeight(hoveredCity) - 5}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="font-bold text-foreground mb-2">{hoveredCity.name}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-semibold">${hoveredCity.revenue}M</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Customers:</span>
                      <span className="font-semibold">{hoveredCity.customers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Growth:</span>
                      <span className="font-semibold text-green-500">{hoveredCity.growth}%</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">Business Lines:</div>
                    <div className="flex flex-wrap gap-1">
                      {hoveredCity.businessLines.map(bl => (
                        <div
                          key={bl}
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: businessLines[bl].color, color: 'white' }}
                        >
                          {businessLines[bl].name.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Hover Tooltip */}
              {hoveredLine && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border rounded-lg px-4 py-2 shadow-xl pointer-events-none animate-fade-in">
                  <div className="text-sm font-semibold">
                    {businessLines[hoveredLine.split('-')[1] as keyof typeof businessLines]?.name}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(businessLines).map(([key, value]) => (
              <Card key={key} className="p-4 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: value.color }}
                  ></div>
                  <span className="text-sm font-medium">{value.name}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <DollarSign className="h-8 w-8 text-primary mb-3" />
              <div className="text-3xl font-bold mb-1">
                ${cities.reduce((sum, c) => sum + c.revenue, 0)}M
              </div>
              <div className="text-muted-foreground">Total Revenue</div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <Users className="h-8 w-8 text-primary mb-3" />
              <div className="text-3xl font-bold mb-1">
                {cities.reduce((sum, c) => sum + c.customers, 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Customers</div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <div className="text-3xl font-bold mb-1">
                {(cities.reduce((sum, c) => sum + c.growth, 0) / cities.length).toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Average Growth</div>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-br from-card to-muted/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Join Our Network?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Connect with industry leaders and grow your business nationwide
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg">Contact Us</Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline">View Plans</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

