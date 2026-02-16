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
  Mic,
  Phone,
  Clock,
  MessageSquare,
  Calendar,
  UserPlus,
  Globe,
  Voicemail,
  PhoneIncoming,
  Bot,
} from "lucide-react";

export default function VoiceAI() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const features = [
    { icon: PhoneIncoming, title: "24/7 Call Answering", description: "Never miss a lead. AI answers every call, day or night, weekends and holidays." },
    { icon: MessageSquare, title: "Natural Conversations", description: "Human-like voice interactions that represent your business professionally." },
    { icon: UserPlus, title: "Lead Capture", description: "Automatically capture caller information and create leads in your CRM." },
    { icon: Calendar, title: "Appointment Scheduling", description: "Book appointments directly into your calendar during the call." },
    { icon: Globe, title: "Bilingual Support", description: "Serve English and Spanish speaking customers seamlessly." },
    { icon: Voicemail, title: "Smart Voicemail", description: "Take detailed messages when scheduling isn't needed." },
  ];

  const callFlow = [
    { step: "1", title: "Call Comes In", description: "Customer calls your business number" },
    { step: "2", title: "AI Answers", description: "Voice AI greets caller professionally" },
    { step: "3", title: "Information Gathered", description: "AI asks about their project needs" },
    { step: "4", title: "Action Taken", description: "Schedule appointment or take message" },
    { step: "5", title: "CRM Updated", description: "Lead created automatically with details" },
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
                <Mic className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Voice <span className="text-primary">AI</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Answer every call with AI that sounds natural, captures leads, and books appointments. 
                Never miss an opportunity, even at 2 AM.
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
                      title="Book a Voice AI Demo"
                      description="Hear how CT1's Voice AI can answer your calls"
                      ctaText="Schedule Demo"
                      formType="voiceai-demo"
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
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">CT1 Voice Assistant</p>
                  <p className="text-sm text-muted-foreground">Active • Ready to answer</p>
                </div>
                <div className="ml-auto h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="bg-background rounded-lg p-3 flex-1">
                    <p className="text-sm text-foreground">"Hi, I'm calling about getting an estimate for a new roof."</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary/10 rounded-lg p-3 flex-1">
                    <p className="text-sm text-foreground">"I'd be happy to help you with that! Let me get some information. What type of roofing material are you considering?"</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
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
              Your 24/7 <span className="text-primary">Virtual Receptionist</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              AI that handles calls professionally so you can focus on the job.
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

      {/* Call Flow Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From incoming call to CRM entry in seconds.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {callFlow.map((item, index) => (
              <Card key={index} className="p-4 text-center hover:shadow-lg transition-all relative">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {index < callFlow.length - 1 && (
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
                Stop Losing Leads to <span className="text-primary">Missed Calls</span>
              </h2>
              <ul className="space-y-4">
                {[
                  "Answer 100% of calls, even during jobs or after hours",
                  "Capture caller details automatically in your CRM",
                  "Book appointments without phone tag",
                  "Custom greetings that match your brand",
                  "Detailed call summaries and transcripts",
                  "Forward urgent calls to your cell when needed",
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
                <Phone className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Calls Answered</p>
              </Card>
              <Card className="p-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">Availability</p>
              </Card>
              <Card className="p-6 text-center">
                <UserPlus className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">+40%</p>
                <p className="text-sm text-muted-foreground">Lead Capture</p>
              </Card>
              <Card className="p-6 text-center">
                <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">Auto</p>
                <p className="text-sm text-muted-foreground">Scheduling</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="p-8">
            <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Voice AI Add-On</h3>
            <p className="text-3xl font-bold text-primary mb-2">$50<span className="text-lg text-muted-foreground">/month per user</span></p>
            <p className="text-muted-foreground mb-4">Available as a standalone add-on to any CT1 plan</p>
            <Link to="/pricing">
              <Button variant="outline">View All Pricing</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Never Miss a Call Again?
          </h2>
          <p className="text-xl text-background/80 mb-8">
            Join contractors who've increased lead capture by 40% with Voice AI.
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
                  title="Book a Voice AI Demo"
                  description="Hear how CT1's Voice AI can transform your call handling"
                  ctaText="Schedule Demo"
                  formType="voiceai-demo"
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
