import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ct1Logo from "@/assets/ct1-logo-main.png";

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
  { name: "Fraser, MI", x: 67, y: 35, isHub: true, businessLines: ["construction", "training", "equipment", "consulting"] },
  // Local Michigan Markets
  { name: "Detroit", x: 67.5, y: 36, businessLines: ["construction", "equipment"] },
  { name: "Grand Rapids", x: 65, y: 35, businessLines: ["construction", "training"] },
  { name: "Ann Arbor", x: 66.5, y: 36.5, businessLines: ["training", "consulting"] },
  { name: "Lansing", x: 66, y: 35.5, businessLines: ["construction"] },
  // East Coast
  { name: "New York", x: 80, y: 33, businessLines: ["construction", "consulting"] },
  { name: "Philadelphia", x: 79, y: 35, businessLines: ["training", "consulting"] },
  { name: "Boston", x: 82, y: 30, businessLines: ["consulting", "training"] },
  // Southeast
  { name: "Miami", x: 78, y: 65, businessLines: ["construction", "consulting"] },
  // Midwest
  { name: "Chicago", x: 64, y: 37, businessLines: ["construction", "training"] },
  // South Central
  { name: "Dallas", x: 48, y: 58, businessLines: ["construction", "equipment"] },
  { name: "Houston", x: 47, y: 63, businessLines: ["equipment", "consulting"] },
  { name: "San Antonio", x: 46, y: 64, businessLines: ["construction"] },
  // Mountain West
  { name: "Denver", x: 42, y: 37, businessLines: ["construction", "equipment"] },
  { name: "Phoenix", x: 30, y: 57, businessLines: ["construction"] },
  // West Coast
  { name: "Seattle", x: 18, y: 22, businessLines: ["training", "equipment"] },
  { name: "Los Angeles", x: 20, y: 55, businessLines: ["construction", "equipment", "consulting"] },
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
              <svg className="w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet">
                {/* US Map Shape with 3D Effect */}
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="mapShadow">
                    <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodOpacity="0.3"/>
                  </filter>
                </defs>

                {/* US Map Outline - Accurate shape */}
                <g filter="url(#mapShadow)">
                  <path
                    d="M 15 25 L 17 20 L 18 22 L 19 20 L 20 25 L 22 28 L 24 32 L 26 36 L 28 40 L 30 45 L 32 50 L 30 55 L 28 58 L 25 60 L 22 58 L 20 54 L 18 50 L 16 45 L 15 40 L 14 35 L 15 30 Z 
                       M 32 50 L 35 48 L 40 47 L 45 48 L 48 52 L 50 55 L 52 58 L 50 62 L 48 65 L 46 68 L 44 70 L 42 72 L 40 74 L 38 76 L 36 74 L 34 70 L 32 66 L 30 62 L 32 58 L 34 54 Z
                       M 50 55 L 55 53 L 60 52 L 62 50 L 64 48 L 66 46 L 68 45 L 70 44 L 72 42 L 74 40 L 76 38 L 78 36 L 80 34 L 82 32 L 84 30 L 85 32 L 86 34 L 87 36 L 86 38 L 84 40 L 82 42 L 80 44 L 78 46 L 76 48 L 74 50 L 72 52 L 70 54 L 68 56 L 66 58 L 64 60 L 62 62 L 60 64 L 58 66 L 56 68 L 54 70 L 52 72 L 50 74 L 48 76 L 46 78 L 44 76 L 46 74 L 48 72 L 50 70 L 52 68 L 54 66 L 56 64 L 58 62 L 60 60 L 62 58 L 64 56 L 66 54 L 68 52 L 70 50 L 72 48 L 74 46 L 76 44 L 78 42 L 80 40 L 82 38 L 84 36 L 85 34 L 84 32 L 82 30 L 80 28 L 78 26 L 76 28 L 74 30 L 72 32 L 70 34 L 68 36 L 66 38 L 64 40 L 62 42 L 60 44 L 58 46 L 56 48 L 54 50 L 52 52 Z
                       M 76 58 L 78 60 L 80 64 L 80 68 L 78 72 L 76 74 L 74 76 L 72 78 L 70 76 L 72 74 L 74 72 L 76 68 L 76 64 L 75 60 Z"
                    fill="url(#mapGradient)"
                    stroke="hsl(var(--border))"
                    strokeWidth="0.3"
                    opacity={animationProgress >= 20 ? "1" : "0"}
                    className="transition-opacity duration-1000"
                  />
                </g>

                {/* Connection Lines - Only show after map appears */}
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
                          strokeWidth="0.15"
                          opacity={(progress / 100) * 0.4}
                          strokeDasharray="0.5,0.5"
                          onMouseEnter={() => setHoveredLine(`${city.name}-${businessLine}`)}
                          onMouseLeave={() => setHoveredLine(null)}
                          style={{
                            filter: hoveredLine === `${city.name}-${businessLine}` ? `drop-shadow(0 0 2px ${color})` : 'none',
                            opacity: hoveredLine === `${city.name}-${businessLine}` ? 0.8 : (progress / 100) * 0.4,
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
                            strokeWidth="0.3"
                            opacity="0.6"
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
                  const scale = (progress / 100) * (isHovered ? 1.2 : 1);
                  
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
                          r={2.5 * scale}
                          fill="hsl(var(--primary))"
                          opacity="0.2"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Building marker */}
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={(city.isHub ? 1.5 : 0.8) * scale}
                        fill={city.isHub ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                        stroke={isHovered ? "hsl(var(--primary))" : "hsl(var(--background))"}
                        strokeWidth={isHovered ? "0.3" : "0.2"}
                        style={{
                          filter: isHovered ? 'drop-shadow(0 0 2px hsl(var(--primary)))' : city.isHub ? 'drop-shadow(0 0 1px hsl(var(--primary)))' : 'none',
                        }}
                      />

                      {/* Building icon for larger cities */}
                      {(city.isHub || isHovered) && (
                        <>
                          <rect
                            x={city.x - 0.3 * scale}
                            y={city.y - 0.6 * scale}
                            width={0.6 * scale}
                            height={0.8 * scale}
                            fill={city.isHub ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                            opacity="0.8"
                          />
                          <rect
                            x={city.x - 0.15 * scale}
                            y={city.y - 0.4 * scale}
                            width={0.3 * scale}
                            height={0.3 * scale}
                            fill="hsl(var(--background))"
                            opacity="0.6"
                          />
                        </>
                      )}
                      
                      {/* City label */}
                      {(city.isHub || isHovered) && (
                        <text
                          x={city.x}
                          y={city.y - 2.5}
                          textAnchor="middle"
                          fontSize={city.isHub ? "2" : "1.5"}
                          fill="hsl(var(--foreground))"
                          className="font-bold pointer-events-none"
                          style={{ textShadow: '0 0 3px hsl(var(--background))' }}
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

