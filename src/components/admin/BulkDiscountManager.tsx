import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { BulkDiscountRule, BulkDiscountTargetType, BulkDiscountCalculationType, BulkDiscountTier, ProductCategory } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Percent,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building2,
  Package,
  Layers,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
  Check,
  Info,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export const BulkDiscountManager: React.FC = () => {
  const {
    bulkDiscountRules,
    addBulkDiscountRule,
    updateBulkDiscountRule,
    deleteBulkDiscountRule,
    toggleBulkDiscountRuleStatus,
    resetBulkDiscountRules,
    products,
    outlets,
    categories,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [targetFilter, setTargetFilter] = useState<'all' | BulkDiscountTargetType>('all');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'b2b_only' | 'retail_only'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTargetType, setFormTargetType] = useState<BulkDiscountTargetType>('entire_order');
  const [formCategoryId, setFormCategoryId] = useState<ProductCategory | 'all'>('all');
  const [formProductId, setFormProductId] = useState<string>('');
  const [formMinQuantity, setFormMinQuantity] = useState<number>(3);
  const [formMinOrderValue, setFormMinOrderValue] = useState<number>(0);
  const [formDiscountType, setFormDiscountType] = useState<BulkDiscountCalculationType>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(5);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(10000);
  const [formCustomerType, setFormCustomerType] = useState<'all' | 'b2b_only' | 'retail_only'>('all');
  const [formStackWithCoupons, setFormStackWithCoupons] = useState<boolean>(true);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Multi-tier configuration
  const [formTiers, setFormTiers] = useState<BulkDiscountTier[]>([
    { minQuantity: 3, discountPercentage: 5 },
    { minQuantity: 6, discountPercentage: 10 },
    { minQuantity: 10, discountPercentage: 15 },
  ]);
  const [enableTiers, setEnableTiers] = useState<boolean>(true);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Metrics
  const metrics = useMemo(() => {
    const totalRules = bulkDiscountRules.length;
    const activeRules = bulkDiscountRules.filter((r) => r.isActive).length;
    const totalTimesApplied = bulkDiscountRules.reduce((acc, r) => acc + (r.timesApplied || 0), 0);
    const totalSavingsGranted = bulkDiscountRules.reduce((acc, r) => acc + (r.totalSavingsGranted || 0), 0);
    const avgSavingsPerOrder = totalTimesApplied > 0 ? Math.round(totalSavingsGranted / totalTimesApplied) : 0;

    return {
      totalRules,
      activeRules,
      totalTimesApplied,
      totalSavingsGranted,
      avgSavingsPerOrder,
    };
  }, [bulkDiscountRules]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return bulkDiscountRules.filter((r) => {
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      if (targetFilter !== 'all' && r.targetType !== targetFilter) return false;
      if (customerFilter !== 'all' && r.applicableToCustomerType !== customerFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchCat = r.targetCategoryId ? r.targetCategoryId.toLowerCase().includes(q) : false;
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [bulkDiscountRules, statusFilter, targetFilter, customerFilter, searchTerm]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setFormName('');
    setFormDesc('');
    setFormTargetType('entire_order');
    setFormCategoryId('all');
    setFormProductId('');
    setFormMinQuantity(3);
    setFormMinOrderValue(0);
    setFormDiscountType('percentage');
    setFormDiscountValue(5);
    setFormMaxDiscount(10000);
    setFormCustomerType('all');
    setFormStackWithCoupons(true);
    setFormIsActive(true);
    setEnableTiers(true);
    setFormTiers([
      { minQuantity: 3, discountPercentage: 5 },
      { minQuantity: 6, discountPercentage: 10 },
      { minQuantity: 10, discountPercentage: 15 },
    ]);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (rule: BulkDiscountRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormDesc(rule.description || '');
    setFormTargetType(rule.targetType);
    setFormCategoryId(rule.targetCategoryId || 'all');
    setFormProductId(rule.targetProductId || '');
    setFormMinQuantity(rule.minQuantity || 1);
    setFormMinOrderValue(rule.minOrderValue || 0);
    setFormDiscountType(rule.discountType);
    setFormDiscountValue(rule.discountValue);
    setFormMaxDiscount(rule.maxDiscountAmount || 0);
    setFormCustomerType(rule.applicableToCustomerType);
    setFormStackWithCoupons(rule.stackWithCoupons);
    setFormIsActive(rule.isActive);

    if (rule.tiers && rule.tiers.length > 0) {
      setEnableTiers(true);
      setFormTiers(rule.tiers);
    } else {
      setEnableTiers(false);
      setFormTiers([]);
    }

    setIsModalOpen(true);
  };

  // Add / Remove Tier Row
  const handleAddTierRow = () => {
    const lastTier = formTiers[formTiers.length - 1];
    const nextQty = lastTier ? lastTier.minQuantity + 5 : 5;
    const nextPct = lastTier && lastTier.discountPercentage ? Math.min(30, lastTier.discountPercentage + 5) : 10;
    setFormTiers([...formTiers, { minQuantity: nextQty, discountPercentage: nextPct }]);
  };

  const handleRemoveTierRow = (index: number) => {
    setFormTiers(formTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof BulkDiscountTier, value: number) => {
    setFormTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  // Form Submission
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Rule name is required.' });
      return;
    }

    let prodName: string | undefined = undefined;
    if (formTargetType === 'product' && formProductId) {
      const prod = products.find((p) => p.id === formProductId);
      prodName = prod?.name;
    }

    const payload: Omit<BulkDiscountRule, 'id' | 'createdAt' | 'updatedAt' | 'timesApplied' | 'totalSavingsGranted'> = {
      name: formName.trim(),
      description: formDesc.trim(),
      targetType: formTargetType,
      targetCategoryId: formTargetType === 'category' ? formCategoryId : undefined,
      targetProductId: formTargetType === 'product' ? formProductId : undefined,
      targetProductName: prodName,
      minQuantity: Number(formMinQuantity) || 1,
      minOrderValue: formMinOrderValue > 0 ? Number(formMinOrderValue) : undefined,
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      maxDiscountAmount: formMaxDiscount > 0 ? Number(formMaxDiscount) : undefined,
      tiers: enableTiers && formTiers.length > 0 ? formTiers : undefined,
      applicableToCustomerType: formCustomerType,
      applicableOutlets: 'all',
      stackWithCoupons: formStackWithCoupons,
      priority: 1,
      isActive: formIsActive,
    };

    if (editingRuleId) {
      const existing = bulkDiscountRules.find((r) => r.id === editingRuleId);
      if (existing) {
        const updated: BulkDiscountRule = {
          ...existing,
          ...payload,
          id: existing.id,
          timesApplied: existing.timesApplied || 0,
          totalSavingsGranted: existing.totalSavingsGranted || 0,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };
        const res = updateBulkDiscountRule(updated);
        setFeedbackMsg({ type: res.success ? 'success' : 'error', text: res.message });
      }
    } else {
      const res = addBulkDiscountRule(payload);
      setFeedbackMsg({ type: res.success ? 'success' : 'error', text: res.message });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Preset Template Loader
  const handleLoadPreset = (presetKey: 'tiered_3' | 'corporate_10' | 'accessory_bundle' | 'milestone_50k') => {
    if (presetKey === 'tiered_3') {
      setFormName('Tiered Electronics Pack (Buy 3, 6, 10+)');
      setFormDesc('Step-discount ladder for multiple electronic items: 5% at 3 units, 10% at 6 units, 15% at 10 units.');
      setFormTargetType('entire_order');
      setFormMinQuantity(3);
      setFormMinOrderValue(0);
      setFormDiscountType('percentage');
      setFormDiscountValue(5);
      setFormMaxDiscount(15000);
      setFormCustomerType('all');
      setEnableTiers(true);
      setFormTiers([
        { minQuantity: 3, discountPercentage: 5 },
        { minQuantity: 6, discountPercentage: 10 },
        { minQuantity: 10, discountPercentage: 15 },
      ]);
    } else if (presetKey === 'corporate_10') {
      setFormName('Corporate B2B Wholesale Tier (10+ Units)');
      setFormDesc('Wholesale bulk discount reserved for registered businesses ordering 10 or more devices for employee or office deployment.');
      setFormTargetType('entire_order');
      setFormMinQuantity(10);
      setFormMinOrderValue(30000);
      setFormDiscountType('percentage');
      setFormDiscountValue(12);
      setFormMaxDiscount(35000);
      setFormCustomerType('b2b_only');
      setEnableTiers(true);
      setFormTiers([
        { minQuantity: 10, discountPercentage: 12 },
        { minQuantity: 25, discountPercentage: 18 },
      ]);
    } else if (presetKey === 'accessory_bundle') {
      setFormName('Power & Audio Multi-Pack (4+ Units)');
      setFormDesc('15% instant savings on bulk purchases of GaN chargers, USB-C cords, power banks, and audio headsets.');
      setFormTargetType('category');
      setFormCategoryId('chargers_cables');
      setFormMinQuantity(4);
      setFormMinOrderValue(0);
      setFormDiscountType('percentage');
      setFormDiscountValue(15);
      setFormMaxDiscount(5000);
      setFormCustomerType('all');
      setEnableTiers(false);
      setFormTiers([]);
    } else if (presetKey === 'milestone_50k') {
      setFormName('High Cart Value Milestone (Cart ₹50,000+)');
      setFormDesc('Flat ₹2,500 instant discount when customer cart crosses ₹50,000 threshold.');
      setFormTargetType('entire_order');
      setFormMinQuantity(1);
      setFormMinOrderValue(50000);
      setFormDiscountType('fixed_amount');
      setFormDiscountValue(2500);
      setFormMaxDiscount(2500);
      setFormCustomerType('all');
      setEnableTiers(false);
      setFormTiers([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0">
              <Percent className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Bulk Order Discounts & Tiered Rules
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {metrics.activeRules} Active Rules
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Volume Engine Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure progressive quantity brackets, B2B wholesale pricing slabs, and cart milestone discounts with live storefront calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => {
                resetBulkDiscountRules();
                setFeedbackMsg({ type: 'success', text: 'Reset all discount rules to default store presets.' });
                setTimeout(() => setFeedbackMsg(null), 3000);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
              title="Reset all rules to factory templates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Presets</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Bulk Rule</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Bulk Rules
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {metrics.activeRules} <span className="text-xs text-slate-400 font-sans">/ {metrics.totalRules}</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluated live in cart</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Orders Benefited
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
              {metrics.totalTimesApplied}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Volume orders processed
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Customer Savings
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              {formatINR(metrics.totalSavingsGranted)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Granted via bulk tiers
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avg Savings / Order
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
              {formatINR(metrics.avgSavingsPerOrder)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Per bulk qualified order
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by rule name, description, or category..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Scope Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase text-slate-400">Scope:</span>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Scopes</option>
                <option value="entire_order">Entire Store</option>
                <option value="category">Category Specific</option>
                <option value="product">Product Specific</option>
              </select>
            </div>

            {/* Customer Audience Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase text-slate-400">Audience:</span>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Shoppers</option>
                <option value="b2b_only">B2B Business Only</option>
                <option value="retail_only">Retail Consumers</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All ({bulkDiscountRules.length})</option>
                <option value="active">Active ({bulkDiscountRules.filter((r) => r.isActive).length})</option>
                <option value="inactive">Paused ({bulkDiscountRules.filter((r) => !r.isActive).length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List / Grid */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Percent className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Bulk Discount Rules Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No rules match your active filters. Create a new volume rule or reset to pre-configured store templates.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Add New Rule
            </button>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const hasTiers = rule.tiers && rule.tiers.length > 0;

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-xl border transition-all p-4 sm:p-5 space-y-3 ${
                  rule.isActive
                    ? 'border-slate-200 shadow-xs hover:border-slate-300'
                    : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {rule.name}
                      </span>

                      {/* Active Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>

                      {/* Target Scope Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize flex items-center gap-1">
                        {rule.targetType === 'entire_order' && <ShoppingBag className="w-3 h-3" />}
                        {rule.targetType === 'category' && <Layers className="w-3 h-3" />}
                        {rule.targetType === 'product' && <Package className="w-3 h-3" />}
                        <span>
                          {rule.targetType === 'entire_order'
                            ? 'Storewide'
                            : rule.targetType === 'category'
                            ? `Category: ${rule.targetCategoryId?.replace(/_/g, ' ')}`
                            : `Product: ${rule.targetProductName || 'Selected'}`}
                        </span>
                      </span>

                      {/* Customer Type Badge */}
                      {rule.applicableToCustomerType === 'b2b_only' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>B2B ITC Customers Only</span>
                        </span>
                      )}

                      {rule.stackWithCoupons && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          Stacks with Coupons
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {rule.description}
                    </p>
                  </div>

                  {/* Quick Toggle & Edit Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                    <button
                      onClick={() => toggleBulkDiscountRuleStatus(rule.id)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 ${
                        rule.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                      title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{rule.isActive ? 'Active' : 'Enable'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Edit rule settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        deleteBulkDiscountRule(rule.id);
                        setFeedbackMsg({ type: 'success', text: `Deleted discount rule "${rule.name}".` });
                        setTimeout(() => setFeedbackMsg(null), 3000);
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Slabs / Progressive Tiers Visualization */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Configured Volume Discount Tiers</span>
                  </div>

                  {hasTiers ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {rule.tiers!.map((tier, idx) => (
                        <div
                          key={idx}
                          className="bg-indigo-50/80 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5"
                        >
                          <span className="font-bold text-indigo-900">
                            {tier.minQuantity}+ Units:
                          </span>
                          <span className="font-extrabold text-indigo-700 bg-white px-1.5 py-0.5 rounded shadow-2xs font-mono">
                            {tier.discountPercentage}% OFF
                          </span>
                        </div>
                      ))}

                      {rule.maxDiscountAmount && rule.maxDiscountAmount > 0 && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Max Cap: {formatINR(rule.maxDiscountAmount)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <span className="font-bold text-emerald-900">
                          Min {rule.minQuantity} Units:
                        </span>
                        <span className="font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded shadow-2xs font-mono">
                          {rule.discountType === 'percentage'
                            ? `${rule.discountValue}% OFF`
                            : `${formatINR(rule.discountValue)} FLAT OFF`}
                        </span>
                      </div>

                      {rule.minOrderValue && rule.minOrderValue > 0 && (
                        <span className="text-[11px] text-slate-500">
                          • Requires Cart Value &gt; {formatINR(rule.minOrderValue)}
                        </span>
                      )}

                      {rule.maxDiscountAmount && rule.maxDiscountAmount > 0 && (
                        <span className="text-[11px] text-slate-500">
                          • Max Cap: {formatINR(rule.maxDiscountAmount)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Analytics & Timestamps */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>{rule.timesApplied || 0} times applied</span>
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">
                      Savings granted: <strong className="text-emerald-700 font-mono">{formatINR(rule.totalSavingsGranted || 0)}</strong>
                    </span>
                  </div>

                  <span className="font-mono text-[10px]">
                    ID: {rule.id}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRuleId ? 'Edit Bulk Discount Rule' : 'Create New Bulk Discount Rule'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure volume pricing slabs, thresholds, and customer constraints.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Toolbar (Only when creating new) */}
            {!editingRuleId && (
              <div className="bg-indigo-50/70 border-b border-indigo-100 p-3 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Load Preset:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('tiered_3')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Tiered (3+, 6+, 10+)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('corporate_10')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    B2B Wholesale 12%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('accessory_bundle')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Power/Audio 4-Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('milestone_50k')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    ₹50k Cart Milestone
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Rule Name & Description */}
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Rule Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Volume Pack: Buy 3+ Save 5%, 6+ Save 10%"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Customer-Facing Description
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="e.g. Purchase 3 or more electronics to automatically unlock progressive wholesale volume discounts."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Target Scope & Product/Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Target Applicability Scope
                  </label>
                  <select
                    value={formTargetType}
                    onChange={(e) => setFormTargetType(e.target.value as BulkDiscountTargetType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="entire_order">Entire Store (All Products)</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Single Product</option>
                  </select>
                </div>

                {formTargetType === 'category' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Eligible Category
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formTargetType === 'product' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Target Product
                    </label>
                    <select
                      value={formProductId}
                      onChange={(e) => setFormProductId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                      required
                    >
                      <option value="">Select a product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatINR(p.dealPrice || p.regularPrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Target Customer Audience
                  </label>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="all">All Shoppers (Retail & B2B)</option>
                    <option value="b2b_only">B2B Business Buyers Only (with GSTIN)</option>
                    <option value="retail_only">Retail Shoppers Only</option>
                  </select>
                </div>
              </div>

              {/* Thresholds: Min Quantity & Min Cart Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Minimum Quantity Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMinQuantity}
                    onChange={(e) => setFormMinQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Units of eligible item(s) needed in cart
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Minimum Cart Subtotal (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrderValue}
                    onChange={(e) => setFormMinOrderValue(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Set 0 for no cart minimum
                  </span>
                </div>
              </div>

              {/* Multi-Tier Volume Ladder Toggle */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Enable Multi-Tier Volume Ladder
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Progressive discount scaling (e.g. 3+ units = 5%, 6+ units = 10%, 10+ units = 15%)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableTiers}
                      onChange={(e) => setEnableTiers(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {enableTiers ? (
                  <div className="space-y-2 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                        Volume Pricing Slabs
                      </span>
                      <button
                        type="button"
                        onClick={handleAddTierRow}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tier Slab</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formTiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 w-12">
                            Tier {idx + 1}:
                          </span>

                          <div className="flex-1 flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">From Qty</span>
                            <input
                              type="number"
                              min={1}
                              value={tier.minQuantity}
                              onChange={(e) =>
                                handleUpdateTier(idx, 'minQuantity', Math.max(1, Number(e.target.value)))
                              }
                              className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-center"
                            />
                            <span className="text-[11px] text-slate-500">units</span>
                          </div>

                          <div className="flex-1 flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">Discount:</span>
                            <input
                              type="number"
                              min={1}
                              max={90}
                              value={tier.discountPercentage || 5}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  'discountPercentage',
                                  Math.min(90, Math.max(1, Number(e.target.value)))
                                )
                              }
                              className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-center"
                            />
                            <span className="text-[11px] font-bold text-slate-700">% OFF</span>
                          </div>

                          {formTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTierRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete tier"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Single Flat Discount Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Discount Calculation Method
                      </label>
                      <select
                        value={formDiscountType}
                        onChange={(e) =>
                          setFormDiscountType(e.target.value as BulkDiscountCalculationType)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="fixed_amount">Flat Fixed Discount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Discount Value ({formDiscountType === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formDiscountValue}
                        onChange={(e) => setFormDiscountValue(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cap, Stack, Active Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Maximum Discount Cap (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Maximum deduction allowed per order (0 for unlimited)
                  </span>
                </div>

                <div className="space-y-2 pt-1 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStackWithCoupons}
                      onChange={(e) => setFormStackWithCoupons(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">
                      Can be combined with Coupon Codes
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">
                      Rule Active on Storefront
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingRuleId ? 'Update Rule' : 'Save & Publish Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
