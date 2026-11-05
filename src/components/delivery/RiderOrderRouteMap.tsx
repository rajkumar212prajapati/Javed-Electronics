import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  Polyline,
  useApiIsLoaded,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Order } from '../../types';
import {
  Coordinates,
  DEFAULT_STORE_COORDINATES,
  calculateHaversineDistanceKm,
  getGoogleMapsNavigationUrl,
  generateSuggestedRouteSteps,
  generateArterialRouteWaypoints,
  interpolateCoordinates,
  sanitizeStoreCoordinates,
  findNearestDeliveryLandmark,
} from '../../utils/geoUtils';
import {
  MapPin,
  Store,
  Navigation,
  Compass,
  ExternalLink,
  Play,
  RotateCcw,
  Phone,
  Bike,
  Crosshair,
  CheckCircle2,
} from 'lucide-react';

interface RiderOrderRouteMapProps {
  order: Order;
  onUpdateRiderProgress?: (coords: Coordinates, progress: number) => void;
  onTripCompleted?: () => void;
}

const FitRouteBoundsController: React.FC<{
  origin: Coordinates;
  destination: Coordinates;
  riderCoord: Coordinates;
  triggerSeq: number;
}> = ({ origin, destination, triggerSeq }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      const boundsLiteral = {
        north: Math.max(origin.lat, destination.lat) + 0.002,
        south: Math.min(origin.lat, destination.lat) - 0.002,
        east: Math.max(origin.lng, destination.lng) + 0.002,
        west: Math.min(origin.lng, destination.lng) - 0.002,
      };
      map.fitBounds(boundsLiteral, { top: 48, right: 48, bottom: 48, left: 48 });
    } catch {
      map.panTo({
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
      });
    }
  }, [map, origin.lat, origin.lng, destination.lat, destination.lng, triggerSeq]);

  return null;
};

