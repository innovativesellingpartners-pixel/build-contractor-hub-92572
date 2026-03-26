import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  job_id: string | null;
  customer_name: string | null;
  rating: number;
  review_text: string | null;
  photos: any[];
  is_public: boolean;
  google_review_redirected: boolean;
  submitted_at: string;
  review_request_id: string | null;
  created_at: string;
}

export interface ReviewRequest {
  id: string;
  user_id: string;
  job_id: string | null;
  customer_id: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  sent_at: string | null;
  channel: string;
  status: string;
  review_token: string;
  reminder_count: number;
  created_at: string;
}

export function useReviews() {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: reviewRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['review-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReviewRequest[];
    },
  });

  const sendReviewRequest = useMutation({
    mutationFn: async (params: { job_id: string; customer_id?: string; customer_email: string; customer_phone?: string; channel?: string }) => {
      const { data, error } = await supabase.functions.invoke('send-review-request', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-requests'] });
      toast.success('Review request sent!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send review request');
    },
  });

  // Stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  const pendingRequests = reviewRequests.filter(r => r.status === 'pending' || r.status === 'sent');

  return {
    reviews,
    reviewRequests,
    reviewsLoading,
    requestsLoading,
    sendReviewRequest,
    avgRating,
    ratingBreakdown,
    pendingRequests,
  };
}
