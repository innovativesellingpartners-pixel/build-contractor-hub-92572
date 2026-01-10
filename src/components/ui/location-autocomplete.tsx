import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Navigation, Keyboard, MapPinOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddressData {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
  formattedAddress: string;
  placeId?: string;
  source?: string;
}

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  distanceMeters?: number | null;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (data: AddressData) => void;
  placeholder?: string;
  className?: string;
  showGpsButton?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  nearLat?: number;
  nearLng?: number;
  radiusMeters?: number;
  countryCodes?: string[];
}

// Local storage key for persisting last used location
const LOCATION_STORAGE_KEY = 'ct1_last_search_location';

// Default fallback location (approximate center of US)
const DEFAULT_LOCATION = { lat: 39.8283, lng: -98.5795, city: 'United States' };

interface StoredLocation {
  lat: number;
  lng: number;
  city?: string;
  timestamp: number;
}

function getStoredLocation(): StoredLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if less than 30 days old
      if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {
    console.log('Could not read stored location');
  }
  return null;
}

function storeLocation(lat: number, lng: number, city?: string): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
      lat,
      lng,
      city,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.log('Could not store location');
  }
}

export function LocationAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  showGpsButton = true,
  disabled = false,
  required = false,
  label,
  nearLat,
  nearLng,
  radiusMeters = 48280, // 30 miles default
  countryCodes = ['us'],
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Session token for billing optimization - reset on each selection
  const sessionToken = useMemo(() => crypto.randomUUID(), [hasSelected]);

  // Initialize search location from props, stored location, or geolocation
  useEffect(() => {
    // Priority: props > stored location > geolocation
    if (nearLat !== undefined && nearLng !== undefined) {
      setSearchLocation({ lat: nearLat, lng: nearLng });
      setLocationStatus('granted');
      return;
    }

    const stored = getStoredLocation();
    if (stored) {
      setSearchLocation({ lat: stored.lat, lng: stored.lng, city: stored.city });
      setLocationStatus('granted');
      console.log('Using stored location:', stored);
      return;
    }

    // Will request on first focus
    setLocationStatus('pending');
  }, [nearLat, nearLng]);

  // Request geolocation on first focus
  const requestGeolocation = useCallback(() => {
    if (hasRequestedLocation || locationStatus !== 'pending') return;
    
    setHasRequestedLocation(true);
    
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setSearchLocation(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSearchLocation(loc);
        setLocationStatus('granted');
        storeLocation(loc.lat, loc.lng);
        console.log('Got user location:', loc);
      },
      (error) => {
        console.log('Geolocation denied/unavailable:', error.message);
        setLocationStatus('denied');
        // Use stored or default
        const stored = getStoredLocation();
        setSearchLocation(stored || DEFAULT_LOCATION);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [hasRequestedLocation, locationStatus]);

  // Debounced search function - 250ms delay, starts at 2 chars
  const searchPlaces = useCallback(async (query: string) => {
    // Start at 2 characters
    if (query.length < 2) {
      setPredictions([]);
      setNoResults(false);
      setExpandedSearch(false);
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    setExpandedSearch(false);
    
    try {
      // Build URL with parameters
      const params = new URLSearchParams({
        q: query,
        sessionToken,
        radius: radiusMeters.toString(),
      });
      
      if (searchLocation) {
        params.set('lat', searchLocation.lat.toString());
        params.set('lng', searchLocation.lng.toString());
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/places-autocomplete?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      
      const result = await response.json();
      
      if (result.predictions && result.predictions.length > 0) {
        setPredictions(result.predictions);
        setShowDropdown(true);
        setNoResults(false);
        setExpandedSearch(result.expanded || false);
      } else {
        setPredictions([]);
        setShowDropdown(true);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Error fetching address predictions:', error);
      setPredictions([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, searchLocation, radiusMeters]);

  // Handle input change with 250ms debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);
    setHasSelected(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!isManualMode) {
      debounceRef.current = setTimeout(() => {
        searchPlaces(newValue);
      }, 250);
    }
  };

  // Handle input focus - request location and show dropdown
  const handleFocus = () => {
    requestGeolocation();
    if (predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Fetch place details when selecting a prediction
  const handleSelectPrediction = async (prediction: Prediction) => {
    setIsLoadingDetails(true);
    setShowDropdown(false);
    setPredictions([]);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/places-details?placeId=${encodeURIComponent(prediction.placeId)}&sessionToken=${sessionToken}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }
      
      const data: AddressData = await response.json();
      
      onChange(data.formattedAddress);
      setHasSelected(true);
      
      // Store the location for future searches
      if (data.lat && data.lng) {
        storeLocation(data.lat, data.lng, data.city);
      }
      
      if (onAddressSelect) {
        onAddressSelect(data);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fall back to using the description
      onChange(prediction.description);
      setHasSelected(true);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (predictions.length > 0) {
          setHighlightedIndex((prev) => 
            prev < predictions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (predictions.length > 0) {
          setHighlightedIndex((prev) => 
            prev > 0 ? prev - 1 : predictions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
          handleSelectPrediction(predictions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Get current GPS location and reverse geocode
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
      
      // Update search location
      setSearchLocation({ lat: latitude, lng: longitude });
      storeLocation(latitude, longitude);
      
      // Use reverse geocoding via Nominatim (free) for GPS lookup
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
        { headers: { 'Accept-Language': 'en-US,en' } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const address1 = [addr.house_number, addr.road].filter(Boolean).join(' ');
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const postalCode = addr.postcode || '';
          
          onChange(data.display_name);
          setHasSelected(true);
          
          storeLocation(latitude, longitude, city);
          
          if (onAddressSelect) {
            onAddressSelect({
              address1,
              city,
              state,
              postalCode,
              country: addr.country_code?.toUpperCase() || 'US',
              lat: latitude,
              lng: longitude,
              formattedAddress: data.display_name,
              source: 'gps',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Toggle manual mode
  const handleManualMode = () => {
    setIsManualMode(true);
    setShowDropdown(false);
    setPredictions([]);
    setHasSelected(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
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

  const showValidationError = required && !hasSelected && !isManualMode && value.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-8",
              showValidationError && "border-destructive",
              className
            )}
            disabled={disabled || isLoadingDetails}
            autoComplete="off"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            role="combobox"
          />
          {(isLoading || isLoadingDetails) && (
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
            aria-label="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Search near indicator */}
      {searchLocation && searchLocation.city && !isLoading && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Searching near {searchLocation.city}
        </p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-72 overflow-auto"
          role="listbox"
        >
          {/* Expanded search notice */}
          {expandedSearch && predictions.length > 0 && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5 border-b border-input">
              <AlertCircle className="h-3 w-3" />
              No nearby matches. Showing results from expanded area.
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="px-3 py-4 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </div>
          )}
          
          {/* Predictions list */}
          {!isLoading && predictions.length > 0 && (
            <>
              {predictions.map((prediction, index) => (
                <button
                  key={prediction.placeId}
                  type="button"
                  onClick={() => handleSelectPrediction(prediction)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    index === highlightedIndex && "bg-accent text-accent-foreground"
                  )}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{prediction.mainText}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {prediction.secondaryText}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Keyboard hint */}
              <div className="px-3 py-2 border-t border-input bg-muted/50 text-xs text-muted-foreground flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              </div>
            </>
          )}
          
          {/* No results */}
          {!isLoading && noResults && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <MapPinOff className="h-5 w-5" />
              <span>No addresses found</span>
            </div>
          )}
          
          {/* Manual entry link */}
          {!isLoading && (
            <button
              type="button"
              onClick={handleManualMode}
              className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-accent transition-colors border-t border-input"
            >
              Enter address manually
            </button>
          )}
        </div>
      )}
      
      {/* Validation message */}
      {showValidationError && (
        <p className="text-xs text-destructive mt-1">
          Please select an address from the suggestions or enter manually
        </p>
      )}
      
      {/* Manual mode indicator */}
      {isManualMode && (
        <p className="text-xs text-muted-foreground mt-1">
          Manual entry mode - 
          <button 
            type="button"
            onClick={() => setIsManualMode(false)}
            className="text-primary hover:underline ml-1"
          >
            switch to autocomplete
          </button>
        </p>
      )}
    </div>
  );
}
