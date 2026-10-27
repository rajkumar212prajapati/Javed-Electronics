import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, Polyline, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { Order } from '../../types';
import {
  Coordinates,
  DEFAULT_STORE_COORDINATES,
  calculateHaversineDistanceKm,
  estimateDeliveryMinutes,
  getGoogleMapsNavigationUrl,
  generateSuggestedRouteSteps,
  interpolateCoordinates,
} from '../../utils/geoUtils';
import {
  MapPin,
  Store,
  Navigation,
  Compass,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  Bike,
} from 'lucide-react';

interface RiderOrderRouteMapProps {
  order: Order;
  onUpdateRiderProgress?: (coords: Coordinates, progress: number) => void;
  onTripCompleted?: () => void;
}

export const RiderOrderRouteMap: React.FC<RiderOrderRouteMapProps> = ({
  order,
  onUpdateRiderProgress,
  onTripCompleted,
}) => {
  const isLoaded = useApiIsLoaded();

  // Store coordinates (origin)
  const originCoords: Coordinates =
    order.outletCoordinates || DEFAULT_STORE_COORDINATES;

  // Customer coordinates (destination)
  const destCoords: Coordinates =
    order.deliveryCoordinates ||
    order.customer.coordinates || {
      lat: 26.8524,
      lng: 80.9984, // Gomti nagar fallback
    };

  // State for simulated or active rider location
  const [riderProgress, setRiderProgress] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  const currentRiderCoord = interpolateCoordinates(originCoords, destCoords, riderProgress);

  const totalDistanceKm = calculateHaversineDistanceKm(originCoords, destCoords);
  const remainingDistanceKm = Math.max(
    0.1,
    Math.round((totalDistanceKm * (1 - riderProgress)) * 10) / 10
  );
  const etaMinutes = Math.max(
    2,
    Math.round((remainingDistanceKm / 25) * 60)
  );

  const suggestedSteps = generateSuggestedRouteSteps(
    order.outletName || 'Hazratganj Flagship Outlet',
    order.customer.area || 'Customer Address',
    totalDistanceKm
  );

  const googleMapsNavUrl = getGoogleMapsNavigationUrl(
    currentRiderCoord,
    destCoords,
    order.customer.name
  );

  // Simulation handler
  const handleStartSimulation = () => {
    if (isSimulating) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    let p = riderProgress >= 0.98 ? 0 : riderProgress;

    simulationRef.current = setInterval(() => {
      p += 0.05;
      if (p >= 1) {
        p = 1;
        setRiderProgress(1);
        setIsSimulating(false);
        if (simulationRef.current) clearInterval(simulationRef.current);
        if (onTripCompleted) onTripCompleted();
        return;
      }
      setRiderProgress(p);
      const newPos = interpolateCoordinates(originCoords, destCoords, p);
      if (onUpdateRiderProgress) {
        onUpdateRiderProgress(newPos, p);
      }
    }, 800);
  };

  const handleReset = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setIsSimulating(false);
    setRiderProgress(0);
    const originPos = interpolateCoordinates(originCoords, destCoords, 0);
    if (onUpdateRiderProgress) {
      onUpdateRiderProgress(originPos, 0);
    }
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // Center the map midway between store and customer
  const midPoint: Coordinates = {
    lat: (originCoords.lat + destCoords.lat) / 2,
    lng: (originCoords.lng + destCoords.lng) / 2,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header with Navigation and Order Summary */}
      <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">Rider Suggested Route</h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Order #{order.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deliver to: <span className="text-white font-medium">{order.customer.name}</span> ({order.customer.area})
            </p>
          </div>
        </div>

        {/* Action: Open Google Maps App */}
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Open in Google Maps
          <ExternalLink className="w-3 h-3 text-blue-200" />
        </a>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-100">
        {isLoaded ? (
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={midPoint}
            defaultZoom={13}
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Store Origin Marker */}
            <AdvancedMarker position={originCoords} title={`Pickup: ${order.outletName || 'Store Outlet'}`}>
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Store Hub
                </div>
                <div className="w-2.5 h-2.5 bg-blue-700 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Customer Destination Marker */}
            <AdvancedMarker position={destCoords} title={`Delivery: ${order.customer.name}`}>
              <div className="flex flex-col items-center animate-bounce-short">
                <div className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Customer
                </div>
                <div className="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Live Rider Marker */}
            <AdvancedMarker position={currentRiderCoord} title="Rider Location">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-400/40">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="px-1.5 py-0.2 bg-emerald-800 text-emerald-100 text-[9px] rounded font-bold -mt-0.5 shadow-xs">
                  {riderProgress >= 0.98 ? 'Arrived' : 'On Route'}
                </div>
              </div>
            </AdvancedMarker>

            {/* Route Polyline connecting Origin to Destination */}
            <Polyline
              path={[originCoords, currentRiderCoord, destCoords]}
              options={{
                strokeColor: '#2563eb',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-xs text-slate-500">
            Loading Google Maps...
          </div>
        )}

        {/* Live Rider Progress Overlay Card */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold text-slate-900">
              {riderProgress >= 0.98 ? 'Arrived at Doorstep!' : `ETA ~${etaMinutes} mins`}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            {remainingDistanceKm} km remaining (Total: {totalDistanceKm} km)
          </div>
        </div>

        {/* Simulation Control floating buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-md">
          <button
            type="button"
            onClick={handleStartSimulation}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-colors ${
              isSimulating
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {isSimulating ? 'Pause Route' : riderProgress >= 0.98 ? 'Replay Route' : 'Simulate Route'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="Reset to store"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Turn-by-Turn Route Advice */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            Suggested Turn-by-Turn Route:
          </h5>
          <span className="text-[11px] text-slate-500 font-medium">
            Via Lucknow City Arterial Network
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          {suggestedSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/70">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-[11px] leading-tight">{step}</span>
            </div>
          ))}
        </div>

        {/* Customer Address Card */}
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-blue-950 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Delivery Address:
            </div>
            <p className="text-slate-700 text-[11px] mt-0.5">
              {order.customer.address}, {order.customer.area}, {order.customer.city} - {order.customer.pincode}
            </p>
            {order.customer.landmark && (
              <p className="text-[11px] text-blue-800/80">
                Landmark: {order.customer.landmark}
              </p>
            )}
          </div>

          <a
            href={`tel:${order.customer.phone}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-md font-semibold text-xs shrink-0 transition-colors shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            Call Customer
          </a>
        </div>
      </div>
    </div>
  );
};
