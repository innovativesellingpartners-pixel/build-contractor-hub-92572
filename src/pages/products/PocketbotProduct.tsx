import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { 
  Bot, 
  Calculator, 
  ClipboardList, 
  Settings, 
  Share2, 
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
  Pause
} from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

const PocketbotProduct = () => {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const modules = [
    {
      icon: Bot,
      title: "Sales Bot",
      description: "Master the art of selling with AI-powered sales coaching. Get real-time advice on customer communication, follow-up strategies, and closing techniques.",
      features: ["Customer communication scripts", "Follow-up scheduling", "Objection handling", "Closing strategies"]
    },
    {
      icon: Calculator,
      title: "Estimator Bot",
      description: "Create professional, accurate estimates in minutes. Get pricing guidance, line item suggestions, and markup calculations tailored to your trade.",
      features: ["Smart line item suggestions", "Material cost calculations", "Labor hour estimates", "Profit margin optimization"]
    },
    {
      icon: ClipboardList,
      title: "Project Manager Bot",
      description: "Keep every job on track with intelligent project management assistance. Task scheduling, progress tracking, and team coordination made simple.",
      features: ["Task breakdown & scheduling", "Progress milestone tracking", "Resource allocation", "Deadline management"]
    },
    {
      icon: Settings,
      title: "Administrator Bot",
      description: "Streamline your back-office operations. From data entry to compliance reminders, your AI administrator handles the paperwork so you don't have to.",
      features: ["Document organization", "Compliance reminders", "Report generation", "Data entry assistance"]
    },
    {
      icon: Share2,
      title: "Social Media Manager Bot",
      description: "Build your online presence without the hassle. Get content ideas, post suggestions, and engagement strategies designed for contractors.",
      features: ["Post content creation", "Hashtag optimization", "Engagement strategies", "Before/after showcases"]
    }
  ];

  const trainingModules = [
    "Sales & Customer Communication",
    "Estimating & Pricing Strategies",
    "Project Management Best Practices",
    "Business Administration",
    "Marketing & Social Media",
    "Financial Management"
  ];

  const sampleConversations = [
    {
      id: "sales",
      title: "Sales Bot - Closing a Deal",
      transcript: [
        { speaker: "You", text: "I have a customer who seems interested but keeps delaying. What should I do?" },
        { speaker: "Pocketbot", text: "That's a common situation. Let's address it strategically. First, have you identified their primary concern? Often, delays come from uncertainty about price, timing, or trust." },
        { speaker: "You", text: "They mentioned the price seems high compared to another quote." },
        { speaker: "Pocketbot", text: "Perfect - now we know the objection. Here's your approach: Don't compete on price alone. Instead, ask them what's included in the other quote. Then highlight your value differentiators - your warranty, your response time, your reviews. Would you like me to draft a follow-up message that addresses price concerns professionally?" }
      ]
    },
    {
      id: "estimator",
      title: "Estimator Bot - Creating a Quote",
      transcript: [
        { speaker: "You", text: "I need to create an estimate for a 1,500 sq ft bathroom remodel with tile, new fixtures, and a walk-in shower." },
        { speaker: "Pocketbot", text: "Great, I'll help you build this estimate. Based on current market rates in your area and a mid-range finish level, here's what I recommend for your line items:" },
        { speaker: "Pocketbot", text: "Tile work (floor & walls): $4,500-6,000\nWalk-in shower installation: $3,200-4,500\nFixtures (toilet, vanity, faucets): $2,800-4,000\nPlumbing labor: $1,800-2,500\nDemo & prep: $800-1,200\n\nWith your standard 35% markup, you're looking at $18,500-25,200 total. Want me to generate the detailed line items?" },
        { speaker: "You", text: "Yes, use the mid-range numbers and add permit fees." }
      ]
    },
    {
      id: "project",
      title: "Project Manager Bot - Job Tracking",
      transcript: [
        { speaker: "You", text: "The Henderson kitchen remodel is running behind. We're 3 days past the original timeline." },
        { speaker: "Pocketbot", text: "Let me help you get back on track. First, what caused the delay - was it materials, labor availability, or unexpected issues?" },
        { speaker: "You", text: "The cabinets arrived damaged and we had to reorder." },
        { speaker: "Pocketbot", text: "Got it. Here's your recovery plan:\n1. Document the damaged cabinets with photos for your records\n2. Contact the supplier for expedited replacement and potential credit\n3. Communicate proactively with the Hendersons - customers appreciate transparency\n4. Shift your crew to complete countertop prep and electrical while waiting\n\nWould you like me to draft a professional update email to send to the customer?" }
      ]
    }
  ];

  const handlePlayAudio = (id: string) => {
    if (playingAudio === id) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(id);
      // Simulate audio playing for 5 seconds
      setTimeout(() => setPlayingAudio(null), 5000);
    }
  };

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
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Business Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            MyCT1 Pocketbot
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Your complete AI business assistant. One bot that covers everything you need—sales, estimating, 
            project management, administration, and social media—all trained on proven contractor success strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                $20/month per user
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bot Modules Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Five Powerful AI Assistants in One
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pocketbot combines specialized AI modules that work together to run every aspect of your contracting business.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={`flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className="md:w-1/3 bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-4">
                          <module.icon className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">{module.title}</h3>
                      </div>
                    </div>
                    <div className="md:w-2/3 p-8">
                      <p className="text-muted-foreground mb-6">{module.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {module.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Conversations with Audio */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Hear Pocketbot in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Listen to real conversation examples and see how Pocketbot helps contractors every day
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {sampleConversations.map((conversation) => (
              <Card key={conversation.id} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{conversation.title}</h3>
                    <button
                      onClick={() => handlePlayAudio(conversation.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        playingAudio === conversation.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {playingAudio === conversation.id ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Audio Waveform Visualization */}
                  <div className="mb-6 h-12 bg-muted/50 rounded-lg flex items-center justify-center gap-1 px-4">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          playingAudio === conversation.id 
                            ? 'bg-primary animate-pulse' 
                            : 'bg-muted-foreground/30'
                        }`}
                        style={{
                          height: playingAudio === conversation.id 
                            ? `${Math.random() * 24 + 8}px` 
                            : `${Math.sin(i * 0.5) * 12 + 16}px`,
                          animationDelay: `${i * 50}ms`
                        }}
                      />
                    ))}
                  </div>

                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {conversation.transcript.map((line, i) => (
                      <div key={i} className={`flex gap-3 ${line.speaker === 'You' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          line.speaker === 'Pocketbot' ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          {line.speaker === 'Pocketbot' ? (
                            <Bot className="h-4 w-4 text-primary" />
                          ) : (
                            <span className="text-xs font-medium">You</span>
                          )}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg ${
                          line.speaker === 'Pocketbot' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <p className="text-sm text-foreground whitespace-pre-line">{line.text}</p>
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

      {/* Training Integration */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary/50 text-secondary-foreground px-4 py-2 rounded-full mb-6">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-medium">Training Powered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Built on Proven Success
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Pocketbot isn't just another AI—it's trained on our comprehensive contractor training modules 
                developed from real-world success stories. Every response is informed by decades of industry expertise.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trainingModules.map((module, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">{module}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8">
              <div className="bg-background rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Pocketbot</p>
                    <p className="text-foreground">
                      "Based on your job details, I recommend a 35% markup to hit your target profit margin. 
                      Would you like me to generate the line items for this bathroom remodel estimate?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">You</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">"Yes, include tile, fixtures, and labor"</p>
                  </div>
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
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of contractors using Pocketbot to work smarter, not harder.
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
            Standalone: $20/month per user • Included in Growth & Market tiers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} myCT1. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PocketbotProduct;
