import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { MobileNav } from "@/components/MobileNav";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { 
  Star, 
  Video, 
  Award, 
  Target, 
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Play
} from "lucide-react";

export function Training() {
  const features = [
    {
      icon: Video,
      title: "Interactive Video Courses",
      description: "Step-by-step video training from industry experts covering every aspect of your trade"
    },
    {
      icon: Award,
      title: "Industry Certifications",
      description: "Earn recognized certifications that boost your credibility and win more contracts"
    },
    {
      icon: Target,
      title: "Skill Assessments",
      description: "Track progress with comprehensive assessments and personalized learning paths"
    },
    {
      icon: Users,
      title: "Team Training Management",
      description: "Monitor your entire team's progress and ensure consistent quality standards"
    }
  ];

  const benefits = [
    "Increase project quality by 40%",
    "Reduce costly mistakes and rework",
    "Stay ahead of industry standards",
    "Build customer confidence",
    "Command premium pricing",
    "Faster onboarding for new hires"
  ];

  const courses = [
    { category: "Safety & Compliance", count: 45 },
    { category: "Technical Skills", count: 120 },
    { category: "Business Management", count: 38 },
    { category: "Customer Service", count: 22 },
    { category: "Advanced Techniques", count: 67 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">CT1</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">One-Up the Competition</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/business-suite" className="text-foreground hover:text-primary transition-colors font-medium">Back to Suite</Link>
              <Link 
                to="/pricing" 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
              >
                Get Started
              </Link>
            </nav>

            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-yellow-500/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img src={ct1Logo} alt="CT1" className="h-32 w-32 drop-shadow-2xl" />
                <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-12 w-12 fill-yellow-500 text-yellow-500 drop-shadow-lg" />
              ))}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              5-Star Training
              <span className="block text-primary mt-2">Excellence Program</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              World-class training that transforms your team into industry-leading professionals
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Elevate Your Team's <span className="text-primary">Skills & Performance</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 group-hover:scale-110 transition-transform">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits */}
          <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-background">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
                Proven Results for Your Business
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Course Library */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Comprehensive <span className="text-primary">Course Library</span>
            </h2>
            <p className="text-xl text-muted-foreground">Over 290+ courses across all categories</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <Card key={idx} className="group hover:shadow-xl hover:shadow-primary/10 transition-all hover:border-primary/50 border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <span className="text-3xl font-bold text-primary">{course.count}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{course.category}</h3>
                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-500/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-8 w-8 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Start Your <span className="text-primary">5-Star Journey</span> Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of contractors who have elevated their skills and grown their business with CT1 Training.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 font-bold">
                Get Started Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/business-suite">
              <Button size="lg" variant="outline" className="text-xl px-12 py-6 font-bold">
                Back to Suite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
