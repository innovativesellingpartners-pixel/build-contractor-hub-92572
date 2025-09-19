import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Globe, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings, 
  FileText,
  Wrench,
  Star,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface MarketplaceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  icon: any;
  featured?: boolean;
  provider: string;
  features: string[];
}

export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const marketplaceItems: MarketplaceItem[] = [
    {
      id: '1',
      category: 'legal',
      title: 'LLC Formation Service',
      description: 'Complete business formation with state filing, registered agent, and compliance support.',
      price: '$299',
      rating: 4.8,
      reviews: 127,
      icon: Shield,
      featured: true,
      provider: 'LegalEase Business',
      features: ['State Filing Included', 'Registered Agent Service', 'Operating Agreement Template', 'EIN Application Support']
    },
    {
      id: '2',
      category: 'insurance',
      title: 'Contractor Insurance Bundle',
      description: 'Comprehensive liability, workers comp, and equipment coverage designed for contractors.',
      price: '$189/month',
      rating: 4.9,
      reviews: 89,
      icon: Shield,
      provider: 'ProTrade Insurance',
      features: ['General Liability', 'Workers Compensation', 'Equipment Coverage', 'Commercial Auto']
    },
    {
      id: '3',
      category: 'digital',
      title: 'Professional Website Package',
      description: 'Custom contractor website with lead capture, project galleries, and mobile optimization.',
      price: '$149/month',
      rating: 4.7,
      reviews: 203,
      icon: Globe,
      provider: 'ContractorWeb Pro',
      features: ['Custom Design', 'Lead Capture Forms', 'Project Gallery', 'SEO Optimized']
    },
    {
      id: '4',
      category: 'marketing',
      title: 'Digital Marketing Suite',
      description: 'Complete lead generation system with Google Ads, Facebook marketing, and local SEO.',
      price: '$399/month',
      rating: 4.6,
      reviews: 156,
      icon: TrendingUp,
      featured: true,
      provider: 'LeadGen Masters',
      features: ['Google Ads Management', 'Social Media Marketing', 'Local SEO', 'Lead Tracking']
    },
    {
      id: '5',
      category: 'software',
      title: 'Contractor CRM System',
      description: 'Complete customer relationship management system built specifically for contractors.',
      price: '$79/month',
      rating: 4.8,
      reviews: 312,
      icon: Users,
      provider: 'BuildCRM',
      features: ['Lead Management', 'Project Tracking', 'Automated Follow-ups', 'Mobile App']
    },
    {
      id: '6',
      category: 'finance',
      title: 'Invoicing & Payment Processing',
      description: 'Professional invoicing software with integrated payment processing and accounting.',
      price: '$49/month',
      rating: 4.7,
      reviews: 289,
      icon: DollarSign,
      provider: 'ContractorPay',
      features: ['Custom Invoices', 'Online Payments', 'Expense Tracking', 'QuickBooks Integration']
    },
    {
      id: '7',
      category: 'tools',
      title: 'Project Management Suite',
      description: 'Complete project management tools with scheduling, budgeting, and team collaboration.',
      price: '$99/month',
      rating: 4.5,
      reviews: 178,
      icon: Settings,
      provider: 'BuildManager Pro',
      features: ['Project Scheduling', 'Budget Tracking', 'Team Chat', 'Document Storage']
    },
    {
      id: '8',
      category: 'equipment',
      title: 'Equipment Financing',
      description: 'Fast approval equipment financing with competitive rates for contractors.',
      price: 'Quote Based',
      rating: 4.4,
      reviews: 95,
      icon: Wrench,
      provider: 'EquipFinance Plus',
      features: ['Fast Approval', 'Competitive Rates', 'New & Used Equipment', 'Flexible Terms']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Services', count: marketplaceItems.length },
    { id: 'legal', name: 'Legal & Compliance', count: marketplaceItems.filter(item => item.category === 'legal').length },
    { id: 'insurance', name: 'Insurance', count: marketplaceItems.filter(item => item.category === 'insurance').length },
    { id: 'digital', name: 'Digital Services', count: marketplaceItems.filter(item => item.category === 'digital').length },
    { id: 'marketing', name: 'Marketing', count: marketplaceItems.filter(item => item.category === 'marketing').length },
    { id: 'software', name: 'Software & Apps', count: marketplaceItems.filter(item => item.category === 'software').length },
    { id: 'finance', name: 'Financial Services', count: marketplaceItems.filter(item => item.category === 'finance').length },
    { id: 'tools', name: 'Tools & Equipment', count: marketplaceItems.filter(item => item.category === 'tools').length },
    { id: 'equipment', name: 'Equipment Financing', count: marketplaceItems.filter(item => item.category === 'equipment').length }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? marketplaceItems 
    : marketplaceItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contractor Marketplace</h1>
            <p className="text-muted-foreground mt-2">Everything you need to run and grow your business</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card className="card-industrial">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Marketplace Items */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Card key={item.id} className={`card-industrial ${item.featured ? 'border-primary shadow-hero' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            {item.featured && (
                              <Badge className="bg-primary text-primary-foreground text-xs mt-1">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary">{item.price}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{item.rating}</span>
                            <span>({item.reviews})</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{item.description}</CardDescription>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Provider: {item.provider}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {item.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="contractor" className="flex-1">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <IconComponent className="h-6 w-6 text-primary" />
                                </div>
                                {item.title}
                              </DialogTitle>
                              <DialogDescription>
                                Provided by {item.provider}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-muted-foreground">{item.description}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">What's Included</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {item.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div className="h-2 w-2 bg-primary rounded-full" />
                                      <span className="text-sm">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div>
                                  <div className="text-2xl font-bold text-primary">{item.price}</div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{item.rating} ({item.reviews} reviews)</span>
                                  </div>
                                </div>
                                <Button variant="hero">
                                  Get Started
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}