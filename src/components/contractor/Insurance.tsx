import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Shield, FileText, AlertCircle, CheckCircle, Check, ChevronsUpDown, Upload, Download, Trash2, Loader2, ExternalLink, LogIn, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { ContactForm } from "@/components/ContactForm";
import { useInsuranceDocuments } from "@/hooks/useInsuranceDocuments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface InsuranceProvider {
  name: string;
  portalUrl: string;
}

const insuranceProviders: InsuranceProvider[] = [
  // Major National Carriers
  { name: "Acuity Insurance", portalUrl: "https://www.acuity.com/my-account" },
  { name: "Admiral Insurance", portalUrl: "https://www.admiralins.com" },
  { name: "AIG", portalUrl: "https://www.aig.com/individual/account" },
  { name: "Allstate", portalUrl: "https://myaccount.allstate.com" },
  { name: "Allied Insurance", portalUrl: "https://www.nationwide.com/personal/login" },
  { name: "American Family Insurance", portalUrl: "https://www.amfam.com/myaccount" },
  { name: "AmTrust Financial", portalUrl: "https://amtrustfinancial.com/login" },
  { name: "AmWINS", portalUrl: "https://www.amwins.com" },
  { name: "AP Intego", portalUrl: "https://www.apintego.com/login" },
  { name: "Applied Underwriters", portalUrl: "https://www.appliedunderwriters.com" },
  { name: "Arch Insurance", portalUrl: "https://www.archinsurance.com" },
  { name: "Argo Group", portalUrl: "https://www.argolimited.com" },
  { name: "Assurant", portalUrl: "https://myassurant.com" },
  { name: "Auto-Owners Insurance", portalUrl: "https://www.auto-owners.com/policyholder" },
  { name: "Berkshire Hathaway GUARD", portalUrl: "https://www.guard.com/policyholder-login" },
  { name: "BiBerk", portalUrl: "https://www.biberk.com/account/login" },
  { name: "Brotherhood Mutual", portalUrl: "https://www.brotherhoodmutual.com/login" },
  { name: "Builders Mutual", portalUrl: "https://www.buildersmutual.com/login" },
  { name: "California Casualty", portalUrl: "https://www.calcas.com/my-account" },
  { name: "Capitol Specialty Insurance", portalUrl: "https://www.capitolspecialty.com" },
  { name: "Church Mutual", portalUrl: "https://www.churchmutual.com/login" },
  { name: "Chubb", portalUrl: "https://my.chubb.com" },
  { name: "Cincinnati Insurance", portalUrl: "https://www.cinfin.com/policyholders" },
  { name: "CNA", portalUrl: "https://www.cna.com/web/guest/cna/login" },
  { name: "COUNTRY Financial", portalUrl: "https://www.countryfinancial.com/en/login.html" },
  { name: "Coterie Insurance", portalUrl: "https://app.coterieinsurance.com/login" },
  { name: "CoverWallet", portalUrl: "https://www.coverwallet.com/login" },
  { name: "Crum & Forster", portalUrl: "https://www.cfins.com" },
  { name: "Donegal Insurance", portalUrl: "https://www.donegalgroup.com/policyholder" },
  { name: "EMC Insurance", portalUrl: "https://www.emcins.com/losscontrol/login" },
  { name: "Encompass Insurance", portalUrl: "https://www.encompassinsurance.com/login" },
  { name: "Erie Insurance", portalUrl: "https://www.erieinsurance.com/login" },
  { name: "Falls Lake National Insurance", portalUrl: "https://www.fallslakeins.com" },
  { name: "Farmers Insurance", portalUrl: "https://www.farmers.com/login" },
  { name: "Foremost Insurance", portalUrl: "https://www.foremost.com/login" },
  { name: "Frankenmuth Insurance", portalUrl: "https://www.ffrankenmuth.com/login" },
  { name: "GAINSCO", portalUrl: "https://www.gainsco.com" },
  { name: "GEICO Commercial", portalUrl: "https://www.geico.com/login" },
  { name: "Global Liberty Insurance", portalUrl: "https://www.globallibertyinsurance.com" },
  { name: "Grange Insurance", portalUrl: "https://www.grangeinsurance.com/login" },
  { name: "Great American Insurance", portalUrl: "https://www.greatamericaninsurancegroup.com" },
  { name: "Guard Insurance", portalUrl: "https://www.guard.com/policyholder-login" },
  { name: "GuideOne Insurance", portalUrl: "https://www.guideone.com/login" },
  { name: "Hanover Insurance", portalUrl: "https://www.hanover.com/policyholder" },
  { name: "Hartford (The Hartford)", portalUrl: "https://www.thehartford.com/login" },
  { name: "Hiscox", portalUrl: "https://www.hiscox.com/login" },
  { name: "Horace Mann", portalUrl: "https://www.horacemann.com/login" },
  { name: "ICW Group", portalUrl: "https://www.icwgroup.com/login" },
  { name: "IMT Insurance", portalUrl: "https://www.imtins.com/login" },
  { name: "Insureon", portalUrl: "https://www.insureon.com/login" },
  { name: "James River Insurance", portalUrl: "https://www.jamesriverins.com" },
  { name: "Kemper Insurance", portalUrl: "https://www.kemper.com/login" },
  { name: "Kinsale Insurance", portalUrl: "https://www.kinsalecapitalgroup.com" },
  { name: "Liberty Mutual", portalUrl: "https://business.libertymutual.com/login" },
  { name: "Main Street America", portalUrl: "https://www.msagroup.com" },
  { name: "Markel", portalUrl: "https://www.markel.com/login" },
  { name: "Merchants Insurance Group", portalUrl: "https://www.merchantsgroup.com" },
  { name: "Mercury Insurance", portalUrl: "https://www.mercuryinsurance.com/login" },
  { name: "MetLife", portalUrl: "https://online.metlife.com/edge/web/public/login" },
  { name: "Munich Re", portalUrl: "https://www.munichre.com" },
  { name: "National General Insurance", portalUrl: "https://www.nationalgeneral.com/login" },
  { name: "Nationwide", portalUrl: "https://www.nationwide.com/personal/login" },
  { name: "Nautilus Insurance", portalUrl: "https://www.nautilusinsgroup.com" },
  { name: "NEXT Insurance", portalUrl: "https://app.nextinsurance.com/login" },
  { name: "OneBeacon Insurance", portalUrl: "https://www.onebeacon.com" },
  { name: "Pacific Specialty Insurance", portalUrl: "https://www.pacificspecialty.com/policyholder" },
  { name: "Peerless Insurance", portalUrl: "https://www.libertymutual.com/login" },
  { name: "PEMCO Insurance", portalUrl: "https://www.pemco.com/login" },
  { name: "Philadelphia Insurance", portalUrl: "https://www.phly.com/login" },
  { name: "Pie Insurance", portalUrl: "https://app.pieinsurance.com/login" },
  { name: "Plymouth Rock", portalUrl: "https://www.plymouthrock.com/login" },
  { name: "Progressive", portalUrl: "https://www.progressive.com/login" },
  { name: "ProSight Specialty Insurance", portalUrl: "https://www.prosightspecialty.com" },
  { name: "QBE North America", portalUrl: "https://www.qbe.com/us/login" },
  { name: "Risk Strategies", portalUrl: "https://www.risk-strategies.com" },
  { name: "RLI Corp", portalUrl: "https://www.rlicorp.com" },
  { name: "Rockhill Insurance", portalUrl: "https://www.rockhillinsurance.com" },
  { name: "Safeco Insurance", portalUrl: "https://www.safeco.com/login" },
  { name: "Safety National", portalUrl: "https://www.safetynational.com" },
  { name: "Selective Insurance", portalUrl: "https://www.selective.com/policyholder" },
  { name: "Sentry Insurance", portalUrl: "https://www.sentry.com/login" },
  { name: "Simply Business", portalUrl: "https://www.simplybusiness.com/login" },
  { name: "Society Insurance", portalUrl: "https://www.societyinsurance.com/login" },
  { name: "Sompo International", portalUrl: "https://www.sompo-intl.com" },
  { name: "StarStone Insurance", portalUrl: "https://www.starstone.com" },
  { name: "State Auto Insurance", portalUrl: "https://www.stateauto.com/login" },
  { name: "State Farm", portalUrl: "https://www.statefarm.com/login" },
  { name: "Stillwater Insurance", portalUrl: "https://www.stillwaterinsurance.com/login" },
  { name: "Thimble", portalUrl: "https://www.thimble.com/login" },
  { name: "Tokio Marine", portalUrl: "https://www.tokiomarinehcc.com" },
  { name: "Tower Group", portalUrl: "https://www.twrgrp.com" },
  { name: "Travelers", portalUrl: "https://www.travelers.com/login" },
  { name: "United Fire Group", portalUrl: "https://www.ufginsurance.com/login" },
  { name: "Utica National", portalUrl: "https://www.uticanational.com/login" },
  { name: "W.R. Berkley Corporation", portalUrl: "https://www.wrberkley.com" },
  { name: "West Bend Mutual Insurance", portalUrl: "https://www.thesilverlining.com/login" },
  { name: "Western National Insurance", portalUrl: "https://www.wnins.com/login" },
  { name: "Westfield Insurance", portalUrl: "https://www.westfieldinsurance.com/login" },
  { name: "World Insurance", portalUrl: "https://www.worldinsurance.com" },
  { name: "Wright Insurance", portalUrl: "https://www.jmwilson.com" },
  { name: "XL Catlin", portalUrl: "https://axaxl.com" },
  { name: "Zenith National Insurance", portalUrl: "https://www.thezenith.com/login" },
  { name: "Zurich", portalUrl: "https://www.zurichna.com/login" },
  // Small contractor favorites
  { name: "biBERK (Berkshire Hathaway)", portalUrl: "https://www.biberk.com/account/login" },
  { name: "Contractors Insurance Group", portalUrl: "https://www.ciginsurance.com" },
  { name: "Cover Genius", portalUrl: "https://www.covergenius.com" },
  { name: "Footprint Insurance", portalUrl: "https://www.footprintinsurance.com" },
  { name: "Openly", portalUrl: "https://www.openly.com" },
  { name: "Pogo Insurance", portalUrl: "https://www.pogoinsurance.com" },
  { name: "Tivly (formerly Commercialinsurance.net)", portalUrl: "https://www.tivly.com" },
  { name: "Cerity", portalUrl: "https://www.cerity.com/login" },
  { name: "Bold Penguin", portalUrl: "https://www.boldpenguin.com" },
  { name: "Cake Insurance", portalUrl: "https://www.cake.insure" },
  { name: "Embroker", portalUrl: "https://app.embroker.com/login" },
  { name: "Vouch Insurance", portalUrl: "https://www.vouch.us/login" },
].sort((a, b) => a.name.localeCompare(b.name));

