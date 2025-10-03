import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ct1Logo from "@/assets/ct1-logo-main.png";

// Business lines with colors
const businessLines = {
  construction: { name: "Construction", color: "hsl(var(--primary))" },
  training: { name: "Training", color: "hsl(35, 91%, 51%)" },
  equipment: { name: "Equipment", color: "hsl(217, 91%, 60%)" },
  consulting: { name: "Consulting", color: "hsl(258, 77%, 62%)" },
};

type BusinessLine = keyof typeof businessLines;

// States with CT1 presence
type StateData = {
  name: string;
  abbr: string;
  active: boolean;
  businessLines?: BusinessLine[];
};

const statesData: Record<string, StateData> = {
  MI: { name: "Michigan", abbr: "MI", active: true, businessLines: ["construction", "training", "equipment", "consulting"] },
  NY: { name: "New York", abbr: "NY", active: true, businessLines: ["construction", "consulting"] },
  PA: { name: "Pennsylvania", abbr: "PA", active: true, businessLines: ["training", "consulting"] },
  MA: { name: "Massachusetts", abbr: "MA", active: true, businessLines: ["consulting", "training"] },
  FL: { name: "Florida", abbr: "FL", active: true, businessLines: ["construction", "consulting"] },
  IL: { name: "Illinois", abbr: "IL", active: true, businessLines: ["construction", "training"] },
  TX: { name: "Texas", abbr: "TX", active: true, businessLines: ["construction", "equipment"] },
  CO: { name: "Colorado", abbr: "CO", active: true, businessLines: ["construction", "equipment"] },
  AZ: { name: "Arizona", abbr: "AZ", active: true, businessLines: ["construction"] },
  WA: { name: "Washington", abbr: "WA", active: true, businessLines: ["training", "equipment"] },
  CA: { name: "California", abbr: "CA", active: true, businessLines: ["construction", "equipment", "consulting"] },
};

// Simplified US state paths (all 50 states + DC)
const statePaths: Record<string, string> = {
  AL: "M774 394l2-38-1-9-2-12-3-3-4-1-10 0-14-1-14-2-13-1-16-1-1 11 0 11 0 13 1 16 4 17 4 13 5 13 6 11 4 7 4 5 5 4 9-1 8-1 8 0 7 0 11 0 8-1 4-6 2-10 2-17 1-12-1-11Z",
  AK: "M133 450l3-1 3 0 2 1 2 2 1 3 0 3-2 3-3 2-3 0-3-1-2-2-1-3 0-3 2-3 2-1Zm40-10l3-1 4 1 2 2 1 3-1 3-2 2-3 1-4-1-2-2-1-3 1-3 2-2Zm-60-5l3 0 3 1 1 2 1 3-1 3-2 2-3 1-3 0-2-2-1-3 0-3 2-2 2-1Z",
  AZ: "M197 282l0-19-1-19-1-22-2-29-3-31-4-38-5-31-32 6-32 7-33 7-33 7-33 7-1 3 0 4 1 9 2 17 3 20 5 28 6 31 7 32 8 32 8 30 21-4 20-4 20-4 20-4 19-4 20-4 20-4Z",
  AR: "M586 313l1-6 2-7 2-7 3-7 3-5 3-5 3-3 6-5-1-2-2-3-2-2-2-2-23-4-22-4-15-3-15-2-12-2-6-1-4 0-1 6-1 12-1 13-1 13-1 10-1 4-1 2-1 1-2 1-3 0-3 1-1 1-1 3-1 4 0 13 0 13 1 13 1 12 1 13 1 13 1 13 26 3 27 4 26 4 26 3 1-10 1-12 2-17 2-18 1-10 1-10 0-11-1-11-1-10-2-11Z",
  CA: "M96 68l-3 18-4 20-5 23-7 29-8 32-9 35-10 39-11 42-12 45-12 47-8 30 3 3 4 1 5 0 8 1 6 2 5 3 4 4 2 3 2 4 2 5 3 8 4 12 5 16 7 20 7 21 4 10 4 7 5 5 6 3 7 2 16 2 12 1 3-4 2-5 2-8 1-10 1-13 1-17 1-22 1-27 0-32 0-30 0-24 1-19 1-14 2-11 3-6 20-4 20-5 21-4 20-4 20-4 20-4 20-5 21-4 20-4 20-5-27-43-24-37-11-18-4-7-4-8-4-10-4-13-3-14-3-16-2-18-1-20-1-22 0-25 0-26 1-28 2-27-8-3-9-1-10 1-9 2-8 4-7 5-8 9-9 11-6 8-4 6-7 10-8 13-5 9Z",

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
