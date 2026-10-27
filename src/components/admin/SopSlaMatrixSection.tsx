import React, { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Layers,
  Store,
  Users,
  Tag,
  Truck,
  FileText,
  Sparkles,
  RefreshCw,
  Sliders,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit3,
  Save,
  Package,
  MapPin,
  Flame,
  Check,
  X,
  ChevronRight,
  Info,
  Building2,
  PhoneCall,
  Printer,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  MetricCategory,
  SlaHealthStatus,
  OrderLifecycleSlaConfig,
  SlaThresholdRange,
  StressMetricDefinition,
  CustomerTagSlaRule,
  SellerTagSlaRule,
} from '../../types/sopSla';
import { PRESET_CONFIGURATIONS } from '../../data/mockSopSlaData';

export const SopSlaMatrixSection: React.FC = () => {
  const {
    sopSlaConfig,
    outletCompliance,
    updateLifecycleSla,
    updateStressMetricThreshold,
    applySlaPreset,
    addOrUpdateCustomerTag,
    deleteCustomerTag,
    addOrUpdateSellerTag,
    deleteSellerTag,
    resetSopSlaToDefault,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // Section Sub-Tab Navigation
  type SubTab = 'lifecycle' | 'stress_metrics' | 'outlets' | 'tagging' | 'handbook';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('lifecycle');

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<SlaHealthStatus | 'all'>('all');
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit modal states for customer / seller tags
  const [editingCustomerTag, setEditingCustomerTag] = useState<CustomerTagSlaRule | null>(null);
  const [isCustomerTagModalOpen, setIsCustomerTagModalOpen] = useState(false);
  const [editingSellerTag, setEditingSellerTag] = useState<SellerTagSlaRule | null>(null);
  const [isSellerTagModalOpen, setIsSellerTagModalOpen] = useState(false);

  // Lifecycle Inline Edit states
  const [editingLifecycleKey, setEditingLifecycleKey] = useState<keyof OrderLifecycleSlaConfig | null>(null);
  const [tempLifecycleForm, setTempLifecycleForm] = useState<SlaThresholdRange | null>(null);

  // Metric Inline Edit state
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [tempMetricForm, setTempMetricForm] = useState<Partial<StressMetricDefinition> | null>(null);

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Overall E-Commerce Health Score calculation
  const overallMetricsSummary = useMemo(() => {
    const total = sopSlaConfig.metrics.length;
    const greenCount = sopSlaConfig.metrics.filter((m) => m.currentStatus === 'green').length;
    const yellowCount = sopSlaConfig.metrics.filter((m) => m.currentStatus === 'yellow').length;
    const redCount = sopSlaConfig.metrics.filter((m) => m.currentStatus === 'red').length;

    const compliancePct = Math.round(((greenCount * 1.0 + yellowCount * 0.5) / total) * 100);

    return {
      total,
      greenCount,
      yellowCount,
      redCount,
      compliancePct,
      overallStatus: (redCount > 0 ? 'red' : yellowCount > 2 ? 'yellow' : 'green') as SlaHealthStatus,
    };
  }, [sopSlaConfig.metrics]);

  // Filtered metrics list
  const filteredMetrics = useMemo(() => {
    return sopSlaConfig.metrics.filter((m) => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (selectedStatusFilter !== 'all' && m.currentStatus !== selectedStatusFilter) return false;
      return true;
    });
  }, [sopSlaConfig.metrics, selectedCategory, selectedStatusFilter]);

  // Handlers for lifecycle editing
  const handleStartEditLifecycle = (key: keyof OrderLifecycleSlaConfig) => {
    setEditingLifecycleKey(key);
    setTempLifecycleForm({ ...sopSlaConfig.orderLifecycle[key] });
  };

  const handleSaveLifecycle = (key: keyof OrderLifecycleSlaConfig) => {
    if (!tempLifecycleForm) return;
    const res = updateLifecycleSla(key, tempLifecycleForm);
    if (res.success) {
      showToast(res.message);
      setEditingLifecycleKey(null);
      setTempLifecycleForm(null);
    }
  };

  // Handlers for metric editing
  const handleStartEditMetric = (m: StressMetricDefinition) => {
    setEditingMetricId(m.id);
    setTempMetricForm({
      idealGreen: m.idealGreen,
      warningYellow: m.warningYellow,
      criticalRed: m.criticalRed,
      sopGuidelines: m.sopGuidelines,
      automatedRemedy: m.automatedRemedy,
    });
  };

  const handleSaveMetric = (id: string) => {
    if (!tempMetricForm) return;
    const res = updateStressMetricThreshold(id, tempMetricForm);
    if (res.success) {
      showToast(res.message);
      setEditingMetricId(null);
      setTempMetricForm(null);
    }
  };

  // Preset switch
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && PRESET_CONFIGURATIONS[val]) {
      const res = applySlaPreset(val);
      if (res.success) showToast(res.message);
    }
  };

  // Print Handbook
  const handlePrintHandbook = () => {
    window.print();
  };

  // Status visual badge helper
  const renderStatusBadge = (status: SlaHealthStatus, label?: string) => {
    switch (status) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{label || 'Ideal (Green)'}</span>
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{label || 'Warning (Yellow)'}</span>
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{label || 'Critical (Red)'}</span>
          </span>
        );
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

      {/* Main Header Card with E-Commerce Cockpit Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  SOP & SLA Operations Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Define ideal, warning, and critical operational thresholds across Lucknow fulfillment nodes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
              <span className="font-medium">Active Policy Preset:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {sopSlaConfig.presetLabel}
              </span>
              <span>•</span>
              <span>Updated {new Date(sopSlaConfig.lastUpdated).toLocaleDateString()} by {sopSlaConfig.updatedBy}</span>
            </div>
          </div>

          {/* Quick Actions & Preset Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-700">Preset:</span>
                <select
                  value={sopSlaConfig.presetName}
                  onChange={handleSelectPreset}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="express_2h">Hyperlocal 2-Hour Express (Lucknow)</option>
                  <option value="same_day_standard">Standard Same-Day Hub Fulfillment</option>
                  <option value="relaxed_b2b">B2B & Bulk Logistics SOP</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrintHandbook}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Print laminated SOP operations handbook for warehouse table"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print SOP Handbook</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to restore all SOP & SLA thresholds to standard industry defaults?')) {
                    const res = resetSopSlaToDefault();
                    showToast(res.message);
                  }
                }}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>

        {/* Live E-Commerce Cockpit Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          {/* Gauge 1: Overall Flow Health */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Overall E-Com Health</span>
              {renderStatusBadge(overallMetricsSummary.overallStatus, `${overallMetricsSummary.compliancePct}%`)}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {overallMetricsSummary.compliancePct}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Weighted composite of all 18 operational stress & health indicators
            </p>
          </div>

          {/* Gauge 2: Ideal Flow (Green) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Optimal / Ideal Flow</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {overallMetricsSummary.greenCount}{' '}
              <span className="text-xs font-medium text-emerald-700">/ {overallMetricsSummary.total} Metrics</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Parameters operating within optimal zero-delay boundaries
            </p>
          </div>

          {/* Gauge 3: Moderate Warning (Yellow) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Moderate Warning</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900 font-mono">
              {overallMetricsSummary.yellowCount}{' '}
              <span className="text-xs font-medium text-amber-700">Indices</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Approaching threshold limit; proactive supervision active
            </p>
          </div>

          {/* Gauge 4: Critical Bottlenecks (Red) */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-rose-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Critical SLA Breaches</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-900 font-mono">
              {overallMetricsSummary.redCount}{' '}
              <span className="text-xs font-medium text-rose-700">Breaches</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Requires immediate supervisor resolution & intervention
            </p>
          </div>
        </div>

        {/* Color Coding Reference Strip */}
        <div className="mt-4 p-3 bg-slate-100/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              SOP Traffic-Light Protocol:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-800 font-semibold">Green (Ideal):</span>
              <span className="text-slate-500">Normal operations, customer promise satisfied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-800 font-semibold">Yellow (Warning):</span>
              <span className="text-slate-500">Approaching breach, re-assign priority queue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-800 font-semibold">Red (Critical):</span>
              <span className="text-slate-500">Direct SLA breach; triggers supervisor alerts & rerouting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('lifecycle')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'lifecycle'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>1. Order Lifecycle Timers & SLAs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('stress_metrics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'stress_metrics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Operational Stress & Health Indices ({sopSlaConfig.metrics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('outlets')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'outlets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>3. Outlet Demand & Branch Matrix ({outletCompliance.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tagging')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'tagging'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. Customer & Seller Tagging Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('handbook')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'handbook'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>5. SOP Handbook & Print Guide</span>
        </button>
      </div>

      {/* SUB-TAB 1: ORDER LIFECYCLE TIMERS & SLAS */}
      {activeSubTab === 'lifecycle' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Order Fulfillment Stage Timers & SLA Boundaries
              </h3>
              <p className="text-xs text-slate-500">
                Define exact ideal (Green), warning (Yellow), and critical breach (Red) minutes for every stage of the order funnel.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
              6 Active Funnel Stages
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                key: 'packingTimeMinutes' as const,
                title: 'Order Packing Time (Packer SLA)',
                icon: <Package className="w-4 h-4 text-amber-600" />,
                currentAvg: '11.8 min',
                currentStatus: 'green' as SlaHealthStatus,
              },
              {
                key: 'riderAssignmentMinutes' as const,
                title: 'Assigned to Rider Time',
                icon: <Truck className="w-4 h-4 text-blue-600" />,
                currentAvg: '8.4 min',
                currentStatus: 'green' as SlaHealthStatus,
              },
              {
                key: 'dispatchTimeMinutes' as const,
                title: 'Order Dispatched Time (Dock Handover)',
                icon: <SendToRiderIcon />,
                currentAvg: '13.2 min',
                currentStatus: 'green' as SlaHealthStatus,
              },
              {
                key: 'totalDeliveryMinutes' as const,
                title: 'Total Order Delivered Time (Customer Doorstep)',
                icon: <Clock className="w-4 h-4 text-emerald-600" />,
                currentAvg: '74.5 min',
                currentStatus: 'green' as SlaHealthStatus,
              },
              {
                key: 'paymentVerificationMinutes' as const,
                title: 'Payment Verification SLA (UPI / WhatsApp)',
                icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
                currentAvg: '3.8 min',
                currentStatus: 'green' as SlaHealthStatus,
              },
              {
                key: 'returnInspectionHours' as const,
                title: 'Return / Reverse Logistics Inspection',
                icon: <RefreshCw className="w-4 h-4 text-rose-600" />,
                currentAvg: '18.0 hrs',
                currentStatus: 'green' as SlaHealthStatus,
              },
            ].map(({ key, title, icon, currentAvg, currentStatus }) => {
              const rule = sopSlaConfig.orderLifecycle[key];
              const isEditing = editingLifecycleKey === key;

              return (
                <div
                  key={key}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{title}</h4>
                      </div>
                      {renderStatusBadge(currentStatus, currentAvg)}
                    </div>

                    <p className="text-[11px] text-slate-500 mb-4 line-clamp-2">{rule.description}</p>

                    {/* Thresholds Display / Edit Form */}
                    {isEditing && tempLifecycleForm ? (
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 text-xs">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                          Configure Thresholds ({rule.unit}):
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                            <span>🟢 Ideal (Green Max):</span>
                            <span className="font-mono">{rule.unit}</span>
                          </label>
                          <input
                            type="number"
                            value={tempLifecycleForm.idealGreenMax}
                            onChange={(e) =>
                              setTempLifecycleForm({
                                ...tempLifecycleForm,
                                idealGreenMax: Number(e.target.value),
                              })
                            }
                            className="w-full mt-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-amber-800 flex items-center justify-between">
                            <span>🟡 Warning (Yellow Max):</span>
                            <span className="font-mono">{rule.unit}</span>
                          </label>
                          <input
                            type="number"
                            value={tempLifecycleForm.warningYellowMax}
                            onChange={(e) =>
                              setTempLifecycleForm({
                                ...tempLifecycleForm,
                                warningYellowMax: Number(e.target.value),
                              })
                            }
                            className="w-full mt-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-rose-800 flex items-center justify-between">
                            <span>🔴 Critical (Red Above):</span>
                            <span className="font-mono">{rule.unit}</span>
                          </label>
                          <input
                            type="number"
                            value={tempLifecycleForm.criticalRedAbove}
                            onChange={(e) =>
                              setTempLifecycleForm({
                                ...tempLifecycleForm,
                                criticalRedAbove: Number(e.target.value),
                              })
                            }
                            className="w-full mt-1 px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">SOP Protocol Action:</label>
                          <textarea
                            rows={2}
                            value={tempLifecycleForm.sopInstruction}
                            onChange={(e) =>
                              setTempLifecycleForm({
                                ...tempLifecycleForm,
                                sopInstruction: e.target.value,
                              })
                            }
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-[11px] focus:outline-hidden"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLifecycleKey(null);
                              setTempLifecycleForm(null);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs border border-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveLifecycle(key)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save Rules</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {/* Traffic light bar */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block">🟢 Ideal</span>
                            <span className="font-mono font-black text-emerald-900 text-xs">
                              ≤ {rule.idealGreenMax} {rule.unit}
                            </span>
                          </div>
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">🟡 Warning</span>
                            <span className="font-mono font-black text-amber-900 text-xs">
                              {rule.idealGreenMax + 1}-{rule.warningYellowMax} {rule.unit}
                            </span>
                          </div>
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-rose-800 block">🔴 Critical</span>
                            <span className="font-mono font-black text-rose-900 text-xs">
                              &gt; {rule.criticalRedAbove} {rule.unit}
                            </span>
                          </div>
                        </div>

                        {/* SOP action notice */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-800">SOP Rule:</strong> {rule.sopInstruction}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  {isSuperAdmin && !isEditing && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Target Standard: {rule.unit}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEditLifecycle(key)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Edit Thresholds</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OPERATIONAL STRESS & HEALTH INDICES */}
      {activeSubTab === 'stress_metrics' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Category:</span>
              </span>
              {[
                { id: 'all', label: 'All Matrices' },
                { id: 'inventory_health', label: '📦 Inventory Health' },
                { id: 'order_stress', label: '⚡ Order Stress' },
                { id: 'inventory_stress', label: '🔒 Inventory Stress' },
                { id: 'outlet_demand', label: '🏬 Outlet Demand' },
                { id: 'product_demand', label: '🔥 Product Demand' },
                { id: 'location_stress', label: '📍 Location Stress' },
                { id: 'seller_stress', label: '🏪 Seller Stress' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-700">Status:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'green', label: '🟢 Ideal' },
                { id: 'yellow', label: '🟡 Warning' },
                { id: 'red', label: '🔴 Critical' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStatusFilter(s.id as any)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    selectedStatusFilter === s.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.map((m) => {
              const isEditing = editingMetricId === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          {m.categoryLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{m.name}</h4>
                      </div>
                      {renderStatusBadge(m.currentStatus)}
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">{m.description}</p>

                    {/* Live Gauge Meter */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Current Live Value</span>
                        <div className="font-mono font-black text-slate-900 text-base">
                          {m.currentLiveValue} <span className="text-xs font-medium text-slate-500">{m.unit}</span>
                        </div>
                      </div>

                      {/* Visual Health Progress Track */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex mt-2">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              m.higherIsBetter
                                ? m.currentLiveValue
                                : (m.currentLiveValue / (m.criticalRed * 1.3)) * 100
                            )}%`,
                          }}
                          className={`h-full transition-all duration-500 ${
                            m.currentStatus === 'green'
                              ? 'bg-emerald-500'
                              : m.currentStatus === 'yellow'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Thresholds / Edit inputs */}
                    {isEditing && tempMetricForm ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-xs">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                          Edit Thresholds ({m.unit}):
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-emerald-800 block">🟢 Ideal</label>
                            <input
                              type="number"
                              step="0.1"
                              value={tempMetricForm.idealGreen ?? m.idealGreen}
                              onChange={(e) =>
                                setTempMetricForm({
                                  ...tempMetricForm,
                                  idealGreen: Number(e.target.value),
                                })
                              }
                              className="w-full mt-1 p-1.5 bg-white border border-emerald-300 rounded font-mono font-bold text-slate-900 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 block">🟡 Warning</label>
                            <input
                              type="number"
                              step="0.1"
                              value={tempMetricForm.warningYellow ?? m.warningYellow}
                              onChange={(e) =>
                                setTempMetricForm({
                                  ...tempMetricForm,
                                  warningYellow: Number(e.target.value),
                                })
                              }
                              className="w-full mt-1 p-1.5 bg-white border border-amber-300 rounded font-mono font-bold text-slate-900 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-rose-800 block">🔴 Critical</label>
                            <input
                              type="number"
                              step="0.1"
                              value={tempMetricForm.criticalRed ?? m.criticalRed}
                              onChange={(e) =>
                                setTempMetricForm({
                                  ...tempMetricForm,
                                  criticalRed: Number(e.target.value),
                                })
                              }
                              className="w-full mt-1 p-1.5 bg-white border border-rose-300 rounded font-mono font-bold text-slate-900 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">SOP Protocol Guidelines:</label>
                          <textarea
                            rows={2}
                            value={tempMetricForm.sopGuidelines ?? m.sopGuidelines}
                            onChange={(e) =>
                              setTempMetricForm({
                                ...tempMetricForm,
                                sopGuidelines: e.target.value,
                              })
                            }
                            className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">Automated System Remedy:</label>
                          <input
                            type="text"
                            value={tempMetricForm.automatedRemedy ?? m.automatedRemedy}
                            onChange={(e) =>
                              setTempMetricForm({
                                ...tempMetricForm,
                                automatedRemedy: e.target.value,
                              })
                            }
                            className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMetricId(null);
                              setTempMetricForm(null);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveMetric(m.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {/* Traffic light ranges */}
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded">
                            <span className="font-bold text-emerald-800 block">🟢 Ideal</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              {m.higherIsBetter ? `≥ ${m.idealGreen}` : `≤ ${m.idealGreen}`}
                            </span>
                          </div>
                          <div className="p-1.5 bg-amber-50 border border-amber-200 rounded">
                            <span className="font-bold text-amber-800 block">🟡 Warning</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              {m.warningYellow}
                            </span>
                          </div>
                          <div className="p-1.5 bg-rose-50 border border-rose-200 rounded">
                            <span className="font-bold text-rose-800 block">🔴 Critical</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              {m.higherIsBetter ? `< ${m.criticalRed}` : `> ${m.criticalRed}`}
                            </span>
                          </div>
                        </div>

                        {/* SOP action notice */}
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                          <p className="line-clamp-2">
                            <strong className="text-slate-800">SOP:</strong> {m.sopGuidelines}
                          </p>
                          <p className="line-clamp-1 mt-1 text-indigo-700">
                            <strong>System Action:</strong> {m.automatedRemedy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {isSuperAdmin && !isEditing && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Unit: {m.unit}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEditMetric(m)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Adjust Limits</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: OUTLET DEMAND & BRANCH SLA COMPLIANCE MATRIX */}
      {activeSubTab === 'outlets' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lucknow Multi-Branch Operational SLA Compliance
                </h3>
                <p className="text-xs text-slate-500">
                  Live fulfillment performance, active order queues, and bottlenecks across physical store branches.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Auto-Refreshed:</span>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live Sync
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Branch Outlet</th>
                    <th className="py-2.5 px-3 text-center">SOP Health</th>
                    <th className="py-2.5 px-3 font-mono text-center">Compliance</th>
                    <th className="py-2.5 px-3 font-mono text-center">Queue Congestion</th>
                    <th className="py-2.5 px-3 font-mono text-center">Avg Pack Time</th>
                    <th className="py-2.5 px-3 font-mono text-center">Avg Dispatch</th>
                    <th className="py-2.5 px-3 font-mono text-center">Avg Delivery</th>
                    <th className="py-2.5 px-3 font-mono text-center">Active Riders</th>
                    <th className="py-2.5 px-3">Critical Notes & Bottlenecks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {outletCompliance.map((out) => (
                    <tr key={out.outletId} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{out.outletName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {out.outletId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(out.overallStatus)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded font-black ${
                            out.complianceRatePct >= 95
                              ? 'bg-emerald-100 text-emerald-800'
                              : out.complianceRatePct >= 90
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {out.complianceRatePct}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-bold text-slate-900">{out.activeOrdersInQueue}</span>
                        <span className="text-[10px] text-slate-400 block">orders</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {out.avgPackTimeMin} m
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {out.avgDispatchTimeMin} m
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {out.avgDeliveryTimeMin} m
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          {out.activeRidersCount} Couriers
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {out.criticalViolations.length > 0 ? (
                          <div className="space-y-1">
                            {out.criticalViolations.map((v, i) => (
                              <div key={i} className="text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% SLA Adherence • Flow Optimal</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CUSTOMER & SELLER TAGGING SOP RULES */}
      {activeSubTab === 'tagging' && (
        <div className="space-y-6">
          {/* Customer Tagging Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Customer Tier Tags & SLA Fulfillment Policies</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Categorize customers by lifetime spend and risk profile. Higher trust customers receive expedited bypass queues.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomerTag({
                      id: `ctag_${Date.now()}`,
                      tagName: '',
                      badgeColor: 'blue',
                      criteria: '',
                      slaTargetMinutes: 90,
                      assignedSlaStatus: 'green',
                      dispatchPriority: 'Standard Queue',
                      autoInspectionRequired: false,
                      notes: '',
                    });
                    setIsCustomerTagModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer Tag Rule</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sopSlaConfig.customerTags.map((ct) => (
                <div
                  key={ct.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-xs">{ct.tagName}</span>
                      {renderStatusBadge(ct.assignedSlaStatus)}
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 mb-3">
                      <p>
                        <strong className="text-slate-700">Qualification:</strong> {ct.criteria}
                      </p>
                      <p>
                        <strong className="text-slate-700">Dispatch Priority:</strong>{' '}
                        <span className="font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {ct.dispatchPriority}
                        </span>
                      </p>
                      <p>
                        <strong className="text-slate-700">Delivery SLA:</strong>{' '}
                        <span className="font-mono font-bold text-slate-900">{ct.slaTargetMinutes} min</span>
                      </p>
                      {ct.autoInspectionRequired && (
                        <p className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Manager Sign-Off Required Prior to Packing</span>
                        </p>
                      )}
                      <p className="text-slate-500 italic mt-1">{ct.notes}</p>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomerTag(ct);
                          setIsCustomerTagModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete customer tag "${ct.tagName}"?`)) {
                            const res = deleteCustomerTag(ct.id);
                            showToast(res.message);
                          }
                        }}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                        title="Delete Tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seller Tagging Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Seller & Store Tier Tags & SLA Enforcements</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enforce fulfillment latency rules for Lucknow outlets and marketplace merchant partners.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSellerTag({
                      id: `stag_${Date.now()}`,
                      tagName: '',
                      badgeColor: 'blue',
                      qualification: '',
                      slaTargetScorePct: 90,
                      assignedSlaStatus: 'green',
                      maxFulfillmentLatencyMin: 30,
                      penaltiesOrActions: '',
                      activeSellerCount: 0,
                    });
                    setIsSellerTagModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Seller Tier Rule</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sopSlaConfig.sellerTags.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-xs">{st.tagName}</span>
                      {renderStatusBadge(st.assignedSlaStatus)}
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 mb-3">
                      <p>
                        <strong className="text-slate-700">SLA Target:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-800">≥ {st.slaTargetScorePct}%</span>
                      </p>
                      <p>
                        <strong className="text-slate-700">Max Dispatch Latency:</strong>{' '}
                        <span className="font-mono font-bold text-slate-900">{st.maxFulfillmentLatencyMin} min</span>
                      </p>
                      <p>
                        <strong className="text-slate-700">Criterion:</strong> {st.qualification}
                      </p>
                      <p className="text-slate-700 font-medium">
                        <strong>Policy:</strong> {st.penaltiesOrActions}
                      </p>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{st.activeSellerCount} Stores Tagged</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSellerTag(st);
                            setIsSellerTagModalOpen(true);
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete seller tag "${st.tagName}"?`)) {
                              const res = deleteSellerTag(st.id);
                              showToast(res.message);
                            }
                          }}
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SOP HANDBOOK & PRINT GUIDE */}
      {activeSubTab === 'handbook' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Official E-Commerce Fulfillment SOP & SLA Operations Manual
              </h3>
              <p className="text-xs text-slate-500">
                Laminated desk copy for warehouse supervisors, picker/packers, branch managers, and dispatch couriers.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintHandbook}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Clean Manual</span>
            </button>
          </div>

          {/* Section 1: Traffic Light Rules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded-lg">
              Section 1: The Traffic-Light Priority System
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GREEN: Ideal Operation</span>
                </span>
                <p className="text-emerald-800 text-[11px]">
                  Fulfillment proceed at normal pace. Barcode scanning verifies correct SKU and packaging seal. Handover to rider within 15 minutes.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>YELLOW: Warning & Acceleration</span>
                </span>
                <p className="text-amber-800 text-[11px]">
                  Stage elapsed time exceeds 15 minutes. Order bumped to top of pack table queue. Warehouse lead confirms courier arrival.
                </p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>RED: Critical Escalation</span>
                </span>
                <p className="text-rose-800 text-[11px]">
                  SLA breached (&gt; 30 min packing or unassigned rider). Automated failover to Shadowfax/Dunzo courier fleet. Customer notified with compensation coupon.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Exact Step-by-Step SOP Protocols */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded-lg">
              Section 2: Step-by-Step Fulfillment SOP Protocols
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
              <li className="p-2 bg-slate-50 rounded-lg">
                <strong>Step 1: Order Acknowledgment (0 - 5 min):</strong> Order receipt webhook received on POS terminal. For first-time or COD buyers, OTP / WhatsApp verification confirms address validity.
              </li>
              <li className="p-2 bg-slate-50 rounded-lg">
                <strong>Step 2: Bin Picking & GS1 Barcode Scan (5 - 12 min):</strong> Warehouse picker retrieves SKU from marked bin. Scans product barcode with laser reader. If mismatch occurs, buzzer sounds.
              </li>
              <li className="p-2 bg-slate-50 rounded-lg">
                <strong>Step 3: Anti-Tamper Packaging & Seal (12 - 15 min):</strong> Unit placed in security bubble mailer with fragile tape. Shipping manifest printed and affixed. Staged in Zone Outbound rack.
              </li>
              <li className="p-2 bg-slate-50 rounded-lg">
                <strong>Step 4: Courier OTP Handover (15 - 25 min):</strong> Delivery partner arrives at branch dispatch bay, scans parcel QR code, provides 4-digit courier pin, and departs for customer location.
              </li>
              <li className="p-2 bg-slate-50 rounded-lg">
                <strong>Step 5: Doorstep Delivery & Handover (25 - 90 min):</strong> Courier delivers within designated Lucknow PIN code zone. Customer inspects outer seal and confirms receipt.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Customer Tag Edit Modal */}
      {isCustomerTagModalOpen && editingCustomerTag && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCustomerTag.id.startsWith('ctag_new') ? 'Add New Customer Tag' : 'Edit Customer SLA Tag'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerTagModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = addOrUpdateCustomerTag(editingCustomerTag);
                showToast(res.message);
                setIsCustomerTagModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tag Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Corporate Client"
                  value={editingCustomerTag.tagName}
                  onChange={(e) => setEditingCustomerTag({ ...editingCustomerTag, tagName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Qualification Criteria</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lifetime purchases > ₹50,000"
                  value={editingCustomerTag.criteria}
                  onChange={(e) => setEditingCustomerTag({ ...editingCustomerTag, criteria: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Health Status</label>
                  <select
                    value={editingCustomerTag.assignedSlaStatus}
                    onChange={(e) =>
                      setEditingCustomerTag({
                        ...editingCustomerTag,
                        assignedSlaStatus: e.target.value as SlaHealthStatus,
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="green">🟢 Ideal (Green)</option>
                    <option value="yellow">🟡 Warning (Yellow)</option>
                    <option value="red">🔴 Critical (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Delivery SLA (min)</label>
                  <input
                    type="number"
                    value={editingCustomerTag.slaTargetMinutes}
                    onChange={(e) =>
                      setEditingCustomerTag({
                        ...editingCustomerTag,
                        slaTargetMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispatch Priority Queue</label>
                <select
                  value={editingCustomerTag.dispatchPriority}
                  onChange={(e) =>
                    setEditingCustomerTag({
                      ...editingCustomerTag,
                      dispatchPriority: e.target.value as any,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Express Expedited">Express Expedited (Bypass Packing Queue)</option>
                  <option value="Standard Queue">Standard Queue</option>
                  <option value="OTP / Anti-Fraud Lock">OTP / Anti-Fraud Lock (Requires Phone Verify)</option>
                  <option value="Manager Sign-off">Manager Sign-off (COD Restricted)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCustomerTag.autoInspectionRequired}
                    onChange={(e) =>
                      setEditingCustomerTag({
                        ...editingCustomerTag,
                        autoInspectionRequired: e.target.checked,
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-800">
                    Require Supervisor Physical Inspection Prior to Box Sealing
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerTagModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Customer Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Tag Edit Modal */}
      {isSellerTagModalOpen && editingSellerTag && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSellerTag.id.startsWith('stag_new') ? 'Add New Seller Tier' : 'Edit Seller Tier SLA'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSellerTagModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = addOrUpdateSellerTag(editingSellerTag);
                showToast(res.message);
                setIsSellerTagModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tier / Tag Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platinum Flagship Seller"
                  value={editingSellerTag.tagName}
                  onChange={(e) => setEditingSellerTag({ ...editingSellerTag, tagName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Qualification Requirements</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SLA compliance >= 98%, avg pack time < 15m"
                  value={editingSellerTag.qualification}
                  onChange={(e) => setEditingSellerTag({ ...editingSellerTag, qualification: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Health Status</label>
                  <select
                    value={editingSellerTag.assignedSlaStatus}
                    onChange={(e) =>
                      setEditingSellerTag({
                        ...editingSellerTag,
                        assignedSlaStatus: e.target.value as SlaHealthStatus,
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="green">🟢 Ideal (Green)</option>
                    <option value="yellow">🟡 Warning (Yellow)</option>
                    <option value="red">🔴 Critical (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target SLA Score (%)</label>
                  <input
                    type="number"
                    value={editingSellerTag.slaTargetScorePct}
                    onChange={(e) =>
                      setEditingSellerTag({
                        ...editingSellerTag,
                        slaTargetScorePct: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Fulfillment Latency (Minutes)</label>
                <input
                  type="number"
                  value={editingSellerTag.maxFulfillmentLatencyMin}
                  onChange={(e) =>
                    setEditingSellerTag({
                      ...editingSellerTag,
                      maxFulfillmentLatencyMin: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Automated System Action / Policy</label>
                <input
                  type="text"
                  placeholder="e.g. Auto-reroutes orders if delayed > 30m"
                  value={editingSellerTag.penaltiesOrActions}
                  onChange={(e) =>
                    setEditingSellerTag({
                      ...editingSellerTag,
                      penaltiesOrActions: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellerTagModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Seller Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon for Send to Rider / Dispatch
const SendToRiderIcon: React.FC = () => (
  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
