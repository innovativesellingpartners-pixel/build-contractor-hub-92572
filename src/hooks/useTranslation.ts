import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CONSTRUCTION_GLOSSARY, CONSTRUCTION_GLOSSARY_EN_TO_ES } from "@/constants/constructionTranslations";
import { toast } from "sonner";

export interface TranslationResult {
  translated: Record<string, string>;
  baseTranslated: Record<string, string>;
  aiEnhanced: boolean;
  refinedFields: string[];
}

/**
 * Hook for translating document content between Spanish and English
 * using the construction glossary + AI translation edge function.
 */
export function useDocumentTranslation() {
  const [translating, setTranslating] = useState(false);

  /**
   * Translate a set of text fields from one language to another.
   * Returns the full translation result including AI refinement metadata.
   */
  const translateTexts = async (
    texts: Record<string, string>,
    sourceLang: "es" | "en",
    targetLang: "en" | "es"
  ): Promise<TranslationResult | null> => {
    setTranslating(true);
    try {
      // Pick the right glossary direction
      const glossary = sourceLang === "es"
        ? CONSTRUCTION_GLOSSARY
        : CONSTRUCTION_GLOSSARY_EN_TO_ES;

      // Filter glossary to only include terms that appear in the texts
      const textsLower = Object.values(texts).join(" ").toLowerCase();
      const relevantGlossary: Record<string, string> = {};
      for (const [term, translation] of Object.entries(glossary)) {
        if (textsLower.includes(term.toLowerCase())) {
          relevantGlossary[term] = translation;
        }
      }

      const { data, error } = await supabase.functions.invoke("translate-document", {
        body: { texts, sourceLang, targetLang, glossary: relevantGlossary },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        translated: data.translated,
        baseTranslated: data.baseTranslated || data.translated,
        aiEnhanced: data.aiEnhanced || false,
        refinedFields: data.refinedFields || [],
      };
    } catch (err: any) {
      console.error("Translation failed:", err);
      toast.error(err?.message || "Translation failed. Please try again.");
      return null;
    } finally {
      setTranslating(false);
    }
  };

  return { translateTexts, translating };
}