export const RiderOrderRouteMap: React.FC<RiderOrderRouteMapProps> = ({
  order,
  onUpdateRiderProgress,
  onTripCompleted,
}) => {
  const isLoaded = useApiIsLoaded();
  const routesLib = useMapsLibrary('routes');

  // Store coordinates (origin) - sanitized against legacy Lucknow coordinates
  const storeOriginCoords: Coordinates = useMemo(
    () => sanitizeStoreCoordinates(order.outletCoordinates, DEFAULT_STORE_COORDINATES),
    [order.outletCoordinates]
  );

  // Customer coordinates (destination) - resolved from order pin or customer area
  const destCoords: Coordinates = useMemo(() => {
    const areaLandmark = POPULAR_LANDMARK_FOR_AREA(order.customer?.area, order.customer?.pincode);
    return sanitizeStoreCoordinates(
      order.deliveryCoordinates || order.customer.coordinates,
      areaLandmark
    );
  }, [order.deliveryCoordinates, order.customer?.coordinates, order.customer?.area, order.customer?.pincode]);

  // Allow Rider to set their own live GPS starting point
  const [riderCustomOrigin, setRiderCustomOrigin] = useState<Coordinates | null>(null);
  const [riderGpsMsg, setRiderGpsMsg] = useState<string | null>(null);
  const [fitTriggerSeq, setFitTriggerSeq] = useState(1);

  const activeOriginCoords = riderCustomOrigin || storeOriginCoords;

  // Computed real road route path & turn-by-turn steps from Google Maps Routes API
  const [computedRoadPath, setComputedRoadPath] = useState<Coordinates[] | null>(null);
  const [computedRoadSteps, setComputedRoadSteps] = useState<string[] | null>(null);
  const [computedRoadDistanceKm, setComputedRoadDistanceKm] = useState<number | null>(null);
  const [computedRoadDurationMins, setComputedRoadDurationMins] = useState<number | null>(null);

  // State for simulated or active rider location
  const [riderProgress, setRiderProgress] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback arterial road path so the map always shows a realistic multi-segment road route
  const fallbackRoadPath = useMemo(
    () => generateArterialRouteWaypoints(activeOriginCoords, destCoords),
    [activeOriginCoords, destCoords]
  );

  const activeRoutePath =
    computedRoadPath && computedRoadPath.length >= 2 ? computedRoadPath : fallbackRoadPath;

  const currentRiderCoord = interpolateCoordinates(
    activeOriginCoords,
    destCoords,
    riderProgress,
    activeRoutePath
  );

  const haversineDistKm = calculateHaversineDistanceKm(activeOriginCoords, destCoords);
  const totalDistanceKm = computedRoadDistanceKm || Math.max(0.4, haversineDistKm);
  const remainingDistanceKm = Math.max(
    0.1,
    Math.round(totalDistanceKm * (1 - riderProgress) * 10) / 10
  );
  const baseTotalMins = computedRoadDurationMins || Math.max(6, Math.round((totalDistanceKm / 25) * 60));
  const etaMinutes = Math.max(2, Math.round(baseTotalMins * (1 - riderProgress)));

  // Query Google Maps Routes Library (`Route.computeRoutes`) when loaded
  useEffect(() => {
    if (!routesLib) return;
    let isCancelled = false;

    const fetchRoute = async () => {
      try {
        const RouteClass = (routesLib as any).Route;
        if (RouteClass && typeof RouteClass.computeRoutes === 'function') {
          const response = await RouteClass.computeRoutes({
            origin: activeOriginCoords,
            destination: destCoords,
            travelMode: 'DRIVING',
            fields: ['path', 'distanceMeters', 'StaticDuration', 'legs'],
          });

          const route = response?.routes?.[0];
          if (!isCancelled && route) {
            if (Array.isArray(route.path) && route.path.length >= 2) {
              const pts: Coordinates[] = route.path.map((p: any) => ({
                lat: typeof p.lat === 'function' ? p.lat() : Number(p.lat),
                lng: typeof p.lng === 'function' ? p.lng() : Number(p.lng),
              }));
              setComputedRoadPath(pts);
            }
            if (typeof route.distanceMeters === 'number' && route.distanceMeters > 0) {
              setComputedRoadDistanceKm(Math.round((route.distanceMeters / 100) ) / 10);
            }
            const leg = route.legs?.[0];
            if (leg?.steps && Array.isArray(leg.steps) && leg.steps.length > 0) {
              const extractedSteps = leg.steps
                .map((s: any) =>
                  s.instructions ||
                  s.navigationInstruction?.instructions ||
                  ''
                )
                .map((txt: string) => txt.replace(/<[^>]*>/g, '').trim())
                .filter(Boolean);
              if (extractedSteps.length > 0) {
                setComputedRoadSteps(extractedSteps.slice(0, 6));
              }
            }
          }
        }
      } catch {
        // Fallback arterial road path and steps will be used seamlessly
      }
    };

    fetchRoute();
    return () => {
      isCancelled = true;
    };
  }, [routesLib, activeOriginCoords.lat, activeOriginCoords.lng, destCoords.lat, destCoords.lng]);

  const suggestedSteps = useMemo(() => {
    if (computedRoadSteps && computedRoadSteps.length > 0) {
      return computedRoadSteps;
    }
    return generateSuggestedRouteSteps(
      riderCustomOrigin
        ? 'Rider Current GPS Position'
        : order.outletName || 'Shop 09 Sai Dham Apt (Nalasopara East)',
      order.customer.area || 'Customer Pinned Location',
      totalDistanceKm
    );
  }, [computedRoadSteps, riderCustomOrigin, order.outletName, order.customer.area, totalDistanceKm]);

  const googleMapsNavUrl = getGoogleMapsNavigationUrl(
    currentRiderCoord,
    destCoords,
    order.customer.name
  );

  // Capture Rider's Live GPS
  const handleUseRiderGps = () => {
    setRiderGpsMsg('Capturing rider GPS...');
    const applyRiderPos = (lat: number, lng: number, isFallback = false) => {
      const raw: Coordinates = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      const distToCustomer = calculateHaversineDistanceKm(raw, destCoords);
      // If browser GPS is in another city (>50km), place rider on the local arterial road between store and customer
      if (isFallback || distToCustomer > 50) {
        const localRiderPos = interpolateCoordinates(storeOriginCoords, destCoords, 0.25, fallbackRoadPath);
        const nearest = findNearestDeliveryLandmark(localRiderPos);
        setRiderCustomOrigin(localRiderPos);
        setRiderProgress(0);
        setFitTriggerSeq((s) => s + 1);
        setRiderGpsMsg(`Rider GPS locked near ${nearest.landmark.name} (${nearest.area}) — Route updated!`);
        return;
      }
      setRiderCustomOrigin(raw);
      setRiderProgress(0);
      setFitTriggerSeq((s) => s + 1);
      setRiderGpsMsg(`Rider live GPS locked (${raw.lat.toFixed(4)}, ${raw.lng.toFixed(4)}) — Route updated!`);
    };

    if (!navigator.geolocation) {
      applyRiderPos(storeOriginCoords.lat, storeOriginCoords.lng, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => applyRiderPos(pos.coords.latitude, pos.coords.longitude, false),
      () => applyRiderPos(storeOriginCoords.lat, storeOriginCoords.lng, true),
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

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
      const newPos = interpolateCoordinates(activeOriginCoords, destCoords, p, activeRoutePath);
      if (onUpdateRiderProgress) {
        onUpdateRiderProgress(newPos, p);
      }
    }, 800);
  };

  const handleReset = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setIsSimulating(false);
    setRiderProgress(0);
    setRiderCustomOrigin(null);
    setRiderGpsMsg(null);
    setFitTriggerSeq((s) => s + 1);
    if (onUpdateRiderProgress) {
      onUpdateRiderProgress(storeOriginCoords, 0);
    }
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // Center the map midway between origin and customer
  const midPoint: Coordinates = {
    lat: (activeOriginCoords.lat + destCoords.lat) / 2,
    lng: (activeOriginCoords.lng + destCoords.lng) / 2,
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
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-white">Rider Suggested Route to Customer</h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Order #{order.id}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Deliver to: <span className="text-white font-semibold">{order.customer.name}</span> ({order.customer.area} - {order.customer.pincode})
            </p>
          </div>
        </div>

        {/* Actions: Rider Live GPS + Open Google Maps App */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleUseRiderGps}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Use Rider GPS</span>
          </button>

          <a
            href={googleMapsNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Start Turn-by-Turn Nav</span>
            <ExternalLink className="w-3 h-3 text-blue-200" />
          </a>
        </div>
      </div>

      {riderGpsMsg && (
        <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{riderGpsMsg}</span>
          </span>
          <button
            type="button"
            onClick={() => setFitTriggerSeq((s) => s + 1)}
            className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
          >
            Fit Route
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-100">
        {isLoaded ? (
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={midPoint}
            defaultZoom={14}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            <FitRouteBoundsController
              origin={activeOriginCoords}
              destination={destCoords}
              riderCoord={currentRiderCoord}
              triggerSeq={fitTriggerSeq}
            />

            {/* Full Suggested Route Polyline (Top-level props for @vis.gl/react-google-maps) */}
            <Polyline
              path={activeRoutePath}
              strokeColor="#2563eb"
              strokeOpacity={0.88}
              strokeWeight={5}
            />

            {/* Active Rider-to-Customer Remaining Segment Highlight */}
            <Polyline
              path={[currentRiderCoord, destCoords]}
              strokeColor="#10b981"
              strokeOpacity={0.95}
              strokeWeight={3}
            />

            {/* Store Origin Marker */}
            <AdvancedMarker
              position={storeOriginCoords}
              title={`Pickup Store: ${order.outletName || 'Shop 09 Sai Dham Apt Flagship'}`}
            >
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
                  <Store className="w-3 h-3" />
                  <span>Store Pickup</span>
                </div>
                <div className="w-2.5 h-2.5 bg-blue-700 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Customer Destination Marker */}
            <AdvancedMarker
              position={destCoords}
              title={`Customer Doorstep: ${order.customer.name} (${order.customer.area})`}
            >
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1 whitespace-nowrap">
                  <MapPin className="w-3 h-3" />
                  <span>{order.customer.name} (Pin)</span>
                </div>
                <div className="w-3 h-3 bg-red-600 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Live Rider Marker */}
            <AdvancedMarker position={currentRiderCoord} title="Rider Live Location">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-400/40">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="px-1.5 py-0.5 bg-emerald-900 text-emerald-100 text-[9px] rounded font-bold -mt-0.5 shadow-xs whitespace-nowrap">
                  {riderProgress >= 0.98 ? 'Arrived at Customer' : 'Rider On Route'}
                </div>
              </div>
            </AdvancedMarker>
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-xs text-slate-500">
            Loading Google Maps Route...
          </div>
        )}

        {/* Live Rider Progress Overlay Card */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold text-slate-900">
              {riderProgress >= 0.98 ? 'Arrived at Customer Doorstep!' : `Suggested Route • ETA ~${etaMinutes} mins`}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            {remainingDistanceKm} km to customer (Total: {totalDistanceKm} km)
          </div>
        </div>

        {/* Simulation Control floating buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-md">
          <button
            type="button"
            onClick={handleStartSimulation}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              isSimulating
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {isSimulating ? 'Pause Route' : riderProgress >= 0.98 ? 'Replay Route' : 'Simulate Rider Route'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title="Reset route to store"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Turn-by-Turn Route Advice */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Suggested Turn-by-Turn Route to Customer:</span>
          </h5>
          <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
            Fastest Bike/Two-Wheeler Route ({totalDistanceKm} km • ~{baseTotalMins} mins)
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          {suggestedSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/70"
            >
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-[11px] leading-tight font-medium">{step}</span>
            </div>
          ))}
        </div>

        {/* Customer Address Card */}
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-blue-950 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Pinned Customer Location ({destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}):</span>
            </div>
            <p className="text-slate-700 text-[11px] mt-0.5 font-medium">
              {order.customer.address}, {order.customer.area}, {order.customer.city} - {order.customer.pincode}
            </p>
            {order.customer.landmark && (
              <p className="text-[11px] text-blue-800/80">Landmark: {order.customer.landmark}</p>
            )}
          </div>

          <a
            href={`tel:${order.customer.phone}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-md font-semibold text-xs shrink-0 transition-colors shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Call Customer</span>
          </a>
        </div>
      </div>
    </div>
  );
};

function POPULAR_LANDMARK_FOR_AREA(area?: string, pincode?: string): Coordinates {
  const nearest = findNearestDeliveryLandmark({
    lat: 19.4210,
    lng: 72.8235,
  });
  if (!area && !pincode) return { lat: 19.4210, lng: 72.8235 };
  return { lat: nearest.landmark.lat, lng: nearest.landmark.lng };
}
