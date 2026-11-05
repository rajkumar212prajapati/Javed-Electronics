import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryPincodeZone } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Building2,
  Globe,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Check,
  RotateCcw,
  Compass,
  Layers,
} from 'lucide-react';
import { DeliveryRadiusMap } from '../common/DeliveryRadiusMap';

export const DeliveryZoneManager: React.FC = () => {
  const {
    deliveryZones,
    addDeliveryZone,
    updateDeliveryZone,
    deleteDeliveryZone,
    toggleDeliveryZoneStatus,
    outlets,
    activeOutlet,
    currentUser,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';
  const myStoreId = currentUser.storeId || activeOutlet?.id || 'out_hazratganj';
  const myStoreOutlet = outlets.find((o) => o.id === myStoreId) || activeOutlet;

  // Filters state
  const [activeView, setActiveView] = useState<'map_radius' | 'pincode_list'>('map_radius');
  const [searchTerm, setSearchTerm] = useState('');
  const [outletFilter, setOutletFilter] = useState<string>('all_scopes');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryPincodeZone | null>(null);

  // Form inputs
  const [pincode, setPincode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [city, setCity] = useState('Lucknow');
  const [state, setState] = useState('Uttar Pradesh');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all');
  const [deliveryFee, setDeliveryFee] = useState<number>(40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(699);
  const [estimatedHours, setEstimatedHours] = useState<number>(3);
  const [cutoffTime, setCutoffTime] = useState<string>('17:00');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // UI feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingZone(null);
    setPincode('');
    setAreaName('');
    setCity('Lucknow');
    setState('Uttar Pradesh');
    setSelectedOutletId('all');
    setDeliveryFee(40);
    setFreeDeliveryThreshold(699);
    setEstimatedHours(3);
    setCutoffTime('17:00');
    setIsActive(true);
    setNotes('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (zone: DeliveryPincodeZone) => {
    setEditingZone(zone);
    setPincode(zone.pincode);
    setAreaName(zone.areaName);
    setCity(zone.city || 'Lucknow');
    setState(zone.state || 'Uttar Pradesh');
    setSelectedOutletId(zone.outletId || 'all');
    setDeliveryFee(zone.deliveryFee ?? 40);
    setFreeDeliveryThreshold(zone.freeDeliveryThreshold ?? 699);
    setEstimatedHours(zone.estimatedHours || 3);
    setCutoffTime(zone.cutoffTime || '17:00');
    setIsActive(zone.isActive);
    setNotes(zone.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setFeedbackMsg({ type: 'error', text: 'PIN code must be exactly 6 digits.' });
      return;
    }
    if (!areaName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter area / neighborhood names.' });
      return;
    }

    if (editingZone) {
      const res = updateDeliveryZone({
        ...editingZone,
        pincode: pincode.trim(),
        areaName: areaName.trim(),
        city: city.trim() || 'Lucknow',
        state: state.trim() || 'Uttar Pradesh',
        outletId: selectedOutletId,
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        estimatedHours: Number(estimatedHours),
        cutoffTime,
        isActive,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message });
        setIsModalOpen(false);
        resetForm();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = addDeliveryZone({
        pincode: pincode.trim(),
        areaName: areaName.trim(),
        city: city.trim() || 'Lucknow',
        state: state.trim() || 'Uttar Pradesh',
        outletId: selectedOutletId,
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        estimatedHours: Number(estimatedHours),
        cutoffTime,
        isActive,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message });
        setIsModalOpen(false);
        resetForm();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  const handleDelete = (id: string) => {
    const res = deleteDeliveryZone(id);
    setDeleteConfirmId(null);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Scoped Delivery Zones for current role
  const roleScopedZones = useMemo(() => {
    if (isSuperAdmin) return deliveryZones;
    return deliveryZones.filter((z) => z.outletId === myStoreId || z.outletId === 'all');
  }, [deliveryZones, isSuperAdmin, myStoreId]);

  // Filtered Delivery Zones
  const filteredZones = useMemo(() => {
    return roleScopedZones.filter((zone) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        zone.pincode.includes(search) ||
        zone.areaName.toLowerCase().includes(search) ||
        (zone.outletName && zone.outletName.toLowerCase().includes(search)) ||
        zone.city.toLowerCase().includes(search);

      // Outlet filter (Super Admin only)
      let matchOutlet = true;
      if (isSuperAdmin) {
        if (outletFilter === 'all_scopes') {
          matchOutlet = true;
        } else if (outletFilter === 'all_stores_only') {
          matchOutlet = zone.outletId === 'all';
        } else {
          matchOutlet = zone.outletId === outletFilter;
        }
      }

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = zone.isActive;
      if (statusFilter === 'inactive') matchStatus = !zone.isActive;

      return matchSearch && matchOutlet && matchStatus;
    });
  }, [roleScopedZones, isSuperAdmin, searchTerm, outletFilter, statusFilter]);

  // Key KPI Metrics
  const stats = useMemo(() => {
    const total = roleScopedZones.length;
    const activeCount = roleScopedZones.filter((z) => z.isActive).length;
    const anyStoreCount = roleScopedZones.filter((z) => z.outletId === 'all').length;
    const storeSpecificCount = roleScopedZones.filter((z) => z.outletId !== 'all').length;
    const avgSla =
      total > 0
        ? (roleScopedZones.reduce((acc, z) => acc + (z.estimatedHours || 3), 0) / total).toFixed(1)
        : '3.0';

    return {
      total,
      activeCount,
      anyStoreCount,
      storeSpecificCount,
      avgSla,
    };
  }, [roleScopedZones]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>
                    {isSuperAdmin
                      ? 'Delivery Pincodes & Area Coverage Manager'
                      : `${myStoreOutlet?.name || 'Store'} — Serviceable Delivery Pincodes`}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {isSuperAdmin ? 'Super Admin' : 'Store Coverage'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSuperAdmin
                    ? 'Configure serviceable Indian PIN codes and neighborhood coverage for Any Store (Global Platform) or specific branch outlets.'
                    : `View local delivery PIN codes, fees, and express SLAs serviceable by ${myStoreOutlet?.name || 'your store'}.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isSuperAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pincode & Area</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
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
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Pincodes</span>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{stats.total}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{stats.activeCount} active for express delivery</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Any Store (Global)</span>
            <div className="text-xl font-extrabold text-purple-700 font-mono mt-0.5">{stats.anyStoreCount}</div>
            <span className="text-[10px] text-slate-500">Serviceable by all outlets</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Store Specific</span>
            <div className="text-xl font-extrabold text-blue-700 font-mono mt-0.5">{stats.storeSpecificCount}</div>
            <span className="text-[10px] text-slate-500">Dedicated branch routing</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Avg Delivery SLA</span>
            <div className="text-xl font-extrabold text-amber-600 font-mono mt-0.5">{stats.avgSla} Hrs</div>
            <span className="text-[10px] text-slate-500">Lucknow city speed</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveView('map_radius')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'map_radius'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Map Delivery Radius & Geospatial Zone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('pincode_list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'pincode_list'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pincode List & Tariff Table ({stats.total})</span>
          </button>
        </div>
      </div>

      {/* When Map Radius View is Active */}
      {activeView === 'map_radius' && (
        <div className="space-y-4">
          <DeliveryRadiusMap selectedOutlet={myStoreOutlet} />
        </div>
      )}

      {/* Filter and Search Bar */}
      {activeView === 'pincode_list' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PIN code (e.g. 401209), locality (Nalasopara / Vasai / Virar), or store name..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Store Scope Filter - Super Admin Only */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all_scopes">All Store Scopes ({deliveryZones.length})</option>
                <option value="all_stores_only">Any Store (Global Platform)</option>
                {outlets.map((out) => (
                  <option key={out.id} value={out.id}>
                    {out.name} ({out.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(searchTerm || outletFilter !== 'all_scopes' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOutletFilter('all_scopes');
                setStatusFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Coverage Zones List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Serviceable Zones ({filteredZones.length})
            </h3>
            <span className="text-xs text-slate-500">
              Orders placed from these PIN codes receive express doorstep courier delivery
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            City: <strong className="text-slate-900">Lucknow, UP</strong>
          </span>
        </div>

        {filteredZones.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No delivery zones matched your criteria</p>
            <p className="text-xs text-slate-400">Try modifying your search or click 'Add Pincode & Area' to configure coverage.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredZones.map((zone) => {
              const isGlobal = zone.outletId === 'all';
              const outletObj = outlets.find((o) => o.id === zone.outletId);

              return (
                <div
                  key={zone.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                    !zone.isActive ? 'bg-slate-50/40 opacity-75' : ''
                  }`}
                >
                  {/* Left: PIN Code, Area Names & Scope */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-sm tracking-wide shadow-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{zone.pincode}</span>
                      </span>

                      {/* Store Scope Badge */}
                      {isGlobal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Globe className="w-3 h-3 text-purple-600" />
                          <span>Any Store (Global Platform)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          <span>{outletObj ? outletObj.name : zone.outletName || 'Specific Branch'}</span>
                        </span>
                      )}

                      {/* Active Status Badge */}
                      <button
                        onClick={() => toggleDeliveryZoneStatus(zone.id)}
                        title="Click to toggle active status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          zone.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {zone.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Serviceable</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Paused</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Area Name / Localities */}
                    <div className="text-sm font-semibold text-slate-900 leading-snug">
                      {zone.areaName}
                    </div>

                    {/* Operational Notes */}
                    {zone.notes && (
                      <div className="text-xs text-slate-500 italic flex items-center gap-1">
                        <span>Note:</span>
                        <span>{zone.notes}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      <span>{zone.city}, {zone.state}</span>
                      {zone.updatedBy && <span className="ml-2">| Updated by {zone.updatedBy}</span>}
                    </div>
                  </div>

                  {/* Middle: Delivery SLA & Rates */}
                  <div className="flex items-center gap-4 text-xs shrink-0 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-xl border border-slate-200 lg:border-none">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Delivery Fee</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        {zone.deliveryFee === 0 ? 'FREE' : formatINR(zone.deliveryFee ?? 40)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Free &gt; {formatINR(zone.freeDeliveryThreshold ?? 699)}
                      </span>
                    </div>

                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>SLA & Cutoff</span>
                      </span>
                      <span className="font-bold text-amber-700">
                        {zone.estimatedHours} Hours Express
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Cutoff: {zone.cutoffTime || '17:00'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleOpenEditModal(zone)}
                      title="Edit pincode, coverage areas, or store assignment"
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === zone.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200 animate-in fade-in">
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold cursor-pointer hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(zone.id)}
                        title="Delete coverage zone"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 relative animate-in zoom-in-95 duration-150 my-8">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {editingZone ? `Edit Delivery Zone: PIN ${editingZone.pincode}` : 'Add Serviceable Pincode & Area'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Define the PIN code, covered localities, and assign whether orders are dispatched by <strong>Any Store</strong> or a <strong>specific store outlet</strong>.
            </p>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Row 1: Pincode & Store Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    6-Digit Indian PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 226010"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">6-digit postal code</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Store Assignment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">Any Store (All Outlets / Global)</option>
                    {outlets.map((out) => (
                      <option key={out.id} value={out.id}>
                        {out.name} ({out.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Choose 'Any Store' or assign exclusively
                  </span>
                </div>
              </div>

              {/* Area Names / Localities */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Covered Area Names / Localities <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Gomti Nagar, Vibhuti Khand, Patrakarpuram, Manoj Pandey Chowk"
                  rows={2}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Comma-separated neighborhood and landmark names for customer clarity
                </span>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State:</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Delivery Rates & Free Threshold */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard Delivery Fee (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0 = Free Delivery</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Delivery Min Order (₹):</label>
                  <input
                    type="number"
                    min={0}
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* SLA & Cutoff Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery SLA (Hours):</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 2 for 2-hour, 4 for same-day</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Same-Day Cutoff Time:</label>
                  <input
                    type="text"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    placeholder="17:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400">24h format (e.g. 17:00 = 5 PM)</span>
                </div>
              </div>

              {/* Operational Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Operational Notes (Optional):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Two-wheelers only; high bridge traffic between 5-7 PM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Coverage Active</span>
                  <span className="text-[11px] text-slate-500">Allow customers to place delivery orders in this zone</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    isActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {editingZone ? 'Update Delivery Zone' : 'Add Delivery Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
