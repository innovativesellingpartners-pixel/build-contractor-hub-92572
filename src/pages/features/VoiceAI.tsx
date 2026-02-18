import { useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroBg from "@/assets/hero-construction-aerial.jpg";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import {
  ArrowRight,
  ImageIcon,
  Mic,
  Phone,
  Clock,
  MessageSquare,
  Calendar,
  UserPlus,
  Globe,
  Voicemail,
  PhoneIncoming,
} from "lucide-react";

export default function VoiceAI() {
  const stats = [
    { number: "100%", label: "Calls Answered" },
    { number: "24/7", label: "Availability" },
    { number: "+40%", label: "Lead Capture" },
    { number: "Auto", label: "Scheduling" },
  ];

  const storyCards = [
    { icon: PhoneIncoming, title: "Always Answering", description: "AI picks up every call, day or night" },
    { icon: MessageSquare, title: "Natural Voice", description: "Human-like conversations that impress callers" },
    { icon: UserPlus, title: "Lead Capture", description: "Automatically creates leads in your CRM" },
    { icon: Calendar, title: "Smart Booking", description: "Books appointments into your calendar" },
  ];

  const features = [
    { icon: PhoneIncoming, title: "24/7 Call Answering", description: "Never miss a lead. AI answers every call, day or night, weekends and holidays." },
    { icon: MessageSquare, title: "Natural Conversations", description: "Human-like voice interactions that represent your business professionally." },
    { icon: UserPlus, title: "Lead Capture", description: "Automatically capture caller information and create leads in your CRM." },
    { icon: Calendar, title: "Appointment Scheduling", description: "Book appointments directly into your calendar during the call." },
    { icon: Globe, title: "Bilingual Support", description: "Serve English and Spanish speaking customers seamlessly." },
    { icon: Voicemail, title: "Smart Voicemail", description: "Take detailed messages when scheduling isn't needed." },
    { icon: Phone, title: "Call Forwarding", description: "Forward urgent calls to your cell when you need to be interrupted." },
    { icon: Clock, title: "Call Summaries", description: "Detailed transcripts and summaries of every call in your dashboard." },
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
              <Mic className="h-5 w-5 mr-2" />
              Voice AI
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Never Miss a <span className="text-primary">Call Again</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Answer every call with AI that sounds natural, captures leads, and books appointments. Never miss an opportunity, even at 2 AM.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">Your 24/7 <span className="text-primary">Virtual Receptionist</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Every missed call is a missed opportunity. Studies show that 85% of callers who don't reach you on the first try will call your competitor instead.
                </p>
                <p>
                  CT1's Voice AI answers every call professionally, captures caller details, qualifies leads, and even books appointments—all while you're on the job site or after hours.
                </p>
                <p>
                  Contractors using Voice AI have increased their lead capture by 40% and eliminated the frustration of phone tag. It's like having a full-time receptionist for a fraction of the cost.
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
              Your AI Phone <span className="text-primary">Assistant</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what Voice AI looks like inside your CT1 dashboard.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              "Call Dashboard - Every call logged with transcripts and summaries",
              "Lead Capture - New leads created automatically from calls",
              "AI Settings - Customize greetings, hours, and call routing",
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
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI that handles calls professionally so you can focus on the job.
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
            Ready to Never Miss a Call Again?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join contractors who've increased lead capture by 40% with Voice AI.
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
