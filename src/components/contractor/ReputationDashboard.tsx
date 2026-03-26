import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Star, Send, Clock, ExternalLink, TrendingUp, MessageSquare, ArrowLeft } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';
import { useJobs } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export default function ReputationDashboard({ onBack }: { onBack?: () => void }) {
  const { reviews, reviewRequests, reviewsLoading, sendReviewRequest, avgRating, ratingBreakdown, pendingRequests } = useReviews();
  const { jobs } = useJobs();
  const { customers } = useCustomers();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile-google', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_name, google_place_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [channel, setChannel] = useState('email');

  const googlePlaceId = (profile as any)?.google_place_id;

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months: { month: string; count: number; avg: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
      const monthReviews = reviews.filter(r => {
        const d = new Date(r.submitted_at);
        return d >= monthStart && d < monthEnd;
      });
      months.push({
        month: format(monthStart, 'MMM'),
        count: monthReviews.length,
        avg: monthReviews.length > 0
          ? Math.round((monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length) * 10) / 10
          : 0,
      });
    }
    return months;
  }, [reviews]);

  const handleSendRequest = async () => {
    if (!selectedJobId || !customerEmail) return;
    await sendReviewRequest.mutateAsync({
      job_id: selectedJobId,
      customer_email: customerEmail,
      customer_phone: customerPhone || undefined,
      channel,
    });
    setShowRequestDialog(false);
    setSelectedJobId('');
    setCustomerEmail('');
    setCustomerPhone('');
  };

  const completedJobs = jobs?.filter(j => j.job_status === 'completed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold">Reputation & Reviews</h2>
            <p className="text-sm text-muted-foreground">Monitor and grow your online reputation</p>
          </div>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Send className="h-4 w-4 mr-2" />
          Request Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('h-4 w-4', s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">
              {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Positive (4-5★)</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown & Google Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratingBreakdown.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm w-12 text-right">{star} star</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-14 text-right">{count} ({percent}%)</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Business</CardTitle>
            <CardDescription>
              {googlePlaceId ? 'Customers with 4-5 star reviews are redirected to your Google page' : 'Add your Google Place ID in Profile to enable Google Review redirects'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {googlePlaceId ? (
              <Button variant="outline" asChild>
                <a href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Google Reviews Page
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Configure your Google Place ID in your profile settings under Branding.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Review Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Send your first review request!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 10).map(review => (
                <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="shrink-0">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('h-3.5 w-3.5', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{review.customer_name || 'Customer'}</span>
                      {review.rating < 4 && !review.is_public && (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                      {review.google_review_redirected && (
                        <Badge variant="secondary" className="text-xs">Google</Badge>
                      )}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.review_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(review.submitted_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.slice(0, 5).map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{req.customer_email || req.customer_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {req.sent_at ? format(new Date(req.sent_at), 'MMM d') : 'Pending'} · {req.channel}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{req.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Review Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Review</DialogTitle>
            <DialogDescription>Send a review request to a customer after completing their job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Completed Job</Label>
              <Select value={selectedJobId} onValueChange={(v) => {
                setSelectedJobId(v);
                // Auto-fill customer info
                const job = completedJobs.find(j => j.id === v);
                if (job && (job as any).customer_id) {
                  const customer = customers?.find(c => c.id === (job as any).customer_id);
                  if (customer) {
                    setCustomerEmail(customer.email || '');
                    setCustomerPhone(customer.phone || '');
                  }
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {completedJobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.name || j.job_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer Email *</Label>
              <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Customer Phone</Label>
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSendRequest}
              disabled={!selectedJobId || !customerEmail || sendReviewRequest.isPending}
              className="w-full"
            >
              {sendReviewRequest.isPending ? 'Sending...' : 'Send Review Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
