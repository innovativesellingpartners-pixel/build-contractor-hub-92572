import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-training-platform.jpg";
import { ImageIcon } from "lucide-react";
import {
  Star,
  Video,
  Award,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function Training() {
  const stats = [
    { number: "290+", label: "Courses Available" },
    { number: "40%", label: "Quality Increase" },
    { number: "5-Star", label: "Training Program" },
    { number: "24/7", label: "Access Anytime" },
  ];

  const storyCards = [
    { icon: Video, title: "Video Courses", description: "Step-by-step training from industry experts" },
    { icon: Award, title: "Certifications", description: "Earn recognized certifications for your trade" },
    { icon: Target, title: "Skill Assessments", description: "Track progress with personalized learning paths" },
    { icon: Users, title: "Team Management", description: "Monitor your entire team's training progress" },
  ];

  const features = [
    { icon: Video, title: "Interactive Video Courses", description: "Step-by-step video training from industry experts covering every aspect of your trade." },
    { icon: Award, title: "Industry Certifications", description: "Earn recognized certifications that boost your credibility and win more contracts." },
    { icon: Target, title: "Skill Assessments", description: "Track progress with comprehensive assessments and personalized learning paths." },
    { icon: Users, title: "Team Training", description: "Monitor your entire team's progress and ensure consistent quality standards." },
    { icon: BookOpen, title: "Safety & Compliance", description: "45+ courses covering OSHA compliance, job site safety, and best practices." },
    { icon: TrendingUp, title: "Business Management", description: "38 courses on running a profitable contracting business and scaling operations." },
    { icon: Star, title: "Customer Service", description: "22 courses on building lasting customer relationships and earning 5-star reviews." },
    { icon: Award, title: "Advanced Techniques", description: "67 courses on cutting-edge techniques and methods for your specific trade." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Star className="h-5 w-5 mr-2" />
              5-Star Training
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              World-Class Training for <span className="text-primary">Contractors</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your team into industry-leading professionals with comprehensive training, certifications, and skill assessments.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 card-ct1">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Column Story Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Elevate Your Team's <span className="text-primary">Skills</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The best contractors never stop learning. CT1's 5-Star Training Program gives your team access to 290+ courses covering technical skills, safety, business management, and customer service.
                </p>
                <p>
                  Earn industry-recognized certifications that boost your credibility with customers and help you command premium pricing. Track every team member's progress with personalized learning paths.
                </p>
                <p>
                  Contractors who invest in training see a 40% increase in project quality, reduced rework, and faster onboarding for new hires.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {storyCards.slice(0, 2).map((card, index) => (
                  <Card key={index} className="p-4 card-ct1">
                    <card.icon className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">{card.title}</h4>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </Card>
                ))}
              </div>
              <div className="space-y-4 mt-8">
                {storyCards.slice(2, 4).map((card, index) => (
                  <Card key={index} className="p-4 card-ct1">
                    <card.icon className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-semibold">{card.title}</h4>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Showcase */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary px-4 py-2 text-lg">
              <ImageIcon className="h-5 w-5 mr-2" />
              See It In Action
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Training <span className="text-primary">Hub</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what world-class training looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              "Course Library - Browse 290+ courses by category and trade",
              "Video Player - Interactive lessons with progress tracking",
              "Team Dashboard - Monitor your entire crew's certifications",
            ].map((label, index) => (
              <div key={index} className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-4">
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Comprehensive <span className="text-primary">Course Library</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Over 290+ courses across all categories to elevate every aspect of your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-ct1 p-6">
                <CardContent className="pt-6 text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Start Your 5-Star Journey Today
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of contractors who have elevated their skills and grown their business with CT1 Training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4 font-bold">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
