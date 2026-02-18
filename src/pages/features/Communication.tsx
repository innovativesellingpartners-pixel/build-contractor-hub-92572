import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-communication-hub.jpg";
import {
  ArrowRight,
  MessageSquare,
  Mail,
  Phone,
  MessagesSquare,
  FileText,
  RefreshCw,
  History,
  Users,
  Globe,
  ImageIcon,
} from "lucide-react";

export default function Communication() {
  const stats = [
    { number: "Unified", label: "Inbox" },
    { number: "100%", label: "Message Capture" },
    { number: "Auto", label: "Follow-Ups" },
    { number: "0", label: "Missed Messages" },
  ];

  const storyCards = [
    { icon: Mail, title: "Email Integration", description: "Send and receive emails directly from the CRM" },
    { icon: Phone, title: "Call Tracking", description: "Log every call with notes and follow-up reminders" },
    { icon: MessagesSquare, title: "SMS/Text", description: "Text customers right from their contact profile" },
    { icon: RefreshCw, title: "Auto Follow-Ups", description: "Automated sequences so nothing falls through" },
  ];

  const features = [
    { icon: Mail, title: "Email Integration", description: "Send and receive emails directly from customer profiles. Every message logged automatically." },
    { icon: Phone, title: "Call Tracking", description: "Log every inbound and outbound call with notes, duration, and follow-up reminders." },
    { icon: MessagesSquare, title: "SMS/Text Messaging", description: "Text customers directly from their contact profile. Templates for quick responses." },
    { icon: FileText, title: "Message Templates", description: "Pre-built templates for estimates, follow-ups, reminders, and thank-you messages." },
    { icon: RefreshCw, title: "Auto Follow-Ups", description: "Set automated follow-up sequences so no lead or customer falls through the cracks." },
    { icon: History, title: "Communication History", description: "Complete timeline of every email, text, call, and note for each customer." },
    { icon: Users, title: "Team Messaging", description: "Internal messaging between team members tied to specific jobs or customers." },
    { icon: Globe, title: "Customer Portal", description: "Give customers a portal to view updates, approve changes, and communicate with you." },
  ];

  const screenshots = [
    { label: "Unified Inbox - All emails, texts, and calls in one view" },
    { label: "Communication Timeline - Full history for every customer" },
    { label: "Auto Follow-Up Sequences - Set it and never miss a touchpoint" },
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
              <MessageSquare className="h-5 w-5 mr-2" />
              Communication Hub
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Every Conversation, <span className="text-primary">One Place</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Centralize emails, texts, calls, and follow-ups so nothing slips through the cracks. Keep every customer touchpoint organized and accessible.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Stop Losing Messages <span className="text-primary">Between Tools</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Emails in one app, texts on your phone, voicemails in another. Important messages get buried, follow-ups get forgotten, and customers feel ignored. Sound familiar?
                </p>
                <p>
                  CT1's Communication Hub brings every channel into one unified timeline for each customer. See every email, text, call, and note in chronological order so your team always knows the full story.
                </p>
                <p>
                  Set up automated follow-up sequences to ensure every lead gets a response and every customer feels valued. Never let a message fall through the cracks again.
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
              Your Communication <span className="text-primary">Command Center</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what centralized communication looks like inside CT1.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {screenshots.map((shot, index) => (
              <div key={index} className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-4">
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
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
              Complete Communication <span className="text-primary">Toolkit</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every channel, every conversation, organized and actionable.
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
            Ready to Centralize Your Communication?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who never miss a message with CT1's Communication Hub.
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