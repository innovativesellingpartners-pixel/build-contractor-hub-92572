import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Shield, FileText, AlertCircle, CheckCircle, Check, ChevronsUpDown, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const { documents, isLoading: documentsLoading, uploadDocument, deleteDocument, downloadDocument, isUploading, isDeleting } = useInsuranceDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setComboboxOpen(false);
    toast({
      title: "Insurance Provider Selected",
      description: `You selected ${provider}. Contact your provider to manage your policy.`,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
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

    // Reset form
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
