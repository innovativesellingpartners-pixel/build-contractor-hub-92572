import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CONSTRUCTION_TERMS } from "@/constants/constructionTerms";

const MAX_SUGGESTIONS = 8;
const MIN_CHARS = 2;

const termsLower = CONSTRUCTION_TERMS.map((t) => ({ original: t, lower: t.toLowerCase() }));

interface InputProps extends React.ComponentProps<"input"> {
  /** Set to false to disable construction term autocomplete */
  smartComplete?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, smartComplete, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [show, setShow] = useState(false);
    const [wordMeta, setWordMeta] = useState({ word: "", start: 0 });

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    const isTextType = type === "text" || type === undefined || type === "search";
    const enableSmart = smartComplete !== false && isTextType;

    const getCurrentWord = useCallback((el: HTMLInputElement) => {
      const pos = el.selectionStart ?? 0;
      const text = el.value;
      let start = pos;
      while (start > 0 && !/\s/.test(text[start - 1])) start--;
      return { word: text.slice(start, pos), start };
    }, []);

    const updateSuggestions = useCallback(
      (el: HTMLInputElement) => {
        if (!enableSmart) return;
        const { word, start } = getCurrentWord(el);
        setWordMeta({ word, start });
        if (word.length < MIN_CHARS) {
          setShow(false);
          return;
        }
        const lower = word.toLowerCase();
        const matches = termsLower
          .filter((t) => t.lower.startsWith(lower) && t.lower !== lower)
          .slice(0, MAX_SUGGESTIONS)
          .map((t) => t.original);
        if (matches.length === 0) {
          setShow(false);
        } else {
          setSuggestions(matches);
          setActiveIndex(0);
          setShow(true);
        }
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
          window.HTMLInputElement.prototype, "value"
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
      (e: React.KeyboardEvent<HTMLInputElement>) => {
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

    const inputEl = (
      <input
        type={type}
        spellCheck={isTextType ? true : undefined}
        autoCorrect="on"
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-150",
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        ref={enableSmart ? setRefs : ref}
        {...props}
        onInput={enableSmart ? (e: React.FormEvent<HTMLInputElement>) => {
          updateSuggestions(e.currentTarget);
          (props as any).onInput?.(e);
        } : (props as any).onInput}
        onClick={enableSmart ? (e: React.MouseEvent<HTMLInputElement>) => {
          updateSuggestions(e.currentTarget);
          props.onClick?.(e);
        } : props.onClick}
        onKeyDown={enableSmart ? handleKeyDown : props.onKeyDown}
        onBlur={enableSmart ? (e: React.FocusEvent<HTMLInputElement>) => {
          setTimeout(() => setShow(false), 150);
          props.onBlur?.(e);
        } : props.onBlur}
      />
    );

    if (!enableSmart) return inputEl;

    return (
      <div ref={wrapperRef} className="relative w-full">
        {inputEl}
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
  },
);
Input.displayName = "Input";

export { Input };
