import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
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
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch job and contractor info
  const { data: jobInfo, isLoading } = useQuery({
    queryKey: ['public-review-job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data: job, error } = await supabase
        .from('jobs')
        .select('id, name, user_id')
        .eq('id', jobId)
        .single();
      if (error) return null;

      // Get contractor profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, contact_name, logo_url')
        .eq('id', job.user_id)
        .single();

      return { job, profile };
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
      const { error } = await supabase
        .from('post_sale_follow_ups')
        .insert({
          job_id: jobId,
          user_id: jobInfo.job.user_id,
          status: 'completed',
          outcome: `${rating} star review`,
          notes: feedback || null,
          contact_method: 'review_link',
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSubmitted(true);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground">Your review has been submitted successfully. We appreciate your feedback!</p>
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

        {/* Rating */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium">Your Rating</p>
          <InteractiveStarRating rating={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Comments (optional)</label>
          <Textarea
            placeholder="Tell us about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

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
