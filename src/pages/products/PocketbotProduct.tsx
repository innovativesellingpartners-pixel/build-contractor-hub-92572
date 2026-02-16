import { useState, useCallback } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Mic,
  MicOff,
  Brain,
  MessageSquare,
  TrendingUp,
  Shield
} from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

const PocketAgentProduct = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Pocket Agent voice demo");
    },
    onDisconnect: () => {
      console.log("Disconnected from Pocket Agent voice demo");
    },
    onError: (error) => {
      console.error("Voice demo error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to voice demo. Please try again.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error || !data?.token) {
        throw new Error("Failed to get voice token");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Microphone Required",
        description: "Please enable microphone access to try the voice demo.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const modules = [
    {
      icon: Bot,
      title: "Sales Agent",
      description: "Master the art of selling with AI-powered sales coaching. Get real-time advice on customer communication, follow-up strategies, and closing techniques.",
      features: ["Customer communication scripts", "Follow-up scheduling", "Objection handling", "Closing strategies"]
    },
    {
      icon: Calculator,
      title: "Estimator Agent",
      description: "Create professional, accurate estimates in minutes. Get pricing guidance, line item suggestions, and markup calculations tailored to your trade.",
      features: ["Smart line item suggestions", "Material cost calculations", "Labor hour estimates", "Profit margin optimization"]
    },
    {
      icon: ClipboardList,
      title: "Project Manager Agent",
      description: "Keep every job on track with intelligent project management assistance. Task scheduling, progress tracking, and team coordination made simple.",
      features: ["Task breakdown & scheduling", "Progress milestone tracking", "Resource allocation", "Deadline management"]
    },
    {
      icon: Settings,
      title: "Administrator Agent",
      description: "Streamline your back-office operations. From data entry to compliance reminders, your AI administrator handles the paperwork so you don't have to.",
      features: ["Document organization", "Compliance reminders", "Report generation", "Data entry assistance"]
    },
    {
      icon: Share2,
      title: "Social Media Manager Agent",
      description: "Build your online presence without the hassle. Get content ideas, post suggestions, and engagement strategies designed for contractors.",
      features: ["Post content creation", "Hashtag optimization", "Engagement strategies", "Before/after showcases"]
    }
  ];

  const stats = [
    { number: "5", label: "AI Agents in One" },
    { number: "24/7", label: "Always Available" },
    { number: "40%", label: "Revenue Increase" },
    { number: "20hrs", label: "Saved Per Week" }
  ];

  const trainingModules = [
    "Sales & Customer Communication",
    "Estimating & Pricing Strategies",
    "Project Management Best Practices",
    "Business Administration",
    "Marketing & Social Media",
    "Financial Management"
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section - matching About Us */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-lg">
              <Brain className="h-5 w-5 mr-2" />
              AI-Powered Business Assistant
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Meet Your <span className="text-primary">Pocket Agent</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your complete AI business assistant. One agent that covers everything you need—sales, estimating, 
              project management, administration, and social media—all trained on proven contractor success strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/pricing">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 font-bold">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 font-bold">
                  $20/month per user
                </Button>
              </Link>
            </div>
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

      {/* Talk to Pocket Agent - Live Voice Demo */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Talk to Pocket Agent <span className="text-primary">Live</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Experience the power of Pocket Agent firsthand. Click the microphone below and have a real 
                  conversation with our AI assistant. Ask about estimating, sales strategies, project management, 
                  or anything related to growing your contracting business.
                </p>
                <p>
                  Pocket Agent is trained on decades of industry expertise and real-world contractor success stories. 
                  It's like having a seasoned business mentor available 24/7.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8 w-full max-w-sm">
                <div className="bg-background rounded-2xl p-8 shadow-xl text-center">
                  <div className="mb-6">
                    <img src={ct1Logo} alt="CT1" className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Pocket Agent</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.status === 'connected' 
                        ? conversation.isSpeaking ? 'Speaking...' : 'Listening...'
                        : 'Click to start a conversation'}
                    </p>
                  </div>

                  {/* Voice Activity Indicator */}
                  {conversation.status === 'connected' && (
                    <div className="mb-6 h-16 flex items-center justify-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full transition-all duration-150 ${
                            conversation.isSpeaking 
                              ? 'bg-primary animate-pulse' 
                              : 'bg-muted-foreground/30'
                          }`}
                          style={{
                            height: conversation.isSpeaking 
                              ? `${Math.random() * 40 + 12}px` 
                              : '12px',
                            animationDelay: `${i * 80}ms`
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Mic Button */}
                  {conversation.status === 'disconnected' ? (
                    <Button 
                      onClick={startConversation} 
                      disabled={isConnecting}
                      size="lg"
                      className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                      {isConnecting ? (
                        <Sparkles className="h-8 w-8 animate-spin" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopConversation}
                      size="lg"
                      variant="destructive"
                      className="w-20 h-20 rounded-full shadow-lg"
                    >
                      <MicOff className="h-8 w-8" />
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground mt-4">
                    {conversation.status === 'connected' 
                      ? 'Tap to end conversation' 
                      : 'Tap to start talking'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Five Agents Section - matching About Us values grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Five Powerful <span className="text-primary">AI Agents</span> in One
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pocket Agent combines specialized AI modules that work together to run every aspect of your contracting business.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module, index) => (
              <div key={index} className="grid lg:grid-cols-2 gap-12 items-center">
                {index % 2 === 0 ? (
                  <>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                          <module.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">{module.title}</h3>
                      </div>
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
                    <Card className="p-6 card-ct1">
                      <CardContent className="pt-6 text-center">
                        <module.icon className="h-16 w-16 text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">{module.description}</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="p-6 card-ct1 order-2 lg:order-1">
                      <CardContent className="pt-6 text-center">
                        <module.icon className="h-16 w-16 text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">{module.description}</p>
                      </CardContent>
                    </Card>
                    <div className="order-1 lg:order-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                          <module.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">{module.title}</h3>
                      </div>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Section - matching About Us story section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Built on Proven Success</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Pocket Agent isn't just another AI—it's trained on our comprehensive contractor training modules 
                  developed from real-world success stories. Every response is informed by decades of industry expertise.
                </p>
                <p>
                  From sales coaching to project management best practices, Pocket Agent delivers actionable advice 
                  that's been proven to work in the field. It's like having a seasoned mentor in your pocket, available 24/7.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card className="p-4 card-ct1">
                  <GraduationCap className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Training Powered</h4>
                  <p className="text-sm text-muted-foreground">Built on proven contractor success strategies</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Natural Conversation</h4>
                  <p className="text-sm text-muted-foreground">Talk naturally, get expert answers instantly</p>
                </Card>
              </div>
              <div className="space-y-4 mt-8">
                <Card className="p-4 card-ct1">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Growth Focused</h4>
                  <p className="text-sm text-muted-foreground">Every response optimized for business growth</p>
                </Card>
                <Card className="p-4 card-ct1">
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold">Industry Expertise</h4>
                  <p className="text-sm text-muted-foreground">Decades of construction knowledge built in</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Modules Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Trained on <span className="text-primary">Expert Knowledge</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pocket Agent draws from our comprehensive training library covering every aspect of running a successful contracting business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingModules.map((module, i) => (
              <Card key={i} className="card-ct1 p-6">
                <CardContent className="pt-6 flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium text-lg">{module}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - matching About Us */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of contractors using Pocket Agent to work smarter, not harder.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trial-signup">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-bold">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-8 py-4 font-bold"
              >
                View All Plans
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            Standalone: $20/month per user • Included in Growth & Market tiers
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PocketAgentProduct;
