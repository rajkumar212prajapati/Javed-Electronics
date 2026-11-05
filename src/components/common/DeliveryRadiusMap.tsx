import React, { useState, useEffect, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  Circle,
  useApiIsLoaded,
  useMap,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { useStore } from '../../context/StoreContext';
import { Outlet } from '../../types';
import {
  Coordinates,
  DEFAULT_STORE_COORDINATES,
  sanitizeStoreCoordinates,
} from '../../utils/geoUtils';
import {
  Store,
  Compass,
  CheckCircle2,
  Sliders,
  Info,
  Save,
  Navigation,
  Building2,
} from 'lucide-react';

interface DeliveryRadiusMapProps {
  selectedOutlet?: Outlet;
  onRadiusChange?: (radiusKm: number) => void;
  compact?: boolean;
}

const RadiusMapCameraController: React.FC<{
  target: { center: Coordinates; zoom?: number; seq: number } | null;
}> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target.center);
    if (target.zoom) {
      map.setZoom(target.zoom);
    }
  }, [map, target]);

  return null;
};

export const DeliveryRadiusMap: React.FC<DeliveryRadiusMapProps> = ({
  selectedOutlet,
  onRadiusChange,
  compact = false,
}) => {
  const { outlets, updateOutlet, activeOutlet, setActiveOutletId, currentRole } = useStore();
  const isLoaded = useApiIsLoaded();
  const isSuperAdmin = currentRole === 'super_admin';

  const [internalOutletId, setInternalOutletId] = useState<string>(
    selectedOutlet?.id || activeOutlet?.id || outlets[0]?.id || 'out_hazratganj'
  );

  useEffect(() => {
    if (selectedOutlet?.id) {
      setInternalOutletId(selectedOutlet.id);
    }
  }, [selectedOutlet?.id]);

  const currentOutlet =
    outlets.find((o) => o.id === internalOutletId) ||
    selectedOutlet ||
    activeOutlet ||
    outlets[0];

  const initialCoords = sanitizeStoreCoordinates(
    currentOutlet?.coordinates,
    DEFAULT_STORE_COORDINATES
  );
  const initialRadius =
    currentOutlet?.deliveryRadiusKm && currentOutlet.deliveryRadiusKm >= 1
      ? currentOutlet.deliveryRadiusKm
      : 15;

  const [radiusKm, setRadiusKm] = useState<number>(initialRadius);
  const [storeCoords, setStoreCoords] = useState<Coordinates>(initialCoords);
  const [isSaved, setIsSaved] = useState(false);
  const [savedNoticeText, setSavedNoticeText] = useState<string>('');
  const [cameraTarget, setCameraTarget] = useState<{
    center: Coordinates;
    zoom?: number;
    seq: number;
  } | null>(null);

  // Zoom calculation based on radius
  const getZoomForRadius = (r: number) => {
    if (r <= 3) return 14;
    if (r <= 6) return 13;
    if (r <= 14) return 12;
    if (r <= 24) return 11;
    return 10;
  };

  useEffect(() => {
    if (currentOutlet) {
      const r =
        currentOutlet.deliveryRadiusKm && currentOutlet.deliveryRadiusKm >= 1
          ? currentOutlet.deliveryRadiusKm
          : 15;
      const c = sanitizeStoreCoordinates(
        currentOutlet.coordinates,
        DEFAULT_STORE_COORDINATES
      );
      setRadiusKm(r);
      setStoreCoords(c);
      setCameraTarget((prev) => ({
        center: c,
        zoom: getZoomForRadius(r),
        seq: (prev?.seq || 0) + 1,
      }));
    }
  }, [currentOutlet?.id]);

  // Persist changes immediately to StoreContext so radius updates are never lost
  const persistToStore = useCallback(
    (newRadiusKm: number, newCoords: Coordinates, applyToAll = false) => {
      const clampedRadius = Math.max(1, Math.min(50, Math.round(newRadiusKm * 10) / 10));
      if (applyToAll) {
        outlets.forEach((o) => {
          updateOutlet({
            ...o,
            deliveryRadiusKm: clampedRadius,
          });
        });
        setSavedNoticeText(`Applied ${clampedRadius} km delivery radius to all ${outlets.length} outlets!`);
      } else if (currentOutlet) {
        updateOutlet({
          ...currentOutlet,
          deliveryRadiusKm: clampedRadius,
          coordinates: newCoords,
        });
        setSavedNoticeText(`Saved ${clampedRadius} km delivery radius for ${currentOutlet.name}`);
      }
      setIsSaved(true);
      if (onRadiusChange) {
        onRadiusChange(clampedRadius);
      }
    },
    [currentOutlet, outlets, updateOutlet, onRadiusChange]
  );

  const handleRadiusUpdate = (newVal: number, shouldZoom = false) => {
    if (Number.isNaN(newVal)) return;
    const clamped = Math.max(1, Math.min(50, Math.round(newVal * 10) / 10));
    setRadiusKm(clamped);
    persistToStore(clamped, storeCoords, false);
    if (shouldZoom) {
      setCameraTarget((prev) => ({
        center: storeCoords,
        zoom: getZoomForRadius(clamped),
        seq: (prev?.seq || 0) + 1,
      }));
    }
  };

  const handleSave = () => {
    persistToStore(radiusKm, storeCoords, false);
  };

  const handleApplyToAllOutlets = () => {
    persistToStore(radiusKm, storeCoords, true);
  };

  // Allow clicking on map or dragging store pin to update store hub coordinates
  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const newCoords: Coordinates = {
      lat: Number(e.detail.latLng.lat.toFixed(6)),
      lng: Number(e.detail.latLng.lng.toFixed(6)),
    };
    setStoreCoords(newCoords);
    persistToStore(radiusKm, newCoords, false);
  };

  const handleStoreMarkerDragEnd = (e: { latLng?: { lat: () => number; lng: () => number } | null }) => {
    if (!e.latLng) return;
    const newCoords: Coordinates = {
      lat: Number(e.latLng.lat().toFixed(6)),
      lng: Number(e.latLng.lng().toFixed(6)),
    };
    setStoreCoords(newCoords);
    persistToStore(radiusKm, newCoords, false);
  };

  const handleUseStoreGps = () => {
    if (!navigator.geolocation) {
      setStoreCoords(DEFAULT_STORE_COORDINATES);
      persistToStore(radiusKm, DEFAULT_STORE_COORDINATES, false);
      setCameraTarget((prev) => ({
        center: DEFAULT_STORE_COORDINATES,
        zoom: getZoomForRadius(radiusKm),
        seq: (prev?.seq || 0) + 1,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setStoreCoords(coords);
        persistToStore(radiusKm, coords, false);
        setCameraTarget((prev) => ({
          center: coords,
          zoom: getZoomForRadius(radiusKm),
          seq: (prev?.seq || 0) + 1,
        }));
      },
      () => {
        setStoreCoords(DEFAULT_STORE_COORDINATES);
        persistToStore(radiusKm, DEFAULT_STORE_COORDINATES, false);
        setCameraTarget((prev) => ({
          center: DEFAULT_STORE_COORDINATES,
          zoom: getZoomForRadius(radiusKm),
          seq: (prev?.seq || 0) + 1,
        }));
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  const areaCoverageSqKm = Math.round(Math.PI * radiusKm * radiusKm);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Header bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2 flex-wrap">
              <span>Store Delivery Radius & Geospatial Zone</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-mono font-bold">
                {radiusKm} km Radius
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Active Store:{' '}
              <span className="font-semibold text-slate-800">{currentOutlet?.name}</span> (
              {currentOutlet?.city})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Outlet selector for Super Admin */}
          {isSuperAdmin && outlets.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={currentOutlet?.id || ''}
                onChange={(e) => {
                  setInternalOutletId(e.target.value);
                  setActiveOutletId(e.target.value);
                }}
                className="font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.deliveryRadiusKm} km)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleUseStoreGps}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
            title="Set store hub to GPS or Nalasopara Flagship coordinates"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Center Store GPS</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Radius ({radiusKm} km)</span>
          </button>

          {isSuperAdmin && outlets.length > 1 && (
            <button
              type="button"
              onClick={handleApplyToAllOutlets}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply to All Stores</span>
            </button>
          )}
        </div>
      </div>

      {/* Instant Auto-Save Confirmation Banner */}
      {isSaved && savedNoticeText && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNoticeText}</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-700">Live on Checkout Map</span>
        </div>
      )}

      {/* Map Canvas */}
      <div className={`relative w-full ${compact ? 'h-64' : 'h-80 sm:h-96'} bg-slate-100`}>
        {isLoaded ? (
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={storeCoords}
            defaultZoom={getZoomForRadius(radiusKm)}
            onClick={handleMapClick}
            clickableIcons={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            <RadiusMapCameraController target={cameraTarget} />

            {/* Delivery Radius Circle Overlay (Top-level props for @vis.gl/react-google-maps) */}
            <Circle
              center={storeCoords}
              radius={radiusKm * 1000}
              fillColor="#3b82f6"
              fillOpacity={0.2}
              strokeColor="#2563eb"
              strokeOpacity={0.9}
              strokeWeight={2.5}
              editable={true}
              onRadiusChanged={(newRadiusMeters) => {
                if (typeof newRadiusMeters === 'number' && newRadiusMeters > 0) {
                  const newKm = Math.max(1, Math.min(50, Math.round((newRadiusMeters / 1000) * 2) / 2));
                  if (Math.abs(newKm - radiusKm) >= 0.5) {
                    setRadiusKm(newKm);
                    persistToStore(newKm, storeCoords, false);
                  }
                }
              }}
            />

            {/* Center Outlet Advanced Marker (Draggable to reposition store center) */}
            <AdvancedMarker
              position={storeCoords}
              draggable={true}
              onDragEnd={handleStoreMarkerDragEnd}
              title={`Store Hub: ${currentOutlet?.name} (Drag or click map to move store center)`}
            >
              <div className="flex flex-col items-center group cursor-grab active:cursor-grabbing">
                <div className="bg-blue-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 border-2 border-white ring-2 ring-blue-500/20 whitespace-nowrap">
                  <Store className="w-3.5 h-3.5" />
                  <span>{currentOutlet?.name?.slice(0, 22) || 'Store Hub'} ({radiusKm} km)</span>
                </div>
                <div className="w-3 h-3 bg-blue-700 transform rotate-45 -mt-1.5 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>
          </Map>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Loading Google Maps Platform...</p>
          </div>
        )}

        {/* Floating Metrics Badge on Map */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 shadow-md text-xs space-y-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">
              Coverage Area: ~{areaCoverageSqKm} km² ({radiusKm} km radius)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Store Pin: {storeCoords.lat.toFixed(4)}, {storeCoords.lng.toFixed(4)} (Tap map or drag circle edge)
          </div>
        </div>
      </div>

      {/* Control panel & presets */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-4">
        {/* Slider + Direct Numeric Input */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Set Store Delivery Radius (1 km – 50 km):</span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRadiusUpdate(radiusKm - 1, true)}
                className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <div className="flex items-center bg-blue-50 border border-blue-300 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  value={radiusKm}
                  onChange={(e) => handleRadiusUpdate(parseFloat(e.target.value), false)}
                  className="w-14 text-center text-sm font-bold text-blue-800 font-mono bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-blue-700 ml-0.5">km</span>
              </div>
              <button
                type="button"
                onClick={() => handleRadiusUpdate(radiusKm + 1, true)}
                className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={radiusKm}
            onChange={(e) => handleRadiusUpdate(parseFloat(e.target.value), true)}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>1 km (Hyperlocal)</span>
            <span>15 km (Nalasopara-Vasai-Virar)</span>
            <span>30 km (Extended Palghar)</span>
            <span>50 km (Full MMR)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1">Quick Radius Presets:</span>
          {[
            { label: '3 km (Hyperlocal 20-min)', value: 3 },
            { label: '5 km (Nalasopara Town)', value: 5 },
            { label: '10 km (Nalasopara + Vasai)', value: 10 },
            { label: '15 km (Vasai-Virar Standard)', value: 15 },
            { label: '25 km (Palghar & Mira Road)', value: 25 },
            { label: '40 km (Greater Mumbai MMR)', value: 40 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleRadiusUpdate(preset.value, true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors font-semibold cursor-pointer ${
                radiusKm === preset.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Informative Guidance */}
        {!compact && (
          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">How Delivery Radius Enforcement Works:</p>
              <p className="text-blue-800/90 text-[11px]">
                Changes made via the slider, number input, preset buttons, or dragging the blue circle edge on the map are saved automatically for <strong>{currentOutlet?.name}</strong> and immediately reflected on the Customer Checkout Map.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
