import { useState, useEffect } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-jobs-management.jpg";
import screenshotBoard from "@/assets/screenshots/jobs-board.jpg";
import screenshotScheduling from "@/assets/screenshots/jobs-scheduling.jpg";
import screenshotDetail from "@/assets/screenshots/jobs-detail.jpg";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  ArrowRight,
  HardHat,
  Calendar,
  Users,
  ClipboardList,
  Camera,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Wrench,
  Eye,
} from "lucide-react";

export default function Jobs() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const stats = [
    { number: "98%", label: "On-Time Completion" },
    { number: "+15%", label: "Profit Margin" },
    { number: "3x", label: "Crew Efficiency" },
    { number: "Real-Time", label: "Job Visibility" },
  ];

  const storyCards = [
    { icon: Calendar, title: "Smart Scheduling", description: "Set start dates, milestones, and track deadlines visually" },
    { icon: Users, title: "Crew Coordination", description: "Assign team members and track hours per project" },
    { icon: DollarSign, title: "Job Costing", description: "Track materials, labor, and expenses against budget" },
    { icon: Camera, title: "Photo Documentation", description: "Upload job photos with notes to document progress" },
  ];

  const features = [
    { icon: Calendar, title: "Scheduling", description: "Schedule crews, set milestones, and track deadlines on a visual calendar." },
    { icon: Users, title: "Crew Management", description: "Assign team members to jobs and track hours worked on each project." },
    { icon: ClipboardList, title: "Task Tracking", description: "Create task lists, assign owners, and mark completion as work progresses." },
    { icon: Camera, title: "Photo Documentation", description: "Upload job photos with notes to document progress and quality." },
    { icon: DollarSign, title: "Job Costing", description: "Track materials, labor, and expenses against budget in real-time." },
    { icon: FileText, title: "Change Orders", description: "Document scope changes with automatic contract value updates." },
    { icon: Wrench, title: "Job Lifecycle", description: "Track every job from estimate acceptance to final payment." },
    { icon: Clock, title: "Time Tracking", description: "Log hours by crew member and job for accurate labor costing." },
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
              <HardHat className="h-5 w-5 mr-2" />
              Jobs Management
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Keep Every Job <span className="text-primary">On Track</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Schedule crews, track progress, and manage every job from start to finish. Keep projects on time, on budget, and customers happy.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">From Estimate to <span className="text-primary">Final Payment</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Never miss a deadline or blow a budget again. CT1's job management system gives you complete visibility into every project—from the moment an estimate is signed to the final payment.
                </p>
                <p>
                  Coordinate crews across multiple job sites, document progress with photos, and keep customers informed with real-time updates. Everything your team needs, in one place.
                </p>
                <p>
                  Contractors using CT1 complete 98% of jobs on time and see a 15% increase in profit margins through better job costing and resource allocation.
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
              <Eye className="h-5 w-5 mr-2" />
              See It In Action
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Job Management <span className="text-primary">Dashboard</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what managing jobs and crews looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: screenshotBoard, label: "Job Board - All active jobs with status, crew, and timeline" },
              { img: screenshotScheduling, label: "Scheduling View - Crew assignments and calendar management" },
              { img: screenshotDetail, label: "Job Detail - Progress tracking, photos, and cost breakdown" },
            ].map((shot, index) => (
              <div key={index} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="aspect-video rounded-lg overflow-hidden mb-3">
                  <img src={shot.img} alt={shot.label} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">{shot.label}</p>
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
              Complete Job <span className="text-primary">Lifecycle Management</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From scheduling to completion, track every aspect of your projects.
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
            Ready to Manage Jobs Like a Pro?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who complete 98% of jobs on time with CT1's job management.
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
