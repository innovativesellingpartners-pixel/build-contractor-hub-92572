import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Languages, Loader2, Check, Edit2, Sparkles } from "lucide-react";
import { useDocumentTranslation, TranslationResult } from "@/hooks/useTranslation";
import { useTranslation } from "react-i18next";

interface TranslationField {
  key: string;
  label: string;
  value: string;
}

interface TranslationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: TranslationField[];
  sourceLang: "es" | "en";
  targetLang: "en" | "es";
  onConfirm: (translatedFields: Record<string, string>) => void;
}

export function TranslationPreviewDialog({
  open,
  onOpenChange,
  fields,
  sourceLang,
  targetLang,
  onConfirm,
}: TranslationPreviewDialogProps) {
  const { t } = useTranslation();
  const { translateTexts, translating } = useDocumentTranslation();
  const [translatedFields, setTranslatedFields] = useState<Record<string, string>>({});
  const [baseTranslatedFields, setBaseTranslatedFields] = useState<Record<string, string>>({});
  const [hasTranslated, setHasTranslated] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [refinedFieldKeys, setRefinedFieldKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const handleTranslate = async () => {
    const textsToTranslate: Record<string, string> = {};
    for (const field of fields) {
      if (field.value?.trim()) {
        textsToTranslate[field.key] = field.value;
      }
    }

    if (Object.keys(textsToTranslate).length === 0) return;

    const result = await translateTexts(textsToTranslate, sourceLang, targetLang);
    if (result) {
      setTranslatedFields(result.translated);
      setBaseTranslatedFields(result.baseTranslated);
      setAiEnhanced(result.aiEnhanced);
      setRefinedFieldKeys(result.refinedFields);
      setHasTranslated(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(translatedFields);
    onOpenChange(false);
    resetState();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setTranslatedFields({});
    setBaseTranslatedFields({});
    setHasTranslated(false);
    setAiEnhanced(false);
    setRefinedFieldKeys([]);
    setEditing(null);
  };

  const targetLangLabel = targetLang === "en" ? "English" : "Spanish";
  const sourceLangLabel = sourceLang === "es" ? "Spanish" : "English";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t("translation.reviewTranslation")}
            {hasTranslated && aiEnhanced && (
              <Badge variant="secondary" className="ml-2 gap-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3" />
                AI-Enhanced
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t("translation.reviewDescription")}
          </DialogDescription>
        </DialogHeader>

        {!hasTranslated ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground text-center">
              {fields.filter(f => f.value?.trim()).length} field(s) will be translated from {sourceLangLabel} to {targetLangLabel}.
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Translation is AI-enhanced: a base translation is refined by a construction industry expert AI for accuracy and natural phrasing.
            </p>
            <Button onClick={handleTranslate} disabled={translating}>
              {translating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("translation.translating")}
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2" />
                  {t("translation.translateForCustomer")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {aiEnhanced && refinedFieldKeys.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  AI refinement improved {refinedFieldKeys.length} field(s) for better construction terminology and natural phrasing. Refined fields are highlighted.
                </p>
              </div>
            )}
            {fields.filter(f => f.value?.trim()).map((field) => {
              const isRefined = refinedFieldKeys.includes(field.key);
              return (
                <div
                  key={field.key}
                  className={`border rounded-lg p-3 space-y-2 ${isRefined ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
                    {isRefined && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 border-primary/30 text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        Refined
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("translation.originalVersion")}</p>
                      <div className="text-sm bg-muted/50 rounded p-2 min-h-[60px]">
                        {field.value}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        {t("translation.translatedVersion")}
                        <button
                          onClick={() => setEditing(editing === field.key ? null : field.key)}
                          className="text-primary hover:underline"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </p>
                      {editing === field.key ? (
                        <Textarea
                          value={translatedFields[field.key] || ""}
                          onChange={(e) =>
                            setTranslatedFields((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="text-sm min-h-[60px]"
                        />
                      ) : (
                        <div className={`text-sm rounded p-2 min-h-[60px] ${isRefined ? "bg-primary/5 border border-primary/20" : "bg-primary/5 border border-primary/20"}`}>
                          {translatedFields[field.key] || field.value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {t("translation.keepOriginal")}
          </Button>
          {hasTranslated && (
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-2" />
              {t("translation.useTranslation")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
