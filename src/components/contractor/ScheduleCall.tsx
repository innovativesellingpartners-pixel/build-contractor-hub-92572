import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, Phone, Mail, User } from "lucide-react";
import { useState } from "react";

interface UpcomingCall {
  id: string;
  date: string;
  time: string;
  type: 'training' | 'business' | 'support';
  accountManager: string;
  status: 'confirmed' | 'pending';
}

export function ScheduleCall() {
  const [upcomingCalls] = useState<UpcomingCall[]>([
    {
      id: '1',
      date: '2024-02-15',
      time: '2:00 PM EST',
      type: 'business',
      accountManager: 'John Smith',
      status: 'confirmed'
    }
  ]);

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Training Session';
      case 'business': return 'Business Consultation';
      case 'support': return 'Support Call';
      default: return 'Call';
    }
  };

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Schedule a Call with CT1 Account Manager</h2>
        <p className="text-muted-foreground">Book one-on-one sessions with your dedicated account manager</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Training Session</h3>
                <p className="text-sm text-muted-foreground">30 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Growth Consultation</h3>
                <p className="text-sm text-muted-foreground">45 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Support Call</h3>
                <p className="text-sm text-muted-foreground">15 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Calls</CardTitle>
          <CardDescription>Your scheduled sessions with CT1 team</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingCalls.length > 0 ? (
            <div className="space-y-4">
              {upcomingCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{getCallTypeLabel(call.type)}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCallTypeColor(call.type)}`}>
                          {call.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(call.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{call.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{call.accountManager}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Reschedule</Button>
                    <Button size="sm">Join Call</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming calls</h3>
              <p className="text-muted-foreground mb-4">Schedule your first session with your account manager</p>
              <Button>Schedule Now</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account Manager</CardTitle>
          <CardDescription>Direct contact for support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">John Smith</h4>
              <p className="text-sm text-muted-foreground mb-2">Senior Account Manager</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>support@myct1.com</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>(555) 123-4567</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}