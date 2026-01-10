import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Pencil, Upload, Loader2, Check, X } from "lucide-react";

type EditingField = 'company_name' | 'contact_name' | 'phone' | 'business_address' | 
  'city' | 'state' | 'zip_code' | 'tax_id' | 'ct1_contractor_number' | null;

export function ProfileEditDialog() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { isSuperAdmin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
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
      });
      setEditingField(null);
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
      
      // Refresh the page to show updated logo
      setTimeout(() => window.location.reload(), 1000);
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

  const handleSaveAll = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Prepare update data - only include contractor number if user is super admin
      const updateData: any = {
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        business_address: formData.business_address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        tax_id: formData.tax_id,
      };

      // Only super admins can update contractor number
      if (isSuperAdmin) {
        updateData.ct1_contractor_number = formData.ct1_contractor_number;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      setOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (field: EditingField) => {
    if (!user || !field) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: formData[field] })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Field updated",
        description: "Your information has been updated successfully.",
      });
      setEditingField(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    field: EditingField,
    label: string,
    type: string = "text",
    disabled: boolean = false
  ) => {
    const value = formData[field as keyof typeof formData];

    return (
      <div>
        <Label htmlFor={field!}>{label}</Label>
        <div className="mt-2">
          <Input
            id={field!}
            name={field!}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}`}
            disabled={disabled}
            className={disabled ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : ""}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contractor Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* User Email (Read-only) */}
          <div>
            <Label>Email (Username)</Label>
            <div className="px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground mt-2">
              {user?.email}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo" className="h-20 w-20 object-cover rounded border" />
              )}
              <div>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload New Logo'}
                  </div>
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderField('company_name', 'Company Name')}
            {renderField('contact_name', 'Contact Name')}
            {renderField('phone', 'Phone Number', 'tel')}
            {renderField('ct1_contractor_number', 'CT1 Contractor Number', 'text', !isSuperAdmin)}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <div className="mt-2">
                <AddressAutocomplete
                  value={formData.business_address}
                  onChange={(value) => setFormData({ ...formData, business_address: value })}
                  onAddressParsed={(parsed) => {
                    setFormData(prev => ({
                      ...prev,
                      business_address: parsed.street,
                      city: parsed.city,
                      state: parsed.state,
                      zip_code: parsed.zipCode,
                    }));
                  }}
                  placeholder="Start typing an address..."
                  showGpsButton={true}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {renderField('city', 'City')}
            {renderField('state', 'State')}
            {renderField('zip_code', 'ZIP Code')}
          </div>

          <div>
            {renderField('tax_id', 'Tax ID')}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAll} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
