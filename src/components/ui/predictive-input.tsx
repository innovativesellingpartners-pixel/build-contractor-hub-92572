import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { History, X } from 'lucide-react';

interface PredictiveInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  type?: string;
  autoCapitalize?: boolean;
}

export function PredictiveInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  disabled,
  id,
  type = 'text',
  autoCapitalize = true,
}: PredictiveInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on current input
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setFilteredSuggestions(suggestions.slice(0, 5));
    } else {
      const lowerValue = value.toLowerCase();
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(lowerValue) &&
        s.toLowerCase() !== lowerValue
      );
      setFilteredSuggestions(filtered.slice(0, 5));
    }
    setHighlightedIndex(-1);
  }, [value, suggestions]);

  // Handle input change with optional auto-capitalize
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (autoCapitalize && newValue.length > 0) {
      newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    }
    onChange(newValue);
  }, [onChange, autoCapitalize]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
        }
        break;
    }
  }, [showSuggestions, filteredSuggestions, highlightedIndex, handleSelectSuggestion]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSuggestions = filteredSuggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={() => hasSuggestions && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-auto">
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-b flex items-center gap-1">
            <History className="h-3 w-3" />
            Previously used
          </div>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
            >
              <span className="truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
