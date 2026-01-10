import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressParsed?: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  showGpsButton?: boolean;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressParsed,
  placeholder = "Start typing an address...",
  className,
  showGpsButton = true,
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) - free geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Address suggestions received:', data.length);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  // Parse address from suggestion
  const parseAddress = (suggestion: AddressSuggestion): ParsedAddress => {
    const addr = suggestion.address;
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || '';
    const state = addr.state || '';
    const zipCode = addr.postcode || '';
    
    return {
      street,
      city,
      state,
      zipCode,
      fullAddress: suggestion.display_name,
    };
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const parsed = parseAddress(suggestion);
    onChange(parsed.fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    
    if (onAddressParsed) {
      onAddressParsed(parsed);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Get current location via GPS
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('GPS location obtained:', latitude, longitude);

      // Reverse geocode the coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Reverse geocode result:', data);
        
        if (data && data.display_name) {
          const parsed = parseAddress(data);
          onChange(parsed.fullAddress);
          
          if (onAddressParsed) {
            onAddressParsed(parsed);
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={cn("pl-10 pr-8", className)}
            disabled={disabled}
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {showGpsButton && (
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation || disabled}
            className="flex-shrink-0 p-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.lat}-${suggestion.lon}`}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{suggestion.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
