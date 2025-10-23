import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Shield, FileText, AlertCircle, CheckCircle, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { ContactForm } from "@/components/ContactForm";

const insuranceProviders = [
  "State Farm",
  "Allstate",
  "Progressive",
  "Liberty Mutual",
  "Nationwide",
  "Travelers",
  "Hartford",
  "Chubb",
  "CNA",
  "Zurich",
  "NEXT Insurance",
  "Hiscox",
  "BiBerk",
  "Pie Insurance",
  "AP Intego",
  "Coterie Insurance",
  "Thimble",
  "Simply Business",
  "Insureon",
  "CoverWallet",
  "Workmen's Circle",
  "The Hartford AARP",
  "AmTrust Financial",
  "Markel",
  "Berkshire Hathaway GUARD",
  "Philadelphia Insurance Companies",
  "Acuity Insurance",
  "Auto-Owners Insurance",
  "EMC Insurance",
  "Great American Insurance",
  "World Insurance",
  "Farmers Insurance",
  "GEICO Commercial",
  "MetLife",
  "AIG",
  "Cincinnati Insurance",
  "Westfield Insurance",
  "Selective Insurance",
  "Hanover Insurance",
  "Society Insurance",
  "Guard Insurance",
  "Main Street America",
  "Safeco Insurance",
  "Foremost Insurance",
  "Allied Insurance",
  "Munich Re",
  "QBE North America",
  "Encompass Insurance",
  "Grange Insurance",
  "California Casualty",
  "Mercury Insurance",
  "Kemper Insurance",
  "Peerless Insurance",
  "Plymouth Rock",
  "Rockhill Insurance",
  "State Auto Insurance",
  "COUNTRY Financial",
  "Erie Insurance",
  "Frankenmuth Insurance",
  "Horace Mann",
  "IMT Insurance",
  "National General Insurance",
  "PEMCO Insurance",
  "Tower Group",
  "United Fire Group",
  "Utica National",
  "W.R. Berkley Corporation",
  "West Bend Mutual Insurance",
  "Western National Insurance",
  "Brotherhood Mutual",
  "Church Mutual",
  "GuideOne Insurance",
  "OneBeacon Insurance",
  "RLI Corp",
  "Sompo International",
  "StarStone Insurance",
  "Arch Insurance",
  "Assurant",
  "Argo Group",
  "Tokio Marine",
  "XL Catlin",
  "Pacific Specialty Insurance",
  "Nationwide E&S/Specialty",
  "Admiral Insurance",
  "AmWINS",
  "Applied Underwriters",
  "Builders Mutual",
  "Capitol Specialty Insurance",
  "Crum & Forster",
  "Falls Lake National Insurance",
  "Global Liberty Insurance",
  "James River Insurance",
  "Kinsale Insurance",
  "Nautilus Insurance",
  "ProSight Specialty Insurance",
  "Risk Strategies",
  "Safety National",
  "Sentry Insurance",
  "Stillwater Insurance",
  "StoneRiver",
  "Wright Insurance",
].sort();

export function Insurance() {
  const [open, setOpen] = useState(true);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setComboboxOpen(false);
    toast({
      title: "Insurance Provider Selected",
      description: `You selected ${provider}. Contact your provider to manage your policy.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              CT1 Insurance & Compliance
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage your insurance policies and compliance documents
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button 
            onClick={() => window.location.href = 'mailto:sales@myct1.com?subject=Insurance Options - Lower My Bill'}
            className="w-full sm:w-auto"
            size="sm"
          >
            Contact Sales
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" size="sm">Upload Documents</Button>
        </div>
      </div>

      {/* Insurance Provider Selection Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
              <DialogTitle className="text-2xl">Select Your Insurance Provider</DialogTitle>
            </div>
            <DialogDescription>
              Choose your current insurance provider from the list below to manage your policy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between h-12"
                >
                  {selectedProvider || "Select insurance provider..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-card z-50" align="start">
                <Command className="bg-card">
                  <CommandInput placeholder="Search insurance providers..." className="h-12" />
                  <CommandList>
                    <CommandEmpty>No insurance provider found.</CommandEmpty>
                    <CommandGroup>
                      {insuranceProviders.map((provider) => (
                        <CommandItem
                          key={provider}
                          value={provider}
                          onSelect={() => handleProviderSelect(provider)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProvider === provider ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {provider}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedProvider && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Provider: {selectedProvider}</p>
                <p className="text-xs text-muted-foreground">
                  Contact your insurance provider directly to manage your policy, file claims, or update coverage.
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => setOpen(false)} 
              className="w-full h-11"
              disabled={!selectedProvider}
            >
              Continue with {selectedProvider || "Selected Provider"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insurance Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">General Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Dec 31, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Workers Comp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <Badge className="bg-yellow-500">Expiring Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Feb 15, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contractor License</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Jun 30, 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Providers */}
      <Card>
        <CardHeader>
          <CardTitle>CT1 Preferred Insurance Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">CT1 Insurance Program</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Comprehensive coverage designed specifically for CT1 contractors with competitive rates and exclusive benefits.
                  </p>
                  <div className="flex gap-2">
                    <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Get a Quote</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ContactForm 
                          title="Get Insurance Quote"
                          description="Fill out the form below and our insurance team will contact you with a personalized quote"
                          ctaText="Request Quote"
                          formType="insurance_quote"
                          onClose={() => setQuoteDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Partner Insurance Solutions</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Additional coverage options for specialized work and expanded protection.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">Contact Agent</Button>
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">General Liability Certificate</p>
                  <p className="text-xs text-muted-foreground">Updated: Jan 1, 2024</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Workers Comp Policy</p>
                  <p className="text-xs text-muted-foreground">Updated: Jan 1, 2023</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Contractor License</p>
                  <p className="text-xs text-muted-foreground">Updated: Jul 1, 2023</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
