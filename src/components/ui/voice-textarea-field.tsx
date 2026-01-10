import * as React from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { VoiceInput } from "@/components/ui/voice-input";
import { cn } from "@/lib/utils";

interface VoiceTextareaFieldProps extends TextareaProps {
  onVoiceInput?: (text: string) => void;
  showVoice?: boolean;
  containerClassName?: string;
}

const VoiceTextareaField = React.forwardRef<HTMLTextAreaElement, VoiceTextareaFieldProps>(
  ({ className, containerClassName, value, onChange, onVoiceInput, showVoice = true, disabled, ...props }, ref) => {
    const handleVoiceTranscript = (text: string) => {
      const currentValue = typeof value === 'string' ? value : '';
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      
      if (onVoiceInput) {
        onVoiceInput(newValue);
      } else if (onChange) {
        // Create a synthetic event
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn("relative", containerClassName)}>
        <Textarea
          ref={ref}
          className={cn("pr-10", className)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {showVoice && (
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={disabled}
            className="absolute right-2 top-2"
          />
        )}
      </div>
    );
  }
);

VoiceTextareaField.displayName = "VoiceTextareaField";

export { VoiceTextareaField };
