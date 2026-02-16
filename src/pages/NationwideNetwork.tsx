import { useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import heroImage from "@/assets/hero-construction.jpg";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { 
  ArrowRight, 
  Bot, 
  Calculator, 
  Users,
  Globe,
  TrendingUp,
  CheckCircle,
  Star,
  Phone,
  MapPin,
  Building,
  Briefcase,
  GraduationCap,
  BarChart3,
  Headset,
  Mic,
  BookOpen,
  HardHat,
  MessageCircle,
  Rocket,
  Network,
  Pickaxe,
  LayoutGrid,
  Quote,
  Wrench,
  Zap,
  Flame,
  Plug,
  Hammer,
  PaintBucket,
  Wind
} from "lucide-react";

// Fraser, Michigan coordinates (approximate center position on US map)
const FRASER_MI = { x: 720, y: 180 };

// Contractor cluster locations across the US
const contractorClusters = [
  { x: 120, y: 120, label: "Seattle" },
  { x: 100, y: 220, label: "Portland" },
  { x: 80, y: 320, label: "San Francisco" },
  { x: 120, y: 380, label: "Los Angeles" },
  { x: 200, y: 420, label: "San Diego" },
  { x: 280, y: 380, label: "Phoenix" },
  { x: 350, y: 300, label: "Denver" },
  { x: 420, y: 420, label: "Dallas" },
  { x: 480, y: 480, label: "Houston" },
  { x: 380, y: 500, label: "Austin" },
  { x: 550, y: 350, label: "Kansas City" },
  { x: 620, y: 280, label: "Chicago" },
  { x: 650, y: 200, label: "Detroit" },
  { x: 760, y: 240, label: "Pittsburgh" },
  { x: 820, y: 200, label: "New York" },
  { x: 800, y: 160, label: "Boston" },
  { x: 780, y: 280, label: "Philadelphia" },
  { x: 750, y: 340, label: "Charlotte" },
  { x: 720, y: 400, label: "Atlanta" },
  { x: 700, y: 480, label: "Tampa" },
  { x: 780, y: 500, label: "Miami" },
  { x: 560, y: 440, label: "Nashville" },
  { x: 300, y: 180, label: "Salt Lake City" },
];

const NetworkMapSVG = () => {
  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <svg viewBox="0 0 960 600" className="w-full h-full">
        {/* Actual US Lower 48 States Outline */}
        <path
          d="M158.1,127.1l-0.3,8.8l3.2,4.4l3.6-0.8l7.9,5.2l3.9,0.8l3.9-2l3.2,0.4l2.8,2.8l4.3-0.4l2.4,2l3.2-0.8l0.8-2.4l-0.8-2.4l3.2-2.8l-2-3.2l2-2l6.3,2l2.4-1.6l-0.4-2.4l4.4-4.8l-1.2-2.4l2.8-4.8l-2-2l1.2-3.2l-2.4-3.6l4-4l-2-2.4l2.8-2.8l-0.8-2.4l-4,0.4l-0.8,2.4l-3.2,0.8l-4-3.6l2-4.8l-3.6-2l0.4-3.2l-5.2-0.8l-2,3.2l-2.8-0.4l-1.2-2.8l-3.6,0.4l-0.8,2.4l-3.6-2l-5.2,2.4l-1.6,3.6l2.4,4l-4,0.8l-3.2,5.2l1.2,3.6l-2.8,2l0.8,4l-2.8,2l0.4,3.2l-4,0.4l-2.4,5.6l-3.2,0.8z
          M83.5,168.5l-4.4,4.8l-0.4,6l2.4,5.2l-2.4,3.6l0.4,5.2l4.8,6.4l0.8,4.4l4,3.2l0.8,8l-3.2,8.4l1.2,6.8l-2.8,3.6l-5.2-0.4l-4,3.6l-6,0l-2.8,3.2l-4.8-2l-3.2,3.6l2,5.6l-0.4,4.4l2.8,2l-0.8,3.2l-4.8,2l-2-2.4l0.8-5.2l-2.8-2.4l-0.4-4l-3.2-2.4l-0.8-4.4l-2.4-0.4l0.8-4l-3.6-4l0.4-2.4l-2.8-2l1.6-4l-1.6-2.8l0.8-4.4l-2.4-3.2l2-3.2l-2-4.4l2-2.8l-0.8-4.8l2.4-2.8l-1.2-3.2l4-2.8l-2-4l3.2-4.8l-0.8-4l2.4-4l4.8,0.8l2.8-3.2l3.2,2l5.6-2l3.6,2.4l4.4-1.6l2.4,2.4l5.2-2.8l2.4,2z
          M110.3,387.9l-3.2,4.4l-1.2,7.2l3.6,7.6l1.2,8.8l4.8,4.4l5.2,0.4l3.6,4l8,1.6l3.2-1.2l3.6,2.8l5.6,0.8l5.2-3.2l2.8,1.2l3.6-2l7.6,2.8l8,7.2l4.8,2l2.8-1.2l6.4,5.6l5.2,1.6l2.8-2l3.2,0.4l2,3.2l4.8,0.4l3.6,4l3.6-0.8l3.2,2l2.4-2.4l4.8,2.4l1.2,3.2l-1.6,2.4l4,4.4l4,0.8l2.4-2l3.6,2.4l1.2,4.8l4.4,0.4l1.2,2.8l4.8-1.6l2.8,2.4l4.4-1.2l2.4,2.8l-0.4,4.8l-3.2,2.8l2.8,4.8l4.8-0.4l0.8-4.4l4-0.4l3.2,4l-0.4,3.6l2.8,2.8l6-1.2l0.8-3.6l3.2-0.8l2-4.4l4.4-2l5.2,1.2l4-2.4l0.4-3.6l4.8-2.4l2,2l6.4-4l6.8,2l1.2-2.4l4.8,0.8l2,3.2l-1.6,3.2l4,2.8l5.6-2l4.8,2.4l3.6-3.2l4,0.4l0.4-4.8l4.4-3.6l-2.4-6l1.6-5.2l4.4-1.2l-0.4-3.6l2.4-3.2l0-4.4l-4-0.4l-2.4-4l2.4-5.6l4.8-3.2l4.4,0.8l2-4.8l-3.2-2.8l2-2.8l-2.4-3.2l-4.8-0.4l-0.8-3.6l-4.8-1.2l-2.4-3.2l2.4-4l-1.2-3.2l2.4-4.4l5.2-2l0.4-3.2l-3.6-2.8l-0.4-6.4l-4.4-0.8l-3.2,2.8l-8.8-0.4l-4-4l-8.4,0.4l-2.8,2l-4.4-1.2l-2.8,2.8l-4.8-2l-4,2l-4-2.8l-6.8,0.8l-4-4.4l0.8-4.4l-4.8-2.4l-6-0.4l-2.4,2.4l-6.4-2l-2.4,2.8l-4-2l-1.2,3.6l-4.4-1.6l-3.2,3.2l-6-3.2l-2.8,0.8l-2-3.6l-4.8,1.2l-4.4-3.6l-4.8,0.4l-2.4-2.8l-4.4,2.4l-2-2.8l-4.8,0.8l-2.4-3.2l-4.4,1.2l-3.6-4.4l-5.2,1.6l-4-4l-6.8,0.8l-4.8-3.2l-2.4,0.8l-2-4l-4.8-0.8l-2.4,2.4l-4.4-2.4l-3.6,2l-1.6-3.2l-4.4,1.6l-2.8-2.4l-4.8,2l-3.6-2.4z
          M565.5,85.7l2.8-0.4l2,2.8l3.6-1.2l3.6,1.6l-0.4,2.8l4.8,0.8l1.2,3.2l4,0.4l0.8,2.8l-2.4,2l1.6,2.4l-1.2,2.4l2.4,2.8l-3.2,2.4l4,3.2l-0.4,2.8l3.6,3.2l0.4,4.4l2.8,0.8l-0.8,2.4l2.4,2l-2,2.4l2.4,3.6l-2.4,2.8l1.2,2.8l-2.4,2.8l2.4,2.4l-0.8,2.8l2.8,2.8l-0.4,2.4l2.8,2.4l-2.4,4.4l0.8,3.2l-3.2,3.2l2.4,2.8l-2.8,2.4l1.6,2.4l-2.4,2.8l1.2,3.2l-2.4,2.4l2,3.2l-3.2,2.8l2,2.4l-2.4,3.6l1.2,2.4l-2.8,2.4l2,3.2l-3.2,2.4l1.2,2.8l-2.8,2.8l1.6,2.8l-2.4,2.4l1.2,2.8l-2.4,2.8l1.6,2.8l-2.8,2l0.8,2.8l-3.2,2l0.8,3.2l-2.8,2l0.4,2.8l-2.8,2.4l1.2,2.4l-2,2.8l0.8,2.8l-3.2,2l1.2,2.4l-2.8,2.4l0.8,2.8l-2.4,2.4l1.6,2.4l-2.8,2.4l0.4,2.8l-2.4,2.4l1.2,2.4l-2.4,2.8l0.8,2.4l-2.4,2.4l0.8,2.8l-2.8,2l0.8,2.4l-2.4,2.4l0.8,2.8l-2.4,2l0.4,2.8l-2.8,2l0.8,2.4l-2.4,2.4l0.4,2.8l-2.4,2.4l0.8,2.4l-2.8,2.4l0.4,2.4l-2.4,2.8l0.8,2l-2.4,2.8l0.4,2.4l-2.8,2l0.8,2.8l-2,2l0.4,2.8l-2.8,2l0.4,2.4l-2.4,2.4l0.8,2.4l-2.4,2.4l0.4,2.8l-2.4,2l0.4,2.8l5.2-0.8l4-4l4.8,0.8l3.6-3.6l4.8,1.2l4.4-2.8l4,0.8l3.2-2.4l4.4,1.6l5.6-2.4l3.6,0.8l2.4-2.4l4.8,2.4l4-4l5.6,2l3.6-2.4l2.8,2l4.8-2.4l3.6,2.4l5.2-2l4,2l3.2-2.8l4.8,2l3.6-2l3.2,1.2l4.4-2l4.4,2.4l3.6-2l3.6,0.8l4.4-3.6l4,2.4l4.4-2l2.4,1.6l4.4-3.2l4.4,1.6l3.6-2.4l3.2,1.2l4.8-2.8l3.2,2l3.2-2l3.6,1.6l4.4-3.2l4,1.2l4-2.8l3.6,1.2l4-2.4l4,2l3.2-2.4l4,1.2l4.8-2.8l3.2,0.8l4-3.2l4,2l3.6-2.4l3.2,1.2l4.4-2.4l3.6,1.2l4-2.8l3.6,1.6l4-2.4l4,1.6l3.2-2.8l4.4,1.6l4-2.4l3.6,0.8l2.8-3.6l0.4-6.8l-4.8-4.4l0.4-3.2l-2.8-2l0.8-2.8l-2.4-2.4l1.2-4l-3.2-2.8l0.4-2.8l-2.8-2.8l0.8-3.2l-2.8-2.4l0.4-2.8l-3.2-3.2l0.8-2.8l-2.8-2.4l0.4-3.2l-2.8-2.4l0.8-2.8l-2.4-2.8l0.4-3.2l-2.8-2.4l0.8-2.8l-2.8-2.8l0.4-2.8l-2.8-2.8l0.8-3.2l-2.8-2l0.4-2.8l-4.8,0.4l-4.4-4.4l-4-0.8l-3.2,2.4l-5.2-2l-4.8,2l-4.8-2.8l-4.8,2l-4-2l-4.8,1.6l-5.2-2.4l-4,2l-4.4-1.6l-4.4,2.8l-5.2-2.8l-4,2.4l-4-1.2l-4.8,2.4l-5.2-2l-4,2.8l-4.4-1.6l-4.4,2.4l-4.8-2l-3.6,2.4l-4.4-1.6l-4.4,2.8l-5.2-2l-3.6,2.4l-4.8-1.6l-4,2.4l-4.8-2.4l-4,2.8l-4.4-1.6l-4.4,2.4l-4.4-2l-4,2.8l-4.8-1.6l-4,2.4l-4.4-2l-4.4,2.8l-4.4-1.6l-4,2.4l-4.4-2l-4.4,2.8l-4.8-1.6l-4,2l-4.4-2l-4.4,2.8l-4.4-1.6l-4.4,2.4l-4-2l-4.8,2.8l-4.4-1.2l-4.4,2l-4-2.4l-4.8,2.8l-4-1.2l-4.8,2.4l-4.4-1.6l-4.4,2.4l-4.4-2l-4.4,2.8l-4.4-1.6l-4.8,2l-4-2l-4.8,2.8l-4-1.2l-4.8,2l-4.4-2.4l-4.8,2.8l-4-0.8l-4.8,2l-4.4-2.4l-4.8,2.4l-4.4-0.8l-4.8,2l-4-2.8l-5.2,2.4l-4-1.2l-4.8,2l-4.4-2.4l-4.8,2.8l-4.4-0.8l-4.8,2l-4-2.8l-5.2,2.4l-4-0.8l-4.8,2l-4.4-2.4l-4.8,2.4l-4.4-1.2l-4.8,2.4l-4-2.4l-5.2,2.4l-4-0.8l-4.8,2.4l-4.4-2l-4.8,2l-4.4-1.2l-4.8,2.4l-4.4-2l-4.8,2l-4-1.2l-5.2,2.4l-4-2l-4.8,2l-4.4-1.2l-4.8,2.4l-4.4-2l-5.2,2l-4-1.2l-4.8,2.4l-4.4-2l-4.8,2l-4.4-1.2l-5.2,2.4l-4-2l-4.8,1.6l-4.4-1.2l-5.2,2.4l-4-2l-4.8,1.6l-4.4-1.2l-5.2,2.4l-4-1.6l-4.8,1.6l-4.4-1.6l-5.2,2l-4-1.6l-4.8,1.6l-4.4-2l-5.2,2l-4.4-1.6l-4.8,1.6l-4-2l-5.2,2l-4.4-1.6l-4.8,1.2l-4.4-2l-5.2,1.6l-4.4-2l-4.8,1.6l-4.4-2l-5.2,1.6l-4.4-2l-4.8,1.2l-4.4-2l-5.2,1.6l-4.4-2l-5.2,1.2l-4-2l-5.2,1.6l-4.4-2l-4.8,0.8l-4.4-2.4l-5.2,1.2l-4.4-2l-4.8,0.8l-4.4-2.4l-5.2,0.8l-4.4-2.4l-4.8,0.8l-4.8-2.4l-5.2,0.4l-4.4-2.8l-4.8,0.4l-4.8-2.8l-5.2,0l-4.8-3.2l-4.8,0l-4.8-3.2l-5.2-0.4l-4.8-3.6l-4.8-0.4l-5.2-3.6l-5.2-0.8l-4.8-4l-5.2-1.2l-4.8-4l-5.6-1.6l-4.8-4.4l-5.6-2l-4.8-4.8l-6-2.4l-4.8-5.2l-6.4-2.8l-4.8-6l-7.2-3.6l-2.4-4.8l-4.8-2l-2-6.4l-4.8-2.8l-1.6-5.2l-4-3.2l-1.6-5.6l-4-3.2l-0.8-6l-4.8-2.8l-0.4-6.4l-4.4-2.4l0.4-6.8l-4.4-2l0.8-6.8l-3.6-2.4l1.2-6.4l-3.6-2.8l1.6-6l-2.8-3.2l2-5.2l-2.4-4l2.4-4.8l-2-4l2.8-4.4l-1.2-4.4l3.2-3.6l-0.8-4.8l3.6-3.2l-0.4-5.2l4-2.4l0-5.6l4.4-2l0.4-5.6l4.4-1.2l0.8-6l4.8-0.4l1.2-6l4.8,0l1.6-6l4.8,0.4l2.4-5.6l4.4,0.4l2.8-5.2z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          className="opacity-60"
          transform="translate(30, 50) scale(0.9)"
        />
        
        {/* Connection lines from Fraser to clusters */}
        {contractorClusters.map((cluster, index) => (
          <g key={index}>
            <line
              x1={FRASER_MI.x}
              y1={FRASER_MI.y}
              x2={cluster.x}
              y2={cluster.y}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              className="animate-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            />
            {/* Contractor cluster pin */}
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r="6"
              fill="hsl(var(--primary))"
              className="drop-shadow-md"
            />
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r="3"
              fill="hsl(var(--primary-foreground))"
            />
          </g>
        ))}
        
        {/* Fraser, MI HQ marker */}
        <g className="animate-pulse">
          <circle
            cx={FRASER_MI.x}
            cy={FRASER_MI.y}
            r="20"
            fill="hsl(var(--primary))"
            fillOpacity="0.2"
          />
          <circle
            cx={FRASER_MI.x}
            cy={FRASER_MI.y}
            r="12"
            fill="hsl(var(--primary))"
            className="drop-shadow-lg"
          />
          <circle
            cx={FRASER_MI.x}
            cy={FRASER_MI.y}
            r="5"
            fill="hsl(var(--primary-foreground))"
          />
        </g>
        
        {/* HQ Label */}
        <g>
          <rect
            x={FRASER_MI.x - 60}
            y={FRASER_MI.y - 50}
            width="120"
            height="24"
            rx="4"
            fill="hsl(var(--foreground))"
            className="drop-shadow-lg"
          />
          <text
            x={FRASER_MI.x}
            y={FRASER_MI.y - 33}
            textAnchor="middle"
            fill="hsl(var(--background))"
            fontSize="11"
            fontWeight="600"
          >
            CT1 HQ - Fraser, MI
          </text>
        </g>
      </svg>
    </div>
  );
};

