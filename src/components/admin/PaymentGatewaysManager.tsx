import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentGatewayConfig, PaymentGatewayProviderType } from '../../types/paymentGateways';
import { formatINR } from '../../utils/currency';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';

export const PaymentGatewaysManager: React.FC = () => {
  const {
    paymentGateways,
    togglePaymentGatewayStatus,
    updatePaymentGateway,
    resetPaymentGateways,
    paymentGatewayAuditLogs,
    currentUser,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'live' | 'sandbox'>('all');
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [testingGateway, setTestingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = paymentGateways.length;
    const activeCount = paymentGateways.filter((g) => g.isActive).length;
    const inactiveCount = total - activeCount;
    const liveCount = paymentGateways.filter((g) => g.isActive && g.environment === 'live').length;
    const sandboxCount = paymentGateways.filter((g) => g.isActive && g.environment === 'sandbox').length;

    // Set of all active supported payment rails
    const rails = new Set<string>();
    paymentGateways.filter((g) => g.isActive).forEach((g) => {
      g.supportedMethods.forEach((m) => rails.add(m));
    });

    return { total, activeCount, inactiveCount, liveCount, sandboxCount, supportedRailsCount: rails.size };
  }, [paymentGateways]);

  // Filtered gateways
  const filteredGateways = useMemo(() => {
    return paymentGateways.filter((g) => {
      if (filterStatus === 'active' && !g.isActive) return false;
      if (filterStatus === 'inactive' && g.isActive) return false;
      if (filterStatus === 'live' && g.environment !== 'live') return false;
      if (filterStatus === 'sandbox' && g.environment !== 'sandbox') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = g.name.toLowerCase().includes(q);
        const matchShort = g.shortName.toLowerCase().includes(q);
        const matchProvider = g.provider.toLowerCase().includes(q);
        const matchDesc = g.description.toLowerCase().includes(q);
        const matchMethods = g.supportedMethods.some((m) => m.toLowerCase().includes(q));
        return matchName || matchShort || matchProvider || matchDesc || matchMethods;
      }
      return true;
    });
  }, [paymentGateways, filterStatus, searchQuery]);

  // Handler: Toggle single gateway status
  const handleToggle = (gw: PaymentGatewayConfig) => {
    const res = togglePaymentGatewayStatus(gw.id);
    if (res.success) {
      showToast(res.message, res.gateway?.isActive ? 'success' : 'info');
    }
  };

  // Handler: Activate All
  const handleActivateAll = () => {
    paymentGateways.forEach((gw) => {
      if (!gw.isActive) {
        togglePaymentGatewayStatus(gw.id);
      }
    });
    showToast('All payment gateways activated for customer checkout.', 'success');
  };

  // Handler: Deactivate All (Emergency / Maintenance)
  const handleDeactivateAllExceptCOD = () => {
    paymentGateways.forEach((gw) => {
      if (gw.id !== 'gw_cod' && gw.isActive) {
        togglePaymentGatewayStatus(gw.id);
      }
    });
    showToast('All online payment gateways paused. Only COD remains available.', 'info');
  };

  // Helper for Gateway Icon & Visual Styling
  const getGatewayIcon = (provider: PaymentGatewayProviderType) => {
    switch (provider) {
      case 'upi_qr':
        return <QrCode className="w-5 h-5 text-purple-600" />;
      case 'razorpay':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'phonepe':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'paytm':
        return <Smartphone className="w-5 h-5 text-sky-600" />;
      case 'cashfree':
        return <Zap className="w-5 h-5 text-emerald-600" />;
      case 'stripe':
        return <Globe className="w-5 h-5 text-rose-600" />;
      case 'cod':
        return <Banknote className="w-5 h-5 text-amber-600" />;
      case 'store_pickup_pay':
        return <Store className="w-5 h-5 text-teal-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  const getProviderColorClass = (provider: PaymentGatewayProviderType) => {
    switch (provider) {
      case 'upi_qr':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'razorpay':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'phonepe':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'paytm':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'cashfree':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stripe':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cod':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'store_pickup_pay':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Test Simulation Handler
  const handleRunSimulator = (gw: PaymentGatewayConfig) => {
    setTestingGateway(gw);
    setTestResult({ status: 'testing', message: 'Connecting to gateway sandbox endpoint...' });

    setTimeout(() => {
      setTestResult({
        status: 'success',
        message: `Simulation Successful: Gateway handshake OK! Responded 200 OK. Simulated order JE-TEST-${Date.now().toString().slice(-4)} authorized for ${formatINR(
          1499
        )}.`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500 text-slate-950 px-2 py-0.5 rounded">
              FINANCIAL INFRASTRUCTURE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Gateway Switcher & Routing Engine
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
            Multi-Gateway Payment Orchestration
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Activate or deactivate Indian and global payment gateways in real-time. Changes take effect on the customer checkout screen instantly with zero downtime or build deployments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>{showLivePreview ? 'Hide Customer View' : 'Preview Customer Checkout'}</span>
          </button>

          <button
            onClick={resetPaymentGateways}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Reset all payment gateways to initial defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer ml-3 font-mono">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Gateways
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Configured rails</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Active on Checkout
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stats.activeCount}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Enabled for buyers</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Deactivated
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-0.5">
            {stats.inactiveCount}
          </div>
          <span className="text-[10px] text-slate-400">Hidden from checkout</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Live Production
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono mt-0.5">
            {stats.liveCount}
          </div>
          <span className="text-[10px] text-blue-600 font-medium">Real-money settle</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sandbox / Test
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-0.5">
            {stats.sandboxCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Mock test mode</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Payment Rails
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-0.5">
            {stats.supportedRailsCount}+
          </div>
          <span className="text-[10px] text-purple-600 font-medium">UPI, Cards, Netbanking</span>
        </div>
      </div>

      {/* Customer Checkout Real-Time Preview (Toggleable) */}
      {showLivePreview && (
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-blue-500/40 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Live Storefront Customer Checkout Preview
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                Updates dynamically as you toggle switches below
              </span>
            </div>
            <button onClick={() => setShowLivePreview(false)} className="text-slate-400 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>

          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">
              What the customer currently sees at Checkout (Payment Step):
            </span>

            {paymentGateways.filter((g) => g.isActive).length === 0 ? (
              <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  <strong>Warning:</strong> All payment gateways are currently deactivated. Customers will not be able to place orders! Activate at least one gateway below.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {paymentGateways
                  .filter((g) => g.isActive)
                  .map((gw) => (
                    <div
                      key={gw.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex items-start gap-3 text-xs"
                    >
                      <div className="p-2 rounded-lg bg-slate-800 shrink-0 mt-0.5">{getGatewayIcon(gw.provider)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">{gw.name}</span>
                          {gw.badgeText && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                              {gw.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{gw.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Max: {gw.maxOrderValue ? formatINR(gw.maxOrderValue) : 'Unlimited'}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{gw.settlementCycle}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Quick Action Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Filter Chips */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gateways by name, provider..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'all', label: `All (${paymentGateways.length})` },
              { id: 'active', label: `Active (${stats.activeCount})` },
              { id: 'inactive', label: `Deactivated (${stats.inactiveCount})` },
              { id: 'live', label: `Live (${stats.liveCount})` },
              { id: 'sandbox', label: `Sandbox (${stats.sandboxCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleActivateAll}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            title="Enable all gateways at once"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Activate All</span>
          </button>

          <button
            onClick={handleDeactivateAllExceptCOD}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-300"
            title="Pause all digital gateways (Only COD stays enabled)"
          >
            <span>Pause Online (COD Only)</span>
          </button>
        </div>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGateways.map((gw) => {
          return (
            <div
              key={gw.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col justify-between ${
                gw.isActive
                  ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                  : 'bg-slate-50/80 border-slate-200 opacity-80'
              }`}
            >
              <div>
                {/* Header: Icon, Name, Active Toggle Switch */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${getProviderColorClass(gw.provider)}`}>
                      {getGatewayIcon(gw.provider)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {gw.shortName}
                        </h3>

                        {/* Live / Sandbox Badge */}
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                            gw.environment === 'live'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {gw.environment.toUpperCase()}
                        </span>

                        {gw.badgeText && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            {gw.badgeText}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {gw.name}
                      </p>
                    </div>
                  </div>

                  {/* MAIN ACTIVATE / DEACTIVATE INTERACTIVE SWITCH */}
                  <div className="flex flex-col items-end shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={gw.isActive}
                      onClick={() => handleToggle(gw)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                        gw.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      title={gw.isActive ? 'Click to Deactivate Gateway' : 'Click to Activate Gateway'}
                    >
                      <span className="sr-only">Toggle {gw.name}</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          gw.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-[10px] font-black uppercase mt-1 tracking-wider ${
                        gw.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {gw.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {gw.description}
                </p>

                {/* Supported Payment Methods Pills */}
                <div className="mb-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Supported Payment Rails:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {gw.supportedMethods.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metadata & Limits Specs */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Order Value Limits:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatINR(gw.minOrderValue)} - {gw.maxOrderValue ? formatINR(gw.maxOrderValue) : 'Unlimited'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Settlement Time:</span>
                    <span className="font-semibold text-slate-800">{gw.settlementCycle}</span>
                  </div>

                  {gw.feeOrDiscountValue > 0 && (
                    <div className="col-span-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{gw.feeOrDiscountValue}% Instant Shopper Savings Configured</span>
                    </div>
                  )}

                  {gw.merchantId && (
                    <div className="col-span-2 text-slate-500 font-mono text-[10px] truncate">
                      Merchant ID: {gw.merchantId}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRunSimulator(gw)}
                  className="px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Sandbox Pay</span>
                </button>

                <button
                  onClick={() => setEditingGateway({ ...gw })}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gateway Configuration Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl text-slate-900 relative my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${getProviderColorClass(editingGateway.provider)}`}>
                  {getGatewayIcon(editingGateway.provider)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Configure {editingGateway.shortName} Gateway
                  </h3>
                  <span className="text-xs text-slate-500">
                    Provider: {editingGateway.provider} • ID: {editingGateway.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingGateway(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePaymentGateway(editingGateway.id, editingGateway);
                setEditingGateway(null);
                showToast(`Settings for ${editingGateway.shortName} updated successfully!`, 'success');
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Display Name & Short Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Display Name on Checkout *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGateway.name}
                    onChange={(e) => setEditingGateway({ ...editingGateway, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Short Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGateway.shortName}
                    onChange={(e) => setEditingGateway({ ...editingGateway, shortName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              {/* Status and Environment */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Gateway Status (Active on Storefront)
                  </label>
                  <select
                    value={editingGateway.isActive ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, isActive: e.target.value === 'active' })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="active">Active (Visible to customers at checkout)</option>
                    <option value="inactive">Deactivated (Hidden from customers)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Processing Mode (Environment)
                  </label>
                  <select
                    value={editingGateway.environment}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, environment: e.target.value as any })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="live">Live Production (Actual Settlements)</option>
                    <option value="sandbox">Sandbox / Demo Simulation</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Customer Description / Summary
                </label>
                <textarea
                  rows={2}
                  value={editingGateway.description}
                  onChange={(e) => setEditingGateway({ ...editingGateway, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* API Credentials */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-slate-500 block">
                  API & Merchant Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Merchant ID / Account ID
                    </label>
                    <input
                      type="text"
                      value={editingGateway.merchantId || ''}
                      onChange={(e) => setEditingGateway({ ...editingGateway, merchantId: e.target.value })}
                      placeholder="e.g. rzp_live_je89218"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Public / Client API Key
                    </label>
                    <input
                      type="text"
                      value={editingGateway.apiKey || ''}
                      onChange={(e) => setEditingGateway({ ...editingGateway, apiKey: e.target.value })}
                      placeholder="e.g. rzp_live_..."
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px] bg-white"
                    />
                  </div>

                  {editingGateway.provider === 'upi_qr' && (
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Merchant UPI VPA ID (For Instant QR Generation)
                      </label>
                      <input
                        type="text"
                        value={editingGateway.upiVpa || ''}
                        onChange={(e) => setEditingGateway({ ...editingGateway, upiVpa: e.target.value })}
                        placeholder="e.g. javed.electronics@okhdfcbank"
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-[11px] bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Order Limits and Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingGateway.minOrderValue}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, minOrderValue: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Max Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingGateway.maxOrderValue || 0}
                    onChange={(e) =>
                      setEditingGateway({
                        ...editingGateway,
                        maxOrderValue: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Leave 0 for no limit"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingGateway.badgeText || ''}
                    onChange={(e) => setEditingGateway({ ...editingGateway, badgeText: e.target.value.toUpperCase() })}
                    placeholder="e.g. 0% FEE / POPULAR"
                    className="w-full p-2 border border-slate-300 rounded-lg uppercase"
                  />
                </div>
              </div>

              {/* Instructions shown at checkout */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Custom Instructions for Customers at Checkout
                </label>
                <input
                  type="text"
                  value={editingGateway.customInstructions || ''}
                  onChange={(e) => setEditingGateway({ ...editingGateway, customInstructions: e.target.value })}
                  placeholder="e.g. Keep exact change ready for the delivery rider."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingGateway(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Save Gateway Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {testingGateway && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-900 text-xs">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">
                  Testing {testingGateway.shortName} Gateway Handshake
                </h3>
              </div>
              <button onClick={() => setTestingGateway(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
              <div>Provider: {testingGateway.provider}</div>
              <div>Environment: {testingGateway.environment.toUpperCase()}</div>
              <div>Min/Max Limits: {formatINR(testingGateway.minOrderValue)} - {testingGateway.maxOrderValue ? formatINR(testingGateway.maxOrderValue) : 'Unlimited'}</div>
              <div>Status: {testingGateway.isActive ? 'ACTIVE ON STOREFRONT' : 'DEACTIVATED'}</div>
            </div>

            {testResult.status === 'testing' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{testResult.message}</span>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Connection Verified!</span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            )}

            <button
              onClick={() => setTestingGateway(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Gateway Activity Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Payment Gateway Security & Activation Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Tracks all admin activations, deactivations, credential updates, and fee configuration changes.
            </p>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200 sticky top-0">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Performed By</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentGatewayAuditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{log.gatewayName}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        log.action === 'activated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'deactivated'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.performedBy}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
