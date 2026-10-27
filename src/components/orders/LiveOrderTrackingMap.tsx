import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, Polyline, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { Order } from '../../types';
import {
  Coordinates,
  DEFAULT_STORE_COORDINATES,
  calculateHaversineDistanceKm,
  interpolateCoordinates,
} from '../../utils/geoUtils';
import {
  Bike,
  MapPin,
  Store,
  Clock,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Package,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';

interface LiveOrderTrackingMapProps {
  order: Order;
  onCallRider?: () => void;
  onWhatsAppHelp?: () => void;
}

export const LiveOrderTrackingMap: React.FC<LiveOrderTrackingMapProps> = ({
  order,
  onCallRider,
  onWhatsAppHelp,
}) => {
  const isLoaded = useApiIsLoaded();

  // Origin (Store) and Destination (Customer)
  const storeCoords: Coordinates =
    order.outletCoordinates || DEFAULT_STORE_COORDINATES;

  const destCoords: Coordinates =
    order.deliveryCoordinates ||
    order.customer.coordinates || {
      lat: 26.8524,
      lng: 80.9984,
    };

  // State of Rider progress (0 to 1)
  const [riderProgress, setRiderProgress] = useState<number>(() => {
    if (order.orderStatus === 'delivered') return 1;
    if (order.orderStatus === 'out_for_delivery') return 0.45;
    if (order.orderStatus === 'assigned_to_delivery') return 0.15;
    return 0.05;
  });

  const [isLiveAnimating, setIsLiveAnimating] = useState(false);
  const animRef = useRef<NodeJS.Timeout | null>(null);

  // Total distance
  const totalDist = calculateHaversineDistanceKm(storeCoords, destCoords);
  const remainingDist = Math.max(
    0.1,
    Math.round(totalDist * (1 - riderProgress) * 10) / 10
  );
  const remainingMins = Math.max(
    2,
    Math.round((remainingDist / 25) * 60)
  );

  const currentRiderPos = interpolateCoordinates(storeCoords, destCoords, riderProgress);

  // Auto-play simulation if order is out_for_delivery
  useEffect(() => {
    if (order.orderStatus === 'out_for_delivery' && riderProgress < 0.95) {
      animRef.current = setInterval(() => {
        setRiderProgress((prev) => {
          if (prev >= 0.95) {
            if (animRef.current) clearInterval(animRef.current);
            return 0.95;
          }
          return prev + 0.02;
        });
      }, 1500);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [order.orderStatus]);

  const toggleSimulation = () => {
    if (isLiveAnimating) {
      if (animRef.current) clearInterval(animRef.current);
      setIsLiveAnimating(false);
    } else {
      setIsLiveAnimating(true);
      let p = riderProgress >= 0.98 ? 0 : riderProgress;
      animRef.current = setInterval(() => {
        p += 0.04;
        if (p >= 1) {
          p = 1;
          setRiderProgress(1);
          setIsLiveAnimating(false);
          if (animRef.current) clearInterval(animRef.current);
          return;
        }
        setRiderProgress(p);
      }, 1000);
    }
  };

  const midPoint: Coordinates = {
    lat: (storeCoords.lat + destCoords.lat) / 2,
    lng: (storeCoords.lng + destCoords.lng) / 2,
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-sm flex flex-col">
      {/* Live ETA Header bar */}
      <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Bike className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Live Delivery Tracking</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-blue-200">
              {riderProgress >= 0.98
                ? 'Rider has reached your delivery doorstep!'
                : `Rider is on the way • Estimated Arrival in ~${remainingMins} mins`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSimulation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            {isLiveAnimating ? 'Pause Simulation' : 'Live Movement Demo'}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-64 sm:h-80 bg-slate-100">
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
            {/* Store Hub Marker */}
            <AdvancedMarker position={storeCoords} title="Store Outlet (Origin)">
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Store Outlet
                </div>
                <div className="w-2.5 h-2.5 bg-blue-700 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Pinned Delivery Location Marker */}
            <AdvancedMarker position={destCoords} title="Your Delivery Address">
              <div className="flex flex-col items-center animate-bounce-short">
                <div className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold shadow-md border border-white flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Delivery Pin
                </div>
                <div className="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1 border-r border-b border-white"></div>
              </div>
            </AdvancedMarker>

            {/* Moving Rider Pin */}
            <AdvancedMarker position={currentRiderPos} title="Delivery Rider Location">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-emerald-500/30">
                  <Bike className="w-5 h-5 animate-pulse" />
                </div>
                <div className="px-2 py-0.5 bg-emerald-900 text-emerald-100 text-[9px] rounded-full font-bold shadow-xs -mt-1 border border-emerald-500/40">
                  {riderProgress >= 0.98 ? 'Arrived!' : 'Live Rider'}
                </div>
              </div>
            </AdvancedMarker>

            {/* Polyline Path */}
            <Polyline
              path={[storeCoords, currentRiderPos, destCoords]}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.85,
                strokeWeight: 4,
              }}
            />
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Loading Live Map...
          </div>
        )}

        {/* Live Distance Floating Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>ETA: ~{remainingMins} mins</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {remainingDist} km from doorstep
          </div>
        </div>
      </div>

      {/* Live Status Progress Steps */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Confirmed', done: true },
            { label: 'Packed', done: riderProgress >= 0.1 },
            { label: 'On Route', done: riderProgress >= 0.25 },
            { label: 'Delivered', done: riderProgress >= 0.98 },
          ].map((st, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  st.done
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {st.done ? '✓' : i + 1}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium ${
                  st.done ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rider & Support contact card */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
              {order.deliveryStaffName ? order.deliveryStaffName[0] : 'R'}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                Rider: {order.deliveryStaffName || 'Ramesh Kumar (In-House Express)'}
              </div>
              <div className="text-[11px] text-slate-500">
                Hero Splendor (UP 32 BK 4421) • Contact Verified
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+919415099881"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Call Rider
            </a>

            <button
              type="button"
              onClick={onWhatsAppHelp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
              Store Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
