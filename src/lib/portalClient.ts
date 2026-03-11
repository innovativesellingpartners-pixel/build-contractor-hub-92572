import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://faqrzzodtmsybofakcvv.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcXJ6em9kdG1zeWJvZmFrY3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjM0MjIsImV4cCI6MjA3NDk5OTQyMn0.nbJ0217NG-Om0vy81pb-tjuYn_Rv-fpDpviD6DVLUHM";

/**
 * Creates a Supabase client that includes the x-portal-token header.
 * This is required for RLS policies on portal-scoped tables (portal_messages,
 * job_photos, portal_photo_uploads, portal_calendar_events) which validate
 * that the caller knows the actual token value.
 */
export function createPortalClient(portalToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        'x-portal-token': portalToken,
      },
    },
  });
}
