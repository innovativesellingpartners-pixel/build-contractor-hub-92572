import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Upload, Loader2, Check, X } from "lucide-react";

type EditingField = 'company_name' | 'contact_name' | 'phone' | 'business_address' | 
  'city' | 'state' | 'zip_code' | 'tax_id' | 'ct1_contractor_number' | null;

export function ProfileEditDialog() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
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
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('certificates')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

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
    type: string = "text"
  ) => {
    const isEditing = editingField === field;
    const value = formData[field as keyof typeof formData];

    return (
      <div>
        <Label htmlFor={field!}>{label}</Label>
        <div className="flex items-center gap-2 mt-2">
          {isEditing ? (
            <>
              <Input
                id={field!}
                name={field!}
                type={type}
                value={value}
                onChange={handleChange}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleSaveField(field)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditingField(null);
                  // Reset to original value
                  if (profile) {
                    setFormData(prev => ({
                      ...prev,
                      [field!]: profile[field as keyof typeof profile] || ''
                    }));
                  }
                }}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 px-3 py-2 border rounded-md bg-muted/30">
                {value || <span className="text-muted-foreground">Not set</span>}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setEditingField(field)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
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
            {renderField('ct1_contractor_number', 'CT1 Contractor Number')}
          </div>

          <div className="space-y-4">
            {renderField('business_address', 'Business Address')}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {renderField('city', 'City')}
            {renderField('state', 'State')}
            {renderField('zip_code', 'ZIP Code')}
          </div>

          <div>
            {renderField('tax_id', 'Tax ID')}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
