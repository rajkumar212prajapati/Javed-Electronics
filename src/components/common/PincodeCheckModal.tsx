import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const PincodeCheckModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    checkPincodeServiceable,
    getDeliveryZoneForPincode,
    deliveryZones,
    settings,
    outlets,
    activeOutlet,
    activeOutletId,
    setActiveOutletId,
  } = useStore();
  const [pinInput, setPinInput] = useState('');
  const [result, setResult] = useState<'serviceable' | 'unserviceable' | null>(null);
  const [matchedZone, setMatchedZone] = useState<any>(null);

  if (activeModal !== 'pincode_check') return null;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const isOk = checkPincodeServiceable(pinInput);
    const zone = getDeliveryZoneForPincode(pinInput);
    setMatchedZone(zone || null);
    setResult(isOk ? 'serviceable' : 'unserviceable');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={() => {
            setActiveModal(null);
            setResult(null);
            setPinInput('');
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Check Delivery PIN Code</h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Enter your 6-digit Indian PIN code to check if our 4-hour express courier delivers to your address in Lucknow.
        </p>

        <form onSubmit={handleCheck} className="flex gap-2">
          <input
            type="text"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.replace(/\D/g, ''));
              setResult(null);
            }}
            placeholder="e.g. 226001"
            maxLength={6}
            className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Check
          </button>
        </form>

        {result === 'serviceable' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>PIN Code {pinInput} is Serviceable for Express Delivery!</span>
            </div>

            {matchedZone ? (
              <div className="space-y-1 text-emerald-900 text-[11px]">
                <div className="bg-emerald-100/60 p-2 rounded-lg">
                  <div className="font-semibold text-emerald-950">
                    Covered Localities: {matchedZone.areaName}
                  </div>
                  <div className="text-emerald-800 text-[10px] mt-0.5">
                    Dispatched from: <strong>{matchedZone.outletName || 'Nearest Store'}</strong> • Speed: <strong>{matchedZone.estimatedHours || 3} Hours Express</strong>
                  </div>
                </div>
                <p className="text-emerald-700">
                  Cutoff: Orders before {matchedZone.cutoffTime || '5:00 PM'} delivered today. Free delivery above ₹{matchedZone.freeDeliveryThreshold ?? settings.freeDeliveryThreshold}.
                </p>
              </div>
            ) : (
              <p className="text-emerald-700 text-[11px]">
                Same-day local delivery available! Orders placed before 5:00 PM are delivered today. Free delivery above ₹{settings.freeDeliveryThreshold}.
              </p>
            )}
          </div>
        )}

        {result === 'unserviceable' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Courier Delivery Currently Unavailable in {pinInput}</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              You can still place an order and choose <strong>Free Store Pickup</strong> at our Hazratganj shop ({settings.address}).
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700 block mb-1">Common Serviceable PINs:</span>
          <div className="flex flex-wrap gap-1 font-mono mb-4">
            {settings.serviceablePincodes.slice(0, 7).map((p) => (
              <span
                key={p}
                onClick={() => {
                  setPinInput(p);
                  setResult('serviceable');
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded cursor-pointer transition-colors"
              >
                {p}
              </span>
            ))}
          </div>

          {/* Outlets Directory & Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-800 block mb-1.5 flex items-center justify-between">
              <span>Select Preferred Branch ({outlets.length} Outlets):</span>
              <span className="text-[10px] text-blue-600 font-mono">Current: {activeOutlet?.name.split(' ')[0]}</span>
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {outlets.map((o) => (
                <div
                  key={o.id}
                  onClick={() => {
                    setActiveOutletId(o.id);
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    activeOutletId === o.id
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{o.name}</div>
                    <div className="text-[10px] text-slate-500">{o.city} • PIN: {o.pincode} • {o.operatingHours.open} - {o.operatingHours.close}</div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono">
                    {o.ownershipModel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
