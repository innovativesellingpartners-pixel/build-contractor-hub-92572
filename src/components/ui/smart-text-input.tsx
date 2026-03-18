import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { CONSTRUCTION_TERMS } from "@/constants/constructionTerms";
import { cn } from "@/lib/utils";

interface SmartTextInputProps {
  /** The child must be an input or textarea element (or component forwarding ref). */
  children: React.ReactElement<
    React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>
  >;
}

const MAX_SUGGESTIONS = 8;
const MIN_CHARS = 2;

/**
 * Wraps any <input> or <textarea> with a floating construction-term autocomplete.
 * Renders suggestions after 2+ characters of the current word being typed.
 *
 * Usage:
 *   <SmartTextInput>
 *     <Input value={val} onChange={handleChange} />
 *   </SmartTextInput>
 */
export function SmartTextInput({ children }: SmartTextInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [cursorWord, setCursorWord] = useState("");
  const [cursorWordStart, setCursorWordStart] = useState(0);

  // Lowercase lookup for fast matching
  const termsLower = React.useMemo(
    () => CONSTRUCTION_TERMS.map((t) => ({ original: t, lower: t.toLowerCase() })),
    []
  );

  const getCurrentWord = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      const pos = el.selectionStart ?? 0;
      const text = el.value;
      // Walk backward from cursor to find word start
      let start = pos;
      while (start > 0 && !/\s/.test(text[start - 1])) start--;
      const word = text.slice(start, pos);
      return { word, start };
    },
    []
  );

  const updateSuggestions = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      const { word, start } = getCurrentWord(el);
      setCursorWord(word);
      setCursorWordStart(start);

      if (word.length < MIN_CHARS) {
        setShow(false);
        setSuggestions([]);
        return;
      }

      const lower = word.toLowerCase();
      const matches = termsLower
        .filter((t) => t.lower.startsWith(lower) && t.lower !== lower)
        .slice(0, MAX_SUGGESTIONS)
        .map((t) => t.original);

      if (matches.length === 0) {
        setShow(false);
        setSuggestions([]);
      } else {
        setSuggestions(matches);
        setActiveIndex(0);
        setShow(true);
      }
    },
    [getCurrentWord, termsLower]
  );

  const acceptSuggestion = useCallback(
    (term: string, el: HTMLInputElement | HTMLTextAreaElement) => {
      const before = el.value.slice(0, cursorWordStart);
      const after = el.value.slice(cursorWordStart + cursorWord.length);
      const newValue = before + term + after;

      // Trigger a native-like change event so React controlled components pick it up
      const nativeInputValueSetter =
        Object.getOwnPropertyDescriptor(
          el.tagName === "TEXTAREA"
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype,
          "value"
        )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newValue);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // Move cursor to end of inserted term
      const newPos = cursorWordStart + term.length;
      requestAnimationFrame(() => {
        el.setSelectionRange(newPos, newPos);
        el.focus();
      });

      setShow(false);
      setSuggestions([]);
    },
    [cursorWord, cursorWordStart]
  );

  // Clone child and attach handlers
  const child = React.Children.only(children);
  const cloned = React.cloneElement(child, {
    onInput: (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateSuggestions(e.currentTarget);
      // Preserve original handler
      (child.props as any).onInput?.(e);
    },
    onClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateSuggestions(e.currentTarget);
      (child.props as any).onClick?.(e);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (show && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          if (suggestions[activeIndex]) {
            e.preventDefault();
            acceptSuggestion(suggestions[activeIndex], e.currentTarget);
            return;
          }
        }
        if (e.key === "Escape") {
          setShow(false);
          return;
        }
      }
      (child.props as any).onKeyDown?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Delay hide so click on suggestion registers
      setTimeout(() => setShow(false), 150);
      (child.props as any).onBlur?.(e);
    },
  } as any);

  // Close on outside click
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      {cloned}
      {show && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {suggestions.map((term, i) => (
            <button
              key={term}
              type="button"
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                i === activeIndex && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                const input = wrapperRef.current?.querySelector(
                  "input, textarea"
                ) as HTMLInputElement | HTMLTextAreaElement | null;
                if (input) acceptSuggestion(term, input);
              }}
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
