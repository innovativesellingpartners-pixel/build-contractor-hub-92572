import { useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { 
  Phone, 
  Clock, 
  UserPlus, 
  Calendar, 
  Globe, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  PhoneIncoming,
  Voicemail,
  Mic
} from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

const VoiceAIProduct = () => {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const features = [
    {
      icon: Clock,
      title: "24/7 Call Answering",
      description: "Never miss a lead again. Your AI assistant answers every call, day or night, weekends and holidays included."
    },
    {
      icon: UserPlus,
      title: "Automatic Lead Capture",
      description: "Caller information is automatically captured and synced to your CRM—name, number, job details, and more."
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Book appointments directly into your calendar. The AI checks your availability and confirms with callers."
    },
    {
      icon: Globe,
      title: "Bilingual Support",
      description: "Serve more customers with English and Spanish language support built right in."
    },
    {
      icon: MessageSquare,
      title: "Custom Greetings",
      description: "Personalize how your AI introduces your business. Sound professional with your own custom greeting."
    },
    {
      icon: Phone,
      title: "Call Forwarding",
      description: "Important calls get forwarded to you. Set rules for when you want to be interrupted."
    }
  ];

  const sampleConversations = [
    {
      title: "New Lead Inquiry",
      icon: PhoneIncoming,
      transcript: [
        { speaker: "AI", text: "Hey there, thanks for calling Smith Roofing. How can I help you today?" },
        { speaker: "Caller", text: "Hi, I need a quote for a roof repair. I've got some missing shingles after the storm." },
        { speaker: "AI", text: "I'm sorry to hear about the storm damage. I can definitely help get you set up with a quote. Can I get your name and the best number to reach you?" },
        { speaker: "Caller", text: "Sure, it's John Miller, 555-123-4567." },
        { speaker: "AI", text: "Great, John. And what's the address of the property that needs the repair?" },
        { speaker: "Caller", text: "123 Oak Street." },
        { speaker: "AI", text: "Perfect. I've got all your information. Mike will give you a call back within the hour to schedule an inspection. Is there anything else I can help with?" }
      ]
    },
    {
      title: "Scheduling Request",
      icon: Calendar,
      transcript: [
        { speaker: "AI", text: "Hey there, thanks for calling ABC Plumbing. I'm happy to help—what do you need?" },
        { speaker: "Caller", text: "I need to schedule someone to come look at a leaky faucet." },
        { speaker: "AI", text: "No problem, we can get that taken care of. I'm looking at the schedule now. Would tomorrow morning around 10 AM work for you?" },
        { speaker: "Caller", text: "That works perfectly." },
        { speaker: "AI", text: "Great! I've got you down for tomorrow at 10 AM. Can I get your name and address?" },
        { speaker: "Caller", text: "Sarah Johnson, 456 Maple Drive." },
        { speaker: "AI", text: "You're all set, Sarah. We'll see you tomorrow at 10. Have a great day!" }
      ]
    },
    {
      title: "After Hours Call",
      icon: Voicemail,
      transcript: [
        { speaker: "AI", text: "Hey there, thanks for calling Johnson Electric. Sorry Tom couldn't grab the phone. I'm happy to help—what do you need?" },
        { speaker: "Caller", text: "My power went out in half my house. Is this an emergency?" },
        { speaker: "AI", text: "That sounds like it could be a tripped breaker or a more serious issue. Have you checked your circuit breaker panel yet?" },
        { speaker: "Caller", text: "No, I'm not sure where it is." },
        { speaker: "AI", text: "No worries. It's usually in the garage, basement, or utility room—a gray metal box. If you find it, look for any switches that are in the middle position and flip them all the way off, then back on." },
        { speaker: "Caller", text: "Okay, I'll try that. If it doesn't work, can someone come out?" },
        { speaker: "AI", text: "Absolutely. Let me get your info and Tom will call you first thing in the morning, or if this is urgent, I can flag it for an emergency callback." }
      ]
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Customer Calls",
      description: "A potential customer calls your business number"
    },
    {
      step: "2",
      title: "AI Answers",
      description: "Your Voice AI picks up with your custom greeting"
    },
    {
      step: "3",
      title: "Captures Info",
      description: "AI gathers caller details, job info, and urgency"
    },
    {
      step: "4",
      title: "Syncs to CRM",
      description: "Lead automatically appears in your myCT1 dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <img src={ct1Logo} alt="CT1 Logo" className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Mic className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Call Handling</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            AI Voice Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Never miss a lead again. Your AI receptionist answers calls 24/7, captures customer information, 
            schedules appointments, and syncs everything to your CRM—automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                $50/month per user
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              From ring to CRM in seconds—completely hands-free
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional call handling features designed specifically for contractors
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Conversations */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sample Conversations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how your AI Voice Assistant handles real-world scenarios
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {sampleConversations.map((conversation, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <conversation.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{conversation.title}</h3>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {conversation.transcript.map((line, i) => (
                      <div key={i} className={`flex gap-3 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          line.speaker === 'AI' ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          {line.speaker === 'AI' ? (
                            <PhoneCall className="h-4 w-4 text-primary" />
                          ) : (
                            <span className="text-xs font-medium">C</span>
                          )}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg ${
                          line.speaker === 'AI' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <p className="text-sm text-foreground">{line.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Quality Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Natural, Human-Like Voice
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI uses advanced voice technology that sounds warm, friendly, and professional. 
                Callers won't feel like they're talking to a robot—they'll feel like they're talking 
                to a helpful member of your team.
              </p>
              <div className="space-y-4">
                {[
                  "Warm, friendly tone perfect for contractors",
                  "Natural conversation flow with smart pauses",
                  "Handles interruptions gracefully",
                  "Adapts to caller's speaking pace"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8">
              <div className="bg-background rounded-2xl p-6 shadow-xl text-center">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Voice: Coral</h3>
                <p className="text-muted-foreground mb-4">Warm & Friendly Tone</p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Powered by OpenAI Realtime
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stop Missing Calls. Start Capturing Leads.
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Every missed call is a missed opportunity. Let your AI Voice Assistant answer 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trial-signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View All Plans
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            Standalone: $50/month per user • Included in Growth & Market tiers
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default VoiceAIProduct;