export default function NationwideNetwork() {
  const [activeContactForm, setActiveContactForm] = useState<string | null>(null);

  const featureCards = [
    { icon: Users, title: "Lead Management", description: "Capture web leads, calls, and referrals in one place. Track source, status, and next steps." },
    { icon: HardHat, title: "Job Management", description: "Schedule crews, assign tasks, and track progress from first visit to job completion." },
    { icon: Calculator, title: "Estimating & Proposals", description: "Build professional estimates fast, send digitally, and track approvals." },
    { icon: Briefcase, title: "Customer Management & CRM", description: "Store every contact, note, call, and job history. Keep relationships strong for repeat work." },
    { icon: Mic, title: "Voice AI", description: "Answer inbound calls with voice AI support, route them to the right person, and log outcomes." },
    { icon: GraduationCap, title: "Full Sales Training Suite", description: "Structured sales training for owners, reps, and office staff, aligned with CT1 workflows." },
    { icon: BookOpen, title: "Business Training & Playbooks", description: "On-demand training on pricing, leadership, hiring, and process, tailored to contractors." },
    { icon: BarChart3, title: "Dashboards & Reporting", description: "See pipeline, close rate, revenue, and job status in one view." },
    { icon: Headset, title: "Support & Success", description: "Real people who understand trades, ready to help your team succeed on the platform." },
  ];

  const tradesBadges = [
    { icon: Wrench, label: "Roofing" },
    { icon: Wind, label: "HVAC" },
    { icon: Zap, label: "Electrical" },
    { icon: Flame, label: "Plumbing" },
    { icon: Hammer, label: "Remodeling" },
    { icon: PaintBucket, label: "Painting" },
    { icon: HardHat, label: "General Contracting" },
  ];

  const testimonials = [
    {
      text: "Before CT1, our leads sat in notebooks. Now every call, estimate, and follow up sits in one place. We close more work with less chaos.",
      name: "Mike R.",
      company: "Commercial Roofing"
    },
    {
      text: "CT1 helped our team move from 'busy' to productive. Our jobs move faster, and our customers feel the difference.",
      name: "Sarah T.",
      company: "HVAC Services"
    },
    {
      text: "We went from a few crews to a multi-team operation. CT1 keeps sales, office, and field aligned.",
      name: "David L.",
      company: "Electrical Contractors"
    }
  ];

  const steps = [
    { icon: MessageCircle, title: "Step 1 – Conversation", description: "Meet with CT1 to review your business, trades, and goals. Align on fit and growth targets." },
    { icon: Rocket, title: "Step 2 – Launch Plan", description: "Build a rollout plan for leads, jobs, CRM, and training. Set up pipeline, templates, and reporting." },
    { icon: TrendingUp, title: "Step 3 – Ongoing Growth", description: "Work with Contractor Success on training, hiring support, and process improvement as your volume grows." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader onContactClick={() => setActiveContactForm("contact-sales")} />

      {/* Sticky Floating CTA Button */}
      <div className="fixed bottom-6 right-4 z-50">
        <Dialog open={activeContactForm === "floating-cta"} onOpenChange={(open) => setActiveContactForm(open ? "floating-cta" : null)}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/50 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105">
              <Phone className="mr-2 h-4 w-4" />
              Talk With CT1
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ContactForm
              title="Talk With CT1"
              description="Connect with our team to learn how CT1 can help grow your contracting business"
              ctaText="Get In Touch"
              formType="contact-sales"
              onClose={() => setActiveContactForm(null)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION 1: Hero */}
      <section 
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-white">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
                Nationwide Network of Contractors, <span className="text-primary">Powered by CT1</span>
              </h1>
              <p className="text-xl sm:text-2xl mb-8 text-white/90 leading-relaxed">
                Run your entire trades business in one platform. Leads, jobs, estimates, CRM, Voice AI, and training working together for growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Dialog open={activeContactForm === "apply-network"} onOpenChange={(open) => setActiveContactForm(open ? "apply-network" : null)}>
                  <DialogTrigger asChild>
                    <Button className="btn-hero text-lg px-8 py-4">
                      Apply to Join the Network
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ContactForm
                      title="Apply to Join the Network"
                      description="Take the first step toward growing your contracting business with CT1"
                      ctaText="Submit Application"
                      formType="network-signup"
                      onClose={() => setActiveContactForm(null)}
                    />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={activeContactForm === "schedule-demo"} onOpenChange={(open) => setActiveContactForm(open ? "schedule-demo" : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground text-lg px-8 py-4">
                      Schedule a Live Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ContactForm
                      title="Schedule a Live Demo"
                      description="See CT1 in action with a personalized walkthrough"
                      ctaText="Schedule Demo"
                      formType="demo"
                      onClose={() => setActiveContactForm(null)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <p className="text-white/70 text-sm mb-6 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Headquartered in Fraser, Michigan. Supporting contractors across the United States.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                  Built for trades
                </Badge>
                <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                  Business suite for contractors
                </Badge>
                <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2">
                  Sales and operations in one place
                </Badge>
              </div>
            </div>
            
            {/* Right: Logo/Badge cluster */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
                  <img src={ct1Logo} alt="CT1" className="h-32 w-32 mx-auto mb-4" />
                  <p className="text-white text-center font-semibold text-xl">One-Up Your Business</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Map Visual */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Map */}
            <div className="order-2 lg:order-1">
              <NetworkMapSVG />
            </div>
            
            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                From Fraser, Michigan to Job Sites <span className="text-primary">Across the Country</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                CT1 starts at our headquarters in Fraser, Michigan, then connects to contractors across the United States. Every new partner adds strength to the network. You stay independent. We bring structure, technology, and training so your crews stay busy and profitable.
              </p>
              <p className="text-primary font-semibold mb-6">See How The Network Works</p>
              <Dialog open={activeContactForm === "contractor-success"} onOpenChange={(open) => setActiveContactForm(open ? "contractor-success" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-ct1">
                    Talk With Contractor Success
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Talk With Contractor Success"
                    description="Connect with our team to learn how CT1 can support your growth"
                    ctaText="Get Started"
                    formType="contractor-success"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Business Case */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-center">
              Why Contractors Join The <span className="text-primary">CT1 Network</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-center">
              You want consistent work, healthy margin, and time back. CT1 gives you the structure to run a serious business, not a collection of jobs.
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "More quality leads tracked from first call to closed job.",
                "Standard workflows from inbound lead to final invoice.",
                "Fewer dropped balls with task tracking and automation.",
                "Better visibility into margin, revenue, and crew workload.",
                "Training built into the same platform your team uses every day."
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="text-center">
              <Dialog open={activeContactForm === "growth-session"} onOpenChange={(open) => setActiveContactForm(open ? "growth-session" : null)}>
                <DialogTrigger asChild>
                  <Button className="btn-ct1">
                    Get My Business Growth Session
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <ContactForm
                    title="Get Your Business Growth Session"
                    description="Schedule a personalized session to discuss your business goals and how CT1 can help"
                    ctaText="Schedule Session"
                    formType="growth-session"
                    onClose={() => setActiveContactForm(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Product Suite */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              An Entire Business Suite <span className="text-primary">For Contractors</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Replace scattered apps, spreadsheets, and sticky notes with one platform that supports every part of your operation.
            </p>
          </div>
          
          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featureCards.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
          
          {/* Trades Badge Strip */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 py-6 border-y border-border">
            {tradesBadges.map((trade, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 text-sm flex items-center gap-2">
                <trade.icon className="h-4 w-4" />
                {trade.label}
              </Badge>
            ))}
          </div>
          
          {/* CTA Strip */}
          <div className="bg-card rounded-xl p-8 text-center border">
            <p className="text-xl font-semibold text-foreground mb-4">
              Ready to run your contracting business on one platform?
            </p>
            <Dialog open={activeContactForm === "see-action"} onOpenChange={(open) => setActiveContactForm(open ? "see-action" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  See CT1 In Action
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="See CT1 In Action"
                  description="Get a personalized demo of the CT1 platform"
                  ctaText="Schedule Demo"
                  formType="demo"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 5: Proof / Testimonials */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built For Trades. <span className="text-primary">Trusted By Contractors.</span>
            </h2>
          </div>
          
          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 relative">
                <Quote className="h-10 w-10 text-primary/20 absolute top-4 right-4" />
                <p className="text-foreground mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Stats Row */}
          <div className="grid sm:grid-cols-3 gap-8 mb-12 py-8 border-y border-border">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">47%</p>
              <p className="text-muted-foreground">Higher lead response speed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">12+</p>
              <p className="text-muted-foreground">More booked jobs per month</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">50+</p>
              <p className="text-muted-foreground">Hours of training content</p>
            </div>
          </div>
          
          <div className="text-center">
            <Dialog open={activeContactForm === "success-coach"} onOpenChange={(open) => setActiveContactForm(open ? "success-coach" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  Talk With A Contractor Success Coach
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Talk With A Contractor Success Coach"
                  description="Connect with a coach who understands your business and can help you grow"
                  ctaText="Schedule Call"
                  formType="success-coach"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 6: How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How To Join The <span className="text-primary">CT1 Nationwide Network</span>
            </h2>
          </div>
          
          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="mx-auto h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground mb-6 italic">
              Every partner enters with a clear plan for the first 90 days.
            </p>
            <Dialog open={activeContactForm === "90-day-plan"} onOpenChange={(open) => setActiveContactForm(open ? "90-day-plan" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-ct1">
                  Schedule My 90-Day Plan Call
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Schedule Your 90-Day Plan Call"
                  description="Let's create a clear roadmap for your first 90 days with CT1"
                  ctaText="Schedule Call"
                  formType="90-day-plan"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* SECTION 7: Footer Micro-CTA */}
      <section className="py-12 bg-primary/10 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xl font-semibold text-foreground text-center sm:text-left">
              Ready to grow from local leader to network partner?
            </p>
            <Dialog open={activeContactForm === "footer-apply"} onOpenChange={(open) => setActiveContactForm(open ? "footer-apply" : null)}>
              <DialogTrigger asChild>
                <Button className="btn-hero">
                  Apply To Join The Network
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ContactForm
                  title="Apply To Join The Network"
                  description="Take the first step toward growing your contracting business with CT1"
                  ctaText="Submit Application"
                  formType="network-signup"
                  onClose={() => setActiveContactForm(null)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
