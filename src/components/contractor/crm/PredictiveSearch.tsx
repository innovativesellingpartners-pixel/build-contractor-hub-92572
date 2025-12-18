import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchResult<T> {
  item: T;
  label: string;
  sublabel?: string;
}

interface PredictiveSearchProps<T> {
  items: T[];
  placeholder?: string;
  getLabel: (item: T) => string;
  getSublabel?: (item: T) => string;
  filterFn: (item: T, query: string) => boolean;
  onSelect: (item: T) => void;
  className?: string;
}

export function PredictiveSearch<T>({
  items,
  placeholder = 'Search...',
  getLabel,
  getSublabel,
  filterFn,
  onSelect,
  className,
}: PredictiveSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter results based on query
  const filteredResults = query.trim()
    ? items.filter(item => filterFn(item, query)).slice(0, 8)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[highlightedIndex]) {
          handleSelect(filteredResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (query.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
        >
          {filteredResults.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors',
                index === highlightedIndex
                  ? 'bg-muted'
                  : 'hover:bg-muted/50'
              )}
            >
              <p className="font-medium text-sm truncate">{getLabel(item)}</p>
              {getSublabel && (
                <p className="text-xs text-muted-foreground truncate">
                  {getSublabel(item)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.trim() && filteredResults.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg"
        >
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
