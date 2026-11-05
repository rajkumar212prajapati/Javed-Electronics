import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Outlet,
  OutletOwnershipModelType,
  OutletStatus,
  StoreType,
  StoreDeliverySlot,
  StoreOrderAcceptanceConfig,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  STORE_TYPES_METADATA,
  getDefaultOrderAcceptanceConfig,
  getDefaultSlotsForStoreType,
} from '../../data/storeTypesData';
import {
  Store,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Phone,
  Mail,
  Users,
  ShieldAlert,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  Download,
  AlertCircle,
  ChevronDown,
  Navigation,
  Trash2,
  Sliders,
  Power,
  ShoppingBag,
  HeartPulse,
  Utensils,
  Tv,
  Apple,
  Wrench,
  Calendar,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const OutletsManager: React.FC = () => {
  const {
    outlets,
    activeOutletId,
    setActiveOutletId,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    toggleOutletStatus,
    updateOutletOrderAcceptanceConfig,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [slotModalOutlet, setSlotModalOutlet] = useState<Outlet | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form states for Create/Edit Outlet
  const [selectedStoreType, setSelectedStoreType] = useState<StoreType>('grocery');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ownershipModel, setOwnershipModel] = useState<OutletOwnershipModelType>('COCO');
  const [parentCompany, setParentCompany] = useState('Javed Retail & Services Group');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [gstin, setGstin] = useState('27AAACJ1234F1Z5');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Nalasopara');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('401209');
  const [openTime, setOpenTime] = useState('09:00 AM');
  const [closeTime, setCloseTime] = useState('10:00 PM');
  const [deliveryRadius, setDeliveryRadius] = useState(12);
  const [commissionRate, setCommissionRate] = useState(5);
  const [pincodesInput, setPincodesInput] = useState('401209, 401203, 401201');
  const [status, setStatus] = useState<OutletStatus>('active');
  const [deliveryTimePromise, setDeliveryTimePromise] = useState('30 - 45 Mins Express Delivery');
  const [deliveryMode, setDeliveryMode] = useState<'instant_express' | 'slot_scheduled' | 'hybrid_both'>('hybrid_both');
  const [averagePrepTimeMinutes, setAveragePrepTimeMinutes] = useState(15);

  // Slot Manager temporary state inside slotModal
  const [tempAcceptanceConfig, setTempAcceptanceConfig] = useState<StoreOrderAcceptanceConfig | null>(null);
  const [showAddSlotForm, setShowAddSlotForm] = useState(false);
  const [newSlotTitle, setNewSlotTitle] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('08:00 AM');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00 AM');
  const [newSlotMaxOrders, setNewSlotMaxOrders] = useState(30);
  const [newSlotCutoff, setNewSlotCutoff] = useState(30);
  const [newSlotFee, setNewSlotFee] = useState(0);
  const [newSlotBadge, setNewSlotBadge] = useState('');

  // Flash feedback toast
  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Helper to get Icon Component for StoreType
  const getStoreTypeIcon = (type: StoreType = 'electronics_superstore', className: string = 'w-4 h-4') => {
    switch (type) {
      case 'grocery':
        return <ShoppingBag className={className} />;
      case 'pharma':
        return <HeartPulse className={className} />;
      case 'cafe_kitchen':
        return <Utensils className={className} />;
      case 'electronics_superstore':
        return <Tv className={className} />;
      case 'fruits_veg_dairy':
        return <Apple className={className} />;
      case 'service_provider':
        return <Wrench className={className} />;
      default:
        return <Store className={className} />;
    }
  };

  const getStoreTypeBadge = (type: StoreType = 'electronics_superstore') => {
    const meta = STORE_TYPES_METADATA[type] || STORE_TYPES_METADATA.electronics_superstore;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.colorScheme.bg} ${meta.colorScheme.text} ${meta.colorScheme.border}`}
      >
        {getStoreTypeIcon(type, 'w-3.5 h-3.5')}
        <span>{meta.title}</span>
      </span>
    );
  };

  const filteredOutlets = outlets.filter((out) => {
    const oType = out.storeType || 'electronics_superstore';
    const matchesSearch =
      out.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (out.deliveryTimePromise || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStoreType = storeTypeFilter === 'all' || oType === storeTypeFilter;
    const matchesModel = modelFilter === 'all' || out.ownershipModel === modelFilter;
    const matchesStatus = statusFilter === 'all' || out.status === statusFilter;
    return matchesSearch && matchesStoreType && matchesModel && matchesStatus;
  });

  const resetForm = (targetType: StoreType = 'grocery') => {
    const meta = STORE_TYPES_METADATA[targetType];
    setSelectedStoreType(targetType);
    setName('');
    setCode(`OUT-${targetType.substring(0, 3).toUpperCase()}-00${outlets.length + 1}`);
    setOwnershipModel('COCO');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setManagerName('');
    setManagerPhone('');
    setGstin('27AAACJ1234F1Z5');
    setFssaiNumber(targetType === 'grocery' || targetType === 'cafe_kitchen' || targetType === 'fruits_veg_dairy' ? '11523999000123' : '');
    setDrugLicenseNumber(targetType === 'pharma' ? 'MH-TZ2-284901' : '');
    setAddress('');
    setCity('Nalasopara');
    setState('Maharashtra');
    setPincode('401209');
    setOpenTime('08:30 AM');
    setCloseTime('10:00 PM');
    setPincodesInput('401209, 401203, 401201');
    setDeliveryRadius(meta.suggestedPincodeRadiusKm || 12);
    setCommissionRate(5);
    setStatus('active');
    setDeliveryTimePromise(meta.defaultDeliveryTime);
    setDeliveryMode(meta.defaultDeliveryMode);
    setAveragePrepTimeMinutes(meta.averagePrepTimeMinutes);
    setEditingOutlet(null);
  };

  const handleSelectStoreTypeInWizard = (type: StoreType) => {
    const meta = STORE_TYPES_METADATA[type];
    setSelectedStoreType(type);
    setDeliveryTimePromise(meta.defaultDeliveryTime);
    setDeliveryMode(meta.defaultDeliveryMode);
    setAveragePrepTimeMinutes(meta.averagePrepTimeMinutes);
    if (!editingOutlet) {
      setCode(`OUT-${type.substring(0, 3).toUpperCase()}-00${outlets.length + 1}`);
      setDeliveryRadius(meta.suggestedPincodeRadiusKm);
    }
  };

  const handleOpenEdit = (out: Outlet) => {
    const sType = out.storeType || 'electronics_superstore';
    const config = out.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(sType);
    setEditingOutlet(out);
    setSelectedStoreType(sType);
    setName(out.name);
    setCode(out.code);
    setOwnershipModel(out.ownershipModel);
    setParentCompany(out.parentCompany);
    setOwnerName(out.ownerName);
    setOwnerPhone(out.ownerPhone);
    setOwnerEmail(out.ownerEmail);
    setManagerName(out.managerName);
    setManagerPhone(out.managerPhone);
    setGstin(out.gstin);
    setFssaiNumber(out.fssaiNumber || config.fssaiNumber || '');
    setDrugLicenseNumber(out.drugLicenseNumber || config.drugLicenseNumber || '');
    setAddress(out.address);
    setCity(out.city);
    setState(out.state);
    setPincode(out.pincode);
    setOpenTime(out.operatingHours.open);
    setCloseTime(out.operatingHours.close);
    setDeliveryRadius(out.deliveryRadiusKm);
    setCommissionRate(out.commissionRate);
    setPincodesInput(out.serviceablePincodes.join(', '));
    setStatus(out.status);
    setDeliveryTimePromise(out.deliveryTimePromise || config.deliveryTimePromise);
    setDeliveryMode(config.deliveryMode || 'hybrid_both');
    setAveragePrepTimeMinutes(config.averagePrepTimeMinutes || 15);
    setShowCreateModal(true);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const parsedPincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const baseConfig =
      editingOutlet?.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(selectedStoreType);

    const updatedConfig: StoreOrderAcceptanceConfig = {
      ...baseConfig,
      deliveryTimePromise,
      deliveryMode,
      averagePrepTimeMinutes: Number(averagePrepTimeMinutes),
      fssaiNumber: fssaiNumber || undefined,
      drugLicenseNumber: drugLicenseNumber || undefined,
    };

    if (editingOutlet) {
      updateOutlet({
        ...editingOutlet,
        storeType: selectedStoreType,
        deliveryTimePromise,
        orderAcceptanceConfig: updatedConfig,
        fssaiNumber: fssaiNumber || undefined,
        drugLicenseNumber: drugLicenseNumber || undefined,
        name,
        code,
        ownershipModel,
        parentCompany,
        ownerName,
        ownerPhone,
        ownerEmail,
        managerName,
        managerPhone,
        gstin,
        address,
        city,
        state,
        pincode,
        operatingHours: {
          ...editingOutlet.operatingHours,
          open: openTime,
          close: closeTime,
        },
        deliveryRadiusKm: Number(deliveryRadius),
        commissionRate: Number(commissionRate),
        serviceablePincodes: parsedPincodes,
        status,
      });
      showToast(`Store "${name}" updated successfully with ${STORE_TYPES_METADATA[selectedStoreType].title} parameters.`);
    } else {
      createOutlet({
        name,
        code,
        storeType: selectedStoreType,
        deliveryTimePromise,
        orderAcceptanceConfig: updatedConfig,
        fssaiNumber: fssaiNumber || undefined,
        drugLicenseNumber: drugLicenseNumber || undefined,
        businessCategoryId: `cat_${selectedStoreType}`,
        ownershipModel,
        parentCompany,
        ownerName: ownerName || 'Store Franchise Partner',
        ownerPhone: ownerPhone || '+91 98390 12345',
        ownerEmail: ownerEmail || 'store@javedgroup.in',
        managerName: managerName || 'Branch Dispatch Officer',
        managerPhone: managerPhone || '+91 98390 54321',
        gstin,
        address,
        city,
        state,
        pincode,
        coordinates: { lat: 19.418, lng: 72.829 },
        operatingHours: {
          open: openTime,
          close: closeTime,
          daysOpen: 'Mon - Sun',
        },
        holidays: ['Republic Day', 'Independence Day', 'Diwali'],
        serviceablePincodes: parsedPincodes,
        deliveryRadiusKm: Number(deliveryRadius),
        staffCount: 6,
        commissionRate: Number(commissionRate),
        status,
        monthlyRevenue: 350000,
        activeOrdersCount: 4,
      });
      showToast(`New ${STORE_TYPES_METADATA[selectedStoreType].title} "${name}" onboarded with standard slots!`);
    }

    setShowCreateModal(false);
  };

  // 1-Click Activate / Deactivate / Reactivate
  const handleToggleStoreStatus = (outlet: Outlet) => {
    let newStatus: OutletStatus = 'active';
    let actionLabel = 'activated';
    if (outlet.status === 'active') {
      newStatus = 'inactive';
      actionLabel = 'deactivated';
    } else {
      newStatus = 'active';
      actionLabel = 'reactivated';
    }
    toggleOutletStatus(outlet.id, newStatus);
    showToast(`Store "${outlet.name}" has been ${actionLabel.toUpperCase()} successfully.`);
  };

  // Delete store
  const handleDeleteStore = (outlet: Outlet) => {
    if (outlets.length <= 1) {
      alert('At least one store outlet must remain active.');
      return;
    }
    if (confirm(`Are you sure you want to delete or offboard store "${outlet.name}" (${outlet.code})?`)) {
      deleteOutlet(outlet.id);
      showToast(`Store "${outlet.name}" removed from platform.`);
    }
  };

  // Open Delivery Slots & Order Acceptance Manager Modal
  const handleOpenSlotManager = (outlet: Outlet) => {
    const sType = outlet.storeType || 'electronics_superstore';
    const currentConfig = outlet.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(sType);
    setSlotModalOutlet(outlet);
    setTempAcceptanceConfig(JSON.parse(JSON.stringify(currentConfig)));
    setShowAddSlotForm(false);
  };

  // Save Slots Configuration from Modal
  const handleSaveSlotConfig = () => {
    if (!slotModalOutlet || !tempAcceptanceConfig) return;
    updateOutletOrderAcceptanceConfig(slotModalOutlet.id, tempAcceptanceConfig);
    showToast(`Delivery slots and order acceptance rules saved for "${slotModalOutlet.name}".`);
    setSlotModalOutlet(null);
  };

  // Add a slot to temporary config
  const handleAddTempSlot = () => {
    if (!tempAcceptanceConfig || !newSlotTitle) return;
    const newSlot: StoreDeliverySlot = {
      id: `slot_custom_${Date.now()}`,
      title: newSlotTitle,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      maxOrders: Number(newSlotMaxOrders) || 30,
      currentOrders: 0,
      cutoffMinutes: Number(newSlotCutoff) || 30,
      slotFee: Number(newSlotFee) || 0,
      isActive: true,
      specialBadge: newSlotBadge ? newSlotBadge : undefined,
    };

    setTempAcceptanceConfig({
      ...tempAcceptanceConfig,
      slots: [...tempAcceptanceConfig.slots, newSlot],
    });

    setNewSlotTitle('');
    setShowAddSlotForm(false);
    showToast(`New slot "${newSlot.title}" added to queue.`);
  };

  // Toggle active status of a single slot
  const handleToggleSingleSlot = (slotId: string) => {
    if (!tempAcceptanceConfig) return;
    setTempAcceptanceConfig({
      ...tempAcceptanceConfig,
      slots: tempAcceptanceConfig.slots.map((s) =>
        s.id === slotId ? { ...s, isActive: !s.isActive } : s
      ),
    });
  };

  // Delete a slot
  const handleDeleteSlot = (slotId: string) => {
    if (!tempAcceptanceConfig) return;
    setTempAcceptanceConfig({
      ...tempAcceptanceConfig,
      slots: tempAcceptanceConfig.slots.filter((s) => s.id !== slotId),
    });
  };

  // Reset to vertical standard slots
  const handleResetToStandardSlots = () => {
    if (!slotModalOutlet || !tempAcceptanceConfig) return;
    const sType = slotModalOutlet.storeType || 'electronics_superstore';
    const standardSlots = getDefaultSlotsForStoreType(sType);
    setTempAcceptanceConfig({
      ...tempAcceptanceConfig,
      slots: standardSlots,
    });
    showToast(`Reset to recommended default slots for ${STORE_TYPES_METADATA[sType].title}.`);
  };

  const handleExportCsv = () => {
    const headers = [
      'Outlet Code',
      'Name',
      'Store Type',
      'Delivery Time Promise',
      'Model',
      'Status',
      'Order Acceptance',
      'Active Slots',
      'City',
      'PIN Code',
      'Manager',
      'Phone',
    ];
    const rows = filteredOutlets.map((o) => {
      const config = o.orderAcceptanceConfig;
      const activeSlotsCount = config?.slots?.filter((s) => s.isActive).length || 0;
      return [
        o.code,
        `"${o.name}"`,
        o.storeType || 'electronics_superstore',
        `"${o.deliveryTimePromise || 'Express'}"`,
        o.ownershipModel,
        o.status,
        config?.orderAcceptanceEnabled !== false ? 'Accepting' : 'Paused',
        activeSlotsCount,
        o.city,
        o.pincode,
        `"${o.managerName}"`,
        o.managerPhone,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `javed_stores_verticals_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModelBadge = (model: OutletOwnershipModelType) => {
    switch (model) {
      case 'COCO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">COCO (Company)</span>;
      case 'FOCO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">FOCO (Franchise-Owned)</span>;
      case 'FOFO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">FOFO (Franchise-Operated)</span>;
      case 'dealer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Authorized Dealer</span>;
      case 'marketplace_seller':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Marketplace Seller</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{model}</span>;
    }
  };

  const getStatusBadge = (s: OutletStatus) => {
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-slate-400" /> Deactivated
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3" /> Suspended
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast feedback */}
      {feedbackMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs sm:text-sm animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header Banner & Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Stores</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{outlets.length} Outlets</div>
          <span className="text-[11px] text-blue-600 font-medium">6 Retail Verticals Onboarded</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Live & Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {outlets.filter((o) => o.status === 'active').length} Active
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Accepting customer orders</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Slot Acceptance</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700">
            {
              outlets.reduce((acc, curr) => {
                const slotsCount = curr.orderAcceptanceConfig?.slots?.filter((s) => s.isActive).length || 0;
                return acc + slotsCount;
              }, 0)
            }{' '}
            Slots
          </div>
          <span className="text-[11px] text-purple-600">Morning, Express & Night</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Inactive / Paused</span>
            <Power className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            {outlets.filter((o) => o.status !== 'active').length} Paused
          </div>
          <span className="text-[11px] text-slate-500">Can reactivate anytime</span>
        </div>
      </div>

      {/* STORE TYPE VERTICAL TABS */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setStoreTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            storeTypeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Store Types</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {outlets.length}
          </span>
        </button>

        {(
          [
            'grocery',
            'pharma',
            'cafe_kitchen',
            'electronics_superstore',
            'fruits_veg_dairy',
            'service_provider',
          ] as StoreType[]
        ).map((type) => {
          const meta = STORE_TYPES_METADATA[type];
          const count = outlets.filter((o) => (o.storeType || 'electronics_superstore') === type).length;
          const isSelected = storeTypeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setStoreTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? `${meta.colorScheme.bg} ${meta.colorScheme.text} ${meta.colorScheme.border} font-bold ring-1 ring-current`
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {getStoreTypeIcon(type, 'w-3.5 h-3.5')}
              <span>{meta.shortTitle}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? meta.colorScheme.badgeBg : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Status Filter & Primary Action Button */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name, code, vertical promise, city, manager..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active & Open</option>
            <option value="inactive">Inactive / Deactivated</option>
            <option value="suspended">Suspended</option>
            <option value="pending_approval">Pending Approval</option>
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All Ownership Models</option>
            <option value="COCO">COCO (Company)</option>
            <option value="FOCO">FOCO (Franchise-Owned)</option>
            <option value="FOFO">FOFO (Franchise-Operated)</option>
            <option value="dealer">Authorized Regional Dealer</option>
            <option value="marketplace_seller">Marketplace Seller</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                resetForm('grocery');
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Store</span>
            </button>
          )}
        </div>
      </div>

      {/* STORE OUTLETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map((outlet) => {
          const isSelected = activeOutletId === outlet.id;
          const sType: StoreType = outlet.storeType || 'electronics_superstore';
          const meta = STORE_TYPES_METADATA[sType] || STORE_TYPES_METADATA.electronics_superstore;
          const config = outlet.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(sType);
          const slots = config.slots || [];
          const activeSlots = slots.filter((s) => s.isActive);
          const totalBookedOrders = slots.reduce((sum, s) => sum + (s.currentOrders || 0), 0);
          const totalMaxCapacity = slots.reduce((sum, s) => sum + (s.maxOrders || 0), 0);
          const isAccepting = config.orderAcceptanceEnabled !== false;

          return (
            <div
              key={outlet.id}
              className={`bg-white rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header row: Store Type & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      {outlet.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{outlet.name}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(outlet.status)}
                    {getModelBadge(outlet.ownershipModel)}
                  </div>
                </div>

                {/* Vertical Pill & Delivery Promise Bar */}
                <div className="my-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {getStoreTypeBadge(sType)}
                    <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {outlet.city}, {outlet.pincode}
                    </span>
                  </div>

                  {/* Delivery Promise highlight */}
                  <div
                    className={`rounded-lg px-2.5 py-1.5 border text-xs flex items-center justify-between ${meta.colorScheme.bg} ${meta.colorScheme.border}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${meta.colorScheme.text}`} />
                      <span className={`font-bold ${meta.colorScheme.text}`}>
                        {outlet.deliveryTimePromise || meta.defaultDeliveryTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAccepting ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      ></span>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {isAccepting ? 'Accepting' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{outlet.address}</p>

                {/* Specific Store Details */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1.5 mb-3 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Manager:</span>
                    <span className="font-semibold">{outlet.managerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Contact:</span>
                    <span className="font-mono">{outlet.managerPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Operating Hours:</span>
                    <span className="font-medium">
                      {outlet.operatingHours.open} - {outlet.operatingHours.close}
                    </span>
                  </div>

                  {/* Licenses if applicable */}
                  {(outlet.fssaiNumber || config.fssaiNumber) && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">FSSAI License:</span>
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {outlet.fssaiNumber || config.fssaiNumber}
                      </span>
                    </div>
                  )}
                  {(outlet.drugLicenseNumber || config.drugLicenseNumber) && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Drug License:</span>
                      <span className="font-mono text-[10px] text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {outlet.drugLicenseNumber || config.drugLicenseNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Delivery Radius:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateOutlet({
                            ...outlet,
                            deliveryRadiusKm: Math.max(
                              1,
                              Number(((outlet.deliveryRadiusKm || 12) - 1).toFixed(1))
                            ),
                          })
                        }
                        className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        title="Decrease delivery radius by 1 km"
                      >
                        -
                      </button>
                      <span className="font-bold text-blue-700 min-w-[44px] text-center">
                        {outlet.deliveryRadiusKm} km
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateOutlet({
                            ...outlet,
                            deliveryRadiusKm: Math.min(
                              50,
                              Number(((outlet.deliveryRadiusKm || 12) + 1).toFixed(1))
                            ),
                          })
                        }
                        className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        title="Increase delivery radius by 1 km"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* SLOTS & ORDER ACCEPTANCE SNAPSHOT */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Delivery Slots ({activeSlots.length} Active / {slots.length} Total)
                    </span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {totalBookedOrders} / {totalMaxCapacity} Booked
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          totalMaxCapacity > 0 ? (totalBookedOrders / totalMaxCapacity) * 100 : 0
                        )}%`,
                      }}
                    ></div>
                  </div>

                  {/* Mini slot badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {slots.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          s.isActive
                            ? 'bg-white text-slate-700 border-slate-200'
                            : 'bg-slate-100 text-slate-400 border-dashed border-slate-200 line-through'
                        }`}
                      >
                        {s.startTime} - {s.endTime}
                      </span>
                    ))}
                    {slots.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500 font-semibold">
                        +{slots.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {/* Primary Row: Slot Manager & Activate/Deactivate Button */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleOpenSlotManager(outlet)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Slots</span>
                  </button>

                  <button
                    onClick={() => handleToggleStoreStatus(outlet)}
                    className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      outlet.status === 'active'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{outlet.status === 'active' ? 'Deactivate' : 'Reactivate'}</span>
                  </button>
                </div>

                {/* Secondary Row: Select Context, Edit, Delete */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setActiveOutletId(outlet.id)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>{isSelected ? 'Active Context' : 'Select Branch'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(outlet)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Store Configuration"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(outlet)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Offboard Store"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ONBOARD / EDIT STORE WITH 6 STORE TYPE SELECTOR CARDS */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/60 sm:backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl flex flex-col shadow-2xl sm:border sm:border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingOutlet ? `Edit Store: ${editingOutlet.name}` : 'Onboard New Store'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* STEP 1: SELECT STORE TYPE VERTICAL (6 CARDS) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Select Store Type Vertical *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(
                    [
                      'grocery',
                      'pharma',
                      'cafe_kitchen',
                      'electronics_superstore',
                      'fruits_veg_dairy',
                      'service_provider',
                    ] as StoreType[]
                  ).map((type) => {
                    const meta = STORE_TYPES_METADATA[type];
                    const isPicked = selectedStoreType === type;
                    return (
                      <div
                        key={type}
                        onClick={() => handleSelectStoreTypeInWizard(type)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isPicked
                            ? `${meta.colorScheme.border} ${meta.colorScheme.bg} ring-2 ring-blue-500/30 shadow-xs`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`p-1.5 rounded-lg text-white bg-gradient-to-br ${meta.colorScheme.linearBg}`}
                            >
                              {getStoreTypeIcon(type, 'w-4 h-4')}
                            </span>
                            {isPicked && (
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs">{meta.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{meta.tagline}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-600">{meta.defaultDeliveryTime.split(' ')[0]} {meta.defaultDeliveryTime.split(' ')[1]}</span>
                          <span className="font-mono text-slate-500">~{meta.averagePrepTimeMinutes}m prep</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: DELIVERY TIME PROMISE & FULFILLMENT MODE */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Delivery Promise & Order Acceptance Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Time Promise String *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryTimePromise}
                      onChange={(e) => setDeliveryTimePromise(e.target.value)}
                      placeholder="e.g. 15 - 30 Mins Urgent Healthcare"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order Fulfillment Mode
                    </label>
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                    >
                      <option value="instant_express">Instant Hyperlocal Express Only</option>
                      <option value="slot_scheduled">Scheduled Delivery Slots Only</option>
                      <option value="hybrid_both">Hybrid (Instant Express + Time Slots)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Average Prep / Picking Time
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={averagePrepTimeMinutes}
                        onChange={(e) => setAveragePrepTimeMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        Minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: STORE BASIC DETAILS */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  3. Store Identity & Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Javed Fresh Farm & Daily Mart"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Store Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. OUT-GRO-005"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ownership Model</label>
                    <select
                      value={ownershipModel}
                      onChange={(e) => setOwnershipModel(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                    >
                      <option value="COCO">COCO (Company Owned, Company Operated)</option>
                      <option value="FOCO">FOCO (Franchise Owned, Company Operated)</option>
                      <option value="FOFO">FOFO (Franchise Owned, Franchise Operated)</option>
                      <option value="dealer">Authorized Regional Dealer</option>
                      <option value="marketplace_seller">Marketplace Seller Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                    >
                      <option value="active">Active & Live for Orders</option>
                      <option value="inactive">Temporarily Deactivated</option>
                      <option value="suspended">Suspended (Audit/Review)</option>
                      <option value="pending_approval">Pending Onboarding Approval</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Name</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Rajesh Patil"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Phone</label>
                    <input
                      type="text"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      placeholder="+91 98390 54321"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Street Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop #4, Ground Floor, Station Road..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 4: LICENSES & COMPLIANCE */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Statutory Registration & Vertical Licenses
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="27AAACJ1234F1Z5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono bg-white"
                    />
                  </div>

                  {(selectedStoreType === 'grocery' ||
                    selectedStoreType === 'cafe_kitchen' ||
                    selectedStoreType === 'fruits_veg_dairy') && (
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">
                        FSSAI License Number *
                      </label>
                      <input
                        type="text"
                        value={fssaiNumber}
                        onChange={(e) => setFssaiNumber(e.target.value)}
                        placeholder="e.g. 11523999000123"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm font-mono bg-white"
                      />
                    </div>
                  )}

                  {selectedStoreType === 'pharma' && (
                    <div>
                      <label className="block text-xs font-semibold text-rose-800 mb-1">
                        Drug License Number (20/21) *
                      </label>
                      <input
                        type="text"
                        value={drugLicenseNumber}
                        onChange={(e) => setDrugLicenseNumber(e.target.value)}
                        placeholder="e.g. MH-TZ2-284901"
                        className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-600 text-xs sm:text-sm font-mono bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serviceable PIN Codes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={pincodesInput}
                    onChange={(e) => setPincodesInput(e.target.value)}
                    placeholder="401209, 401203, 401201"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono bg-white"
                  />
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingOutlet ? 'Save Store Changes' : 'Complete Store Onboarding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE DELIVERY SLOTS & ORDER ACCEPTANCE MANAGER */}
      {slotModalOutlet && tempAcceptanceConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStoreTypeBadge(slotModalOutlet.storeType || 'electronics_superstore')}
                  <span className="text-xs font-mono text-slate-500 font-bold">{slotModalOutlet.code}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Delivery Slots & Order Acceptance Manager: {slotModalOutlet.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Manage slot timings, hourly capacity caps, cutoff windows and instant order acceptance
                </p>
              </div>
              <button
                onClick={() => setSlotModalOutlet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* MASTER ORDER ACCEPTANCE SWITCH & DELIVERY PROMISE */}
              <div className="p-4 rounded-xl border bg-gradient-to-r from-slate-50 to-blue-50/40 border-blue-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Power className="w-4 h-4 text-blue-600" />
                      Master Store Order Acceptance Status
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Toggle to immediately pause or resume incoming orders across all customer touchpoints
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setTempAcceptanceConfig({
                        ...tempAcceptanceConfig,
                        orderAcceptanceEnabled: !tempAcceptanceConfig.orderAcceptanceEnabled,
                      })
                    }
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                      tempAcceptanceConfig.orderAcceptanceEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tempAcceptanceConfig.orderAcceptanceEnabled ? 'bg-white animate-pulse' : 'bg-amber-200'
                      }`}
                    ></span>
                    <span>
                      {tempAcceptanceConfig.orderAcceptanceEnabled
                        ? 'ACCEPTING ORDERS (LIVE)'
                        : 'ORDER ACCEPTANCE PAUSED'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Time Promise Banner
                    </label>
                    <input
                      type="text"
                      value={tempAcceptanceConfig.deliveryTimePromise}
                      onChange={(e) =>
                        setTempAcceptanceConfig({
                          ...tempAcceptanceConfig,
                          deliveryTimePromise: e.target.value,
                        })
                      }
                      placeholder="e.g. 30 - 45 Mins Express Delivery"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fulfillment Mode
                    </label>
                    <select
                      value={tempAcceptanceConfig.deliveryMode}
                      onChange={(e) =>
                        setTempAcceptanceConfig({
                          ...tempAcceptanceConfig,
                          deliveryMode: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="instant_express">Instant Hyperlocal Express</option>
                      <option value="slot_scheduled">Slot-Based Scheduled Dispatch Only</option>
                      <option value="hybrid_both">Hybrid (Express + Slots Available)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SLOTS LIST SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Configured Delivery Slots</h4>
                    <p className="text-xs text-slate-500">
                      Customers select from these time slots during checkout. Adjust order caps and cutoff timing.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetToStandardSlots}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSlotForm(!showAddSlotForm)}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddSlotForm ? 'Cancel' : 'Add Slot'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Slot Form */}
                {showAddSlotForm && (
                  <div className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/40 mb-4 space-y-3 animate-in fade-in">
                    <h5 className="font-bold text-slate-900 text-xs">Add New Delivery Time Slot</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Slot Title *
                        </label>
                        <input
                          type="text"
                          value={newSlotTitle}
                          onChange={(e) => setNewSlotTitle(e.target.value)}
                          placeholder="e.g. Afternoon Farm Fresh Dispatch"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Special Badge
                        </label>
                        <input
                          type="text"
                          value={newSlotBadge}
                          onChange={(e) => setNewSlotBadge(e.target.value)}
                          placeholder="e.g. Express Fresh / Emergency"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Start Time
                        </label>
                        <input
                          type="text"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          placeholder="09:00 AM"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          End Time
                        </label>
                        <input
                          type="text"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          placeholder="12:00 PM"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Max Capacity (Orders)
                        </label>
                        <input
                          type="number"
                          value={newSlotMaxOrders}
                          onChange={(e) => setNewSlotMaxOrders(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Cutoff Window (Mins)
                        </label>
                        <input
                          type="number"
                          value={newSlotCutoff}
                          onChange={(e) => setNewSlotCutoff(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSlotForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTempSlot}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        Add Slot to Schedule
                      </button>
                    </div>
                  </div>
                )}

                {/* Slots Table / Cards */}
                <div className="space-y-2.5">
                  {tempAcceptanceConfig.slots.map((slot) => {
                    const capacityPercent = Math.min(
                      100,
                      slot.maxOrders > 0 ? ((slot.currentOrders || 0) / slot.maxOrders) * 100 : 0
                    );

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          slot.isActive
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-slate-50 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                slot.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            ></span>
                            <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{slot.title}</h5>
                            {slot.specialBadge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {slot.specialBadge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleToggleSingleSlot(slot.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                slot.isActive
                                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {slot.isActive ? 'Slot Active' : 'Slot Inactive'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Timing, Capacity & Slider controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">Window:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Cutoff: {slot.cutoffMinutes}m before
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-500">Bookings / Cap:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {slot.currentOrders || 0} / {slot.maxOrders}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full"
                                style={{ width: `${capacityPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              Max Capacity Limit:
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={slot.maxOrders}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTempAcceptanceConfig({
                                    ...tempAcceptanceConfig,
                                    slots: tempAcceptanceConfig.slots.map((s) =>
                                      s.id === slot.id ? { ...s, maxOrders: Math.max(1, val) } : s
                                    ),
                                  });
                                }}
                                className="w-20 px-2 py-0.5 border border-slate-200 rounded text-xs font-mono bg-slate-50 text-center font-bold"
                              />
                              <span className="text-[11px] text-slate-500">Orders max</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSlotModalOutlet(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlotConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Slots & Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
