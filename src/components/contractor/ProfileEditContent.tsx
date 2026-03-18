import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete, AddressData } from "@/components/ui/location-autocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Upload, Loader2, Building2, Globe, DollarSign, Shield, Percent, Palette, Save, ImageIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { WarrantyManagement } from "./WarrantyManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type SectionKey = 'logo' | 'business' | 'branding' | 'licensing' | 'colors' | 'defaults' | 'payments';

interface ProfileEditContentProps {
  targetUserId?: string; // When set, admin is editing another user's profile
}

export function ProfileEditContent({ targetUserId }: ProfileEditContentProps = {}) {
  const { profile: authProfile, user: authUser, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { isSuperAdmin } = useAdminAuth();
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  // Determine which user/profile to operate on
  const isAdminEditing = !!targetUserId;
  const effectiveUserId = targetUserId || authUser?.id;
  const profile = isAdminEditing ? targetProfile : authProfile;

  const [formData, setFormData] = useState({
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
    business_email: '',
    website_url: '',
    license_number: '',
    trade: '',
    brand_primary_color: '#D50A22',
    brand_secondary_color: '#1e3a5f',
    brand_accent_color: '#c9a227',
    brand_footer_color: '#333333',
    brand_accent_bg_color: '#f5f5f5',
    watermark_logo_url: '',
    watermark_opacity: 15,
    default_sales_tax_rate: '',
    default_deposit_percent: '',
    default_warranty_years: '',
    zelle_email: '',
    zelle_phone: '',
    ach_instructions: '',
    accepted_payment_methods: ['card'] as string[],
    google_place_id: '',
    network_visible: false,
    network_bio: '',
  });

  // Fetch target user's profile when admin editing
  useEffect(() => {
    if (!targetUserId) return;
    setLoadingTarget(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching target profile:', error);
          toast({ title: "Error", description: "Failed to load user profile.", variant: "destructive" });
        } else {
          setTargetProfile(data);
        }
        setLoadingTarget(false);
      });
  }, [targetUserId]);

  useEffect(() => {
    if (profile) {
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
        brand_footer_color: (profile as any).brand_footer_color || '#333333',
        brand_accent_bg_color: (profile as any).brand_accent_bg_color || '#f5f5f5',
        watermark_logo_url: (profile as any).watermark_logo_url || '',
        watermark_opacity: ((profile as any).watermark_opacity ?? 0.15) * 100,
        default_sales_tax_rate: profile.default_sales_tax_rate?.toString() || '6.00',
        default_deposit_percent: profile.default_deposit_percent?.toString() || '30.00',
        default_warranty_years: profile.default_warranty_years?.toString() || '2',
        zelle_email: profile.zelle_email || '',
        zelle_phone: profile.zelle_phone || '',
        ach_instructions: profile.ach_instructions || '',
        accepted_payment_methods: profile.accepted_payment_methods || ['card'],
        google_place_id: (profile as any).google_place_id || '',
        network_visible: (profile as any).network_visible || false,
        network_bio: (profile as any).network_bio || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${effectiveUserId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', effectiveUserId);

      if (updateError) throw updateError;

      setFormData({ ...formData, logo_url: publicUrl });
      if (!isAdminEditing) await refreshProfile();
      
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

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;
    setUploadingWatermark(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${effectiveUserId}/watermark-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, watermark_logo_url: publicUrl }));
      toast({ title: "Watermark uploaded", description: "Your watermark logo has been uploaded." });
    } catch (error) {
      console.error('Error uploading watermark:', error);
      toast({ title: "Upload failed", description: "Failed to upload watermark.", variant: "destructive" });
    } finally {
      setUploadingWatermark(false);
    }
  };

  const handleSaveSection = async (section: SectionKey) => {
    if (!effectiveUserId) return;

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
            network_visible: formData.network_visible,
            network_bio: formData.network_bio || null,
          };
          break;
        case 'branding':
          updateData = {
            business_email: formData.business_email,
            website_url: formData.website_url,
            google_place_id: formData.google_place_id || null,
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
            brand_footer_color: formData.brand_footer_color,
            brand_accent_bg_color: formData.brand_accent_bg_color,
            watermark_logo_url: formData.watermark_logo_url,
            watermark_opacity: formData.watermark_opacity / 100,
          };
          break;
        case 'defaults':
          updateData = {
            default_sales_tax_rate: formData.default_sales_tax_rate !== '' ? parseFloat(formData.default_sales_tax_rate) : null,
            default_deposit_percent: formData.default_deposit_percent !== '' ? parseFloat(formData.default_deposit_percent) : null,
            default_warranty_years: formData.default_warranty_years !== '' ? parseInt(formData.default_warranty_years) : null,
          };
          break;
        case 'payments':
          updateData = {
            zelle_email: formData.zelle_email || null,
            zelle_phone: formData.zelle_phone || null,
            ach_instructions: formData.ach_instructions || null,
            accepted_payment_methods: formData.accepted_payment_methods,
          };
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      if (!isAdminEditing) await refreshProfile();

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

  if (loadingTarget) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="business" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Business</span>
        </TabsTrigger>
        <TabsTrigger value="branding" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Branding</span>
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Payments</span>
        </TabsTrigger>
        <TabsTrigger value="defaults" className="gap-2">
          <Percent className="h-4 w-4" />
          <span className="hidden sm:inline">Defaults</span>
        </TabsTrigger>
        <TabsTrigger value="warranties" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Warranties</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
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
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">User ID</Label>
                  <Input value={effectiveUserId || ''} readOnly className="bg-muted/50 text-xs font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">CT1 Contractor #</Label>
                  <Input value={formData.ct1_contractor_number || 'Not assigned'} readOnly className="bg-muted/50 text-xs font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Company Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Company logo"
                      className="w-24 h-24 rounded-lg object-contain border bg-white p-2"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? 'Uploading...' : 'Upload new logo'}
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 400×400px, PNG or SVG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Details
              </CardTitle>
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trade">Trade / Specialty</Label>
                  <Input
                    id="trade"
                    name="trade"
                    value={formData.trade}
                    onChange={handleChange}
                    placeholder="e.g. Roofing, Plumbing, General"
                  />
                </div>
              </div>
              
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-medium">Business Address</Label>
                <LocationAutocomplete
                  value={formData.business_address}
                  onChange={(val) => setFormData(prev => ({ ...prev, business_address: val }))}
                  onAddressSelect={(address: AddressData) => {
                    setFormData(prev => ({
                      ...prev,
                      business_address: address.address1,
                      city: address.city,
                      state: address.state,
                      zip_code: address.postalCode,
                    }));
                  }}
                  placeholder="Start typing your address..."
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Street</Label>
                    <Input name="business_address" value={formData.business_address} onChange={handleChange} placeholder="123 Main St" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">City</Label>
                    <Input name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <Input name="state" value={formData.state} onChange={handleChange} placeholder="FL" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">ZIP</Label>
                      <Input name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="33101" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contractor Network Opt-In */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contractor Network Directory
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      List your business in the CT1 Contractor Network so other contractors can find and connect with you.
                      Only your business name, trade, location, and bio are shown — no private data.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.network_visible}
                      onChange={(e) => setFormData(prev => ({ ...prev, network_visible: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
                {formData.network_visible && (
                  <div className="space-y-2">
                    <Label htmlFor="network_bio">Network Bio / Tagline</Label>
                    <Input
                      id="network_bio"
                      name="network_bio"
                      value={formData.network_bio}
                      onChange={handleChange}
                      placeholder="e.g. Licensed residential plumber serving the Greater Miami area since 2008"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground">{formData.network_bio.length}/200 characters</p>
                  </div>
                )}
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
              <CardDescription>Your business contact information shown on documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    name="business_email"
                    type="email"
                    value={formData.business_email}
                    onChange={handleChange}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="google_place_id">Google Place ID</Label>
                <Input
                  id="google_place_id"
                  name="google_place_id"
                  value={formData.google_place_id}
                  onChange={handleChange}
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
                <p className="text-xs text-muted-foreground">
                  Used for Google Review requests in the customer portal.{' '}
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Find your Place ID →
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <SectionSaveButton section="branding" />
            </CardFooter>
          </Card>

          {/* Licensing & Tax ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Licensing & Tax ID
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
                    placeholder="e.g. CBC1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID (EIN)</Label>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Header Color */}
                    <div className="space-y-2">
                      <Label htmlFor="brand_primary_color">Header Color</Label>
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
                      <p className="text-xs text-muted-foreground">Top header bar on estimates & invoices</p>
                    </div>

                    {/* Body Color */}
                    <div className="space-y-2">
                      <Label htmlFor="brand_secondary_color">Body Color</Label>
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
                      <p className="text-xs text-muted-foreground">Section headers & body text areas</p>
                    </div>

                    {/* Footer Color */}
                    <div className="space-y-2">
                      <Label htmlFor="brand_footer_color">Footer Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="brand_footer_color"
                          name="brand_footer_color"
                          value={formData.brand_footer_color}
                          onChange={handleChange}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.brand_footer_color}
                          onChange={handleChange}
                          name="brand_footer_color"
                          placeholder="#333333"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Footer bar on documents</p>
                    </div>

                    {/* Accent Background Color */}
                    <div className="space-y-2">
                      <Label htmlFor="brand_accent_bg_color">Accent Background</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="brand_accent_bg_color"
                          name="brand_accent_bg_color"
                          value={formData.brand_accent_bg_color}
                          onChange={handleChange}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.brand_accent_bg_color}
                          onChange={handleChange}
                          name="brand_accent_bg_color"
                          placeholder="#f5f5f5"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Highlighted sections & callout backgrounds</p>
                    </div>
                  </div>

                  {/* Watermark Logo */}
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Watermark Logo
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Upload a logo to appear as a faded watermark on document backgrounds</p>
                    </div>
                    <div className="flex items-start gap-4">
                      {formData.watermark_logo_url ? (
                        <div className="relative w-24 h-24 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img 
                            src={formData.watermark_logo_url} 
                            alt="Watermark" 
                            className="max-w-full max-h-full object-contain" 
                            style={{ opacity: formData.watermark_opacity / 100 }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, watermark_logo_url: '' }))}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-xs text-center p-2 flex-shrink-0">
                          No watermark
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor="watermark-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                              {uploadingWatermark ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploadingWatermark ? 'Uploading...' : 'Upload watermark image'}
                            </div>
                          </Label>
                          <input
                            id="watermark-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleWatermarkUpload}
                            className="hidden"
                            disabled={uploadingWatermark}
                          />
                          <p className="text-xs text-muted-foreground mt-1">PNG with transparent background works best</p>
                        </div>
                        
                        {/* Opacity / Transparency Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Transparency</Label>
                            <span className="text-xs text-muted-foreground font-mono">{formData.watermark_opacity}%</span>
                          </div>
                          <Slider
                            value={[formData.watermark_opacity]}
                            onValueChange={([val]) => setFormData(prev => ({ ...prev, watermark_opacity: val }))}
                            min={5}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Very faded</span>
                            <span>Full opacity</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sample Estimate Preview */}
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Sample Estimate Preview
                    </Label>
                    <p className="text-xs text-muted-foreground">This is how your branded estimate will look to customers</p>
                    <div className="rounded-lg border overflow-hidden shadow-lg bg-white max-w-2xl mx-auto">
                      {/* Header */}
                      <div 
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ backgroundColor: formData.brand_primary_color }}
                      >
                        <div className="flex items-center gap-3">
                          {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo" className="h-10 w-10 rounded object-contain bg-white/90 p-0.5" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-white/80" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-bold text-sm">{formData.company_name || 'Your Company Name'}</p>
                            <p className="text-white/70 text-[10px]">{formData.business_address ? `${formData.business_address}, ${formData.city || ''} ${formData.state || ''} ${formData.zip_code || ''}` : '123 Main St, City, ST 12345'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">ESTIMATE</p>
                          <p className="text-white/70 text-[10px]">EST-00001</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="relative overflow-hidden">
                        {/* Watermark */}
                        {formData.watermark_logo_url && (
                          <img 
                            src={formData.watermark_logo_url} 
                            alt="" 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 object-contain pointer-events-none"
                            style={{ opacity: formData.watermark_opacity / 100 }}
                          />
                        )}

                        {/* Client Info */}
                        <div className="px-6 py-3 border-b relative z-10">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prepared For</p>
                              <p className="text-xs font-semibold mt-0.5" style={{ color: formData.brand_secondary_color }}>John Smith</p>
                              <p className="text-[10px] text-muted-foreground">john@example.com</p>
                              <p className="text-[10px] text-muted-foreground">456 Oak Ave, Miami, FL 33101</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Date</p>
                              <p className="text-xs mt-0.5">{new Date().toLocaleDateString()}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-2">Valid Until</p>
                              <p className="text-xs mt-0.5">{new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Scope */}
                        <div 
                          className="px-6 py-2 relative z-10"
                          style={{ backgroundColor: formData.brand_accent_bg_color }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: formData.brand_secondary_color }}>
                            Scope of Work
                          </p>
                        </div>
                        <div className="px-6 py-2 relative z-10">
                          <p className="text-[10px] text-muted-foreground">Complete kitchen renovation including cabinets, countertops, plumbing, and electrical.</p>
                        </div>

                        {/* Line Items Table */}
                        <div className="px-6 py-2 relative z-10">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr style={{ backgroundColor: formData.brand_accent_bg_color }}>
                                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: formData.brand_secondary_color }}>Description</th>
                                <th className="text-center py-1.5 px-2 font-semibold" style={{ color: formData.brand_secondary_color }}>Qty</th>
                                <th className="text-right py-1.5 px-2 font-semibold" style={{ color: formData.brand_secondary_color }}>Rate</th>
                                <th className="text-right py-1.5 px-2 font-semibold" style={{ color: formData.brand_secondary_color }}>Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              <tr>
                                <td className="py-1.5 px-2">Cabinet Installation — Shaker Style</td>
                                <td className="text-center py-1.5 px-2">1</td>
                                <td className="text-right py-1.5 px-2">$8,500.00</td>
                                <td className="text-right py-1.5 px-2 font-medium">$8,500.00</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2">Granite Countertop — 45 sqft</td>
                                <td className="text-center py-1.5 px-2">45</td>
                                <td className="text-right py-1.5 px-2">$75.00</td>
                                <td className="text-right py-1.5 px-2 font-medium">$3,375.00</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2">Plumbing — Sink & Disposal</td>
                                <td className="text-center py-1.5 px-2">1</td>
                                <td className="text-right py-1.5 px-2">$1,200.00</td>
                                <td className="text-right py-1.5 px-2 font-medium">$1,200.00</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2">Electrical — Outlets & Lighting</td>
                                <td className="text-center py-1.5 px-2">1</td>
                                <td className="text-right py-1.5 px-2">$950.00</td>
                                <td className="text-right py-1.5 px-2 font-medium">$950.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="px-6 py-3 border-t relative z-10">
                          <div className="flex justify-end">
                            <div className="w-48 space-y-1 text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>$14,025.00</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax ({formData.default_sales_tax_rate || '6.00'}%)</span>
                                <span>$841.50</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-bold text-xs" style={{ color: formData.brand_secondary_color }}>
                                <span>Total</span>
                                <span>$14,866.50</span>
                              </div>
                              {formData.default_deposit_percent && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Deposit ({formData.default_deposit_percent}%)</span>
                                  <span>${(14866.50 * parseFloat(formData.default_deposit_percent || '0') / 100).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div 
                        className="px-6 py-3 flex items-center justify-between"
                        style={{ backgroundColor: formData.brand_footer_color }}
                      >
                        <div className="text-white/80 text-[10px]">
                          <p>{formData.phone || '(555) 123-4567'} • {formData.business_email || 'info@company.com'}</p>
                          {formData.license_number && <p>License: {formData.license_number}</p>}
                        </div>
                        <div className="text-white/60 text-[9px]">
                          Powered by CT1
                        </div>
                      </div>
                    </div>
                  </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <SectionSaveButton section="colors" />
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Accepted Payment Methods
              </CardTitle>
              <CardDescription>Select which payment methods to display on customer-facing estimates and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'card', label: 'Card / Online' },
                  { key: 'zelle', label: 'Zelle' },
                  { key: 'ach', label: 'ACH / Bank Transfer' },
                  { key: 'check', label: 'Check' },
                ].map((method) => {
                  const isSelected = formData.accepted_payment_methods.includes(method.key);
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          accepted_payment_methods: isSelected
                            ? prev.accepted_payment_methods.filter(m => m !== method.key)
                            : [...prev.accepted_payment_methods, method.key],
                        }));
                      }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {method.label}
                    </button>
                  );
                })}
              </div>

              {formData.accepted_payment_methods.includes('zelle') && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Zelle Details</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Zelle Email</Label>
                        <Input
                          name="zelle_email"
                          value={formData.zelle_email}
                          onChange={handleChange}
                          placeholder="zelle@company.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Zelle Phone</Label>
                        <Input
                          name="zelle_phone"
                          value={formData.zelle_phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formData.accepted_payment_methods.includes('ach') && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ACH / Bank Transfer Instructions</Label>
                    <Input
                      name="ach_instructions"
                      value={formData.ach_instructions}
                      onChange={handleChange}
                      placeholder="Bank name, routing #, account #, etc."
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <SectionSaveButton section="payments" />
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
              <CardDescription>These defaults will pre-fill when creating new estimates</CardDescription>
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
  );
}
