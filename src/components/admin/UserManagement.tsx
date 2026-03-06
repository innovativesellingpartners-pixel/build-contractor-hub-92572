import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, UserPlus, Edit, Trash2, Mail, Phone, Building2, User, Key, Upload, X, Bot, Eye, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import contractorIcon from '@/assets/contractor-icon.png';
type UserWithProfile = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: {
    company_name?: string;
    phone?: string;
    contact_name?: string;
    ct1_contractor_number?: string;
    subscription_tier?: string;
    pocketbot_full_access?: boolean;
  } | null;
  contractor: {
    id: string;
    contractor_number?: string;
    business_name?: string;
  } | null;
  role: 'user' | 'admin' | 'super_admin';
};
export const UserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithProfile | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserWithProfile | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data: users,
    isLoading
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;
      return data.users as UserWithProfile[];
    }
  });
  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      company_name?: string;
      phone?: string;
      contact_name?: string;
      role: 'user' | 'admin' | 'super_admin';
      tier_id?: string;
      billing_cycle?: string;
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-create-user', {
        body: userData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['adminUsers']
      });
      toast.success('Contractor created successfully');
      setIsCreateDialogOpen(false);
    },
    onError: error => {
      toast.error('Failed to create contractor: ' + (error as Error).message);
    }
  });
  const updateProfileMutation = useMutation({
    mutationFn: async ({
      userId,
      profileData
    }: {
      userId: string;
      profileData: {
        company_name?: string;
        phone?: string;
        contact_name?: string;
        ct1_contractor_number?: string;
        subscription_tier?: string;
        logo_url?: string;
        pocketbot_full_access?: boolean;
      };
    }) => {
      const {
        error
      } = await supabase.from('profiles').update(profileData).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['adminUsers']
      });
      toast.success('Profile updated successfully');
      setIsEditDialogOpen(false);
      setLogoPreview(null);
    },
    onError: error => {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  });
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole
    }: {
      userId: string;
      newRole: 'user' | 'admin' | 'super_admin';
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-update-user-role', {
        body: {
          userId,
          newRole
        }
      });
      if (error) throw error;

      // Check if the response indicates an error (even with 200 status)
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to update user role');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['adminUsers']
      });
      toast.success('User role updated successfully');
    },
    onError: error => {
      toast.error('Failed to update user role: ' + (error as Error).message);
      console.error('Error updating role:', error);
    }
  });
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          userId
        }
      });
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['adminUsers']
      });
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: error => {
      toast.error('Failed to delete user: ' + (error as Error).message);
    }
  });
  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      newPassword
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId,
          newPassword
        }
      });
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setIsPasswordDialogOpen(false);
      setPasswordResetUser(null);
    },
    onError: error => {
      toast.error('Failed to reset password: ' + (error as Error).message);
    }
  });
  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUserMutation.mutate({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      company_name: formData.get('company_name') as string,
      phone: formData.get('phone') as string,
      contact_name: formData.get('contact_name') as string,
      role: formData.get('role') as 'user' | 'admin' | 'super_admin',
      tier_id: formData.get('tier_id') as string,
      billing_cycle: formData.get('billing_cycle') as string
    });
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    setUploadingLogo(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingUser.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const {
        error: uploadError
      } = await supabase.storage.from('company-logos').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('company-logos').getPublicUrl(fileName);
      setLogoPreview(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate({
      userId: editingUser.id,
      profileData: {
        company_name: formData.get('company_name') as string,
        phone: formData.get('phone') as string,
        contact_name: formData.get('contact_name') as string,
        ct1_contractor_number: formData.get('ct1_contractor_number') as string,
        subscription_tier: formData.get('subscription_tier') as string,
        logo_url: logoPreview || undefined,
        pocketbot_full_access: formData.get('pocketbot_full_access') === 'on'
      }
    });
  };
  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    resetPasswordMutation.mutate({
      userId: passwordResetUser.id,
      newPassword
    });
  };
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) || user.profile?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.profile?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };
  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'launch':
        return 'bg-blue-500';
      case 'growth':
        return 'bg-green-500';
      case 'accel':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage contractors, users, and their roles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contractor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Contractor</DialogTitle>
              <DialogDescription>
                Add a new contractor to the CT1 network. They will receive their login credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input id="create-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password *</Label>
                <Input id="create-password" name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-company">Company Name</Label>
                <Input id="create-company" name="company_name" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-contact">Contact Name</Label>
                <Input id="create-contact" name="contact_name" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone</Label>
                <Input id="create-phone" name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-tier">Subscription Tier</Label>
                <Select name="tier_id" defaultValue="launch">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free (Full Access)</SelectItem>
                    <SelectItem value="launch">Launch ($500/mo)</SelectItem>
                    <SelectItem value="growth">Growth ($1000/mo)</SelectItem>
                    <SelectItem value="accel">Accel ($1500/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-billing">Billing Cycle</Label>
                <Select name="billing_cycle" defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create Contractor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contractors & Users ({filteredUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers?.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={(user.profile as any)?.logo_url} alt={user.profile?.company_name || user.email} />
                  <AvatarFallback className="text-xs">
                    {user.profile?.company_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {user.profile?.company_name || user.profile?.contact_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {user.contractor?.contractor_number && (
                    <Badge variant="outline" className="text-xs font-mono">#{user.contractor.contractor_number}</Badge>
                  )}
                  {!user.contractor?.contractor_number && user.profile?.ct1_contractor_number && (
                    <Badge variant="outline" className="text-xs font-mono">#{user.profile.ct1_contractor_number}</Badge>
                  )}
                  {user.profile?.subscription_tier && (
                    <Badge className={`${getTierBadgeColor(user.profile.subscription_tier)} text-white text-xs`}>
                      {user.profile.subscription_tier}
                    </Badge>
                  )}
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {user.role}
                  </Badge>
                </div>

                <div className="hidden md:flex flex-col items-end flex-shrink-0 w-28 text-right">
                  <span className="text-xs text-muted-foreground">
                    {user.last_sign_in_at ? `Login: ${new Date(user.last_sign_in_at).toLocaleDateString()}` : 'Never logged in'}
                  </span>
                  {(user.profile as any)?.updated_at && (
                    <span className="text-[10px] text-muted-foreground/70">
                      Edited: {new Date((user.profile as any).updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditingUser(user); setIsEditDialogOpen(true); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPasswordResetUser(user); setIsPasswordDialogOpen(true); }}>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { 
                      updateRoleMutation.mutate({ 
                        userId: user.id, 
                        newRole: user.role === 'admin' ? 'user' : 'admin' 
                      }); 
                    }}>
                      <User className="h-4 w-4 mr-2" />
                      {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => { setDeletingUser(user); setIsDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filteredUsers?.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No users found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contractor Profile</DialogTitle>
            <DialogDescription>
              Update contractor information and settings
            </DialogDescription>
          </DialogHeader>
          {editingUser && <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={logoPreview || (editingUser.profile as any)?.logo_url} alt={editingUser.profile?.company_name || editingUser.email} />
                    <AvatarFallback className="text-2xl">
                      {editingUser.profile?.company_name?.charAt(0) || editingUser.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="cursor-pointer" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a company logo (max 2MB)
                    </p>
                  </div>
                  {logoPreview && <Button type="button" variant="ghost" size="sm" onClick={() => setLogoPreview(null)}>
                      <X className="h-4 w-4" />
                    </Button>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company Name</Label>
                <Input id="edit-company" name="company_name" defaultValue={editingUser.profile?.company_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Name</Label>
                <Input id="edit-contact" name="contact_name" defaultValue={editingUser.profile?.contact_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editingUser.profile?.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ct1-number">CT1 Contractor Number</Label>
                <Input id="edit-ct1-number" name="ct1_contractor_number" defaultValue={editingUser.profile?.ct1_contractor_number || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tier">Subscription Tier</Label>
                <Select name="subscription_tier" defaultValue={editingUser.profile?.subscription_tier || 'launch'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="accel">Accel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="pocketbot-access" className="text-sm font-medium">
                        Full Pocket Agent Access
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Grant unlimited AI assistant access without subscription
                      </p>
                    </div>
                  </div>
                  <Switch id="pocketbot-access" name="pocketbot_full_access" defaultChecked={(editingUser.profile as any)?.pocketbot_full_access || false} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordResetUser?.email}
            </DialogDescription>
          </DialogHeader>
          {passwordResetUser && <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <PasswordInput id="newPassword" name="newPassword" required minLength={6} placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={6} placeholder="Confirm new password" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false);
              setPasswordResetUser(null);
            }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  Warning: This will permanently delete:
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>User account and authentication</li>
                  <li>Profile information</li>
                  <li>All associated data</li>
                </ul>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingUser(null);
            }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deleteUserMutation.mutate(deletingUser.id)} disabled={deleteUserMutation.isPending}>
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                </Button>
              </DialogFooter>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};