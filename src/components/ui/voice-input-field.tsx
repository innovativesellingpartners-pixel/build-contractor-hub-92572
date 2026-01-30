import * as React from "react";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/voice-input";
import { cn } from "@/lib/utils";

interface VoiceInputFieldProps extends React.ComponentProps<"input"> {
  onVoiceInput?: (text: string) => void;
  showVoice?: boolean;
  containerClassName?: string;
}

const VoiceInputField = React.forwardRef<HTMLInputElement, VoiceInputFieldProps>(
  ({ className, containerClassName, value, onChange, onVoiceInput, showVoice = true, disabled, ...props }, ref) => {
    const handleVoiceTranscript = (text: string) => {
      // Use the raw transcript text - don't append here since parent may already handle it
      if (onVoiceInput) {
        // onVoiceInput expects the full new value, so we append here
        const currentValue = typeof value === 'string' ? value : '';
        const newValue = currentValue ? `${currentValue} ${text}` : text;
        onVoiceInput(newValue);
      } else if (onChange) {
        // For onChange, just set the appended value via synthetic event
        const currentValue = typeof value === 'string' ? value : '';
        const newValue = currentValue ? `${currentValue} ${text}` : text;
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn("relative flex items-center gap-1", containerClassName)}>
        <Input
          ref={ref}
          className={cn("flex-1", showVoice && "pr-2", className)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {showVoice && (
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={disabled}
          />
        )}
      </div>
    );
  }
);

VoiceInputField.displayName = "VoiceInputField";

export { VoiceInputField };
