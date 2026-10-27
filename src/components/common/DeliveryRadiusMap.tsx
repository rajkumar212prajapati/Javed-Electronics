import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, Circle, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { useStore } from '../../context/StoreContext';
import { Outlet } from '../../types';
import { DEFAULT_STORE_COORDINATES } from '../../utils/geoUtils';
import {
  MapPin,
  Store,
  Compass,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';

interface DeliveryRadiusMapProps {
  selectedOutlet?: Outlet;
  onRadiusChange?: (radiusKm: number) => void;
  compact?: boolean;
}

export const DeliveryRadiusMap: React.FC<DeliveryRadiusMapProps> = ({
  selectedOutlet,
  onRadiusChange,
  compact = false,
}) => {
  const { outlets, updateOutlet, activeOutlet } = useStore();
  const isLoaded = useApiIsLoaded();

  const currentOutlet = selectedOutlet || activeOutlet || outlets[0];
  const outletCoords = currentOutlet?.coordinates || DEFAULT_STORE_COORDINATES;

  const [radiusKm, setRadiusKm] = useState<number>(currentOutlet?.deliveryRadiusKm || 12);
  const [isSaved, setIsSaved] = useState(false);
  const [mapCenter, setMapCenter] = useState(outletCoords);

  useEffect(() => {
    if (currentOutlet) {
      setRadiusKm(currentOutlet.deliveryRadiusKm || 12);
      if (currentOutlet.coordinates) {
        setMapCenter(currentOutlet.coordinates);
      }
    }
  }, [currentOutlet?.id]);

  const handleSliderChange = (newVal: number) => {
    setRadiusKm(newVal);
    setIsSaved(false);
    if (onRadiusChange) {
      onRadiusChange(newVal);
    }
  };

  const handleSave = () => {
    if (!currentOutlet) return;
    const updated: Outlet = {
      ...currentOutlet,
      deliveryRadiusKm: radiusKm,
    };
    updateOutlet(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Zoom calculation based on radius
  const getZoomForRadius = (r: number) => {
    if (r <= 3) return 14;
    if (r <= 6) return 13;
    if (r <= 12) return 12;
    if (r <= 20) return 11;
    return 10;
  };

  const areaCoverageSqKm = Math.round(Math.PI * radiusKm * radiusKm);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Header bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                Store Delivery Radius & Geospatial Zone
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-mono font-medium">
                  {radiusKm} km Radius
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Outlet: <span className="font-medium text-slate-800">{currentOutlet?.name}</span> ({currentOutlet?.city})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shadow-sm ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Radius Updated!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Store Radius
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-100">
        {isLoaded ? (
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={outletCoords}
            center={mapCenter}
            defaultZoom={getZoomForRadius(radiusKm)}
            zoom={getZoomForRadius(radiusKm)}
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Center Outlet Advanced Marker */}
            <AdvancedMarker position={outletCoords} title={currentOutlet?.name}>
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="bg-blue-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 border-2 border-white ring-2 ring-blue-500/20">
                  <Store className="w-3.5 h-3.5" />
                  <span>{currentOutlet?.name?.slice(0, 18) || 'Store Hub'}</span>
                </div>
                <div className="w-3 h-3 bg-blue-700 transform rotate-45 -mt-1.5 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Delivery Radius Circle Overlay */}
            <Circle
              center={outletCoords}
              radius={radiusKm * 1000}
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.18,
                strokeColor: '#2563eb',
                strokeOpacity: 0.85,
                strokeWeight: 2,
              }}
            />
          </Map>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Loading Google Maps Platform...</p>
          </div>
        )}

        {/* Floating Metrics Badge on Map */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200/80 shadow-md text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">Coverage: ~{areaCoverageSqKm} km²</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Center: {outletCoords.lat.toFixed(4)}, {outletCoords.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Control panel & presets */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-4">
        {/* Slider & Quick presets */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              Adjust Delivery Radius Threshold:
            </label>
            <span className="text-sm font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {radiusKm} km
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={30}
            step={0.5}
            value={radiusKm}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>1 km (Immediate Colony)</span>
            <span>10 km (Urban Core)</span>
            <span>20 km (NCR / Outskirts)</span>
            <span>30 km (Max Radius)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1">Quick Presets:</span>
          {[
            { label: '3 km (Hyperlocal 20-min)', value: 3 },
            { label: '5 km (Express City)', value: 5 },
            { label: '10 km (Standard Hub)', value: 10 },
            { label: '15 km (Wide Coverage)', value: 15 },
            { label: '20 km (Greater Lucknow)', value: 20 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleSliderChange(preset.value)}
              className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                radiusKm === preset.value
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Informative Guidance */}
        <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium">How Delivery Radius Enforcement Works:</p>
            <p className="text-blue-800/90 text-[11px]">
              When customers pin or search their delivery address at checkout, the platform calculates real-time driving
              distance to this outlet. Orders outside this {radiusKm} km radius will alert the customer or require confirmation for extended courier dispatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
