import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete, AddressData } from "@/components/ui/location-autocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Pencil, Upload, Loader2, Check, Building2, User, Globe, FileText, DollarSign, Shield, Percent, Palette, Save } from "lucide-react";
import { WarrantyManagement } from "./WarrantyManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type SectionKey = 'logo' | 'business' | 'branding' | 'licensing' | 'colors' | 'defaults';

export function ProfileEditDialog() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { isSuperAdmin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  const [formData, setFormData] = useState({
    // Business Info
    company_name: '',
    contact_name: '',
    phone: '',
    business_address: '',
    city: '',
    state: '',
    zip_code: '',
    tax_id: '',
    ct1_contractor_number: '',
    logo_url: '',
    // Branding & Contact
    business_email: '',
    website_url: '',
    license_number: '',
    trade: '',
    // Brand Colors
    brand_primary_color: '#D50A22',
    brand_secondary_color: '#1e3a5f',
    brand_accent_color: '#c9a227',
    // Estimate Defaults
    default_sales_tax_rate: '',
    default_deposit_percent: '',
    default_warranty_years: '',
  });

  // Sync form data when dialog opens or profile changes
  useEffect(() => {
    if (open && profile) {
      setFormData({
        company_name: profile.company_name || '',
        contact_name: profile.contact_name || '',
        phone: profile.phone || '',
        business_address: profile.business_address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        tax_id: profile.tax_id || '',
        ct1_contractor_number: profile.ct1_contractor_number || '',
        logo_url: profile.logo_url || '',
        business_email: profile.business_email || '',
        website_url: profile.website_url || '',
        license_number: profile.license_number || '',
        trade: profile.trade || '',
        brand_primary_color: profile.brand_primary_color || '#D50A22',
        brand_secondary_color: profile.brand_secondary_color || '#1e3a5f',
        brand_accent_color: profile.brand_accent_color || '#c9a227',
        default_sales_tax_rate: profile.default_sales_tax_rate?.toString() || '6.00',
        default_deposit_percent: profile.default_deposit_percent?.toString() || '30.00',
        default_warranty_years: profile.default_warranty_years?.toString() || '2',
      });
      setActiveTab("business");
    }
  }, [open, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Save logo URL to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setFormData({ ...formData, logo_url: publicUrl });
      
      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Save a specific section
  const handleSaveSection = async (section: SectionKey) => {
    if (!user) return;

    setSavingSection(section);
    try {
      let updateData: Record<string, any> = {};

      switch (section) {
        case 'business':
          updateData = {
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            phone: formData.phone,
            trade: formData.trade,
            business_address: formData.business_address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
          };
          break;
        case 'branding':
          updateData = {
            business_email: formData.business_email,
            website_url: formData.website_url,
          };
          break;
        case 'licensing':
          updateData = {
            license_number: formData.license_number,
            tax_id: formData.tax_id,
          };
          break;
        case 'colors':
          updateData = {
            brand_primary_color: formData.brand_primary_color,
            brand_secondary_color: formData.brand_secondary_color,
            brand_accent_color: formData.brand_accent_color,
          };
          break;
        case 'defaults':
          updateData = {
            default_sales_tax_rate: formData.default_sales_tax_rate !== '' ? parseFloat(formData.default_sales_tax_rate) : null,
            default_deposit_percent: formData.default_deposit_percent !== '' ? parseFloat(formData.default_deposit_percent) : null,
            default_warranty_years: formData.default_warranty_years !== '' ? parseInt(formData.default_warranty_years) : null,
          };
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Section updated successfully.",
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSection(null);
    }
  };

  // Reusable Save Button component for sections
  const SectionSaveButton = ({ section }: { section: SectionKey }) => (
    <Button 
      type="button" 
      size="sm" 
      onClick={() => handleSaveSection(section)}
      disabled={savingSection === section}
      className="gap-1.5"
    >
      {savingSection === section ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          Save
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Contractor Profile
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="defaults" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Defaults</span>
            </TabsTrigger>
            <TabsTrigger value="warranties" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Warranties</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-6 mt-0">
              {/* Read-only fields */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Account Identifiers
                    <Badge variant="secondary" className="ml-2">Read Only</Badge>
                  </CardTitle>
                  <CardDescription>These fields cannot be modified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email (Username)</Label>
                      <div className="px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground text-sm mt-1 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account ID</Label>
                      <div className="px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground text-sm mt-1 font-mono truncate">
                        {user?.id?.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CT1 Contractor Number</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground text-sm mt-1 font-mono font-bold">
                      {formData.ct1_contractor_number || 'Not assigned'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Auto-generated and immutable for business operations</p>
                  </div>
                </CardContent>
              </Card>

              {/* Logo Upload */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Company Logo</CardTitle>
                  <CardDescription>This logo will appear on estimates, invoices, and proposals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden flex-shrink-0">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Label htmlFor="logo" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploading ? 'Uploading...' : 'Upload Logo'}
                        </div>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 5MB. Square logos work best.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editable Business Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Your Company LLC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input
                        id="contact_name"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleChange}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade">Trade / Industry</Label>
                      <Input
                        id="trade"
                        name="trade"
                        value={formData.trade}
                        onChange={handleChange}
                        placeholder="Plumbing, Electrical, etc."
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_address">Business Address</Label>
                      <LocationAutocomplete
                        value={formData.business_address}
                        onChange={(value) => setFormData({ ...formData, business_address: value })}
                        onAddressSelect={(data) => {
                          setFormData(prev => ({
                            ...prev,
                            business_address: data.address1,
                            city: data.city,
                            state: data.state,
                            zip_code: data.postalCode,
                          }));
                        }}
                        placeholder="Start typing an address..."
                        showGpsButton={true}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2 col-span-1">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2 col-span-1">
                        <Label htmlFor="zip_code">ZIP Code</Label>
                        <Input
                          id="zip_code"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <SectionSaveButton section="business" />
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Online Presence
                  </CardTitle>
                  <CardDescription>These details appear on customer-facing documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      name="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={handleChange}
                      placeholder="contact@yourcompany.com"
                    />
                    <p className="text-xs text-muted-foreground">Shown on estimates and invoices (separate from login email)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      name="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={handleChange}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <SectionSaveButton section="branding" />
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Licensing & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                        placeholder="LIC-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID / EIN</Label>
                      <Input
                        id="tax_id"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <SectionSaveButton section="licensing" />
                </CardFooter>
              </Card>

              {/* Brand Colors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>These colors will be used on estimates, invoices, and proposals sent to customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand_primary_color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="brand_primary_color"
                          name="brand_primary_color"
                          value={formData.brand_primary_color}
                          onChange={handleChange}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.brand_primary_color}
                          onChange={handleChange}
                          name="brand_primary_color"
                          placeholder="#D50A22"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Main brand color for headers & buttons</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand_secondary_color">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="brand_secondary_color"
                          name="brand_secondary_color"
                          value={formData.brand_secondary_color}
                          onChange={handleChange}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.brand_secondary_color}
                          onChange={handleChange}
                          name="brand_secondary_color"
                          placeholder="#1e3a5f"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Background & section headers</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand_accent_color">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="brand_accent_color"
                          name="brand_accent_color"
                          value={formData.brand_accent_color}
                          onChange={handleChange}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.brand_accent_color}
                          onChange={handleChange}
                          name="brand_accent_color"
                          placeholder="#c9a227"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Highlights & accents</p>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Preview</Label>
                    <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: formData.brand_primary_color }}
                      >
                        Primary
                      </div>
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: formData.brand_secondary_color }}
                      >
                        Secondary
                      </div>
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: formData.brand_accent_color }}
                      >
                        Accent
                      </div>
                      <div className="flex-1 min-w-[150px] text-sm text-muted-foreground">
                        These colors will appear on your estimates, invoices, and customer-facing documents.
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <SectionSaveButton section="colors" />
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Defaults Tab */}
            <TabsContent value="defaults" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Estimate Defaults
                  </CardTitle>
                  <CardDescription>Default values applied to new estimates (can be changed per estimate)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default_sales_tax_rate">Sales Tax Rate (%)</Label>
                      <Input
                        id="default_sales_tax_rate"
                        name="default_sales_tax_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.default_sales_tax_rate}
                        onChange={handleChange}
                        placeholder="6.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default_deposit_percent">Required Deposit (%)</Label>
                      <Input
                        id="default_deposit_percent"
                        name="default_deposit_percent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.default_deposit_percent}
                        onChange={handleChange}
                        placeholder="30.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default_warranty_years">Warranty (Years)</Label>
                      <Input
                        id="default_warranty_years"
                        name="default_warranty_years"
                        type="number"
                        min="0"
                        max="99"
                        value={formData.default_warranty_years}
                        onChange={handleChange}
                        placeholder="2"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <SectionSaveButton section="defaults" />
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Warranties Tab */}
            <TabsContent value="warranties" className="space-y-6 mt-0">
              <WarrantyManagement />
            </TabsContent>
          </div>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
