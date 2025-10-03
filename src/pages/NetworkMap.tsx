import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ct1Logo from "@/assets/ct1-logo-main.png";
import usMapBackground from "@/assets/us-map-reference.webp";

// Business lines with colors
const businessLines = {
  construction: { name: "Construction", color: "#e31e24" },
  training: { name: "Training", color: "#f59e0b" },
  equipment: { name: "Equipment", color: "#3b82f6" },
  consulting: { name: "Consulting", color: "#8b5cf6" },
};

type City = {
  name: string;
  x: number; // Percentage position on map
  y: number; // Percentage position on map
  isHub?: boolean;
  businessLines: (keyof typeof businessLines)[];
};

// Cities positioned geographically on the US map
const cities: City[] = [
  // Hub - Michigan
  { name: "Fraser, MI", x: 70, y: 28, isHub: true, businessLines: ["construction", "training", "equipment", "consulting"] },
  // Local Michigan Markets
  { name: "Detroit", x: 70.5, y: 29, businessLines: ["construction", "equipment"] },
  { name: "Grand Rapids", x: 69, y: 27, businessLines: ["construction", "training"] },
  { name: "Ann Arbor", x: 69.5, y: 29.5, businessLines: ["training", "consulting"] },
  { name: "Lansing", x: 69.3, y: 28, businessLines: ["construction"] },
  // East Coast
  { name: "New York", x: 82, y: 25, businessLines: ["construction", "consulting"] },
  { name: "Philadelphia", x: 81, y: 28, businessLines: ["training", "consulting"] },
  { name: "Boston", x: 84, y: 22, businessLines: ["consulting", "training"] },
  // Southeast
  { name: "Miami", x: 78, y: 63, businessLines: ["construction", "consulting"] },
  // Midwest
  { name: "Chicago", x: 67, y: 29, businessLines: ["construction", "training"] },
  // South Central
  { name: "Dallas", x: 50, y: 52, businessLines: ["construction", "equipment"] },
  { name: "Houston", x: 51, y: 58, businessLines: ["equipment", "consulting"] },
  { name: "San Antonio", x: 49, y: 60, businessLines: ["construction"] },
  // Mountain West
  { name: "Denver", x: 43, y: 31, businessLines: ["construction", "equipment"] },
  { name: "Phoenix", x: 33, y: 52, businessLines: ["construction"] },
  // West Coast
  { name: "Seattle", x: 18, y: 18, businessLines: ["training", "equipment"] },
  { name: "Los Angeles", x: 20, y: 50, businessLines: ["construction", "equipment", "consulting"] },
];

