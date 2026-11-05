import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryPartnerAccount, ExpressCarrierName, RiderRemittanceSubmission, Order } from '../../types';
import { InHouseRider } from '../../data/mockDeliveryPartners';
import { formatINR } from '../../utils/currency';
import {
  Truck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Phone,
  User,
  Banknote,
  Sparkles,
  Link2,
  Check,
  Copy,
  Radio,
  QrCode,
  Calendar,
  CreditCard,
  Layers,
  ArrowRight,
  Printer,
  Search,
  RefreshCw,
  Loader2,
  Camera,
  ArrowRightLeft,
  RotateCcw,
  Zap,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Shield,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { RiderCashSubmitModal } from './RiderCashSubmitModal';
import { RiderQrScanApproveModal } from './RiderQrScanApproveModal';
import { CarrierCodSettlementModal } from './CarrierCodSettlementModal';
import { RiderEarningSlotPayoutModule } from './RiderEarningSlotPayoutModule';
import { authenticateShiprocket } from '../../services/shiprocketService';

export const DeliveryPartnerManager: React.FC = () => {
  const {
    deliveryPartners,
    updateDeliveryPartnerConfig,
    ridersList,
    addInHouseRider,
    onboardNewRider,
    transferRiderStore,
    approveRiderStoreTransfer,
    rejectRiderStoreTransfer,
    autoAssignOrdersToRiders,
    reviewOrderRto,
    outlets,
    riderRemittances,
    approveRiderCashRemittance,
    carrierSettlements,
    orders,
    currentRole,
    currentUser,
    syncShiprocketOrderStatus,
    riderSlots,
    riderPayouts,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  const [activeSubTab, setActiveSubTab] = useState<
    | 'partners'
    | 'riders'
    | 'earning_structure'
    | 'slot_management'
    | 'rider_payouts'
    | 'rto_review'
    | 'remittances'
    | 'carrier_settlement'
    | 'cod_ledger'
  >('riders');

  // Modal states
  const [editingPartner, setEditingPartner] = useState<DeliveryPartnerAccount | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [submittingRiderCash, setSubmittingRiderCash] = useState<InHouseRider | null>(null);
  const [showQrScanApproveModal, setShowQrScanApproveModal] = useState(false);
  const [targetRemittanceForApprove, setTargetRemittanceForApprove] = useState<RiderRemittanceSubmission | null>(null);
  const [showCarrierSettlementModal, setShowCarrierSettlementModal] = useState(false);
  const [defaultSettlementCarrier, setDefaultSettlementCarrier] = useState<ExpressCarrierName>('Shiprocket');

  // Admin Transfer Rider Modal
  const [transferringRider, setTransferringRider] = useState<InHouseRider | null>(null);
  const [selectedTargetOutletId, setSelectedTargetOutletId] = useState<string>('');

  // Admin Reject RTO Modal
  const [rejectingRtoOrder, setRejectingRtoOrder] = useState<Order | null>(null);
  const [adminRtoRejectionNote, setAdminRtoRejectionNote] = useState<string>(
    'Customer re-contacted by store and confirmed available at address. Re-attempt delivery now.'
  );

  // Filter for master COD ledger
  const [codStatusFilter, setCodStatusFilter] = useState<'all' | 'pending' | 'collected' | 'remitted' | 'settled_to_admin'>('all');

  // New rider onboarding form state
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderEmail, setNewRiderEmail] = useState('');
  const [newRiderPassword, setNewRiderPassword] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState('');
  const [newRiderOutlet, setNewRiderOutlet] = useState(
    outlets[0]?.name || 'Nalasopara East Main Hub (Shop 09 Sai Dham Apt)'
  );
  const [newRiderAadhar, setNewRiderAadhar] = useState('');
  const [newRiderPan, setNewRiderPan] = useState('');
  const [newRiderBankAcc, setNewRiderBankAcc] = useState('');
  const [newRiderIfsc, setNewRiderIfsc] = useState('');
  const [newRiderSelfie, setNewRiderSelfie] = useState<string>('');

  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTestingShiprocket, setIsTestingShiprocket] = useState(false);
  const [isSyncingAllShipments, setIsSyncingAllShipments] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [quickEightDigitCode, setQuickEightDigitCode] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleQuickApproveEightDigitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickEightDigitCode.trim().replace(/\s+/g, '');
    if (!clean) {
      showToast('Please enter the 8-digit code generated by the rider.', 'error');
      return;
    }
    const approver = `${currentUser.name} (${currentRole.replace('_', ' ')})`;
    const res = approveRiderCashRemittance(
      clean,
      approver,
      `8-digit code ${clean} verified and cash approved by ${approver}`
    );
    if (res.success) {
      showToast(res.message, 'success');
      setQuickEightDigitCode('');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTestShiprocketConnection = async () => {
    setIsTestingShiprocket(true);
    try {
      const res = await authenticateShiprocket();
      if (res.token) {
        showToast(
          res.isSimulated
            ? `Shiprocket Connected (Demo Mode): Token generated. ${res.message}`
            : `Shiprocket Live API Connected! Authenticated for ${res.email}`,
          'success'
        );
      } else {
        showToast('Shiprocket authentication returned no token', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Shiprocket test connection failed', 'error');
    } finally {
      setIsTestingShiprocket(false);
    }
  };

  const handleSyncAllShiprocketOrders = async () => {
    const shiprocketOrders = orders.filter(
      (o) =>
        o.dispatchDetails?.fulfillmentType === 'express_partner' &&
        o.dispatchDetails?.carrier === 'Shiprocket' &&
        o.dispatchDetails?.awbNumber &&
        o.orderStatus !== 'delivered' &&
        o.orderStatus !== 'cancelled'
    );

    if (shiprocketOrders.length === 0) {
      showToast('No active in-transit Shiprocket orders to sync right now.', 'success');
      return;
    }

    setIsSyncingAllShipments(true);
    let successCount = 0;

    for (const order of shiprocketOrders) {
      try {
        const res = await syncShiprocketOrderStatus(order.id, order.dispatchDetails!.awbNumber);
        if (res.success) successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    setIsSyncingAllShipments(false);
    showToast(`Successfully synchronized status for ${successCount} Shiprocket shipments!`, 'success');
  };

  // High-level financial KPIs
  const codOrders = orders.filter((o) => o.paymentMethod === 'cod' || o.dispatchDetails?.isCod);

  const totalRiderCashInHand = ridersList.reduce((sum, r) => sum + (r.codCashInHand || 0), 0);

  const pendingCarrierOrders = codOrders.filter(
    (o) =>
      o.dispatchDetails?.fulfillmentType === 'express_partner' &&
      o.orderStatus === 'delivered' &&
      o.dispatchDetails?.codCollectedStatus !== 'settled_to_admin'
  );
  const totalPendingCarrierCod = pendingCarrierOrders.reduce((sum, o) => sum + o.finalTotal, 0);

  const totalCarrierCodSettled = carrierSettlements.reduce((sum, s) => sum + s.netAmountCredited, 0);

  const pendingRtoOrders = orders.filter(
    (o) =>
      o.rtoRequest?.status === 'pending_store_approval' ||
      o.rtoRequest?.status === 'pending' ||
      o.orderStatus === 'return_requested'
  );
  const unassignedPendingOrders = orders.filter(
    (o) =>
      (o.orderStatus === 'confirmed' || o.orderStatus === 'processing' || o.orderStatus === 'packed') &&
      !o.assignedDeliveryStaffId &&
      o.dispatchDetails?.fulfillmentType !== 'express_partner'
  );

  const pendingRemittancesCount = riderRemittances.filter((r) => r.status === 'pending_approval').length;
  const pendingTransferRiders = ridersList.filter((r) => r.pendingStoreTransfer?.status === 'pending');

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    const res = updateDeliveryPartnerConfig(editingPartner.id, editingPartner);
    showToast(res.message);
    setIsPartnerModalOpen(false);
  };

  const handleAutoAssignOrders = () => {
    setIsAutoAssigning(true);
    setTimeout(() => {
      const res = autoAssignOrdersToRiders();
      setIsAutoAssigning(false);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    }, 400);
  };

  const handleExecuteStoreTransfer = (rider: InHouseRider, targetOutletId: string) => {
    const targetOutlet = outlets.find((o) => o.id === targetOutletId);
    if (!targetOutlet) {
      showToast('Please select a valid destination store outlet.', 'error');
      return;
    }
    const res = transferRiderStore(rider.id, targetOutlet.id, targetOutlet.name);
    if (res.success) {
      showToast(res.message, 'success');
      setTransferringRider(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleApproveStoreTransfer = (riderId: string) => {
    const res = approveRiderStoreTransfer(riderId);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRejectStoreTransfer = (riderId: string) => {
    const res = rejectRiderStoreTransfer(riderId, 'Declined by store manager due to current zone delivery load.');
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleApproveRto = (order: Order) => {
    const approver = `${currentUser.name} (Admin)`;
    const res = reviewOrderRto(
      order.id,
      'approved',
      `RTO Approved by ${approver}: Verified customer unreachable / wrong address. Return package to store inventory.`
    );
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRejectRtoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRtoOrder) return;
    const res = reviewOrderRto(
      rejectingRtoOrder.id,
      'rejected',
      adminRtoRejectionNote.trim() || 'Store confirmed customer is available at delivery location. Re-attempt delivery immediately.'
    );
    if (res.success) {
      showToast(`RTO request rejected. Rider instructed to re-deliver: ${rejectingRtoOrder.id}`, 'success');
      setRejectingRtoOrder(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleAddRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName.trim() || !newRiderPhone.trim()) {
      showToast('Please enter Rider Full Name and Mobile Phone.', 'error');
      return;
    }

    const targetOutlet = outlets.find((o) => o.name === newRiderOutlet) || outlets[0];
    const outletId = targetOutlet ? targetOutlet.id : 'out_1';
    const outletName = targetOutlet ? targetOutlet.name : newRiderOutlet;

    const res = onboardNewRider({
      name: newRiderName.trim(),
      phone: newRiderPhone.trim(),
      email: newRiderEmail.trim() || undefined,
      password: newRiderPassword.trim() || undefined,
      vehicleNo: newRiderVehicle.trim() || 'MH 48 AA 1234 (Hero Electric)',
      outletId,
      outletName,
      aadharNumber: newRiderAadhar.trim() || '5412 8890 2341',
      panNumber: newRiderPan.trim() || 'ABCDE1234F',
      bankAccountNo: newRiderBankAcc.trim() || '987654321012',
      ifscCode: newRiderIfsc.trim() || 'HDFC0001234',
      selfieUrl: newRiderSelfie || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    });

    if (res.success) {
      showToast(res.message, 'success');
      setNewRiderName('');
      setNewRiderPhone('');
      setNewRiderEmail('');
      setNewRiderPassword('');
      setNewRiderVehicle('');
      setNewRiderAadhar('');
      setNewRiderPan('');
      setNewRiderBankAcc('');
      setNewRiderIfsc('');
      setNewRiderSelfie('');
      setShowAddRiderModal(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top duration-200 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header & Stats Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Delivery, Riders &amp; COD Center
            </h2>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Active Partners
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">
              {deliveryPartners.filter((p) => p.status === 'connected').length}{' '}
              <span className="text-xs font-semibold text-slate-500">/ {deliveryPartners.length}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
              In-House Riders
            </span>
            <div className="text-lg sm:text-xl font-black text-blue-900 font-mono mt-0.5">
              {ridersList.length}{' '}
              <span className="text-[11px] font-semibold text-blue-700">({formatINR(totalRiderCashInHand)} Cash)</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Pending Carrier COD
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-950 font-mono mt-0.5">
              {formatINR(totalPendingCarrierCod)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Settled Carrier COD
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-950 font-mono mt-0.5">
              {formatINR(totalCarrierCodSettled)}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('partners')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'partners'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-blue-400" />
          <span>Express Delivery Partners (Shiprocket &amp; 3P)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('riders')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'riders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>In-House Riders &amp; Cash in Hand ({ridersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('earning_structure')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSubTab === 'earning_structure'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-2xs'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Rider Earning Structure</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('slot_management')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSubTab === 'slot_management'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-2xs'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Slot Management ({riderSlots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rider_payouts')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeSubTab === 'rider_payouts'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-2xs'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rider Payout Module ({riderPayouts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('remittances')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeSubTab === 'remittances'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rider Cash Remittances &amp; QR Approvals</span>
          {pendingRemittancesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
              {pendingRemittancesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rto_review')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeSubTab === 'rto_review'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>RTO Return Requests</span>
          {pendingRtoOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingRtoOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('carrier_settlement')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'carrier_settlement'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          <span>Partner COD Settlements to Bank ({carrierSettlements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cod_ledger')}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cod_ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-amber-400" />
          <span>Master COD Orders Register ({codOrders.length})</span>
        </button>
      </div>

      {/* EARNING STRUCTURE, SLOT MANAGEMENT & RIDER PAYOUT MODULE SUBTABS */}
      {(activeSubTab === 'earning_structure' ||
        activeSubTab === 'slot_management' ||
        activeSubTab === 'rider_payouts') && (
        <RiderEarningSlotPayoutModule
          key={activeSubTab}
          initialSection={
            activeSubTab === 'slot_management'
              ? 'slots'
              : activeSubTab === 'rider_payouts'
              ? 'payouts'
              : 'structure'
          }
        />
      )}

      {/* SUBTAB 1: DELIVERY PARTNERS (SHIPROCKET & 3P) */}
      {activeSubTab === 'partners' && (
        <div className="space-y-4">
          {/* Shiprocket Quick Action Bar */}
          <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm flex items-center gap-1.5 text-blue-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Shiprocket API Engine &amp; Real-Time Sync
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  AWB Generation Ready
                </span>
              </div>
              <p className="text-xs text-blue-100/80 max-w-xl">
                Automatically create shipments on Shiprocket, assign express courier partners, generate printable AWB numbers, and synchronize delivery milestones with order status.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleTestShiprocketConnection}
                disabled={isTestingShiprocket}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingShiprocket ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Test API Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAllShiprocketOrders}
                disabled={isSyncingAllShipments}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncingAllShipments ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync Active Shipments</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryPartners.map((dp) => (
              <div
                key={dp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                        {dp.partnerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{dp.partnerName}</h4>
                          {dp.isDefault && (
                            <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Default Carrier
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Channel: {dp.channelId || 'Standard Channel'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dp.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : dp.status === 'testing'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {dp.status === 'connected' ? 'CONNECTED 🟢' : dp.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                    <p>
                      <strong>Warehouse Pickup:</strong> {dp.pickupLocation}
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Auto-Generate AWB:</span>
                      <span className={dp.autoGenerateAwb ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                        {dp.autoGenerateAwb ? 'Enabled (Instant)' : 'Manual Entry'}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Total Shipments Dispatched:</span>
                      <span className="font-mono font-bold text-slate-900">{dp.totalShipmentsDispatched}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sync: {new Date(dp.lastConnectedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultSettlementCarrier(dp.partnerName);
                        setShowCarrierSettlementModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Record COD payout from this carrier"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Settle COD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPartner(dp);
                        setIsPartnerModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs flex items-center gap-1 border border-blue-200 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>API Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: IN-HOUSE RIDERS FLEET & ONBOARDING */}
      {activeSubTab === 'riders' && (
        <div className="space-y-4">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>In-House Riders ({ridersList.length})</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAutoAssignOrders}
                disabled={isAutoAssigning || unassignedPendingOrders.length === 0}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAutoAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Zap className="w-4 h-4 text-slate-950 fill-current" />
                )}
                <span>Auto-Assign Orders ({unassignedPendingOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddRiderModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboarding For New Rider</span>
              </button>
            </div>
          </div>

          {/* Pending Rider Store Transfer Requests Alert Banner */}
          {pendingTransferRiders.length > 0 && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>Pending Store Transfer Requests from Riders ({pendingTransferRiders.length})</span>
                </div>
                <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                  Requires Admin Approval
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingTransferRiders.map((rider) => (
                  <div
                    key={rider.id}
                    className="p-3 bg-white rounded-lg border border-indigo-100 shadow-xs flex flex-col justify-between text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{rider.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rider.pendingStoreTransfer?.requestedAt ? new Date(rider.pendingStoreTransfer.requestedAt).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] space-y-0.5">
                        <p><strong>Current:</strong> {rider.outletName}</p>
                        <p className="text-indigo-700 font-semibold">
                          <strong>Target Outlet:</strong> {rider.pendingStoreTransfer?.targetOutletName}
                        </p>
                        {rider.pendingStoreTransfer?.reason && (
                          <p className="text-slate-500 italic">
                            &quot;{rider.pendingStoreTransfer.reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRejectStoreTransfer(rider.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveStoreTransfer(rider.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Transfer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riders List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ridersList.map((rider) => {
              const hasCash = (rider.codCashInHand || 0) > 0;
              const earnings = rider.earnings || {
                slotBased: 600,
                orderBased: 1440,
                incentiveBased: 350,
                surgeBased: 200,
                milestoneBased: 500,
                distanceBased: 760,
                total: 3850,
              };

              return (
                <div
                  key={rider.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {rider.selfieUrl ? (
                          <img
                            src={rider.selfieUrl}
                            alt={rider.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-base border border-indigo-200">
                            {rider.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{rider.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                rider.isOnline
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              {rider.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-blue-500" /> {rider.phone}
                          </span>
                          {rider.email && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {rider.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rider.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rider.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Operational Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="flex items-center justify-between">
                        <strong>Assigned Store:</strong>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">{rider.outletName}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <strong>Vehicle:</strong>
                        <span>{rider.vehicleNo}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <strong>Active Deliveries:</strong>
                        <span className="font-bold text-blue-700">{rider.activeDeliveriesCount} on the road</span>
                      </p>
                    </div>

                    {/* KYC Credentials */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Aadhar No:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {rider.aadharNumber ? `•••• •••• ${rider.aadharNumber.slice(-4)}` : '•••• 2341'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>PAN No:</span>
                        <span className="font-mono font-bold text-slate-800">{rider.panNumber || 'ABCDE1234F'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Bank &amp; IFSC:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          A/C ••••{rider.bankAccountNo ? rider.bankAccountNo.slice(-4) : '1012'} ({rider.ifscCode || 'HDFC0001234'})
                        </span>
                      </div>
                    </div>

                    {/* Multi-Tier Earnings Breakdown */}
                    <div className="bg-linear-to-br from-indigo-50/50 to-purple-50/40 p-3 rounded-xl border border-indigo-100 text-xs">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-indigo-200/50">
                        <span className="font-black text-indigo-950 flex items-center gap-1 text-[11px]">
                          <Banknote className="w-3.5 h-3.5 text-indigo-600" />
                          Rider Earnings Breakdown
                        </span>
                        <span className="font-black text-indigo-700 font-mono text-sm">
                          {formatINR(earnings.total || 0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Slot</span>
                          <span className="font-bold font-mono text-slate-800">{formatINR(earnings.slotBased || 0)}</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Per Order</span>
                          <span className="font-bold font-mono text-slate-800">{formatINR(earnings.orderBased || 0)}</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Incentives</span>
                          <span className="font-bold font-mono text-emerald-700">{formatINR(earnings.incentiveBased || 0)}</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Surge</span>
                          <span className="font-bold font-mono text-amber-700">{formatINR(earnings.surgeBased || 0)}</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Milestones</span>
                          <span className="font-bold font-mono text-purple-700">{formatINR(earnings.milestoneBased || 0)}</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block">Distance</span>
                          <span className="font-bold font-mono text-blue-700">{formatINR(earnings.distanceBased || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cash in Hand Highlight Card */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      hasCash
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block">
                          COD Cash Held in Hand
                        </span>
                        <div className="font-mono text-base font-black mt-0.5">
                          {formatINR(rider.codCashInHand || 0)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSubmittingRiderCash(rider)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Create 8-digit cash deposit code for any specific amount"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Deposit Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Store Transfer Action */}
                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      ID: {rider.id}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setTransferringRider(rider);
                        setSelectedTargetOutletId(outlets[0]?.id || '');
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer Store</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: RTO RETURN REQUESTS REVIEW QUEUE */}
      {activeSubTab === 'rto_review' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>RTO (Return to Origin) Store Review Queue</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review rider RTO requests. If valid, approve package return to store. If rider wrongly requested or customer is reachable, reject RTO to send an instant re-delivery instruction popup to the rider!
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {pendingRtoOrders.length} Pending Review
            </span>
          </div>

          {pendingRtoOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700">No Pending RTO Requests</p>
              <p className="mt-1 text-slate-400">
                All assigned deliveries are either completed or in transit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRtoOrders.map((order) => {
                const rto = order.rtoRequest;
                const reasonLabels: Record<string, string> = {
                  customer_not_answering: 'Customer Not Answering Call',
                  address_not_found: 'Customer Address Not Found',
                  wrong_address: 'Wrong Address Provided',
                  wrong_order_placed: 'Wrong Order Placed / Duplicate',
                  customer_not_accepting: 'Customer Refused / Not Accepting Order',
                  customer_rescheduled_cancel: 'Customer Requested Reschedule / Cancel',
                };

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {order.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            RTO REQUESTED
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Requested at: {rto?.requestedAt ? new Date(rto.requestedAt).toLocaleString() : 'Just now'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Order Total:</span>
                        <span className="font-mono font-black text-slate-900 text-base">
                          {formatINR(order.finalTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Customer: {order.customer.name}</span>
                        </p>
                        <p className="font-mono text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-500" />
                          <a href={`tel:${order.shippingAddress?.phone || order.customer.phone}`} className="hover:underline text-blue-600">
                            {order.shippingAddress?.phone || order.customer.phone}
                          </a>
                        </p>
                        <p className="text-slate-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            {order.shippingAddress?.addressLine || 'Address'}, {order.shippingAddress?.city || 'Nalasopara'} - {order.shippingAddress?.pincode || '401209'}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <p className="font-bold text-rose-900">
                          <strong>Reported Reason:</strong>{' '}
                          <span className="text-rose-700">
                            {rto ? reasonLabels[rto.reason] || rto.reason : 'Customer issue'}
                          </span>
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Rider Notes:</strong> {rto?.riderNotes || 'No notes provided'}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          <strong>Assigned Rider:</strong> {order.deliveryStaffName || order.assignedDeliveryStaffId || 'In-House Courier'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-rose-100">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingRtoOrder(order);
                          setAdminRtoRejectionNote(
                            'Customer contacted by store support and confirmed available at address. Please call customer and complete delivery.'
                          );
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reject RTO &amp; Send Delivery Instruction</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveRto(order)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve RTO Return to Store</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: RIDER CASH REMITTANCES & QR APPROVALS */}
      {activeSubTab === 'remittances' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Rider Cash Remittances &amp; 8-Digit Code Approval</span>
            </h3>

            <form
              onSubmit={handleQuickApproveEightDigitCode}
              className="flex items-center gap-2 flex-wrap"
            >
              <input
                type="text"
                value={quickEightDigitCode}
                onChange={(e) => setQuickEightDigitCode(e.target.value)}
                placeholder="Enter 8-digit code"
                className="w-44 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Cash</span>
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Remittance ID</th>
                  <th className="py-2.5 px-3">Rider Name</th>
                  <th className="py-2.5 px-3 font-mono">Amount</th>
                  <th className="py-2.5 px-3">Submission System</th>
                  <th className="py-2.5 px-3 font-mono text-center">QR Token</th>
                  <th className="py-2.5 px-3">Store Counter</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {riderRemittances.map((remit) => {
                  const isApproved = remit.status === 'approved';
                  const isPending = remit.status === 'pending_approval';

                  return (
                    <tr key={remit.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {remit.id}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {new Date(remit.submittedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{remit.riderName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{remit.riderPhone}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                        {formatINR(remit.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-semibold text-slate-700">
                          {remit.submissionMethod === 'cash_deposit' ? 'Cash Counter Handover' : 'UPI QR Remittance'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-center">
                        <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                          {remit.remittanceCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {remit.outletName}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved ? 'APPROVED & CREDITED 🟢' : isPending ? 'PENDING STORE APPROVAL ⏳' : 'REJECTED ❌'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetRemittanceForApprove(remit);
                              setShowQrScanApproveModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs"
                          >
                            Approve Cash
                          </button>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Receipt: {remit.receiptNumber || 'N/A'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: EXPRESS CARRIER COD SETTLEMENTS (SHIPROCKET) */}
      {activeSubTab === 'carrier_settlement' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Express Partner COD Settlements to Admin Bank</span>
              </h3>
              <p className="text-xs text-slate-500">
                Log and reconcile periodic COD cash payouts from Shiprocket, Delhivery, etc., with Bank UTR reference and courier deductions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDefaultSettlementCarrier('Shiprocket');
                setShowCarrierSettlementModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manually Record Carrier COD Received</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Settlement ID</th>
                  <th className="py-2.5 px-3">Carrier Partner</th>
                  <th className="py-2.5 px-3 font-mono">Bank UTR / Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 font-mono text-right">Gross COD</th>
                  <th className="py-2.5 px-3 font-mono text-right text-rose-600">Deductions</th>
                  <th className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700">Net Bank Credit</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3">Settled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {carrierSettlements.map((settle) => (
                  <tr key={settle.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{settle.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {settle.carrier} Express
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {settle.bankUtrNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {settle.settlementDate}
                    </td>
                    <td className="py-3 px-3 font-mono text-right text-slate-900">
                      {formatINR(settle.grossCodCollected)}
                    </td>
                    <td className="py-3 px-3 font-mono text-right text-rose-600">
                      -{formatINR(settle.carrierDeductions)}
                    </td>
                    <td className="py-3 px-3 font-mono text-right font-black text-emerald-700 text-sm">
                      {formatINR(settle.netAmountCredited)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                        {settle.orderIds.length} AWBs
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {settle.settledBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: MASTER COD ORDERS REGISTER */}
      {activeSubTab === 'cod_ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Cash on Delivery (COD) Master Reconciliation Register</span>
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end audit trail: Doorstep Cash Handover → Rider Store Remittance → Shiprocket Bank Settlement.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All COD Orders' },
                { id: 'pending', label: 'Pending Doorstep' },
                { id: 'collected', label: 'Collected' },
                { id: 'remitted', label: 'Remitted by Rider' },
                { id: 'settled_to_admin', label: 'Settled to Bank 🟢' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCodStatusFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    codStatusFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 font-mono">COD Amount</th>
                  <th className="py-2.5 px-3">Fulfillment Type</th>
                  <th className="py-2.5 px-3">AWB / Courier Ref</th>
                  <th className="py-2.5 px-3 text-center">Settlement Status</th>
                  <th className="py-2.5 px-3">Settlement / UTR Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {codOrders
                  .filter((order) => {
                    if (codStatusFilter === 'all') return true;
                    const status = order.dispatchDetails?.codCollectedStatus || (order.paymentStatus === 'verified_paid' ? 'collected' : 'pending');
                    return status === codStatusFilter;
                  })
                  .map((order) => {
                    const dispatch = order.dispatchDetails;
                    const status = dispatch?.codCollectedStatus || (order.paymentStatus === 'verified_paid' ? 'collected' : 'pending');

                    return (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{order.id}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{order.customer.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{order.customer.phone}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {formatINR(order.finalTotal)}
                        </td>
                        <td className="py-3 px-3">
                          {dispatch ? (
                            dispatch.fulfillmentType === 'express_partner' ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {dispatch.carrier} Express
                              </span>
                            ) : (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                Rider: {dispatch.riderName}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {dispatch?.awbNumber || (dispatch?.riderOtp ? `OTP: ${dispatch.riderOtp}` : '—')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'settled_to_admin'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : status === 'remitted'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : status === 'collected'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {status === 'settled_to_admin'
                              ? 'SETTLED TO ADMIN BANK 🟢'
                              : status === 'remitted'
                              ? 'REMITTED BY RIDER TO STORE 🏦'
                              : status === 'collected'
                              ? 'COLLECTED AT DOORSTEP 💵'
                              : 'PENDING DOORSTEP COLLECTION ⏳'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {dispatch?.carrierSettlementUtr ? (
                            <span className="text-emerald-700 font-bold">
                              UTR: {dispatch.carrierSettlementUtr}
                            </span>
                          ) : dispatch?.riderRemittanceId ? (
                            <span className="text-blue-700 font-bold">
                              Remit: {dispatch.riderRemittanceId}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {isPartnerModalOpen && editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Configure {editingPartner.partnerName} Connection &amp; Credentials
              </h3>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">API User Email</label>
                <input
                  type="email"
                  value={editingPartner.apiEmail || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, apiEmail: e.target.value })}
                  placeholder="e.g. logistics@electromart.in"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">API Live Token / Secret Key</label>
                <input
                  type="password"
                  value={editingPartner.apiKey || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, apiKey: e.target.value })}
                  placeholder="sr_live_token_..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Pickup Warehouse Location</label>
                <input
                  type="text"
                  value={editingPartner.pickupLocation}
                  onChange={(e) => setEditingPartner({ ...editingPartner, pickupLocation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Live Tracking Webhook URL</label>
                <input
                  type="url"
                  value={editingPartner.webhookUrl || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner.autoGenerateAwb}
                    onChange={(e) => setEditingPartner({ ...editingPartner, autoGenerateAwb: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">Auto-Generate AWB via API</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner.isDefault}
                    onChange={(e) => setEditingPartner({ ...editingPartner, isDefault: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">Set as Default Express Partner</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Partner Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding For New Rider Modal */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Onboarding For New Rider</h3>
                  <p className="text-xs text-slate-500">
                    Register in-house rider with verified KYC, banking credentials, login access &amp; base outlet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRiderModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRiderSubmit} className="space-y-4 text-xs">
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohd Danish Khan"
                    value={newRiderName}
                    onChange={(e) => setNewRiderName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 94150 12345"
                    value={newRiderPhone}
                    onChange={(e) => setNewRiderPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Email & Password for Login */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="font-black text-indigo-950 flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Rider Portal Login Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email ID for Login *</label>
                    <input
                      type="email"
                      required
                      placeholder="rider.danish@javed-electronics.in"
                      value={newRiderEmail}
                      onChange={(e) => setNewRiderEmail(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Password for Login *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter secure password"
                      value={newRiderPassword}
                      onChange={(e) => setNewRiderPassword(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: KYC Details (Aadhar & PAN) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Government KYC Identity
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Aadhar Number (12 Digits) *</label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      placeholder="5412 8890 2341"
                      value={newRiderAadhar}
                      onChange={(e) => setNewRiderAadhar(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">PAN Card Number (10 Characters) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={newRiderPan}
                      onChange={(e) => setNewRiderPan(e.target.value.toUpperCase())}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono uppercase text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Bank Account & IFSC */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Bank Account &amp; Payout Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="987654321012"
                      value={newRiderBankAcc}
                      onChange={(e) => setNewRiderBankAcc(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="HDFC0001234"
                      value={newRiderIfsc}
                      onChange={(e) => setNewRiderIfsc(e.target.value.toUpperCase())}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono uppercase text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Store Name & Vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Name (Assigned Outlet) *</label>
                  <select
                    value={newRiderOutlet}
                    onChange={(e) => setNewRiderOutlet(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                  >
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.name}>
                        {outlet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Registration &amp; Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="MH 48 AA 1234 (Hero Electric)"
                    value={newRiderVehicle}
                    onChange={(e) => setNewRiderVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Row 6: Live Selfie Capture / Upload Preview */}
              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  Live Selfie Verification
                </span>
                <div className="flex items-center gap-4">
                  {newRiderSelfie ? (
                    <img
                      src={newRiderSelfie}
                      alt="Selfie Preview"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[10px] text-slate-500">
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span>No Selfie</span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const demoPhotos = [
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
                          ];
                          const randomPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
                          setNewRiderSelfie(randomPhoto);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Live Selfie</span>
                      </button>

                      {newRiderSelfie && (
                        <button
                          type="button"
                          onClick={() => setNewRiderSelfie('')}
                          className="px-2 py-1.5 text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Face must be clearly visible without sunglasses or helmet for security badge issuance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <BadgeCheck className="w-4 h-4 text-emerald-300" />
                  <span>Complete Rider Onboarding</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Transfer Rider to Store Modal */}
      {transferringRider && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Transfer Rider to Another Store Outlet</span>
              </h3>
              <button
                type="button"
                onClick={() => setTransferringRider(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p><strong>Rider:</strong> {transferringRider.name} ({transferringRider.phone})</p>
                <p className="text-slate-500 mt-0.5"><strong>Current Base Store:</strong> {transferringRider.outletName}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Destination Store Outlet *
                </label>
                <select
                  value={selectedTargetOutletId}
                  onChange={(e) => setSelectedTargetOutletId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setTransferringRider(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteStoreTransfer(transferringRider, selectedTargetOutletId)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reject RTO & Instruct Re-Delivery Modal */}
      {rejectingRtoOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject RTO &amp; Send Delivery Instruction to Rider</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingRtoOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectRtoSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p><strong>Order ID:</strong> {rejectingRtoOrder.id}</p>
                <p><strong>Customer:</strong> {rejectingRtoOrder.customer.name} ({rejectingRtoOrder.shippingAddress?.phone || rejectingRtoOrder.customer.phone})</p>
                <p><strong>Reported RTO Reason:</strong> {rejectingRtoOrder.rtoRequest?.reason.replace(/_/g, ' ').toUpperCase()}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Manager Delivery Instruction (Will pop up immediately on Rider App) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adminRtoRejectionNote}
                  onChange={(e) => setAdminRtoRejectionNote(e.target.value)}
                  placeholder="e.g. Customer contacted by store support and confirmed available at address. Please call customer and complete delivery."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  When you submit, this order will return to active delivery and the rider will receive an urgent popup modal with your instructions and customer contact button.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectingRtoOrder(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Send Delivery Instruction Popup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Rider Cash Submission (Counter Handover or UPI QR) */}
      {submittingRiderCash && (
        <RiderCashSubmitModal
          rider={submittingRiderCash}
          isOpen={Boolean(submittingRiderCash)}
          onClose={() => setSubmittingRiderCash(null)}
          onSuccess={() => {
            setSubmittingRiderCash(null);
            showToast('Rider cash submission processed successfully!');
          }}
        />
      )}

      {/* Modal 2: Store Scan & Approve QR Token */}
      {showQrScanApproveModal && (
        <RiderQrScanApproveModal
          isOpen={showQrScanApproveModal}
          preSelectedRemittance={targetRemittanceForApprove}
          onClose={() => {
            setShowQrScanApproveModal(false);
            setTargetRemittanceForApprove(null);
          }}
          onSuccess={() => {
            setShowQrScanApproveModal(false);
            setTargetRemittanceForApprove(null);
            showToast('Cash remittance approved and credited to store cash drawer!');
          }}
        />
      )}

      {/* Modal 3: Carrier COD Settlement to Admin Bank */}
      {showCarrierSettlementModal && (
        <CarrierCodSettlementModal
          isOpen={showCarrierSettlementModal}
          defaultCarrier={defaultSettlementCarrier}
          onClose={() => setShowCarrierSettlementModal(false)}
          onSuccess={() => {
            setShowCarrierSettlementModal(false);
            showToast('Carrier COD payout reconciled and credited to Admin bank account!');
          }}
        />
      )}
    </div>
  );
};
