import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Detect if a URL points to Supabase Storage or is a relative path
export const isSupabaseStorageUrl = (url: string) => {
  if (!url) return false;
  // Check for signed URLs that have expired or are invalid
  if (/supabase\.co\/storage\/v1\/object\//.test(url)) return true;
  // Check for relative storage paths like "training-videos/folder/file.mp4"
  return /^(training-videos|training-pdfs)\//.test(url);
};

// Parse bucket and path from a Supabase storage URL or relative path
export const parseStorageUrl = (url: string): { bucket: string; path: string } | null => {
  if (!url) return null;

  // Relative path like: "training-videos/folder/file.mp4"
  const relMatch = url.match(/^(training-videos|training-pdfs)\/(.+)$/);
  if (relMatch) {
    return { bucket: relMatch[1], path: relMatch[2] } as { bucket: string; path: string };
  }

  // Full storage URL patterns
  try {
    const u = new URL(url);
    if (!/supabase\.co$/.test(u.hostname)) return null;

    // Path can be: /storage/v1/object/sign/{bucket}/{path}
    //              /storage/v1/object/public/{bucket}/{path}
    //              /storage/v1/object/{bucket}/{path}
    const parts = u.pathname.split("/storage/v1/object/")[1];
    if (!parts) return null;

    // Remove potential leading prefixes like sign/ or public/
    const cleaned = parts.replace(/^sign\//, "").replace(/^public\//, "");
    const firstSlash = cleaned.indexOf("/");
    if (firstSlash === -1) return null;
    const bucket = cleaned.slice(0, firstSlash);
    const path = cleaned.slice(firstSlash + 1);
    return { bucket, path };
  } catch {
    return null;
  }
};

export const useSignedUrl = (url: string | null, expiresInSeconds = 3600) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSigning = useMemo(() => (url ? isSupabaseStorageUrl(url) : false), [url]);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    const run = async () => {
      if (!url) {
        setSignedUrl(null);
        return;
      }

      if (!needsSigning) {
        setSignedUrl(url);
        return;
      }

      const parsed = parseStorageUrl(url);
      if (!parsed) {
        setSignedUrl(url);
        return;
      }

      setIsSigning(true);
      const { bucket, path } = parsed;
      const { data, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (!isMounted) return;

      if (signErr) {
        setError(signErr.message);
        setSignedUrl(url); // Fallback to original
      } else {
        setSignedUrl(data?.signedUrl || url);
      }
      setIsSigning(false);
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [url, needsSigning, expiresInSeconds]);

  return { url: signedUrl, isSigning, error };
};
