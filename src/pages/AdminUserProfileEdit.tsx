import { ProfileEditContent } from "@/components/contractor/ProfileEditContent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminUserProfileEdit() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const { data: profile } = useQuery({
    queryKey: ['adminUserProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, contact_name')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const displayName = profile?.company_name || profile?.contact_name || 'User';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Contractor Profile</h1>
            <p className="text-sm text-muted-foreground">Editing: {displayName}</p>
          </div>
        </div>
        {userId && <ProfileEditContent targetUserId={userId} />}
      </div>
    </div>
  );
}
