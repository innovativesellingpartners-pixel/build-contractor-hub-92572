import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  Shield, 
  Network, 
  Smartphone, 
  Radio, 
  Users, 
  TrendingUp,
  MessageSquare,
  Building2,
  Mail,
  Phone
} from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

interface TechnologyPartner {
  id: string;
  name: string;
  category: string;
  logo: string;
  description: string;
  fullDescription: string;
  features: string[];
  benefits: string[];
  useCases: string[];
}

export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<TechnologyPartner | null>(null);
  
  const technologyPartners: TechnologyPartner[] = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      category: 'crm',
      logo: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
      description: 'Complete CRM platform for growing contractors',
      fullDescription: 'HubSpot provides a comprehensive CRM solution designed to help contractors manage leads, track customer interactions, and grow their business. With powerful automation and reporting tools, you can streamline your sales process and close more deals.',
      features: ['Contact & Lead Management', 'Email Marketing Automation', 'Sales Pipeline Tracking', 'Reporting & Analytics'],
      benefits: ['Increase lead conversion by 30%', 'Save 10+ hours per week on admin tasks', 'Improve customer communication', 'Scale your business efficiently'],
      useCases: ['Managing customer relationships', 'Tracking sales opportunities', 'Automating follow-up emails', 'Generating sales reports']
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      category: 'crm',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
      description: 'Enterprise-grade CRM for construction businesses',
      fullDescription: 'Salesforce delivers the #1 CRM platform for managing every aspect of your contractor business. From project management to customer service, Salesforce helps you build lasting relationships and grow revenue.',
      features: ['Advanced Lead Management', 'Project Tracking', 'Mobile App Access', 'Custom Workflows', 'AI-Powered Insights'],
      benefits: ['Increase productivity by 25%', 'Better visibility into projects', 'Improved team collaboration', 'Data-driven decision making'],
      useCases: ['Enterprise project management', 'Multi-location coordination', 'Complex sales processes', 'Customer service management']
    },
    {
      id: 'google-cloud',
      name: 'Google Cloud',
      category: 'cloud',
      logo: 'https://www.gstatic.com/images/branding/product/1x/google_cloud_512dp.png',
      description: 'Secure cloud infrastructure for your business',
      fullDescription: 'Google Cloud provides enterprise-grade cloud computing services to help contractors store data securely, collaborate in real-time, and access business applications from anywhere. Built on Google\'s secure infrastructure with 99.9% uptime.',
      features: ['Cloud Storage & Backup', 'Google Workspace Integration', 'Advanced Security', 'Real-time Collaboration', 'Scalable Infrastructure'],
      benefits: ['Reduce IT costs by 40%', 'Access files from anywhere', 'Automatic backups', 'Enhanced security'],
      useCases: ['Document management', 'Team collaboration', 'Data backup and recovery', 'Remote work enablement']
    },
    {
      id: 'tmobile',
      name: 'T-Mobile',
      category: 'mobility',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/T-Mobile_logo.svg',
      description: '5G connectivity for field teams',
      fullDescription: 'T-Mobile for Business provides contractors with America\'s largest 5G network, ensuring your field teams stay connected with fast, reliable mobile service. Special business plans designed for construction companies.',
      features: ['Unlimited 5G Data', 'Mobile Hotspots', 'Business Device Management', 'International Coverage', 'Priority Support'],
      benefits: ['30% faster connectivity', 'Reduced communication costs', 'Better field team coordination', 'Reliable job site connectivity'],
      useCases: ['Field team communication', 'Mobile project updates', 'On-site photo uploads', 'Real-time customer updates']
    },
    {
      id: 'ringcentral',
      name: 'RingCentral',
      category: 'communication',
      logo: 'https://www.ringcentral.com/content/dam/rc-www/en_us/images/brand-assets/rc-logo-icon-orange-rgb.svg',
      description: 'Unified communications for contractors',
      fullDescription: 'RingCentral provides a complete business phone system with video conferencing, team messaging, and call management—all in one platform. Perfect for contractors who need professional communication tools.',
      features: ['Business Phone System', 'Video Conferencing', 'Team Messaging', 'Call Recording', 'Mobile App'],
      benefits: ['Professional business image', 'Never miss a customer call', 'Seamless team communication', 'Work from anywhere'],
      useCases: ['Customer service calls', 'Team coordination', 'Client meetings', 'Remote consultations']
    },
    {
      id: 'zoom',
      name: 'Zoom',
      category: 'communication',
      logo: 'https://st1.zoom.us/static/6.3.28380/image/new/ZoomLogo.png',
      description: 'Video meetings for client consultations',
      fullDescription: 'Zoom provides reliable video conferencing solutions for contractors to meet with clients remotely, conduct virtual walkthroughs, and collaborate with team members. HD video and screen sharing make remote meetings feel personal.',
      features: ['HD Video Meetings', 'Screen Sharing', 'Meeting Recording', 'Virtual Backgrounds', 'Calendar Integration'],
      benefits: ['Save travel time', 'Increase meeting efficiency', 'Better client engagement', 'Record consultations'],
      useCases: ['Virtual client consultations', 'Project walkthroughs', 'Team meetings', 'Supplier meetings']
    },
    {
      id: 'geotab',
      name: 'Geotab',
      category: 'iot',
      logo: 'https://www.geotab.com/wp-content/themes/geotab/images/geotab-logo.svg',
      description: 'Fleet tracking and management',
      fullDescription: 'Geotab provides advanced GPS fleet tracking and management solutions for contractors. Monitor vehicle locations, optimize routes, improve driver safety, and reduce fuel costs with real-time tracking and detailed analytics.',
      features: ['Real-Time GPS Tracking', 'Route Optimization', 'Driver Safety Monitoring', 'Fuel Management', 'Maintenance Scheduling'],
      benefits: ['Reduce fuel costs by 15%', 'Improve driver safety', 'Optimize job schedules', 'Better vehicle maintenance'],
      useCases: ['Fleet management', 'Route planning', 'Driver performance', 'Vehicle maintenance tracking']
    },
    {
      id: 'fortinet',
      name: 'Fortinet',
      category: 'cybersecurity',
      logo: 'https://www.fortinet.com/content/dam/fortinet-com/images/general-images/fortinet-logo.png',
      description: 'Enterprise cybersecurity protection',
      fullDescription: 'Fortinet delivers comprehensive cybersecurity solutions to protect your contractor business from cyber threats. Advanced firewall protection, secure VPN access, and threat detection keep your business data safe.',
      features: ['Next-Gen Firewall', 'VPN Security', 'Threat Detection', 'Email Security', '24/7 Monitoring'],
      benefits: ['Protect sensitive data', 'Prevent cyber attacks', 'Secure remote access', 'Compliance ready'],
      useCases: ['Network security', 'Remote work protection', 'Data encryption', 'Compliance management']
    },
    {
      id: 'cisco',
      name: 'Cisco',
      category: 'networking',
      logo: 'https://www.cisco.com/c/dam/cdc/t/cisco-logo.png',
      description: 'Enterprise networking solutions',
      fullDescription: 'Cisco provides industry-leading networking equipment and solutions for contractors. Build a reliable, secure network infrastructure that scales with your business growth.',
      features: ['Enterprise Routers & Switches', 'Wireless Access Points', 'Network Security', 'SD-WAN', 'Network Management'],
      benefits: ['99.9% network uptime', 'Faster internet speeds', 'Enhanced security', 'Easy expansion'],
      useCases: ['Office networking', 'Multi-site connectivity', 'Secure remote access', 'Guest Wi-Fi']
    },
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      category: 'cloud',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      description: 'Complete productivity suite',
      fullDescription: 'Microsoft 365 provides contractors with essential business tools including Office apps, email, file storage, and collaboration tools. Everything you need to run your business efficiently.',
      features: ['Office Apps (Word, Excel, PowerPoint)', 'Business Email', 'OneDrive Storage', 'Teams Collaboration', 'SharePoint'],
      benefits: ['Professional productivity tools', 'Secure file sharing', 'Better collaboration', 'Mobile access'],
      useCases: ['Document creation', 'Email communication', 'File storage & sharing', 'Team collaboration']
    },
    {
      id: 'teletrac-navman',
      name: 'Teletrac Navman',
      category: 'iot',
      logo: 'https://www.teletracnavman.com/resources/themes/tnm/img/teletrac-navman-logo.svg',
      description: 'GPS fleet management solutions',
      fullDescription: 'Teletrac Navman offers powerful GPS tracking and fleet management tools specifically designed for construction and contractor businesses. Track vehicles, equipment, and improve operational efficiency.',
      features: ['Vehicle Tracking', 'Equipment Monitoring', 'Driver Behavior Analysis', 'Job Site Verification', 'Asset Management'],
      benefits: ['Improve fleet efficiency', 'Reduce unauthorized use', 'Verify job completion', 'Lower insurance costs'],
      useCases: ['Vehicle tracking', 'Equipment location', 'Time tracking', 'Job verification']
    },
    {
      id: 'vonage',
      name: 'Vonage',
      category: 'communication',
      logo: 'https://www.vonage.com/content/dam/vonage/us/logos/vonage-logo.svg',
      description: 'Business communication platform',
      fullDescription: 'Vonage delivers unified communications for contractors including voice, video, messaging, and contact center solutions. Keep your team and customers connected with reliable business communications.',
      features: ['Business Phone Service', 'SMS/MMS Messaging', 'Video Conferencing', 'Call Center Tools', 'API Integration'],
      benefits: ['Professional communication', 'Increase customer satisfaction', 'Better team coordination', 'Flexible pricing'],
      useCases: ['Customer calls', 'SMS notifications', 'Video consultations', 'Support hotline']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Technologies', count: technologyPartners.length, icon: Building2 },
    { id: 'crm', name: 'CRM & Sales', count: technologyPartners.filter(p => p.category === 'crm').length, icon: Users },
    { id: 'cloud', name: 'Cloud Solutions', count: technologyPartners.filter(p => p.category === 'cloud').length, icon: Cloud },
    { id: 'communication', name: 'Communication', count: technologyPartners.filter(p => p.category === 'communication').length, icon: MessageSquare },
    { id: 'mobility', name: '5G & Mobility', count: technologyPartners.filter(p => p.category === 'mobility').length, icon: Smartphone },
    { id: 'iot', name: 'IoT & Tracking', count: technologyPartners.filter(p => p.category === 'iot').length, icon: Radio },
    { id: 'cybersecurity', name: 'Cybersecurity', count: technologyPartners.filter(p => p.category === 'cybersecurity').length, icon: Shield },
    { id: 'networking', name: 'Networking', count: technologyPartners.filter(p => p.category === 'networking').length, icon: Network }
  ];

  const filteredPartners = selectedCategory === 'all' 
    ? technologyPartners 
    : technologyPartners.filter(p => p.category === selectedCategory);

  if (selectedPartner) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl p-6">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPartner(null)}
            >
              ← Back to Marketplace
            </Button>
            <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedPartner.logo} 
                      alt={selectedPartner.name}
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
                      }}
                    />
                    <div>
                      <CardTitle className="text-3xl">{selectedPartner.name}</CardTitle>
                      <Badge className="mt-2">{categories.find(c => c.id === selectedPartner.category)?.name}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-lg">{selectedPartner.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground">{selectedPartner.fullDescription}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPartner.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPartner.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Use Cases for Contractors</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedPartner.useCases.map((useCase, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                          <div className="h-1.5 w-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{useCase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Contact Sales</CardTitle>
                  <CardDescription>Get started with {selectedPartner.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Our team will help you implement {selectedPartner.name} for your contracting business.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" variant="hero" asChild>
                      <a href="mailto:sales@myct1.com">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Sales Team
                      </a>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <a href="tel:+12487527308">
                        <Phone className="h-4 w-4 mr-2" />
                        (248) 752-7308
                      </a>
                    </Button>
                  </div>
                  <div className="pt-4 border-t text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Why choose CT1?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Expert implementation support</li>
                      <li>• Tailored contractor solutions</li>
                      <li>• Ongoing training & support</li>
                      <li>• Competitive pricing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center gap-4 mb-8">
          <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16" />
          <div>
            <h1 className="text-4xl font-bold mb-2">CT1 Technology Marketplace</h1>
            <p className="text-xl text-muted-foreground">Transform your contracting business with cutting-edge solutions to save time and money</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPartners.map((partner) => (
                <Card 
                  key={partner.id} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => setSelectedPartner(partner)}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-24 w-full flex items-center justify-center mb-4 bg-white rounded-lg p-4">
                      <img 
                        src={partner.logo} 
                        alt={partner.name}
                        className="max-h-16 w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    <h3 className="font-semibold mb-2">{partner.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{partner.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}