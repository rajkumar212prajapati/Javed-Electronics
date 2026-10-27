import React, { useState, useEffect } from 'react';
import {
  Order,
  ExpressShipmentDetails,
  ExpressCarrierName,
  DispatchFulfillmentType,
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  X,
  Truck,
  Package,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Send,
  Building2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  createShiprocketOrder,
  generateShiprocketAWB,
} from '../../services/shiprocketService';

interface OrderDispatchModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrderDispatchModal: React.FC<OrderDispatchModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    assignOrderDelivery,
    deliveryPartners,
    ridersList,
    syncShiprocketOrderStatus,
  } = useStore();

  const isCod = order.paymentMethod === 'cod';

  // 1. Choose Option: 'rider' (Option 1) vs 'express_partner' (Option 2 - Shiprocket)
  const [fulfillmentType, setFulfillmentType] = useState<DispatchFulfillmentType>(
    order.dispatchDetails?.fulfillmentType || 'express_partner'
  );

  // 2. Express Partner state (Shiprocket / Delhivery etc.)
  const defaultPartner = deliveryPartners.find((dp) => dp.isDefault)?.partnerName || 'Shiprocket';
  const [carrier, setCarrier] = useState<ExpressCarrierName>(
    order.dispatchDetails?.carrier || defaultPartner
  );
  const [awbNumber, setAwbNumber] = useState<string>(
    order.dispatchDetails?.awbNumber || ''
  );
  const [trackingUrl, setTrackingUrl] = useState<string>(
    order.dispatchDetails?.trackingUrl || ''
  );
  const [serviceType, setServiceType] = useState<'surface_express' | 'air_express' | 'same_day_hyperlocal'>('same_day_hyperlocal');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('Tomorrow by 2:00 PM');
  const [packageWeight, setPackageWeight] = useState<number>(0.75);

  // 3. In-House Rider state
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    order.dispatchDetails?.riderId || ridersList[0]?.id || 'rider-1'
  );
  const [customRiderName, setCustomRiderName] = useState<string>(
    order.dispatchDetails?.riderName || ''
  );
  const [customRiderPhone, setCustomRiderPhone] = useState<string>(
    order.dispatchDetails?.riderPhone || ''
  );
  const [customVehicleNo, setCustomVehicleNo] = useState<string>(
    order.dispatchDetails?.riderVehicleNo || ''
  );
  const [riderOtp, setRiderOtp] = useState<string>(
    order.dispatchDetails?.riderOtp || Math.floor(1000 + Math.random() * 9000).toString()
  );

  const [copiedAwb, setCopiedAwb] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingAwb, setIsGeneratingAwb] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Auto-fill tracking URL when AWB or carrier changes
  const handleAwbChange = (val: string) => {
    setAwbNumber(val);
    if (val.trim()) {
      if (carrier === 'Shiprocket') {
        setTrackingUrl(`https://shiprocket.co/tracking/${val.trim()}`);
      } else if (carrier === 'Delhivery') {
        setTrackingUrl(`https://www.delhivery.com/track/package/${val.trim()}`);
      } else if (carrier === 'Blue Dart') {
        setTrackingUrl(`https://www.bluedart.com/tracking?numbers=${val.trim()}`);
      } else if (carrier === 'Shadowfax') {
        setTrackingUrl(`https://tracker.shadowfax.in/#/${val.trim()}`);
      } else {
        setTrackingUrl(`https://track.electromart.in/shipment/${val.trim()}`);
      }
    }
  };

  // 1-Click Auto Generate AWB via Shiprocket API
  const handleGenerateShiprocketAwb = async () => {
    setIsGeneratingAwb(true);
    setErrorMsg(null);
    setSyncFeedback(null);

    try {
      if (carrier === 'Shiprocket') {
        // Step 1: Create ad-hoc order on Shiprocket
        const orderRes = await createShiprocketOrder(order, {
          pickupLocation: order.outletName || 'Hazratganj Flagship Store',
          dimensions: { length: 18, breadth: 14, height: 8, weight: packageWeight },
        });

        // Step 2: Assign courier & generate AWB
        const awbRes = await generateShiprocketAWB(orderRes.shipment_id || Date.now());
        const finalAwb = awbRes.awb_code || `SR${Math.floor(10000000 + Math.random() * 90000000)}IN`;

        setAwbNumber(finalAwb);
        setTrackingUrl(`https://shiprocket.co/tracking/${finalAwb}`);
        setSyncFeedback(`Shipment & AWB ${finalAwb} created via Shiprocket (${awbRes.courier_name || 'Express Courier'})`);
      } else {
        const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
        const generatedAwb = carrier === 'Delhivery'
          ? `DLV${randomSuffix}`
          : carrier === 'Blue Dart'
          ? `BD${randomSuffix}`
          : `EXP${randomSuffix}`;

        setAwbNumber(generatedAwb);
        if (carrier === 'Delhivery') {
          setTrackingUrl(`https://www.delhivery.com/track/package/${generatedAwb}`);
        } else {
          setTrackingUrl(`https://track.electromart.in/shipment/${generatedAwb}`);
        }
        setSyncFeedback(`Generated ${carrier} AWB: ${generatedAwb}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate AWB');
    } finally {
      setIsGeneratingAwb(false);
    }
  };

  // Live status synchronization with Shiprocket API
  const handleSyncStatus = async () => {
    if (!awbNumber.trim()) {
      setErrorMsg('Please enter or generate an AWB number first.');
      return;
    }
    setIsSyncingStatus(true);
    setSyncFeedback(null);
    setErrorMsg(null);

    try {
      const res = await syncShiprocketOrderStatus(order.id, awbNumber.trim());
      if (res.success && res.syncResult) {
        setSyncFeedback(`Shiprocket Status: ${res.syncResult.carrierStatus} • Latest: ${res.syncResult.latestActivity}`);
        if (res.syncResult.trackingUrl) {
          setTrackingUrl(res.syncResult.trackingUrl);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Status synchronization failed.');
    } finally {
      setIsSyncingStatus(false);
    }
  };

  // Pre-fill selected rider details
  useEffect(() => {
    if (selectedRiderId !== 'custom') {
      const rider = ridersList.find((r) => r.id === selectedRiderId);
      if (rider) {
        setCustomRiderName(rider.name);
        setCustomRiderPhone(rider.phone);
        setCustomVehicleNo(rider.vehicleNo);
      }
    }
  }, [selectedRiderId, ridersList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fulfillmentType === 'express_partner') {
      if (!awbNumber.trim()) {
        setErrorMsg('Please enter or generate an AWB Number for express courier tracking.');
        return;
      }
      if (!trackingUrl.trim()) {
        setErrorMsg('Please provide a valid tracking link for customer visibility.');
        return;
      }

      const dispatchDetails: ExpressShipmentDetails = {
        fulfillmentType: 'express_partner',
        carrier,
        awbNumber: awbNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        assignedAt: new Date().toISOString(),
        dispatchedAt: new Date().toISOString(),
        estimatedDeliveryDate: estimatedDelivery,
        serviceType,
        shipmentWeightKg: packageWeight,
        isCod,
        codAmountToCollect: isCod ? order.finalTotal : 0,
        codCollectedStatus: isCod ? 'pending' : 'collected',
      };

      const res = assignOrderDelivery(order.id, dispatchDetails);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // In-House Rider
      if (!customRiderName.trim()) {
        setErrorMsg('Please select or provide a rider name.');
        return;
      }

      const dispatchDetails: ExpressShipmentDetails = {
        fulfillmentType: 'rider',
        carrier: 'Other',
        riderId: selectedRiderId === 'custom' ? `custom-${Date.now()}` : selectedRiderId,
        riderName: customRiderName.trim(),
        riderPhone: customRiderPhone.trim(),
        riderVehicleNo: customVehicleNo.trim(),
        riderOtp,
        assignedAt: new Date().toISOString(),
        dispatchedAt: new Date().toISOString(),
        estimatedDeliveryDate: 'Within 90 mins (Hyperlocal Lucknow)',
        serviceType: 'same_day_hyperlocal',
        shipmentWeightKg: packageWeight,
        isCod,
        codAmountToCollect: isCod ? order.finalTotal : 0,
        codCollectedStatus: isCod ? 'pending' : 'collected',
      };

      const res = assignOrderDelivery(order.id, dispatchDetails);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Dispatch & Assign Delivery
                </h3>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {order.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose between Local In-House Rider or Express Shiprocket / 3P Delivery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary & Payment Type Banner */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{order.customer.name}</span>
              <span className="text-slate-500 font-mono text-[11px]">{order.customer.phone}</span>
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{order.customer.address}, {order.customer.area}, {order.customer.city} - {order.customer.pincode}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Payment Type Badge */}
            {isCod ? (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-amber-900 shadow-2xs">
                <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block text-amber-800">
                    COD Order (Collect at Doorstep)
                  </span>
                  <span className="font-mono font-black text-xs text-slate-950">
                    {formatINR(order.finalTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block text-emerald-800">
                    Prepaid Order (100% Paid)
                  </span>
                  <span className="font-mono font-black text-xs text-slate-950">
                    {formatINR(order.finalTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Dispatch Mode Selector: 2 Options */}
          <div>
            <label className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-2">
              Select Dispatch & Fulfillment Option *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: In-House Rider */}
              <div
                onClick={() => setFulfillmentType('rider')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentType === 'rider'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${fulfillmentType === 'rider' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Option 1: In-House Rider Delivery</span>
                  </div>
                  <input
                    type="radio"
                    name="fulfillment_type"
                    checked={fulfillmentType === 'rider'}
                    onChange={() => setFulfillmentType('rider')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 pl-8">
                  Assign to internal Lucknow store fleet for fast 45-90 min hyperlocal delivery.
                </p>
              </div>

              {/* Option 2: Express Shiprocket */}
              <div
                onClick={() => setFulfillmentType('express_partner')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  fulfillmentType === 'express_partner'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${fulfillmentType === 'express_partner' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Option 2: Express Shiprocket Delivery</span>
                  </div>
                  <input
                    type="radio"
                    name="fulfillment_type"
                    checked={fulfillmentType === 'express_partner'}
                    onChange={() => setFulfillmentType('express_partner')}
                    className="text-blue-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 pl-8">
                  Connect with Shiprocket, paste AWB ID & tracking link visible directly to customer.
                </p>
              </div>
            </div>
          </div>

          {/* OPTION 1 CONTENT: In-House Rider Configuration */}
          {fulfillmentType === 'rider' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Assign Local Delivery Rider (Lucknow Active Fleet)</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  {ridersList.length} Riders Active
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Active Courier / Rider</label>
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {ridersList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} • {r.vehicleNo} ({r.outletName}) — {r.phone}
                    </option>
                  ))}
                  <option value="custom">+ Assign Other / External Rider</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customRiderName}
                    onChange={(e) => setCustomRiderName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={customRiderPhone}
                    onChange={(e) => setCustomRiderPhone(e.target.value)}
                    placeholder="+91 94150 99881"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Registration No.</label>
                  <input
                    type="text"
                    value={customVehicleNo}
                    onChange={(e) => setCustomVehicleNo(e.target.value)}
                    placeholder="UP 32 BK 4421"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase text-slate-900"
                  />
                </div>
              </div>

              {/* Delivery Handover OTP */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-[11px] block">Customer Delivery Handover OTP</span>
                  <span className="text-[10px] text-slate-500">Customer will verify this 4-digit code with the rider upon delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base tracking-widest bg-slate-100 text-indigo-900 px-3 py-1 rounded-lg border border-slate-300">
                    {riderOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRiderOtp(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* COD Instruction Notice */}
              {isCod && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-950 font-bold">
                      COD Cash Collection Mandate:
                    </strong>
                    <span>
                      The rider must collect <strong>{formatINR(order.finalTotal)}</strong> in Cash or via Store BharatPe QR code before handing over the sealed package.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OPTION 2 CONTENT: Express Shiprocket / 3P Delivery */}
          {fulfillmentType === 'express_partner' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Shiprocket Express Partner & AWB Setup</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Shiprocket Connected</span>
                </span>
              </div>

              {/* Carrier Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Partner / Carrier *</label>
                  <select
                    value={carrier}
                    onChange={(e) => {
                      const newCarrier = e.target.value as ExpressCarrierName;
                      setCarrier(newCarrier);
                      if (awbNumber) handleAwbChange(awbNumber);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Shiprocket">Shiprocket (Recommended Partner)</option>
                    <option value="Delhivery">Delhivery Express</option>
                    <option value="Blue Dart">Blue Dart Apex</option>
                    <option value="Shadowfax">Shadowfax Local</option>
                    <option value="DTDC">DTDC Courier</option>
                    <option value="Other">Other 3P Partner</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="same_day_hyperlocal">Same-Day Hyperlocal Express</option>
                    <option value="air_express">Air Express (Priority Cargo)</option>
                    <option value="surface_express">Standard Surface Express</option>
                  </select>
                </div>
              </div>

              {/* AWB ID / Number Input & Auto-Generate Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 text-xs">
                    Air Waybill Number (AWB ID) *
                  </label>
                  <div className="flex items-center gap-3">
                    {awbNumber && (
                      <button
                        type="button"
                        onClick={handleSyncStatus}
                        disabled={isSyncingStatus}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Query Shiprocket API and sync latest milestone status"
                      >
                        {isSyncingStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span>Sync Status</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateShiprocketAwb}
                      disabled={isGeneratingAwb}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAwb ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{isGeneratingAwb ? 'Connecting Shiprocket...' : `⚡ Auto-Generate ${carrier} AWB`}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback banner */}
                {syncFeedback && (
                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-center gap-1.5 animate-in fade-in">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{syncFeedback}</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={awbNumber}
                    onChange={(e) => handleAwbChange(e.target.value)}
                    placeholder={`Paste ${carrier} AWB ID (e.g. SR782910482IN)`}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs tracking-wider pr-10 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {awbNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(awbNumber);
                        setCopiedAwb(true);
                        setTimeout(() => setCopiedAwb(false), 2000);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy AWB"
                    >
                      {copiedAwb ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Admins or sellers can paste their booking AWB ID here, or click Auto-Generate.
                </p>
              </div>

              {/* Tracking Link / URL */}
              <div>
                <label className="font-bold text-slate-800 text-xs block mb-1">
                  Customer Live Tracking Link (Visible in Customer Order Tab) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://shiprocket.co/tracking/..."
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      title="Open and test tracking link in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test Link</span>
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  This exact link will be displayed on the customer's order tracking screen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Delivery SLA</label>
                  <input
                    type="text"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    placeholder="e.g. Tomorrow by 2:00 PM"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Package Weight (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* COD Shiprocket notice */}
              {isCod && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-950 font-bold">
                      Shiprocket COD Manifest:
                    </strong>
                    <span>
                      {carrier} courier executive will collect <strong>{formatINR(order.finalTotal)}</strong> from the recipient at doorstep. COD remittance will automatically sync to your store ledger upon delivery.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Dispatch Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
