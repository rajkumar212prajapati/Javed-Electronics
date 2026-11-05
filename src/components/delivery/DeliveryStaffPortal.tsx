import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Order, RiderRemittanceSubmission } from '../../types';
import { generateQrDataUrl } from '../../utils/qrcode';
import {
  Bike,
  Package,
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
  AlertTriangle,
  Power,
  ArrowRightLeft,
  DollarSign,
  ExternalLink,
  X,
  RotateCcw,
  AlertCircle,
  BadgePercent,
  TrendingUp,
  Star,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { RiderOrderRouteMap } from './RiderOrderRouteMap';
import { RiderDeliveryCompletionModal } from './RiderDeliveryCompletionModal';
import { cleanCustomerName } from '../../utils/cleaners';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';

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
    toggleRiderOnlineStatus,
    requestRiderStoreTransfer,
    requestOrderRto,
    settings,
    riderEarningStructure,
    riderSlots,
    toggleRiderSlotEnrollment,
    riderPayouts,
    createRiderPayout,
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
      isOnline: true,
    };
  }, [ridersList, selectedRiderId]);

  const [activeTab, setActiveTab] = useState<'pending' | 'earnings' | 'cash_deposit' | 'completed'>('pending');
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [receiverName, setReceiverName] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [failureOrder, setFailureOrder] = useState<Order | null>(null);
  const [failReason, setFailReason] = useState<string>('');
  const [expandedMapOrderId, setExpandedMapOrderId] = useState<string | null>(null);
  const [viewingPodImageUrl, setViewingPodImageUrl] = useState<{ url: string; orderId: string; title: string } | null>(null);

  // RTO (Return to Origin) Request States
  const [rtoModalOrder, setRtoModalOrder] = useState<Order | null>(null);
  const [rtoReason, setRtoReason] = useState<
    'customer_not_answering' | 'address_not_found' | 'wrong_address' | 'wrong_order_placed' | 'customer_not_accepting' | 'customer_rescheduled_cancel'
  >('customer_not_answering');
  const [rtoNotes, setRtoNotes] = useState<string>('');

  // Rider Store Transfer Request States
  const [isStoreTransferModalOpen, setIsStoreTransferModalOpen] = useState(false);
  const [transferTargetOutletId, setTransferTargetOutletId] = useState<string>(
    outlets.find((o) => o.id !== activeRider.outletId)?.id || outlets[0]?.id || ''
  );
  const [transferReason, setTransferReason] = useState<string>('');

  // Re-Delivery Alert Dismissed List
  const [dismissedRedeliveryOrderIds, setDismissedRedeliveryOrderIds] = useState<string[]>([]);

  // Cash Deposit & 8-Digit Code Generator States
  const [depositSelectionMode, setDepositSelectionMode] = useState<'full' | 'custom'>('full');
  const [depositAmount, setDepositAmount] = useState<string>(
    activeRider.codCashInHand > 0 ? String(activeRider.codCashInHand) : '0'
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
    if (depositSelectionMode === 'full') {
      setDepositAmount(String(activeRider.codCashInHand || 0));
    }
    if (activeRider.outletId) {
      setTargetOutletId(activeRider.outletId);
    }
  }, [activeRider.id, activeRider.codCashInHand, activeRider.outletId, depositSelectionMode]);

  // Check if any active order has a rejected RTO request that requires re-delivery
  const rejectedRtoAlertOrder = useMemo(() => {
    return orders.find(
      (o) =>
        (o.assignedDeliveryStaffId === activeRider.id || o.deliveryStaffName === activeRider.name) &&
        o.rtoRequest?.status === 'rejected' &&
        o.orderStatus !== 'delivered' &&
        o.orderStatus !== 'cancelled' &&
        !dismissedRedeliveryOrderIds.includes(o.id)
    );
  }, [orders, activeRider.id, activeRider.name, dismissedRedeliveryOrderIds]);

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

  // Assigned deliveries strictly scoped to active rider
  const myAssignedOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.assignedDeliveryStaffId === activeRider.id ||
        o.deliveryStaffName === activeRider.name ||
        o.dispatchDetails?.riderId === activeRider.id ||
        o.dispatchDetails?.riderName === activeRider.name
    );
  }, [orders, activeRider.id, activeRider.name]);

  const pendingDeliveries = useMemo(() => {
    return myAssignedOrders.filter(
      (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'returned' && o.orderStatus !== 'cancelled'
    );
  }, [myAssignedOrders]);

  const completedDeliveries = useMemo(() => {
    return myAssignedOrders.filter(
      (o) => o.orderStatus === 'delivered' || o.orderStatus === 'returned'
    );
  }, [myAssignedOrders]);

  // Delivered COD Orders specifically handled by this rider
  const deliveredCodOrders = useMemo(() => {
    return myAssignedOrders.filter(
      (o) =>
        o.orderStatus === 'delivered' &&
        (o.paymentMethod === 'cod' || o.dispatchDetails?.isCod)
    );
  }, [myAssignedOrders]);

  const totalDeliveredCodCollected = useMemo(() => {
    return deliveredCodOrders.reduce((sum, o) => {
      const amt = o.deliveryProof?.collectedAmount ?? o.finalTotal;
      return sum + amt;
    }, 0);
  }, [deliveredCodOrders]);

  // Rider's cash deposit codes (pending & approved)
  const myRemittances = useMemo(() => {
    return riderRemittances.filter((r) => r.riderId === activeRider.id);
  }, [riderRemittances, activeRider.id]);

  const myPendingRemittances = useMemo(() => {
    return myRemittances.filter((r) => r.status === 'pending_approval');
  }, [myRemittances]);

  const myPendingRemittanceTotal = useMemo(() => {
    return myPendingRemittances.reduce((sum, r) => sum + r.amount, 0);
  }, [myPendingRemittances]);

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

  const handleToggleOnlineStatus = () => {
    const nextStatus = !activeRider.isOnline;
    toggleRiderOnlineStatus(activeRider.id, nextStatus);
    setToastMessage(nextStatus ? '🟢 ID is now Online! You are available to receive orders.' : '⚪ ID is now Offline. You will not receive new assignments.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStoreTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutlet = outlets.find((o) => o.id === transferTargetOutletId);
    if (!targetOutlet) {
      setToastMessage('Please select a valid store outlet.');
      return;
    }
    const res = requestRiderStoreTransfer(
      activeRider.id,
      targetOutlet.id,
      targetOutlet.name,
      transferReason.trim() || 'Rider requested location re-assignment'
    );
    if (res.success) {
      setToastMessage(res.message);
      setIsStoreTransferModalOpen(false);
      setTransferReason('');
    } else {
      setToastMessage(res.message);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRtoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rtoModalOrder) return;

    const reasonLabels: Record<string, string> = {
      customer_not_answering: 'Customer Not Answering Call (Multiple Attempts Made)',
      address_not_found: 'Customer Address Not Found / Unreachable Location',
      wrong_address: 'Wrong Delivery Address Provided by Customer',
      wrong_order_placed: 'Wrong Order Placed / Customer Ordered by Mistake',
      customer_not_accepting: 'Customer Refused at Doorstep / Not Accepting',
      customer_rescheduled_cancel: 'Customer Requested Rescheduling / Cancellation',
    };

    const res = requestOrderRto(rtoModalOrder.id, {
      reason: rtoReason,
      reasonText: reasonLabels[rtoReason] || String(rtoReason).replace(/_/g, ' '),
      notes: rtoNotes.trim(),
      riderNotes: rtoNotes.trim() || `Customer unreachable / issue reported by rider ${activeRider.name}`,
      requestedAt: new Date().toISOString(),
      requestedByRiderId: activeRider.id,
      requestedByRiderName: activeRider.name,
      riderId: activeRider.id,
      riderName: activeRider.name,
      status: 'pending_store_approval',
    });

    if (res.success) {
      setToastMessage(`✓ RTO Request for #${rtoModalOrder.id} submitted! Awaiting Store Manager approval.`);
      setRtoModalOrder(null);
      setRtoNotes('');
    } else {
      setToastMessage(res.message);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAcknowledgeRedelivery = (orderId: string) => {
    setDismissedRedeliveryOrderIds((prev) => [...prev, orderId]);
    updateOrderStatus(
      orderId,
      'out_for_delivery',
      `Rider ${activeRider.name} acknowledged manager instruction and is re-attempting delivery to customer doorstep.`
    );
    setToastMessage(`Acknowledged! Please proceed to re-attempt delivery for Order ${orderId}.`);
    setTimeout(() => setToastMessage(null), 4000);
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
    setReceiverName(cleanCustomerName(order.customer.name));
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
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
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
            {activeRider.selfieUrl ? (
              <img
                src={activeRider.selfieUrl}
                alt={activeRider.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-black text-lg">
                <Bike className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                  MUMBAI NALASOPARA FLEET RIDER PORTAL
                </span>
                
                {/* Rider Online / Offline ID Toggle */}
                <button
                  type="button"
                  onClick={handleToggleOnlineStatus}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border cursor-pointer transition-all ${
                    activeRider.isOnline
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                  }`}
                  title="Toggle your Rider ID Online (receive orders) or Offline (duty off)"
                >
                  <span className={`w-2 h-2 rounded-full ${activeRider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{activeRider.isOnline ? 'ONLINE (ACTIVE)' : 'OFFLINE (OFF DUTY)'}</span>
                  <Power className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-base font-black text-slate-900">{activeRider.name}</h2>
                <span className="text-xs text-slate-500 font-mono">({activeRider.phone})</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Base Store: <strong className="text-slate-800">{activeRider.outletName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Request Store Transfer Button */}
            <button
              type="button"
              onClick={() => {
                setTransferTargetOutletId(outlets.find((o) => o.id !== activeRider.outletId)?.id || outlets[0]?.id || '');
                setIsStoreTransferModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
              title="Request store outlet transfer to Manager"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Request Store Change</span>
            </button>

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
          </div>
        </div>

        {/* Pending Transfer Status Notice if any */}
        {activeRider.pendingStoreTransfer?.status === 'pending' && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              Store transfer request to &quot;{activeRider.pendingStoreTransfer.targetOutletName}&quot; is pending admin approval.
            </span>
            <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">
              Reviewing
            </span>
          </div>
        )}

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
              Total Earnings
            </span>
            <span className="text-lg font-black font-mono text-indigo-950 mt-0.5 block">
              {formatINR(activeRider.earnings?.total || 3850)}
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

      {/* 4 Category-Style Segmented Rider Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Active ({pendingDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            activeTab === 'earnings'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Earnings</span>
        </button>

        <button
          onClick={() => setActiveTab('cash_deposit')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            activeTab === 'cash_deposit'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
          <span>COD Wallet &amp; Deposit</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono ${
              activeTab === 'cash_deposit'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {formatINR(activeRider.codCashInHand)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>History ({completedDeliveries.length})</span>
        </button>
      </div>

      {/* TAB 2: RIDER CASH DEPOSIT & 8-DIGIT CODE GENERATOR */}
      {activeTab === 'cash_deposit' && (
        <div className="space-y-5">
          {/* 1. RIDER COD CASH WALLET SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Outstanding Cash in Hand */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-slate-950 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-950/80">
                <span className="font-bold flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-slate-950" />
                  Net Outstanding Cash
                </span>
                <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full">
                  In Hand
                </span>
              </div>
              <div className="text-2xl font-black font-mono">
                {formatINR(activeRider.codCashInHand || 0)}
              </div>
              <p className="text-[11px] font-semibold text-slate-900/80">
                Current physical cash held by {activeRider.name}.
              </p>
            </div>

            {/* Delivered COD Orders Gross Cash */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Delivered COD Cash
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {deliveredCodOrders.length} Orders
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                {formatINR(totalDeliveredCodCollected)}
              </div>
              <p className="text-[11px] text-slate-500">
                Gross cash collected from delivered doorstep orders.
              </p>
            </div>

            {/* Locked in Pending Deposit Codes */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Locked in Active Codes
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  {myPendingRemittances.length} Pending
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-indigo-700">
                {formatINR(myPendingRemittanceTotal)}
              </div>
              <p className="text-[11px] text-slate-500">
                Deposit codes waiting for store counter verification.
              </p>
            </div>

            {/* Approved & Settled to Store Counter */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-bold flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Settled at Store
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Approved
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {formatINR(myApprovedTotal)}
              </div>
              <p className="text-[11px] text-slate-500">
                Cash verified and acknowledged by Store Cashier.
              </p>
            </div>
          </div>

          {/* 2. DELIVERED COD ORDERS CONTRIBUTING TO WALLET */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  <span>Delivered COD Orders &amp; Cash Collections ({deliveredCodOrders.length})</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Individual COD orders delivered by {activeRider.name} with cash collected from customers
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-center">
                Total Collected: <strong className="text-emerald-700">{formatINR(totalDeliveredCodCollected)}</strong>
              </span>
            </div>

            {deliveredCodOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <Package className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">No COD orders delivered yet</p>
                <p className="text-[11px] text-slate-500">
                  When you deliver a Cash on Delivery order, its collected cash will immediately appear in this wallet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deliveredCodOrders.map((order) => {
                  const collectedAmt = order.deliveryProof?.collectedAmount ?? order.finalTotal;
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all text-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{order.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          COD Delivered
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">{cleanCustomerName(order.customer.name)}</div>
                        <div className="text-[11px] text-slate-500">
                          {order.shippingAddress?.area || order.customer.area || 'Local Area'}, {order.shippingAddress?.city || 'Nalasopara'}
                        </div>
                        {order.deliveryProof?.timestamp && (
                          <div className="text-[10px] text-slate-400">
                            Delivered at: {new Date(order.deliveryProof.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cash Collected</span>
                          <span className="font-mono font-black text-sm text-emerald-700">{formatINR(collectedAmt)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDepositSelectionMode('custom');
                            setDepositAmount(String(collectedAmt));
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          Deposit This ₹{collectedAmt} →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. GENERATE 8-DIGIT COD DEPOSIT CODE (TOTAL OR SPECIFIC AMOUNT) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Generate COD Cash Deposit Code
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deposit the <strong>Total Outstanding Cash</strong> or enter any <strong>Specific Partial Amount</strong>. The remaining balance updates automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                  Wallet Outstanding: {formatINR(activeRider.codCashInHand)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateDepositCode} className="space-y-4 text-xs">
              {/* Deposit Mode Selector: Total Full Balance vs Specific Custom Amount */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Select Deposit Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositSelectionMode('full');
                      setDepositAmount(String(activeRider.codCashInHand || 0));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      depositSelectionMode === 'full'
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositSelectionMode === 'full' ? 'border-amber-600 bg-amber-500' : 'border-slate-400'}`}>
                          {depositSelectionMode === 'full' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>Deposit Total Outstanding Balance</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-5">
                        Hand over 100% of collected COD cash ({formatINR(activeRider.codCashInHand)}) to clear your wallet.
                      </p>
                    </div>
                    <span className="font-mono font-black text-sm text-amber-900 ml-2 shrink-0">
                      {formatINR(activeRider.codCashInHand)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDepositSelectionMode('custom');
                      if (depositAmount === String(activeRider.codCashInHand)) {
                        setDepositAmount(activeRider.codCashInHand > 1000 ? '1000' : String(activeRider.codCashInHand));
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      depositSelectionMode === 'custom'
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositSelectionMode === 'custom' ? 'border-indigo-600 bg-indigo-500' : 'border-slate-400'}`}>
                          {depositSelectionMode === 'custom' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>Deposit Specific Partial Amount</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-5">
                        Deposit a specific amount and keep the remaining cash in hand.
                      </p>
                    </div>
                    <span className="font-bold text-xs text-indigo-700 ml-2 shrink-0">
                      Custom ₹
                    </span>
                  </button>
                </div>
              </div>

              {/* Specific Amount Input Field (Active when Custom mode is on or for overrides) */}
              {depositSelectionMode === 'custom' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Enter Specific Deposit Amount (₹) *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[500, 1000, 1500, 2000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDepositAmount(String(preset))}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded font-mono font-bold text-[10px] border border-slate-200 cursor-pointer shadow-2xs"
                        >
                          ₹{preset.toLocaleString('en-IN')}
                        </button>
                      ))}
                      {activeRider.codCashInHand > 0 && (
                        <button
                          type="button"
                          onClick={() => setDepositAmount(String(activeRider.codCashInHand))}
                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] border border-amber-300 cursor-pointer"
                        >
                          Max ({formatINR(activeRider.codCashInHand)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-base">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={activeRider.codCashInHand > 0 ? activeRider.codCashInHand : undefined}
                      step="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* REAL-TIME REMAINING OUTSTANDING BALANCE CALCULATOR BOX */}
              {(() => {
                const parsedDeposit = Math.max(0, Number(depositAmount) || 0);
                const currentCash = activeRider.codCashInHand || 0;
                const remainingAfter = Math.max(0, currentCash - parsedDeposit);
                const isOverDeposit = parsedDeposit > currentCash && currentCash > 0;

                return (
                  <div className="p-4 rounded-xl bg-linear-to-r from-slate-900 to-indigo-950 text-white shadow-xs space-y-3">
                    <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center justify-between">
                      <span>Real-Time Cash Remittance Balance Calculator</span>
                      <span>Wallet Sync</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left pt-1">
                      <div className="space-y-0.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Current Cash in Hand</span>
                        <div className="font-mono text-lg font-black text-white">
                          {formatINR(currentCash)}
                        </div>
                      </div>

                      <div className="space-y-0.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-amber-300 block">Deposit Code Amount</span>
                        <div className="font-mono text-lg font-black text-amber-300">
                          - {formatINR(parsedDeposit)}
                        </div>
                      </div>

                      <div className={`space-y-0.5 p-2.5 rounded-lg border ${
                        isOverDeposit
                          ? 'bg-rose-500/20 border-rose-400'
                          : remainingAfter === 0
                          ? 'bg-emerald-500/20 border-emerald-400'
                          : 'bg-indigo-500/20 border-indigo-400'
                      }`}>
                        <span className="text-[10px] font-bold block text-slate-200">
                          Remaining Outstanding Balance
                        </span>
                        <div className={`font-mono text-lg font-black ${
                          isOverDeposit
                            ? 'text-rose-300'
                            : remainingAfter === 0
                            ? 'text-emerald-300'
                            : 'text-amber-200'
                        }`}>
                          {formatINR(remainingAfter)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                      {isOverDeposit ? (
                        <span className="text-rose-300 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Deposit amount exceeds your current cash in hand!
                        </span>
                      ) : remainingAfter === 0 ? (
                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Zero cash will remain in your hand (100% wallet clearance).
                        </span>
                      ) : (
                        <span className="text-amber-200 font-semibold flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5" />
                          <strong>{formatINR(remainingAfter)}</strong> will remain in your cash wallet after generating this code.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 8-Digit Code Preview & Customizer */}
              <div className="p-4 rounded-xl bg-linear-to-r from-indigo-50/80 via-white to-amber-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  <span>Regenerate 8-Digit Code</span>
                </button>
              </div>

              {/* Target Store Outlet & Handover Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Receiving Store / Branch Counter *
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
                    Cash Deposit Handover Method *
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
                  placeholder="e.g. 2 x ₹500 notes + ₹99 loose cash handed over at counter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>
                  Generate 8-Digit Code ({formatEightDigitCode(eightDigitCode)}) for{' '}
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

      {/* TAB: RIDER MULTI-TIER EARNINGS BREAKDOWN, SHIFT SLOTS & BANK PAYOUTS */}
      {activeTab === 'earnings' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    My Comprehensive 6-Tier Earnings Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live transparent calculation synced with Admin Earning Structure Rate Card
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Gross Earnings
                </span>
                <span className="font-mono text-2xl font-black text-indigo-700">
                  {formatINR(activeRider.earnings?.totalEarnings ?? activeRider.earnings?.total ?? 2810)}
                </span>
              </div>
            </div>

            {/* 6 Core Earnings Streams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* 1. Slot Based */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-bold flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Slot-Based Base Pay
                  </span>
                  <span className="text-[10px] bg-slate-200/70 px-1.5 py-0.2 rounded font-semibold">
                    {formatINR(riderEarningStructure.defaultSlotBaseGuarantee)}/slot
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {formatINR(activeRider.earnings?.slotEarnings ?? activeRider.earnings?.slotBased ?? 600)}
                </div>
                <p className="text-[10px] text-slate-500">
                  Guaranteed shift slot base rate ({riderEarningStructure.minSlotLoginAdherencePct}% login adherence).
                </p>
              </div>

              {/* 2. Order Based */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-bold flex items-center gap-1.5 text-slate-700">
                    <Bike className="w-3.5 h-3.5 text-blue-500" />
                    Order-Based Deliveries
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                    {formatINR(riderEarningStructure.baseOrderFee)} / Order
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {formatINR(activeRider.earnings?.orderEarnings ?? activeRider.earnings?.orderBased ?? 950)}
                </div>
                <p className="text-[10px] text-slate-500">
                  Fixed {formatINR(riderEarningStructure.baseOrderFee)} per order (+{formatINR(riderEarningStructure.bulkOrderExtraFee)} bulky bonus).
                </p>
              </div>

              {/* 3. Incentive Based */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Incentive-Based Bonus
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                    Daily Slabs
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-emerald-950">
                  {formatINR(activeRider.earnings?.incentiveEarnings ?? activeRider.earnings?.incentiveBased ?? 300)}
                </div>
                <p className="text-[10px] text-emerald-700">
                  {riderEarningStructure.dailyIncentiveTiers
                    .map((t) => `${t.minOrders}+ ord: ₹${t.bonusAmount}`)
                    .join(' • ')}
                </p>
              </div>

              {/* 4. Surge Based */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <div className="flex items-center justify-between text-amber-800">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Surge-Based Multiplier
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                    {riderEarningStructure.surgeConfig.isSurgeActive ? 'LIVE SURGE' : 'Standard'}
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-amber-950">
                  {formatINR(activeRider.earnings?.surgeEarnings ?? activeRider.earnings?.surgeBased ?? 180)}
                </div>
                <p className="text-[10px] text-amber-700">
                  Peak: +{formatINR(riderEarningStructure.surgeConfig.peakHourSurgePerOrder)} • Rain: +{formatINR(riderEarningStructure.surgeConfig.rainSurgePerOrder)} • Fest: +{formatINR(riderEarningStructure.surgeConfig.festivalSurgePerOrder)}
                </p>
              </div>

              {/* 5. Milestone Based */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between text-purple-800">
                  <span className="font-bold flex items-center gap-1.5 text-purple-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Milestone-Based Rewards
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">
                    Targets
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-purple-950">
                  {formatINR(activeRider.earnings?.milestoneEarnings ?? activeRider.earnings?.milestoneBased ?? 500)}
                </div>
                <p className="text-[10px] text-purple-700">
                  {riderEarningStructure.milestoneTiers
                    .map((m) => `${m.targetOrders} (${m.period}): ₹${m.rewardAmount}`)
                    .join(' • ')}
                </p>
              </div>

              {/* 6. Distance Based */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <div className="flex items-center justify-between text-blue-800">
                  <span className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Distance-Based Pay
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                    {formatINR(riderEarningStructure.perKmRate)}/KM
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-blue-950">
                  {formatINR(activeRider.earnings?.distanceEarnings ?? activeRider.earnings?.distanceBased ?? 280)}
                </div>
                <p className="text-[10px] text-blue-700">
                  {formatINR(riderEarningStructure.perKmRate)}/km beyond {riderEarningStructure.baseIncludedKm}km base radius (RTO: {formatINR(riderEarningStructure.returnRtoPerKmRate)}/km).
                </p>
              </div>
            </div>

            {/* Direct Bank Account Disbursal & Request Settlement Card */}
            <div className="p-4 bg-linear-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                  Disbursal Bank Account
                </span>
                <div className="font-mono text-sm font-bold flex items-center gap-2">
                  <span>A/C: ••••••••••••{activeRider.bankAccountNo ? activeRider.bankAccountNo.slice(-4) : '1012'}</span>
                  <span className="text-xs text-indigo-200">({activeRider.ifscCode || 'HDFC0001234'})</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  PAN: <strong className="text-white font-mono">{activeRider.panNumber || 'ABCDE1234F'}</strong> • Aadhar: <strong className="text-white font-mono">•••• {activeRider.aadharNumber ? activeRider.aadharNumber.slice(-4) : '2341'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const res = createRiderPayout({
                      riderId: activeRider.id,
                      periodLabel: 'Rider Instant Settlement Request',
                      paymentMethod: 'IMPS',
                      markPaidImmediately: false,
                      notes: `Requested by ${activeRider.name} from Rider Portal`,
                    });
                    setToastMessage(res.message);
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs cursor-pointer shadow-xs"
                >
                  Request Bank Payout Settlement
                </button>
              </div>
            </div>
          </div>

          {/* RIDER SHIFT SLOT BOOKING & ENROLLMENT SECTION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Available Delivery Shift Slots ({riderSlots.filter((s) => s.isActive).length})</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Book or unbook delivery shift slots to lock in guaranteed Slot Base Pay and Peak Order Surge bonuses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {riderSlots
                .filter((s) => s.isActive)
                .map((slot) => {
                  const isBooked = slot.enrolledRiderIds.includes(activeRider.id);
                  const isFull = !isBooked && slot.enrolledRiderIds.length >= slot.maxRiders;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        isBooked
                          ? 'bg-indigo-50/60 border-indigo-300'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-900 text-sm">{slot.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white border border-slate-200 text-indigo-700">
                            {slot.slotType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-slate-700">
                          {slot.startTime} – {slot.endTime} ({slot.durationHours} hrs)
                        </div>
                        <div className="text-[11px] text-slate-500">{slot.outletName}</div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                            Base Guarantee: {formatINR(slot.slotBasePay)}
                          </span>
                          {slot.perOrderSurgeBonus > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                              +{formatINR(slot.perOrderSurgeBonus)}/order
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Capacity: {slot.enrolledRiderIds.length}/{slot.maxRiders} riders
                        </span>
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            const res = toggleRiderSlotEnrollment(slot.id, activeRider.id);
                            setToastMessage(res.message);
                            setTimeout(() => setToastMessage(null), 3500);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all ${
                            isBooked
                              ? 'bg-emerald-600 text-white hover:bg-rose-600'
                              : isFull
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isBooked ? '✓ Slot Booked (Tap to Leave)' : isFull ? 'Slot Full' : '+ Book Shift Slot'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIDER BANK PAYOUT VOUCHERS & UTR HISTORY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>
                  My Bank Payout Settlements ({riderPayouts.filter((p) => p.riderId === activeRider.id).length})
                </span>
              </h4>
            </div>

            {riderPayouts.filter((p) => p.riderId === activeRider.id).length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No bank payout vouchers generated yet for {activeRider.name}. Click "Request Bank Payout Settlement" above to initiate.
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {riderPayouts
                  .filter((p) => p.riderId === activeRider.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-700">{p.id}</span>
                          <span className="font-bold text-slate-800">{p.periodLabel}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          A/C: {p.bankAccountNo} ({p.ifscCode}) • Mode: {p.paymentMethod}
                          {p.utrReference ? ` • UTR: ${p.utrReference}` : ' • Awaiting Admin Bank Release'}
                        </div>
                      </div>
                      <div className="text-right font-mono text-base font-black text-emerald-700">
                        {formatINR(p.breakdown.netPayableAmount)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1 & 3: DELIVERIES LIST */}
      {activeTab !== 'cash_deposit' && activeTab !== 'earnings' && (
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
                const isRtoPending =
                  order.rtoRequest?.status === 'pending_store_approval' ||
                  order.rtoRequest?.status === 'pending' ||
                  order.orderStatus === 'return_requested';
                const isRtoRejected = order.rtoRequest?.status === 'rejected';

                const destinationAddress = `${order.shippingAddress?.addressLine || order.customer.address}, ${order.shippingAddress?.area || order.customer.area || ''}, ${order.shippingAddress?.city || 'Nalasopara East'} ${order.shippingAddress?.pincode || order.customer.pincode || '401209'}`;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {order.deliverySlot || 'Express'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isRtoPending && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            RTO PENDING STORE APPROVAL ⏳
                          </span>
                        )}
                        {isRtoRejected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            RE-DELIVERY INSTRUCTED ⚠️
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isRtoPending
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isOut
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 text-sm block">
                            {cleanCustomerName(order.customer.name)}
                          </span>
                          <div className="flex items-start gap-1.5 text-slate-600">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>
                              {order.shippingAddress?.addressLine || order.customer.address}
                              {order.customer.landmark && `, Near ${order.customer.landmark}`}
                              <br />
                              <strong className="text-slate-800">
                                {order.shippingAddress?.city || order.customer.area || 'Nalasopara'}, PIN: {order.shippingAddress?.pincode || order.customer.pincode}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Quick Contact & Navigation Action Buttons */}
                        <div className="flex items-center gap-2 self-start shrink-0">
                          <a
                            href={`tel:${order.shippingAddress?.phone || order.customer.phone}`}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
                            title="Call Customer directly"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Customer</span>
                          </a>

                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl font-bold text-xs shadow-2xs transition-colors"
                            title="Open Google Maps directions to customer address"
                          >
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>Map</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Banknote className={`w-4 h-4 ${isCod ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span className="font-semibold text-slate-800">
                          {isCod ? 'Cash on Delivery (COD)' : 'Prepaid / Verified Online'}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        {isCod ? (
                          <span className="text-amber-700 font-black">Collect: {formatINR(order.finalTotal)}</span>
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span>
                            {expandedMapOrderId === order.id
                              ? 'Hide In-App Route Simulation'
                              : 'View In-App Route & Road Navigation'}
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

                    {/* Action Buttons: Start Delivery / Mark Delivered / Request Mark RTO */}
                    <div className="pt-2">
                      {isRtoPending ? (
                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                              RTO REQUEST SUBMITTED (PENDING STORE APPROVAL)
                            </span>
                            <span className="text-[10px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                              Under Review
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-900">
                            <strong>Reason:</strong> {order.rtoRequest?.reasonText || order.rtoRequest?.reason}
                          </p>
                          {order.rtoRequest?.riderNotes && (
                            <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-rose-100">
                              <strong>Rider Note:</strong> &quot;{order.rtoRequest.riderNotes}&quot;
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500">
                            Store Admin has received your request. Return package to <strong>{activeRider.outletName || 'Store Outlet'}</strong>.
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-rose-200 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setRtoModalOrder(order);
                                setRtoReason((order.rtoRequest?.reason as any) || 'customer_not_answering');
                                setRtoNotes(order.rtoRequest?.riderNotes || '');
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer shadow-2xs"
                            >
                              Edit Reason / Notes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCompleteModal(order);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs ml-auto"
                            >
                              Customer Called? Mark Delivered
                            </button>
                          </div>
                        </div>
                      ) : !isOut ? (
                        <button
                          type="button"
                          onClick={() => handleStartDelivery(order)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Start Delivery (Out for Delivery)</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(order)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Enter OTP &amp; Mark Delivered</span>
                          </button>

                          <a
                            href={getWhatsAppClickToChatUrl(
                              settings.whatsappNumber || '919839012345',
                              `Hi Support Team, I am Rider ${activeRider.name} with Order ${order.id} (${order.customer.name}). Need support / manual delivery confirmation.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
                            title="Connect to Support Team"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>Support Team</span>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setRtoModalOrder(order);
                              setRtoReason('customer_not_answering');
                              setRtoNotes('');
                            }}
                            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                            title="Request Return to Origin (customer unreachable, wrong address, rejected)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span>Request Mark RTO Store</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            completedDeliveries.map((order) => {
              const feedback = order.deliveryProof?.customerFeedback;
              const podImg = order.deliveryProof?.podImageUrl;
              const isCod = order.paymentMethod === 'cod' || order.dispatchDetails?.isCod;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs text-xs space-y-3.5 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                      <span className="text-[10px] text-slate-400">
                        {order.deliverySlot || 'Doorstep Delivery'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>

                      {order.deliveryProof?.verifiedOtp && (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          <span>Code Verified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">
                        {cleanCustomerName(order.customer.name)}
                      </span>
                      <p className="text-slate-600 text-[11px]">
                        {order.shippingAddress?.addressLine || order.customer.address},{' '}
                        {order.shippingAddress?.city || order.customer.area || 'Lucknow'}
                      </p>
                    </div>

                    {/* POD Image Thumbnail */}
                    {podImg && (
                      <div className="flex items-center gap-2 self-start shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingPodImageUrl({
                              url: podImg,
                              orderId: order.id,
                              title: `POD: ${order.customer.name}`,
                            })
                          }
                          className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center cursor-pointer shadow-2xs hover:opacity-90 transition-opacity"
                          title="Click to view full Proof of Delivery photo"
                        >
                          <img
                            src={podImg}
                            alt="POD Thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Camera className="w-4 h-4" />
                          </div>
                        </button>
                        <div className="text-[10px] text-slate-500">
                          <strong className="block text-slate-800">POD Photo</strong>
                          <span>Tap to view</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash Collection details & deposit action */}
                  {order.deliveryProof && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-600 block">
                          Handover: {order.deliveryProof.note || 'Delivered safely'}
                        </span>
                        {order.deliveryProof.collectedAmount ? (
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span className="font-mono font-bold text-emerald-800">
                              COD Collected: {formatINR(order.deliveryProof.collectedAmount)}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                              {order.deliveryProof.paymentMethodCollected === 'doorstep_upi_qr'
                                ? 'UPI QR'
                                : 'Cash'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Prepaid Order (Zero COD Collected)
                          </span>
                        )}
                      </div>

                      {order.deliveryProof.collectedAmount &&
                      order.deliveryProof.paymentMethodCollected !== 'doorstep_upi_qr' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDepositAmount(String(order.deliveryProof?.collectedAmount || 0));
                            setActiveTab('cash_deposit');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] cursor-pointer shrink-0 shadow-2xs transition-colors"
                        >
                          Deposit via 8-Digit Code →
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* Customer Feedback Card */}
                  {feedback && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                          Customer Doorstep Feedback
                        </span>
                        <div className="flex items-center gap-1 font-bold text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{feedback.rating}/5 Stars</span>
                        </div>
                      </div>

                      {feedback.tags && feedback.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {feedback.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {feedback.comment && (
                        <p className="text-[11px] text-amber-950 italic pt-1 border-t border-amber-200/60">
                          "{feedback.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* POPUP FOR RE-DELIVERY: WHEN RTO WAS DECLINED / RIDER WRONGLY REQUESTED */}
      {rejectedRtoAlertOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  RTO REQUEST DECLINED BY STORE
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Re-attempt Delivery Required!
                </h3>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Store Manager Verification Notes:
                </span>
                <p className="text-amber-900 text-xs italic">
                  &quot;{rejectedRtoAlertOrder.rtoRequest?.adminNotes || 'Store confirmed customer is available at delivery location. Please call customer and complete delivery.'}&quot;
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{rejectedRtoAlertOrder.id}</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">
                    {formatINR(rejectedRtoAlertOrder.finalTotal)}
                  </span>
                </div>
                <p className="font-bold text-slate-800">{rejectedRtoAlertOrder.customer.name}</p>
                <p className="text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    {rejectedRtoAlertOrder.shippingAddress?.addressLine || rejectedRtoAlertOrder.customer.address}, {rejectedRtoAlertOrder.shippingAddress?.city || 'Nalasopara East'} - {rejectedRtoAlertOrder.shippingAddress?.pincode || '401209'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <a
                href={`tel:${rejectedRtoAlertOrder.shippingAddress?.phone || rejectedRtoAlertOrder.customer.phone}`}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Customer Now</span>
              </a>

              <button
                type="button"
                onClick={() => handleAcknowledgeRedelivery(rejectedRtoAlertOrder.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Proceed to Deliver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RTO REQUEST MODAL FOR RIDER */}
      {rtoModalOrder && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRtoModalOrder(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Request Mark RTO to Store: {rtoModalOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRtoModalOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRtoSubmit} className="space-y-3.5 text-xs flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Select the genuine delivery failure reason. The Store Manager and Admin will verify before approving package return to store shelf inventory:
                </p>

                <div className="space-y-2">
                  {[
                    {
                      id: 'customer_not_answering',
                      label: 'Customer Not Answering Call (Multiple Attempts Made)',
                    },
                    {
                      id: 'address_not_found',
                      label: 'Not Found Customer Address / Unreachable Location',
                    },
                    {
                      id: 'wrong_address',
                      label: 'Wrong Delivery Address Provided by Customer',
                    },
                    {
                      id: 'wrong_order_placed',
                      label: 'Wrong Order Placed / Customer Ordered by Mistake',
                    },
                    {
                      id: 'customer_not_accepting',
                      label: 'Customer Not Accepting Order / Refused at Doorstep',
                    },
                    {
                      id: 'customer_rescheduled_cancel',
                      label: 'Customer Requested Rescheduling / Cancellation',
                    },
                  ].map((reasonOption) => (
                    <label
                      key={reasonOption.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        rtoReason === reasonOption.id
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rto_reason"
                        value={reasonOption.id}
                        checked={rtoReason === reasonOption.id}
                        onChange={(e) => setRtoReason(e.target.value as any)}
                        className="mt-0.5 text-rose-600"
                      />
                      <span>{reasonOption.label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Rider Explanation Notes *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Called customer 3 times, phone ringing but unanswered. Waited 10 mins outside building."
                    value={rtoNotes}
                    onChange={(e) => setRtoNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setRtoModalOrder(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit RTO to Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIDER REQUEST STORE CHANGE MODAL */}
      {isStoreTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Request Store Outlet Change</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStoreTransferModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStoreTransferSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p><strong>Current Store:</strong> {activeRider.outletName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Select where you would like to be reassigned:
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Target Destination Outlet *
                </label>
                <select
                  value={transferTargetOutletId}
                  onChange={(e) => setTransferTargetOutletId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                >
                  {outlets
                    .filter((o) => o.id !== activeRider.outletId)
                    .map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reason for Store Change *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Relocated residence to Nalasopara East Vijaynagar area"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStoreTransferModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rider Delivery Completion Flow (Collect COD -> Ask Customer for 4-Digit OTP -> Take POD -> Mark Delivered -> Customer Feedback) */}
      {deliveringOrder && (
        <RiderDeliveryCompletionModal
          order={deliveringOrder}
          rider={activeRider}
          supportPhone={settings.phone}
          supportWhatsapp={settings.whatsappNumber}
          onClose={() => setDeliveringOrder(null)}
          onDeliveryCompleted={(params) => {
            completeDelivery(deliveringOrder.id, {
              collectedAmount: params.collectedAmount,
              paymentMethodCollected: params.paymentMethodCollected,
              receiverName: params.receiverName,
              note: params.note,
              podImageUrl: params.podImageUrl,
              deliveryPinEntered: params.deliveryPinEntered,
              verifiedOtp: params.verifiedOtp ?? true,
              customerFeedback: params.feedback,
            });
            setToastMessage(`✓ Order ${deliveringOrder.id} marked delivered!`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Full-Screen POD Image Preview Modal with prominent Close button */}
      {viewingPodImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">
                  {viewingPodImageUrl.title || 'Proof of Delivery Photo'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ({viewingPodImageUrl.orderId})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPodImageUrl(null)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Close POD Preview"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={viewingPodImageUrl.url}
                alt="Proof of delivery preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-medium">
                Verified Doorstep Handover Record
              </span>
              <button
                type="button"
                onClick={() => setViewingPodImageUrl(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Close Preview
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
