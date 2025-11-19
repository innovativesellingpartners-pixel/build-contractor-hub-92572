import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Shield, 
  Mail, 
  Bell, 
  FileText, 
  Database,
  Palette,
  Users,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminSettings = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = (section: string) => {
    setSaving(true);
    toast.loading(`Saving ${section} settings...`, { id: 'save-settings' });
    
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      toast.success(`${section} settings saved successfully`, { id: 'save-settings' });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Platform Settings</h2>
        <p className="text-muted-foreground">Configure your CT1 platform settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-11">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Platform Settings
              </CardTitle>
              <CardDescription>
                Configure basic platform behavior and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="CT1 Constructeam" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="america_new_york">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america_new_york">America/New York (EST)</SelectItem>
                      <SelectItem value="america_chicago">America/Chicago (CST)</SelectItem>
                      <SelectItem value="america_denver">America/Denver (MST)</SelectItem>
                      <SelectItem value="america_los_angeles">America/Los Angeles (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select defaultValue="mm_dd_yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm_dd_yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd_mm_yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy_mm_dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable platform for maintenance
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new contractor signups
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify email before accessing platform
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={() => handleSave('General')}>Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Manage default company details for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="CT1 Constructeam" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Support Email</Label>
                  <Input id="company-email" type="email" defaultValue="support@myct1.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Support Phone</Label>
                  <Input id="company-phone" type="tel" defaultValue="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Website</Label>
                  <Input id="company-website" type="url" defaultValue="https://myct1.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">Business Address</Label>
                <Textarea id="company-address" rows={3} defaultValue="123 Construction Ave&#10;Suite 100&#10;City, ST 12345" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="license-number">Contractor License #</Label>
                  <Input id="license-number" placeholder="ABC-123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance-policy">Insurance Policy #</Label>
                  <Input id="insurance-policy" placeholder="INS-123456789" />
                </div>
              </div>

              <Button onClick={() => handleSave('Company')}>Save Company Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing & Invoicing */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing & Invoicing Settings
              </CardTitle>
              <CardDescription>
                Configure payment processing and invoice defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Default Payment Terms</Label>
                  <Select defaultValue="net30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="late-fee">Late Fee Percentage</Label>
                  <Input id="late-fee" type="number" defaultValue="1.5" step="0.1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input id="tax-rate" type="number" defaultValue="7.5" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
                  <Input id="invoice-prefix" defaultValue="INV-" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Online Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow clients to pay invoices online via Clover
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-send Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automated reminders for overdue invoices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Deposit</Label>
                    <p className="text-sm text-muted-foreground">
                      Require upfront deposit before starting work
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-percentage">Default Deposit Percentage</Label>
                <Input id="deposit-percentage" type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-notes">Default Invoice Notes</Label>
                <Textarea 
                  id="invoice-notes" 
                  rows={3} 
                  placeholder="Thank you for your business..."
                />
              </div>

              <Button onClick={() => handleSave('Billing')}>Save Billing Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Configure security policies and data protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Complexity</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce strong password requirements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access to specific IPs
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-duration">Session Duration (minutes)</Label>
                  <Input id="session-duration" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input id="password-expiry" type="number" defaultValue="90" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed-ips">Allowed IP Addresses (one per line)</Label>
                <Textarea id="allowed-ips" rows={4} placeholder="192.168.1.1&#10;10.0.0.1" />
              </div>

              <Button onClick={() => handleSave('Security')}>Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="font-medium">Job Notifications</div>
                <div className="flex items-center justify-between pl-4">
                  <Label>New Job Created</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Job Status Changed</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Job Completed</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-medium">Lead Notifications</div>
                <div className="flex items-center justify-between pl-4">
                  <Label>New Lead Assigned</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Lead Converted to Job</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-medium">Payment Notifications</div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Payment Received</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Invoice Overdue</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-medium">System Notifications</div>
                <div className="flex items-center justify-between pl-4">
                  <Label>New User Registration</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pl-4">
                  <Label>Support Ticket Created</Label>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={() => handleSave('Notifications')}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Customize email templates sent to contractors and clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email Address</Label>
                <Input id="from-email" type="email" defaultValue="estimates@myct1.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input id="from-name" defaultValue="CT1 Constructeam" />
              </div>

              <div className="space-y-2">
                <Label>Email Template</Label>
                <Select defaultValue="estimate">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimate">Estimate Email</SelectItem>
                    <SelectItem value="invoice">Invoice Email</SelectItem>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="reminder">Payment Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject Line</Label>
                <Input id="email-subject" defaultValue="Your Estimate from {{contractor_name}}" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">Email Body (HTML supported)</Label>
                <Textarea 
                  id="email-body" 
                  rows={10} 
                  defaultValue="Hello {{client_name}},&#10;&#10;Thank you for requesting an estimate. Please review the attached estimate for your project.&#10;&#10;Best regards,&#10;{{contractor_name}}"
                />
              </div>

              <Button onClick={() => handleSave('Email')}>Save Email Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Settings */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Management
              </CardTitle>
              <CardDescription>
                Configure document generation and storage settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-generate PDFs</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create PDF documents for estimates and invoices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Company Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Add company logo to all generated documents
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Watermark Drafts</Label>
                    <p className="text-sm text-muted-foreground">
                      Add "DRAFT" watermark to unsigned documents
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-footer">Document Footer Text</Label>
                <Textarea 
                  id="document-footer" 
                  rows={3}
                  placeholder="Company terms and conditions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storage-limit">Max File Size (MB)</Label>
                  <Input id="storage-limit" type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Document Retention (years)</Label>
                  <Input id="retention" type="number" defaultValue="7" />
                </div>
              </div>

              <Button onClick={() => handleSave('Documents')}>Save Document Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>
                Manage external service connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>QuickBooks Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Sync invoices and payments with QuickBooks
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Clover Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept credit card payments via Clover
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Service (Resend)</Label>
                    <p className="text-sm text-muted-foreground">
                      Send emails through Resend service
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Integrations</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">Google Calendar</div>
                    <p className="text-sm text-muted-foreground">Sync job schedules</p>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">Stripe</div>
                    <p className="text-sm text-muted-foreground">Additional payment option</p>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Integrations')}>Save Integration Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Platform Branding
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <Input id="logo-upload" type="file" accept="image/*" />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 200x200px, PNG or SVG
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <Input id="primary-color" type="color" defaultValue="#E02424" className="w-20" />
                    <Input defaultValue="#E02424" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input id="secondary-color" type="color" defaultValue="#1f2937" className="w-20" />
                    <Input defaultValue="#1f2937" className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select defaultValue="inter">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter (Default)</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="openSans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSave('Branding')}>Save Branding Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced platform configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable verbose logging for troubleshooting
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable REST API for external integrations
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Webhook Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Send webhook notifications for system events
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" type="url" placeholder="https://yourapp.com/webhooks" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
                <Input id="api-rate-limit" type="number" defaultValue="60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Database Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSave('Advanced')}>Save Advanced Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
