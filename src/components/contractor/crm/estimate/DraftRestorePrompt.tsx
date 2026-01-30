import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface DraftRestorePromptProps {
  draftUpdatedAt: string;
  onRestore: () => void;
  onDiscard: () => void;
  isDiscarding?: boolean;
}

export function DraftRestorePrompt({
  draftUpdatedAt,
  onRestore,
  onDiscard,
  isDiscarding = false,
}: DraftRestorePromptProps) {
  const formattedDate = (() => {
    try {
      return format(new Date(draftUpdatedAt), 'MMM d, yyyy h:mm a');
    } catch {
      return 'recently';
    }
  })();

  return (
    <Card className="p-4 mb-4 border-warning bg-warning/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">
            Unsaved draft found
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            You have an unsaved draft from {formattedDate}. Would you like to restore it?
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onRestore}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restore Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDiscard}
              disabled={isDiscarding}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
