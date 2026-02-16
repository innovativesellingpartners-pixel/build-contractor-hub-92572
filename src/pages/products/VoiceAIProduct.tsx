import { Link } from "react-router-dom";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import heroBg from "@/assets/hero-construction-aerial.jpg";
import {
  Phone,
  Clock,
  UserPlus,
  Calendar,
  Globe,
  MessageSquare,
  ArrowRight,
  PhoneIncoming,
  Voicemail,
  Mic,
} from "lucide-react";

const VoiceAIProduct = () => {
  const stats = [
    { number: "$50", label: "Per Month / User" },
    { number: "24/7", label: "Call Answering" },
    { number: "+40%", label: "Lead Capture" },
    { number: "Auto", label: "CRM Sync" },
  ];

  const storyCards = [
    { icon: PhoneIncoming, title: "Instant Answer", description: "AI picks up every call with your custom greeting" },
    { icon: MessageSquare, title: "Natural Voice", description: "Warm, friendly tone that represents your brand" },
    { icon: UserPlus, title: "Lead Capture", description: "Caller info automatically synced to your CRM" },
    { icon: Calendar, title: "Smart Scheduling", description: "Books appointments based on your availability" },
  ];

  const features = [
    { icon: Clock, title: "24/7 Call Answering", description: "Never miss a lead again. Your AI assistant answers every call, day or night, weekends and holidays." },
    { icon: UserPlus, title: "Automatic Lead Capture", description: "Caller information is automatically captured and synced to your CRM—name, number, job details." },
    { icon: Calendar, title: "Smart Scheduling", description: "Book appointments directly into your calendar. The AI checks your availability and confirms." },
    { icon: Globe, title: "Bilingual Support", description: "Serve more customers with English and Spanish language support built right in." },
    { icon: MessageSquare, title: "Custom Greetings", description: "Personalize how your AI introduces your business. Sound professional with custom greetings." },
    { icon: Phone, title: "Call Forwarding", description: "Important calls get forwarded to you. Set rules for when you want to be interrupted." },
    { icon: Voicemail, title: "Smart Voicemail", description: "Take detailed messages with AI-powered summaries when scheduling isn't needed." },
    { icon: Mic, title: "Natural Voice", description: "Advanced voice technology that sounds warm, friendly, and professional to every caller." },
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
              AI Voice Assistant
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Stop Missing Calls. <span className="text-primary">Start Capturing Leads.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your AI receptionist answers calls 24/7, captures customer information, schedules appointments, and syncs everything to your CRM—automatically.
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
              <h2 className="text-4xl font-bold text-foreground mb-6">How It <span className="text-primary">Works</span></h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Every missed call is a missed opportunity. Studies show that 85% of callers who don't reach you will call your competitor instead. CT1's Voice AI ensures that never happens.
                </p>
                <p>
                  When a customer calls, your AI assistant picks up with your custom greeting, gathers their project details, and either books an appointment or takes a detailed message—all while syncing everything to your CRM in real-time.
                </p>
                <p>
                  Callers won't feel like they're talking to a robot. Our advanced voice technology delivers warm, natural conversations that represent your business professionally.
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

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Everything You <span className="text-primary">Need</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional call handling features designed specifically for contractors.
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
            Never Miss a Call Again
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Every missed call is a missed opportunity. Let your AI Voice Assistant answer 24/7. Standalone: $50/month per user.
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
};

export default VoiceAIProduct;
