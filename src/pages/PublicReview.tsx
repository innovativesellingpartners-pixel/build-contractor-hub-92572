import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, CheckCircle, ExternalLink, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function InteractiveStarRating({ rating, onChange, size = 'lg' }: { rating: number; onChange: (r: number) => void; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-8 w-8';
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              starSize, 'transition-colors',
              star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function PublicReview() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const presetRating = searchParams.get('r');
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showGoogleRedirect, setShowGoogleRedirect] = useState(false);

  // Pre-set rating from email link
  useEffect(() => {
    if (presetRating) {
      const r = parseInt(presetRating);
      if (r >= 1 && r <= 5) setRating(r);
    }
  }, [presetRating]);

  // Check if this is a token-based review (from review_requests)
  const isToken = jobId && jobId.length > 30; // UUIDs/tokens are longer than typical job IDs

  // Fetch job info - support both job ID and review token
  const { data: jobInfo, isLoading } = useQuery({
    queryKey: ['public-review-job', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      let actualJobId = jobId;
      let reviewRequestId: string | null = null;

      // Check if this is a review token
      if (isToken) {
        const { data: req } = await supabase
          .from('review_requests')
          .select('id, job_id, customer_email')
          .eq('review_token', jobId)
          .single();
        if (req?.job_id) {
          actualJobId = req.job_id;
          reviewRequestId = req.id;
        } else {
          return null;
        }
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .select('id, name, user_id')
        .eq('id', actualJobId)
        .single();
      if (error) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, contact_name, logo_url, google_place_id')
        .eq('id', job.user_id)
        .single();

      return { job, profile, reviewRequestId };
    },
    enabled: !!jobId,
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!jobId || !jobInfo?.job) return;

    setSubmitting(true);
    try {
      // Determine if low rating → private feedback
      const isPublic = rating >= 4;

      // Insert into reviews table
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: jobInfo.job.user_id,
          job_id: jobInfo.job.id,
          customer_name: customerName || null,
          rating,
          review_text: feedback || null,
          is_public: isPublic,
          google_review_redirected: false,
          review_request_id: jobInfo.reviewRequestId || null,
        });

      if (reviewError) throw reviewError;

      // Also insert into post_sale_follow_ups for backward compatibility
      await supabase
        .from('post_sale_follow_ups')
        .insert({
          job_id: jobInfo.job.id,
          user_id: jobInfo.job.user_id,
          status: 'completed',
          outcome: `${rating} star review`,
          notes: feedback || null,
          contact_method: 'review_link',
          completed_at: new Date().toISOString(),
        });

      // Update review request status if applicable
      if (jobInfo.reviewRequestId) {
        await supabase
          .from('review_requests')
          .update({ status: 'completed' })
          .eq('id', jobInfo.reviewRequestId);
      }

      setSubmitted(true);

      // Show Google redirect for high ratings
      if (rating >= 4 && (jobInfo.profile as any)?.google_place_id) {
        setShowGoogleRedirect(true);
      }
    } catch (error: any) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Skeleton className="h-[400px] w-full max-w-md" />
      </div>
    );
  }

  if (!jobInfo?.job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground">Review link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const googlePlaceId = (jobInfo.profile as any)?.google_place_id;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground">
            {rating >= 4
              ? 'We\'re glad you had a great experience!'
              : 'Thank you for your honest feedback. We\'ll use it to improve.'}
          </p>
          
          {showGoogleRedirect && googlePlaceId && (
            <div className="pt-4 space-y-3">
              <p className="text-sm font-medium">Would you also leave us a Google review?</p>
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => {
                  // Mark as redirected
                  supabase
                    .from('reviews')
                    .update({ google_review_redirected: true })
                    .eq('job_id', jobInfo.job.id)
                    .eq('rating', rating);
                  window.open(
                    `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
                    '_blank'
                  );
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Leave a Google Review
              </Button>
              <p className="text-xs text-muted-foreground">It really helps our business grow!</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const companyName = jobInfo.profile?.company_name || jobInfo.profile?.contact_name || 'Your Contractor';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-6 sm:p-8 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {jobInfo.profile?.logo_url && (
            <img
              src={jobInfo.profile.logo_url}
              alt={companyName}
              className="h-12 mx-auto object-contain"
            />
          )}
          <h1 className="text-xl font-bold">{companyName}</h1>
          <p className="text-sm text-muted-foreground">
            How was your experience with <strong>{jobInfo.job.name}</strong>?
          </p>
        </div>

        {/* Star Rating - Large, touch-friendly */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium">Your Rating</p>
          <InteractiveStarRating rating={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Name (optional)</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {rating < 4 && rating > 0 ? 'What could we improve?' : 'Comments (optional)'}
          </label>
          <Textarea
            placeholder={rating < 4 && rating > 0
              ? 'Please share what we could do better...'
              : 'Tell us about your experience...'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        {/* Privacy notice for low ratings */}
        {rating > 0 && rating < 4 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              🔒 Your feedback will be shared privately with the contractor to help them improve. It will not be posted publicly.
            </p>
          </div>
        )}

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full" size="lg">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Powered by MyCT1
        </p>
      </Card>
    </div>
  );
}
