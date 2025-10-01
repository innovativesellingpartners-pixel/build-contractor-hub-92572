import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Calendar, AlertCircle, CheckCircle } from "lucide-react";

export function Insurance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance & Compliance</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('https://insurance-login.example.com', '_blank')}>
            Log in to Insurance Account
          </Button>
          <Button onClick={() => window.location.href = 'mailto:sales@myct1.com?subject=Insurance Options - Lower My Bill'}>
            Contact Sales for Better Rates
          </Button>
          <Button variant="secondary">Upload Documents</Button>
        </div>
      </div>

      {/* Insurance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <Button>Get a Quote</Button>
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
