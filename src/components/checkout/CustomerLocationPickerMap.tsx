import React, { useState, useEffect, useCallback } from 'react';
import { Map, AdvancedMarker, useApiIsLoaded, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useStore } from '../../context/StoreContext';
import {
  Coordinates,
  DEFAULT_STORE_COORDINATES,
  LUCKNOW_POPULAR_LANDMARKS,
  calculateHaversineDistanceKm,
  estimateDeliveryMinutes,
} from '../../utils/geoUtils';
import {
  MapPin,
  Search,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Home,
  Briefcase,
  Bookmark,
  Check,
  Compass,
} from 'lucide-react';

interface CustomerLocationPickerMapProps {
  initialCoordinates?: Coordinates;
  onLocationChange: (
    coords: Coordinates,
    meta?: {
      area?: string;
      addressLine?: string;
      pincode?: string;
      landmark?: string;
      distanceKm: number;
      estimatedMinutes: number;
    }
  ) => void;
  onSaveAddressRequest?: (tag: 'Home' | 'Work' | 'Other', coords: Coordinates) => void;
}

export const CustomerLocationPickerMap: React.FC<CustomerLocationPickerMapProps> = ({
  initialCoordinates,
  onLocationChange,
  onSaveAddressRequest,
}) => {
  const { activeOutlet, outlets, currentUser } = useStore();
  const isLoaded = useApiIsLoaded();

  const storeOutlet = activeOutlet || outlets[0];
  const outletCoords: Coordinates = storeOutlet?.coordinates || DEFAULT_STORE_COORDINATES;
  const storeRadiusKm = storeOutlet?.deliveryRadiusKm || 12;

  // Selected Pin coordinates
  const [selectedPin, setSelectedPin] = useState<Coordinates>(() => {
    return initialCoordinates || {
      lat: 26.8482,
      lng: 80.9412, // Near Hazratganj
    };
  });

  const [mapCenter, setMapCenter] = useState<Coordinates>(selectedPin);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof LUCKNOW_POPULAR_LANDMARKS>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Address saving options
  const [shouldSaveForNextOrder, setShouldSaveForNextOrder] = useState(true);
  const [selectedTag, setSelectedTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Calculate distance & ETA
  const distanceKm = calculateHaversineDistanceKm(outletCoords, selectedPin);
  const isWithinRadius = distanceKm <= storeRadiusKm;
  const eta = estimateDeliveryMinutes(distanceKm);

  // Notify parent on changes
  const notifyChange = useCallback(
    (coords: Coordinates, meta?: { area?: string; addressLine?: string; pincode?: string; landmark?: string }) => {
      const dist = calculateHaversineDistanceKm(outletCoords, coords);
      const estEta = estimateDeliveryMinutes(dist);
      onLocationChange(coords, {
        area: meta?.area,
        addressLine: meta?.addressLine,
        pincode: meta?.pincode,
        landmark: meta?.landmark,
        distanceKm: dist,
        estimatedMinutes: estEta.min,
      });
    },
    [outletCoords, onLocationChange]
  );

  // Initial trigger
  useEffect(() => {
    notifyChange(selectedPin);
  }, []);

  // Filter landmarks by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = LUCKNOW_POPULAR_LANDMARKS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.pincode.includes(q)
    );
    setSearchResults(matches);
  }, [searchQuery]);

  // Handle map click to drop/move pin
  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const newCoords: Coordinates = {
      lat: e.detail.latLng.lat,
      lng: e.detail.latLng.lng,
    };
    setSelectedPin(newCoords);
    notifyChange(newCoords);
  };

  // Select landmark from search
  const handleSelectLandmark = (item: (typeof LUCKNOW_POPULAR_LANDMARKS)[0]) => {
    const coords: Coordinates = { lat: item.lat, lng: item.lng };
    setSelectedPin(coords);
    setMapCenter(coords);
    setSearchQuery(item.name);
    setShowSearchResults(false);
    notifyChange(coords, {
      area: item.area,
      addressLine: item.name,
      pincode: item.pincode,
      landmark: item.name,
    });
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setSelectedPin(coords);
        setMapCenter(coords);
        setIsLocatingUser(false);
        notifyChange(coords, {
          area: 'GPS Located Area',
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocatingUser(false);
        // Fallback default
        alert('Could not retrieve precise GPS. You can drag or click the pin on the map directly.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Quick switch from saved customer addresses
  const handleSelectSavedAddress = (addr: (typeof currentUser.savedAddresses)[0]) => {
    const coords = addr.coordinates || {
      lat: 26.8482 + (Math.random() - 0.5) * 0.01,
      lng: 80.9412 + (Math.random() - 0.5) * 0.01,
    };
    setSelectedPin(coords);
    setMapCenter(coords);
    notifyChange(coords, {
      area: addr.area,
      addressLine: addr.addressLine,
      pincode: addr.pincode,
      landmark: addr.landmark,
    });
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-xs space-y-3">
      {/* Top Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Pin Delivery Location on Map</h4>
            <p className="text-[11px] text-slate-500">
              Click anywhere or search to pin your doorstep for rider navigation
            </p>
          </div>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocatingUser}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs"
        >
          <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocatingUser ? 'animate-spin' : ''}`} />
          {isLocatingUser ? 'Locating...' : 'Use My GPS'}
        </button>
      </div>

      <div className="px-3 space-y-2.5">
        {/* Search bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search colony, market, landmark or pincode..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Autocomplete dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelectLandmark(item)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-start gap-2 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.area}, Lucknow - {item.pincode}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Saved addresses shortcut chips */}
        {currentUser?.savedAddresses && currentUser.savedAddresses.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Saved:</span>
            {currentUser.savedAddresses.map((addr, idx) => (
              <button
                key={addr.id || idx}
                type="button"
                onClick={() => handleSelectSavedAddress(addr)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200 shrink-0"
              >
                {addr.tag === 'Work' ? <Briefcase className="w-3 h-3 text-slate-500" /> : <Home className="w-3 h-3 text-slate-500" />}
                <span>{addr.tag || (idx === 0 ? 'Home' : 'Office')}</span>
                <span className="text-slate-400 text-[10px]">({addr.area || addr.city})</span>
              </button>
            ))}
          </div>
        )}

        {/* Map Canvas */}
        <div className="relative w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
          {isLoaded ? (
            <Map
              mapId="DEMO_MAP_ID"
              center={mapCenter}
              defaultCenter={selectedPin}
              defaultZoom={13}
              zoom={13}
              onClick={handleMapClick}
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Store Outlet Pin */}
              <AdvancedMarker position={outletCoords} title={`Store Outlet: ${storeOutlet.name}`}>
                <div className="p-1.5 bg-blue-700 text-white rounded-full shadow-md border-2 border-white ring-1 ring-blue-500/30 flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
              </AdvancedMarker>

              {/* Customer Delivery Pin (Draggable / Clickable) */}
              <AdvancedMarker position={selectedPin} title="Your Delivery Address">
                <div className="flex flex-col items-center cursor-pointer animate-bounce-short">
                  <div className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold shadow-md border border-white">
                    Deliver Here
                  </div>
                  <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white -mt-0.5">
                    <MapPin className="w-4 h-4 fill-white text-red-600" />
                  </div>
                </div>
              </AdvancedMarker>
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-xs text-slate-500">
              Loading Map...
            </div>
          )}

          {/* Floating Instructions Banner */}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] text-slate-600 border border-slate-200/80 shadow-xs pointer-events-none">
            💡 Click anywhere on map to reposition your delivery pin
          </div>
        </div>

        {/* Radius Check & Delivery ETA Status Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Serviceable status */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2 ${
              isWithinRadius
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isWithinRadius ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-xs">
                {isWithinRadius
                  ? `Within Delivery Radius (${distanceKm} km from store)`
                  : `Outside Standard ${storeRadiusKm} km Zone (${distanceKm} km)`}
              </div>
              <div className="text-[11px] text-slate-600">
                {isWithinRadius
                  ? 'Eligible for instant rider assignment & express dispatch'
                  : 'Courier delivery option will be selected'}
              </div>
            </div>
          </div>

          {/* Delivery ETA preview */}
          <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/80 text-blue-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-xs flex items-center gap-1.5">
                Estimated Delivery:
                <span className="font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                  {eta.label}
                </span>
              </div>
              <div className="text-[11px] text-blue-800/80">
                Live rider tracking available after checkout
              </div>
            </div>
          </div>
        </div>

        {/* Save Address Checkbox for next order */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shouldSaveForNextOrder}
              onChange={(e) => {
                setShouldSaveForNextOrder(e.target.checked);
                if (e.target.checked && onSaveAddressRequest) {
                  onSaveAddressRequest(selectedTag, selectedPin);
                }
              }}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              Save this pinned location for my next orders
            </span>
          </label>

          {shouldSaveForNextOrder && (
            <div className="flex items-center gap-2 pl-6">
              <span className="text-[11px] text-slate-500">Save as:</span>
              {(['Home', 'Work', 'Other'] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(tag);
                    if (onSaveAddressRequest) {
                      onSaveAddressRequest(tag, selectedPin);
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