export function Insurance() {
  const [open, setOpen] = useState(true);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  
  const { toast } = useToast();
  const { documents, isLoading: documentsLoading, uploadDocument, deleteDocument, downloadDocument, isUploading, isDeleting } = useInsuranceDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleProviderSelect = (provider: InsuranceProvider) => {
    setSelectedProvider(provider);
    setComboboxOpen(false);
    toast({
      title: "Insurance Provider Selected",
      description: `You selected ${provider.name}.`,
    });
  };

  const handleClearProvider = () => {
    setSelectedProvider(null);
  };

  const handleOpenPortal = useCallback(() => {
    if (!selectedProvider) return;
    setPortalOpen(true);
  }, [selectedProvider]);

  const handleOpenInNewTab = useCallback(() => {
    if (!selectedProvider) return;
    window.open(selectedProvider.portalUrl, '_blank', 'noopener,noreferrer');
  }, [selectedProvider]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast({
        title: "Missing information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    await uploadDocument.mutateAsync({
      file: selectedFile,
      documentType,
      expiresAt: expiresAt || undefined,
      notes: notes || undefined,
    });

    setSelectedFile(null);
    setDocumentType("");
    setExpiresAt("");
    setNotes("");
    setUploadDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (document: any) => {
    if (window.confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      await deleteDocument.mutateAsync(document);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general_liability: "General Liability",
      workers_comp: "Workers Comp",
      contractor_license: "Contractor License",
      other: "Other",
    };
    return labels[type] || type;
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
          <Button 
            variant="secondary" 
            className="w-full sm:w-auto" 
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
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
              Choose your current insurance provider from the list below to access your portal and manage your policy.
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
                  <span className="truncate">
                    {selectedProvider?.name || "Search insurance providers..."}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedProvider && (
                      <span 
                        role="button"
                        className="p-1 hover:bg-accent rounded"
                        onClick={(e) => { e.stopPropagation(); handleClearProvider(); }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-card z-50" align="start">
                <Command className="bg-card">
                  <CommandInput placeholder="Search insurance providers..." className="h-12" />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-sm text-muted-foreground">
                        Provider not listed? Contact us and we'll add them.
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {insuranceProviders.map((provider) => (
                        <CommandItem
                          key={provider.name}
                          value={provider.name}
                          onSelect={() => handleProviderSelect(provider)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProvider?.name === provider.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {provider.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedProvider && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <p className="text-sm font-medium">Selected Provider: {selectedProvider.name}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={() => { setOpen(false); handleOpenPortal(); }}
                    className="flex-1"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In to {selectedProvider.name}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="flex-1"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => setOpen(false)} 
              className="w-full h-11"
              disabled={!selectedProvider}
            >
              Continue with {selectedProvider?.name || "Selected Provider"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Portal Dialog — always shows guided external login */}
      <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
        <DialogContent className="max-w-xl w-[95vw] p-0 gap-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg">{selectedProvider?.name} Portal</DialogTitle>
                <DialogDescription className="text-xs">
                  Access your provider externally and upload documents here
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 md:p-8">
            <div className="w-full max-w-lg mx-auto space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ExternalLink className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Log In Externally</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {selectedProvider?.name} requires you to log in directly on their website. Follow the steps below to access your policy and upload documents back into CT1.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-medium text-sm">Open your provider's portal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Log in to {selectedProvider?.name} in a new tab to access your policies and documents.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-medium text-sm">Download your documents</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Download your Certificate of Insurance, policy declarations, or any other compliance documents you need.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-medium text-sm">Upload to CT1</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Come back here and upload your documents so they're stored and accessible from your CT1 dashboard.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleOpenInNewTab} size="lg" className="flex-1">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open {selectedProvider?.name}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => { setPortalOpen(false); setUploadDialogOpen(true); }}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Provider Quick Access Bar */}
      {selectedProvider && !open && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">{selectedProvider.name}</p>
                  <p className="text-xs text-muted-foreground">Your current insurance provider</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button size="sm" onClick={handleOpenPortal} className="flex-1 sm:flex-auto">
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In to Portal
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between">
            <CardTitle>Insurance Documents</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{doc.file_name}</p>
                        <Badge variant="outline" className="shrink-0">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                        {doc.expires_at && ` • Expires: ${format(new Date(doc.expires_at), 'MMM dd, yyyy')}`}
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(doc)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Insurance Document</DialogTitle>
            <DialogDescription>
              Upload your insurance certificates, licenses, and compliance documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_liability">General Liability</SelectItem>
                  <SelectItem value="workers_comp">Workers Comp</SelectItem>
                  <SelectItem value="contractor_license">Contractor License</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
              <Input
                id="expires-at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFile(null);
                  setDocumentType("");
                  setExpiresAt("");
                  setNotes("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!selectedFile || !documentType || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
