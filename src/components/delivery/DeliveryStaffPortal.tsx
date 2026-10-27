import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Order, RiderRemittanceSubmission } from '../../types';
import { generateQrDataUrl } from '../../utils/qrcode';
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  Banknote,
  KeyRound,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Building2,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Receipt,
  User,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RiderOrderRouteMap } from './RiderOrderRouteMap';

const generateEightDigitCode = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const formatEightDigitCode = (code: string): string => {
  const digits = code.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  return code;
};

export const DeliveryStaffPortal: React.FC = () => {
  const {
    orders,
    outlets,
    ridersList,
    riderRemittances,
    submitRiderCashRemittance,
    updateOrderStatus,
    completeDelivery,
    reportDeliveryFailure,
    settings,
  } = useStore();

  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    ridersList[0]?.id || 'rider-1'
  );

  const activeRider = useMemo(() => {
    return ridersList.find((r) => r.id === selectedRiderId) || ridersList[0] || {
      id: 'rider-1',
      name: 'Ramesh Kumar',
      phone: '+91 94150 99881',
      vehicleNo: 'UP 32 BK 4421 (Hero Splendor)',
      outletId: 'out_hazratganj',
      outletName: 'Hazratganj Flagship Outlet',
      status: 'available' as const,
      activeDeliveriesCount: 1,
      codCashInHand: 1599,
    };
  }, [ridersList, selectedRiderId]);

  const [activeTab, setActiveTab] = useState<'pending' | 'cash_deposit' | 'completed'>('pending');
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [receiverName, setReceiverName] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [failureOrder, setFailureOrder] = useState<Order | null>(null);
  const [failReason, setFailReason] = useState<string>('');
  const [expandedMapOrderId, setExpandedMapOrderId] = useState<string | null>(null);

  // Cash Deposit & 8-Digit Code Generator States
  const [depositAmount, setDepositAmount] = useState<string>(
    activeRider.codCashInHand > 0 ? String(activeRider.codCashInHand) : '1500'
  );
  const [eightDigitCode, setEightDigitCode] = useState<string>(() => generateEightDigitCode());
  const [depositMethod, setDepositMethod] = useState<'cash_deposit' | 'upi_qr'>('cash_deposit');
  const [targetOutletId, setTargetOutletId] = useState<string>(
    activeRider.outletId || outlets[0]?.id || 'out_hazratganj'
  );
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [latestCreatedRemittance, setLatestCreatedRemittance] =
    useState<RiderRemittanceSubmission | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeRider.codCashInHand > 0) {
      setDepositAmount(String(activeRider.codCashInHand));
    }
    if (activeRider.outletId) {
      setTargetOutletId(activeRider.outletId);
    }
  }, [activeRider.id, activeRider.codCashInHand, activeRider.outletId]);

  // Generate QR code for latest created remittance or preview
  useEffect(() => {
    const codeToEncode = latestCreatedRemittance?.remittanceCode || eightDigitCode;
    const amt = latestCreatedRemittance?.amount || Number(depositAmount) || 0;
    const payload = `upi://pay?pa=${encodeURIComponent(
      settings.upiId || 'javed.electronics@icici'
    )}&pn=${encodeURIComponent(
      settings.upiName || 'Javed Electronics'
    )}&am=${amt}&tr=REMIT-${codeToEncode}&tn=${encodeURIComponent(
      `Rider 8-Digit Code ${codeToEncode} (${activeRider.name})`
    )}&cu=INR`;

    generateQrDataUrl(payload, { width: 200 }).then((url) => {
      setQrCodeUrl(url);
    });
  }, [
    latestCreatedRemittance,
    eightDigitCode,
    depositAmount,
    activeRider.name,
    settings.upiId,
    settings.upiName,
  ]);

  // Assigned deliveries
  const myAssignedOrders = orders.filter(
    (o) =>
      o.assignedDeliveryStaffId ||
      o.orderStatus === 'assigned_to_delivery' ||
      o.orderStatus === 'out_for_delivery' ||
      o.deliveryStaffName
  );

  const pendingDeliveries = myAssignedOrders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  );

  const completedDeliveries = myAssignedOrders.filter(
    (o) => o.orderStatus === 'delivered'
  );

  // Rider's cash deposit codes (pending & approved)
  const myRemittances = useMemo(() => {
    return riderRemittances.filter((r) => r.riderId === activeRider.id);
  }, [riderRemittances, activeRider.id]);

  const myPendingRemittances = useMemo(() => {
    return myRemittances.filter((r) => r.status === 'pending_approval');
  }, [myRemittances]);

  const myApprovedTotal = useMemo(() => {
    return myRemittances
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [myRemittances]);

  const handleCopyCode = (code: string, idKey: string) => {
    navigator.clipboard.writeText(code.replace(/\s+/g, ''));
    setCopiedCodeId(idKey);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateDepositCode = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(depositAmount);
    if (!numericAmount || numericAmount <= 0) {
      setToastMessage('Please enter a valid cash deposit amount greater than ₹0.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const cleanCode = eightDigitCode.replace(/\D/g, '');
    const finalEightDigitCode =
      cleanCode.length === 8 ? cleanCode : generateEightDigitCode();

    const deliveredCodOrderIds = completedDeliveries
      .filter((o) => o.paymentMethod === 'cod' || o.dispatchDetails?.isCod)
      .map((o) => o.id);

    const res = submitRiderCashRemittance({
      riderId: activeRider.id,
      amount: numericAmount,
      submissionMethod: depositMethod,
      outletId: targetOutletId,
      orderIds: deliveredCodOrderIds,
      qrDataUrl: qrCodeUrl,
      customCode: finalEightDigitCode,
      notes:
        depositNotes.trim() ||
        `Rider ${activeRider.name} created 8-digit cash deposit code for ${formatINR(numericAmount)}`,
    });

    if (res.success && res.remittance) {
      setLatestCreatedRemittance(res.remittance);
      setEightDigitCode(generateEightDigitCode());
      setDepositNotes('');
      setToastMessage(
        `8-Digit Code ${formatEightDigitCode(res.remittance.remittanceCode)} created for ${formatINR(
          res.remittance.amount
        )}! Store or Admin can now enter this code to approve.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleStartDelivery = (order: Order) => {
    updateOrderStatus(
      order.id,
      'out_for_delivery',
      `Rider ${activeRider.name} picked up package and is out for local delivery`,
      `${activeRider.name} (Rider)`
    );
  };

  const handleOpenCompleteModal = (order: Order) => {
    setDeliveringOrder(order);
    setCollectedAmount(order.paymentMethod === 'cod' ? order.finalTotal : 0);
    setReceiverName(order.customer.name);
    setDeliveryNote('Delivered in person with genuine warranty card and invoice');
  };

  const handleConfirmDelivered = () => {
    if (!deliveringOrder) return;

    completeDelivery(deliveringOrder.id, {
      collectedAmount: Number(collectedAmount),
      receiverName: receiverName || deliveringOrder.customer.name,
      note: deliveryNote || 'Delivered successfully',
    });

    setDeliveringOrder(null);
  };

  const handleConfirmFailed = () => {
    if (!failureOrder || !failReason.trim()) return;

    reportDeliveryFailure(failureOrder.id, failReason);
    setFailureOrder(null);
    setFailReason('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 no-print space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lightweight Premium Rider Header */}
      <div className="bg-linear-to-br from-slate-50 via-white to-indigo-50/40 p-5 rounded-2xl shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                  LUCKNOW FLEET RIDER PORTAL
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  ● On Duty
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-base font-black text-slate-900">{activeRider.name}</h2>
                <span className="text-xs text-slate-500 font-mono">({activeRider.phone})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Switch Rider Profile for Testing */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeRider.id}
                onChange={(e) => {
                  setSelectedRiderId(e.target.value);
                  setLatestCreatedRemittance(null);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                title="Switch Active Rider Profile"
              >
                {ridersList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({formatINR(r.codCashInHand)})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('cash_deposit')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Create 8-Digit Cash Deposit Code</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
            <span className="text-amber-800 font-bold block text-[10px] uppercase tracking-wider">
              COD Cash in Hand
            </span>
            <span className="text-lg font-black font-mono text-amber-950 mt-0.5 block">
              {formatINR(activeRider.codCashInHand || 0)}
            </span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 p-3 rounded-xl">
            <span className="text-indigo-800 font-bold block text-[10px] uppercase tracking-wider">
              Active 8-Digit Codes
            </span>
            <span className="text-lg font-black font-mono text-indigo-950 mt-0.5 block">
              {myPendingRemittances.length} Pending
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl">
            <span className="text-emerald-800 font-bold block text-[10px] uppercase tracking-wider">
              Cash Approved
            </span>
            <span className="text-lg font-black font-mono text-emerald-950 mt-0.5 block">
              {formatINR(myApprovedTotal)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <span className="text-slate-600 font-bold block text-[10px] uppercase tracking-wider">
              Deliveries (Pend / Done)
            </span>
            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
              {pendingDeliveries.length} / {completedDeliveries.length}
            </span>
          </div>
        </div>
      </div>

      {/* Category-Style Segmented Rider Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Active Deliveries ({pendingDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cash_deposit')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'cash_deposit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-indigo-700 bg-white/60'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Cash Deposit (8-Digit Code)</span>
          {myPendingRemittances.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'cash_deposit'
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {myPendingRemittances.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({completedDeliveries.length})</span>
        </button>
      </div>

      {/* TAB 2: RIDER CASH DEPOSIT & 8-DIGIT CODE GENERATOR */}
      {activeTab === 'cash_deposit' && (
        <div className="space-y-5">
          {/* Generator Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Generate 8-Digit Cash Deposit Code
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter any specific cash amount to generate a secure 8-digit deposit code for Store or Admin approval
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg self-start sm:self-center">
                Cash in Hand: {formatINR(activeRider.codCashInHand)}
              </span>
            </div>

            <form onSubmit={handleCreateDepositCode} className="space-y-4 text-xs">
              {/* Specific Amount Input + Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Enter Specific Cash Amount to Deposit (₹) *
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeRider.codCashInHand > 0 && (
                      <button
                        type="button"
                        onClick={() => setDepositAmount(String(activeRider.codCashInHand))}
                        className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] cursor-pointer"
                      >
                        Full Cash ({formatINR(activeRider.codCashInHand)})
                      </button>
                    )}
                    {[500, 1000, 2000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDepositAmount(String(preset))}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded font-mono font-bold text-[10px] border border-slate-200 cursor-pointer"
                      >
                        ₹{preset.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter specific amount (e.g. 1599)"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 8-Digit Code Preview & Customizer */}
              <div className="p-4 rounded-xl bg-linear-to-r from-indigo-50/80 via-white to-blue-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                    8-Digit Deposit Verification Code (Preview)
                  </span>
                  <div className="font-mono text-2xl font-black text-indigo-950 tracking-widest mt-0.5">
                    {formatEightDigitCode(eightDigitCode)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    This 8-digit code will be linked to{' '}
                    <strong className="text-slate-900">
                      {formatINR(Number(depositAmount) || 0)}
                    </strong>{' '}
                    for Store / Admin verification.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setEightDigitCode(generateEightDigitCode())}
                  className="px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New 8-Digit Code</span>
                </button>
              </div>

              {/* Target Store Outlet & Handover Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Receiving Store / Admin Branch *
                  </label>
                  <select
                    value={targetOutletId}
                    onChange={(e) => setTargetOutletId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Cash Deposit Method *
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as 'cash_deposit' | 'upi_qr')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="cash_deposit">Physical Cash Handover at Store Counter</option>
                    <option value="upi_qr">Rider UPI Transfer / QR Deposit</option>
                  </select>
                </div>
              </div>

              {/* Optional Handover Notes */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Deposit Note / Currency Breakdown (Optional)
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g. 3 x ₹500 notes + ₹99 change handed at counter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>
                  Create 8-Digit Code ({formatEightDigitCode(eightDigitCode)}) for{' '}
                  {formatINR(Number(depositAmount) || 0)}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Newly Generated 8-Digit Code Voucher Highlight */}
          {latestCreatedRemittance && (
            <div className="bg-linear-to-br from-emerald-50/90 via-white to-indigo-50/60 rounded-2xl border-2 border-emerald-400 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <Sparkles className="w-3 h-3" /> Ready for Store / Admin Approval
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    Share this 8-Digit Code at Store Counter or Admin Portal
                  </h4>
                  <p className="text-xs text-slate-600">
                    Store Manager or Super Admin can enter this 8-digit code to verify and approve{' '}
                    <strong className="text-slate-900">
                      {formatINR(latestCreatedRemittance.amount)}
                    </strong>
                    .
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border-2 border-indigo-300 shadow-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      8-Digit Deposit Code
                    </span>
                    <span className="font-mono text-2xl font-black text-indigo-700 tracking-widest">
                      {formatEightDigitCode(latestCreatedRemittance.remittanceCode)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        latestCreatedRemittance.remittanceCode,
                        latestCreatedRemittance.id
                      )
                    }
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 cursor-pointer"
                    title="Copy 8-Digit Code"
                  >
                    {copiedCodeId === latestCreatedRemittance.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-white rounded-xl border border-slate-200">
                  <img
                    src={qrCodeUrl}
                    alt="8-Digit Deposit QR"
                    className="w-24 h-24 object-contain border border-slate-200 rounded-lg p-1"
                  />
                  <div className="text-xs space-y-1 text-center sm:text-left">
                    <div className="font-bold text-slate-900">
                      Remittance ID: <span className="font-mono">{latestCreatedRemittance.id}</span>
                    </div>
                    <div className="text-slate-600">
                      Receiving Store: <strong>{latestCreatedRemittance.outletName}</strong>
                    </div>
                    <div className="text-slate-600">
                      Specific Amount:{' '}
                      <strong className="font-mono text-emerald-700">
                        {formatINR(latestCreatedRemittance.amount)}
                      </strong>
                    </div>
                    <div className="text-[11px] text-indigo-700 font-semibold">
                      Go to Admin / Store Portal → Stock &amp; Logistics → Delivery Fleet (or Rider Cash Deposit) and enter code{' '}
                      <span className="font-mono font-black">
                        {latestCreatedRemittance.remittanceCode}
                      </span>{' '}
                      to approve!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of Rider's 8-Digit Cash Deposit Codes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>My 8-Digit Cash Deposit Codes ({myRemittances.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Real-time sync with Store &amp; Admin
              </span>
            </div>

            {myRemittances.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/70">
                No 8-digit cash deposit codes created yet for {activeRider.name}. Use the form above to generate a code for any specific amount.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myRemittances.map((remit) => {
                  const isApproved = remit.status === 'approved';
                  const isPending = remit.status === 'pending_approval';
                  return (
                    <div
                      key={remit.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPending
                          ? 'bg-amber-50/40 border-amber-200'
                          : isApproved
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 tracking-wider">
                            {formatEightDigitCode(remit.remittanceCode)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(remit.remittanceCode, remit.id)}
                            className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200"
                          >
                            {copiedCodeId === remit.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy 8-Digit Code</span>
                              </>
                            )}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">{remit.id}</span>
                        </div>

                        <div className="text-slate-600 flex items-center gap-2 flex-wrap">
                          <span>
                            Store: <strong>{remit.outletName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(remit.submittedAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        {remit.notes && (
                          <div className="text-[11px] text-slate-500 italic">{remit.notes}</div>
                        )}
                        {isApproved && remit.approvedBy && (
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            ✓ Approved by {remit.approvedBy} • Receipt: {remit.receiptNumber}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <span className="font-mono text-base font-black text-slate-900">
                          {formatINR(remit.amount)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved
                            ? 'Approved & Collected'
                            : isPending
                            ? 'Pending Code Approval'
                            : 'Rejected'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1 & 3: DELIVERIES LIST */}
      {activeTab !== 'cash_deposit' && (
        <div className="space-y-4">
          {activeTab === 'pending' ? (
            pendingDeliveries.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending deliveries right now. You are all caught up!
              </div>
            ) : (
              pendingDeliveries.map((order) => {
                const isCod = order.paymentMethod === 'cod';
                const isOut = order.orderStatus === 'out_for_delivery';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {order.deliverySlot || 'Express'}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isOut ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {order.customer.name}
                          </span>
                          <div className="flex items-start gap-1.5 text-slate-600 mt-1">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              {order.customer.address}
                              {order.customer.landmark && `, Near ${order.customer.landmark}`}
                              <br />
                              <strong>
                                {order.customer.area}, PIN: {order.customer.pincode}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Quick Call Button */}
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Banknote className={`w-4 h-4 ${isCod ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span className="font-semibold text-slate-800">
                          {isCod ? 'Cash on Delivery (COD)' : 'Prepaid / UPI'}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        {isCod ? (
                          <span className="text-amber-700">Collect: {formatINR(order.finalTotal)}</span>
                        ) : (
                          <span className="text-emerald-700">PAID (₹0 to collect)</span>
                        )}
                      </div>
                    </div>

                    {/* View Customer Location & Suggested Route Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMapOrderId(expandedMapOrderId === order.id ? null : order.id)
                        }
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span>
                            {expandedMapOrderId === order.id
                              ? 'Hide Map & Route Details'
                              : 'View Customer Location & Suggested Route'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded text-[10px] font-mono">
                            {order.distanceKm ? `${order.distanceKm} km` : 'Map'}
                          </span>
                        </div>
                        {expandedMapOrderId === order.id ? (
                          <ChevronUp className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        )}
                      </button>

                      {/* Expanded Google Map & Route Directions */}
                      {expandedMapOrderId === order.id && (
                        <div className="mt-3 animate-in fade-in duration-200">
                          <RiderOrderRouteMap
                            order={order}
                            onTripCompleted={() => {
                              handleStartDelivery(order);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      {!isOut ? (
                        <button
                          onClick={() => handleStartDelivery(order)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Start Delivery (Out for Delivery)
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenCompleteModal(order)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                          <button
                            onClick={() => setFailureOrder(order)}
                            className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer"
                          >
                            Delivery Failed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            completedDeliveries.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2 opacity-90"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="font-mono">{order.id}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded uppercase">
                    Delivered
                  </span>
                </div>
                <p className="text-slate-700">
                  Delivered to: <strong>{order.customer.name}</strong>
                </p>
                {order.deliveryProof && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      <span>Proof note: {order.deliveryProof.note}</span>
                      {order.deliveryProof.collectedAmount ? (
                        <span className="block font-mono font-bold text-emerald-700">
                          Cash Collected: {formatINR(order.deliveryProof.collectedAmount)}
                        </span>
                      ) : null}
                    </div>
                    {order.deliveryProof.collectedAmount ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDepositAmount(String(order.deliveryProof?.collectedAmount || 0));
                          setActiveTab('cash_deposit');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10px] cursor-pointer shrink-0"
                      >
                        Deposit via 8-Digit Code →
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Delivery &amp; Proof: {deliveringOrder.id}
            </h3>

            {deliveringOrder.paymentMethod === 'cod' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                <label className="font-bold block mb-1">Cash Collected Amount (₹):</label>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(Number(e.target.value))}
                  className="w-full p-2 border border-amber-300 rounded font-mono font-bold text-sm bg-white"
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Received by Name:</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver full name"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Proof Note / Remarks:</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Handed over with sealed box & invoice"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeliveringOrder(null)}
                className="px-3 py-1.5 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivered}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold cursor-pointer"
              >
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Failed Modal */}
      {failureOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-rose-900">
              Report Delivery Failed: {failureOrder.id}
            </h3>
            <p className="text-slate-600 text-[11px]">
              Package will be marked as delivery failed and staged for customer callback or redelivery.
            </p>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason for Failure *</label>
              <select
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Select reason...</option>
                <option value="Customer phone switched off / unreachable">Customer phone unreachable</option>
                <option value="Customer requested redelivery tomorrow">Customer requested redelivery</option>
                <option value="Door locked / nobody at address">Door locked / premises unattended</option>
                <option value="Incorrect address provided">Incorrect address</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFailureOrder(null)}
                className="px-3 py-1.5 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFailed}
                disabled={!failReason}
                className="px-4 py-1.5 bg-rose-600 disabled:opacity-50 text-white rounded font-bold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
