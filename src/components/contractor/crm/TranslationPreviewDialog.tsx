import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Languages, Loader2, Check, Edit2 } from "lucide-react";
import { useDocumentTranslation } from "@/hooks/useTranslation";
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
  const [hasTranslated, setHasTranslated] = useState(false);
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
      setTranslatedFields(result);
      setHasTranslated(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(translatedFields);
    onOpenChange(false);
    // Reset state
    setTranslatedFields({});
    setHasTranslated(false);
    setEditing(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTranslatedFields({});
    setHasTranslated(false);
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
            {fields.filter(f => f.value?.trim()).map((field) => (
              <div key={field.key} className="border rounded-lg p-3 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
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
                      <div className="text-sm bg-primary/5 border border-primary/20 rounded p-2 min-h-[60px]">
                        {translatedFields[field.key] || field.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
