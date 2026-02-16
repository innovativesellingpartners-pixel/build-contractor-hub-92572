import { useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import {
  ArrowRight,
  CheckCircle,
  HardHat,
  Calendar,
  Users,
  ClipboardList,
  Camera,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Wrench,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function Jobs() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const features = [
    { icon: Calendar, title: "Scheduling", description: "Schedule crews, set milestones, and track deadlines on a visual calendar." },
    { icon: Users, title: "Crew Management", description: "Assign team members to jobs and track hours worked on each project." },
    { icon: ClipboardList, title: "Task Tracking", description: "Create task lists, assign owners, and mark completion as work progresses." },
    { icon: Camera, title: "Photo Documentation", description: "Upload job photos with notes to document progress and quality." },
    { icon: DollarSign, title: "Job Costing", description: "Track materials, labor, and expenses against budget in real-time." },
    { icon: FileText, title: "Change Orders", description: "Document scope changes with automatic contract value updates." },
  ];

  const jobStatuses = [
    { status: "Scheduled", count: 3, color: "bg-blue-500" },
    { status: "In Progress", count: 5, color: "bg-yellow-500" },
    { status: "On Hold", count: 1, color: "bg-orange-500" },
    { status: "Complete", count: 12, color: "bg-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-6">
                <HardHat className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Jobs <span className="text-primary">Management</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Schedule crews, track progress, and manage every job from start to finish. 
                Keep projects on time, on budget, and customers happy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={activeContactForm === "demo"} onOpenChange={(open) => setActiveContactForm(open ? "demo" : null)}>
                  <DialogTrigger asChild>
                    <Button className="btn-ct1 text-lg px-8 py-4">
                      Book a Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ContactForm
                      title="Book a Jobs Demo"
                      description="See how CT1 can help you manage jobs more efficiently"
                      ctaText="Schedule Demo"
                      formType="jobs-demo"
                      onClose={() => setActiveContactForm(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Link to="/trial-signup">
                  <Button variant="outline" className="text-lg px-8 py-4">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="p-6 bg-card border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">Active Jobs</h3>
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <div className="space-y-3 mb-4">
                {jobStatuses.map((job, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${job.color}`}></div>
                      <span className="text-foreground">{job.status}</span>
                    </div>
                    <span className="font-bold text-foreground">{job.count}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Kitchen Remodel - Davis</p>
                    <p className="text-xs text-muted-foreground">123 Oak Street • Day 3 of 14</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded text-xs">In Progress</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="text-primary">Manage Jobs</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From scheduling to completion, track every aspect of your projects.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Job Lifecycle <span className="text-primary">Management</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Track every job from estimate acceptance to final payment.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: FileText, title: "Estimate Sold", description: "Signed estimate converts to a job" },
              { icon: Calendar, title: "Scheduled", description: "Set start date and milestones" },
              { icon: Wrench, title: "In Progress", description: "Track daily work and tasks" },
              { icon: Camera, title: "Document", description: "Photos, notes, and updates" },
              { icon: DollarSign, title: "Complete & Paid", description: "Final invoice and payment" },
            ].map((item, index) => (
              <Card key={index} className="p-4 text-center hover:shadow-lg transition-all relative">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {index < 4 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Keep Every Job <span className="text-primary">On Track</span>
              </h2>
              <ul className="space-y-4">
                {[
                  "See all jobs at a glance with status dashboards",
                  "Never miss a deadline with milestone tracking",
                  "Keep customers informed with progress updates",
                  "Track profitability in real-time with job costing",
                  "Document everything for disputes and warranty claims",
                  "Coordinate crews across multiple job sites",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">On-Time Completion</p>
              </Card>
              <Card className="p-6 text-center">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">+15%</p>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">3x</p>
                <p className="text-sm text-muted-foreground">Crew Efficiency</p>
              </Card>
              <Card className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">Real-Time</p>
                <p className="text-sm text-muted-foreground">Job Visibility</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Manage Jobs Like a Pro?
          </h2>
          <p className="text-xl text-background/80 mb-8">
            Join contractors who complete 98% of jobs on time with CT1's job management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={activeContactForm === "cta-demo"} onOpenChange={(open) => setActiveContactForm(open ? "cta-demo" : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4">
                  <Phone className="mr-2 h-5 w-5" />
                  Book a Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Book a Jobs Demo"
                  description="See how CT1 can help you manage projects more efficiently"
                  ctaText="Schedule Demo"
                  formType="jobs-demo"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
            <Link to="/trial-signup">
              <Button variant="outline" className="border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
