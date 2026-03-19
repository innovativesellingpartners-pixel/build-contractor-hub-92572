import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Syncs the i18n language with the user's preferred_language profile setting.
 * Place this hook in a top-level component that renders after auth is loaded.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { profile } = useAuth();

  useEffect(() => {
    const lang = (profile as any)?.preferred_language || "en";
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [profile, i18n]);
}