export default function NetworkMap() {
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const hub = cities.find(c => c.isHub)!;
  const otherCities = cities.filter(c => !c.isHub);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev < 100) return prev + 1;
        return 100;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

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
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              CT1 Nationwide Reach
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Connecting premier contractors from Fraser, Michigan to markets across America
            </p>
          </div>

          {/* Network Visualization */}
          <Card className="p-6 md:p-12 bg-card/30 backdrop-blur-sm border-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative w-full aspect-[16/10]">
              {/* US Map Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={usMapBackground} 
                  alt="United States Map" 
                  className="w-full h-full object-contain"
                  style={{
                    opacity: animationProgress >= 20 ? "0.4" : "0",
                    transition: "opacity 1s"
                  }}
                />
              </div>

              {/* SVG Overlay for connections and markers */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* Connection Lines */}
                {animationProgress >= 40 && otherCities.map((city, idx) => {
                  const progress = Math.min(100, Math.max(0, (animationProgress - 40 - idx * 2)));
                  if (progress === 0) return null;

                  const sharedBusinessLines = city.businessLines.filter(bl => 
                    hub.businessLines.includes(bl)
                  );
                  
                  return sharedBusinessLines.map((businessLine, lineIdx) => {
                    const color = businessLines[businessLine].color;
                    const offset = (lineIdx - sharedBusinessLines.length / 2) * 0.15;
                    
                    return (
                      <g key={`${city.name}-${businessLine}`}>
                        <line
                          x1={hub.x}
                          y1={hub.y}
                          x2={city.x + offset}
                          y2={city.y}
                          stroke={color}
                          strokeWidth="0.2"
                          opacity={(progress / 100) * 0.5}
                          strokeDasharray="0.5,0.5"
                          onMouseEnter={() => setHoveredLine(`${city.name}-${businessLine}`)}
                          onMouseLeave={() => setHoveredLine(null)}
                          style={{
                            filter: hoveredLine === `${city.name}-${businessLine}` ? `drop-shadow(0 0 2px ${color})` : 'none',
                            opacity: hoveredLine === `${city.name}-${businessLine}` ? 0.9 : (progress / 100) * 0.5,
                          }}
                          className="transition-all duration-300 cursor-pointer"
                        />
                        {hoveredLine === `${city.name}-${businessLine}` && (
                          <line
                            x1={hub.x}
                            y1={hub.y}
                            x2={city.x + offset}
                            y2={city.y}
                            stroke={color}
                            strokeWidth="0.4"
                            opacity="0.7"
                            className="animate-pulse pointer-events-none"
                          />
                        )}
                      </g>
                    );
                  });
                })}

                {/* City Markers */}
                {cities.map((city, idx) => {
                  const delay = city.isHub ? 30 : 40 + idx * 2;
                  const progress = Math.min(100, Math.max(0, (animationProgress - delay)));
                  if (progress === 0) return null;

                  const isHovered = hoveredCity?.name === city.name;
                  const scale = (progress / 100) * (isHovered ? 1.3 : 1);
                  
                  return (
                    <g
                      key={city.name}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                      className="cursor-pointer transition-transform duration-300"
                      opacity={progress / 100}
                    >
                      {/* Glow effect for hub */}
                      {city.isHub && (
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r={3 * scale}
                          fill="hsl(var(--primary))"
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Building marker */}
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={(city.isHub ? 1.8 : 1) * scale}
                        fill={city.isHub ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                        stroke={isHovered ? "hsl(var(--primary))" : "hsl(var(--background))"}
                        strokeWidth={isHovered ? "0.3" : "0.2"}
                        style={{
                          filter: isHovered ? 'drop-shadow(0 0 2px hsl(var(--primary)))' : city.isHub ? 'drop-shadow(0 0 1.5px hsl(var(--primary)))' : 'none',
                        }}
                      />

                      {/* Building icon */}
                      {(city.isHub || isHovered) && (
                        <>
                          <rect
                            x={city.x - 0.4 * scale}
                            y={city.y - 0.8 * scale}
                            width={0.8 * scale}
                            height={1.2 * scale}
                            fill={city.isHub ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                            opacity="0.9"
                          />
                          <rect
                            x={city.x - 0.2 * scale}
                            y={city.y - 0.5 * scale}
                            width={0.4 * scale}
                            height={0.4 * scale}
                            fill="hsl(var(--background))"
                            opacity="0.7"
                          />
                        </>
                      )}
                      
                      {/* City label */}
                      {(city.isHub || isHovered) && (
                        <text
                          x={city.x}
                          y={city.y - 3}
                          textAnchor="middle"
                          fontSize={city.isHub ? "2.5" : "1.8"}
                          fill="hsl(var(--foreground))"
                          fontWeight="bold"
                          className="pointer-events-none"
                          style={{ 
                            textShadow: '0 0 4px hsl(var(--background)), 0 0 8px hsl(var(--background))',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                          }}
                        >
                          {city.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip */}
              {hoveredCity && (
                <div
                  className="absolute bg-card/95 backdrop-blur-md border-2 border-border rounded-lg p-4 shadow-2xl pointer-events-none z-50 animate-fade-in"
                  style={{
                    left: `${hoveredCity.x}%`,
                    top: `${hoveredCity.y}%`,
                    transform: 'translate(-50%, -120%)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div className="font-bold text-lg">{hoveredCity.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground font-medium">Service Lines:</div>
                    <div className="flex flex-wrap gap-2">
                      {hoveredCity.businessLines.map(bl => (
                        <div
                          key={bl}
                          className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{ 
                            backgroundColor: businessLines[bl].color, 
                            color: 'white',
                            boxShadow: `0 2px 8px ${businessLines[bl].color}40`
                          }}
                        >
                          {businessLines[bl].name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Hover Tooltip */}
              {hoveredLine && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border rounded-lg px-4 py-2 shadow-xl pointer-events-none animate-fade-in">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: businessLines[hoveredLine.split('-')[1] as keyof typeof businessLines]?.color }}
                    ></div>
                    {businessLines[hoveredLine.split('-')[1] as keyof typeof businessLines]?.name}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 text-center">Service Lines</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessLines).map(([key, value]) => (
                <Card key={key} className="p-4 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-lg"
                      style={{ 
                        backgroundColor: value.color,
                        boxShadow: `0 2px 12px ${value.color}60`
                      }}
                    ></div>
                    <span className="text-sm font-medium">{value.name}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-4xl font-bold text-primary mb-2">{cities.length}</div>
              <div className="text-muted-foreground">Active Markets</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-4xl font-bold text-primary mb-2">{Object.keys(businessLines).length}</div>
              <div className="text-muted-foreground">Service Lines</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Network Support</div>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Card className="p-10 bg-gradient-to-br from-card via-card to-muted/20 border-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Expand Your Reach with CT1
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our nationwide network and connect with industry-leading contractors across America
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
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
