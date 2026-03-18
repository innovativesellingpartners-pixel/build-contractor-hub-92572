import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CONSTRUCTION_TERMS } from "@/constants/constructionTerms";

const MAX_SUGGESTIONS = 8;
const MIN_CHARS = 2;

const termsLower = CONSTRUCTION_TERMS.map((t) => ({ original: t, lower: t.toLowerCase() }));

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Set to false to disable construction term autocomplete */
  smartComplete?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, smartComplete, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [show, setShow] = useState(false);
    const [wordMeta, setWordMeta] = useState({ word: "", start: 0 });

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    const enableSmart = smartComplete !== false;

    const getCurrentWord = useCallback((el: HTMLTextAreaElement) => {
      const pos = el.selectionStart ?? 0;
      const text = el.value;
      let start = pos;
      while (start > 0 && !/\s/.test(text[start - 1])) start--;
      return { word: text.slice(start, pos), start };
    }, []);

    const updateSuggestions = useCallback(
      (el: HTMLTextAreaElement) => {
        if (!enableSmart) return;
        const { word, start } = getCurrentWord(el);
        setWordMeta({ word, start });
        if (word.length < MIN_CHARS) { setShow(false); return; }
        const lower = word.toLowerCase();
        const matches = termsLower
          .filter((t) => t.lower.startsWith(lower) && t.lower !== lower)
          .slice(0, MAX_SUGGESTIONS)
          .map((t) => t.original);
        if (matches.length === 0) { setShow(false); }
        else { setSuggestions(matches); setActiveIndex(0); setShow(true); }
      },
      [enableSmart, getCurrentWord]
    );

    const acceptSuggestion = useCallback(
      (term: string) => {
        const el = innerRef.current;
        if (!el) return;
        const before = el.value.slice(0, wordMeta.start);
        const after = el.value.slice(wordMeta.start + wordMeta.word.length);
        const newValue = before + term + after;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        if (setter) {
          setter.call(el, newValue);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const newPos = wordMeta.start + term.length;
        requestAnimationFrame(() => {
          el.setSelectionRange(newPos, newPos);
          el.focus();
        });
        setShow(false);
      },
      [wordMeta]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (show && suggestions.length > 0) {
          if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)); return; }
          if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); return; }
          if (e.key === "Tab" || e.key === "Enter") {
            if (suggestions[activeIndex]) { e.preventDefault(); acceptSuggestion(suggestions[activeIndex]); return; }
          }
          if (e.key === "Escape") { setShow(false); return; }
        }
        props.onKeyDown?.(e);
      },
      [show, suggestions, activeIndex, acceptSuggestion, props.onKeyDown]
    );

    useEffect(() => {
      if (!show) return;
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShow(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [show]);

    const textareaEl = (
      <textarea
        spellCheck={true}
        autoCorrect="on"
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-2 border-input-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className,
        )}
        ref={enableSmart ? setRefs : ref}
        {...props}
        onInput={enableSmart ? (e: React.FormEvent<HTMLTextAreaElement>) => {
          updateSuggestions(e.currentTarget);
          (props as any).onInput?.(e);
        } : (props as any).onInput}
        onClick={enableSmart ? (e: React.MouseEvent<HTMLTextAreaElement>) => {
          updateSuggestions(e.currentTarget);
          props.onClick?.(e);
        } : props.onClick}
        onKeyDown={enableSmart ? handleKeyDown : props.onKeyDown}
        onBlur={enableSmart ? (e: React.FocusEvent<HTMLTextAreaElement>) => {
          setTimeout(() => setShow(false), 150);
          props.onBlur?.(e);
        } : props.onBlur}
      />
    );

    if (!enableSmart) return textareaEl;

    return (
      <div ref={wrapperRef} className="relative w-full">
        {textareaEl}
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
                onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(term); }}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
