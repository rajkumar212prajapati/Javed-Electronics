import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Outlet, OutletOwnershipModelType, OutletStatus } from '../../types';
import { formatINR } from '../../utils/currency';
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
} from 'lucide-react';

export const OutletsManager: React.FC = () => {
  const { outlets, activeOutletId, setActiveOutletId, createOutlet, updateOutlet, deleteOutlet, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  // Form states for Create/Edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ownershipModel, setOwnershipModel] = useState<OutletOwnershipModelType>('COCO');
  const [parentCompany, setParentCompany] = useState('Javed Electronics Retail Pvt. Ltd.');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lucknow');
  const [state, setState] = useState('Uttar Pradesh');
  const [pincode, setPincode] = useState('226001');
  const [openTime, setOpenTime] = useState('09:30 AM');
  const [closeTime, setCloseTime] = useState('09:30 PM');
  const [deliveryRadius, setDeliveryRadius] = useState(12);
  const [commissionRate, setCommissionRate] = useState(5);
  const [pincodesInput, setPincodesInput] = useState('226001, 226002, 226003');
  const [status, setStatus] = useState<OutletStatus>('active');

  const filteredOutlets = outlets.filter((out) => {
    const matchesSearch =
      out.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = modelFilter === 'all' || out.ownershipModel === modelFilter;
    const matchesStatus = statusFilter === 'all' || out.status === statusFilter;
    return matchesSearch && matchesModel && matchesStatus;
  });

  const resetForm = () => {
    setName('');
    setCode(`OUT-LKO-00${outlets.length + 1}`);
    setOwnershipModel('COCO');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setManagerName('');
    setManagerPhone('');
    setGstin('09AAACJ1234F1Z5');
    setAddress('');
    setCity('Lucknow');
    setPincode('226001');
    setPincodesInput('226001, 226002');
    setDeliveryRadius(12);
    setCommissionRate(5);
    setStatus('active');
    setEditingOutlet(null);
  };

  const handleOpenEdit = (out: Outlet) => {
    setEditingOutlet(out);
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
    setShowCreateModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const parsedPincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (editingOutlet) {
      updateOutlet({
        ...editingOutlet,
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
    } else {
      createOutlet({
        name,
        code,
        businessCategoryId: 'cat_electronics',
        ownershipModel,
        parentCompany,
        ownerName: ownerName || 'Javed Khan',
        ownerPhone: ownerPhone || '+91 98390 12345',
        ownerEmail: ownerEmail || 'contact@javed-electronics.in',
        managerName: managerName || 'Branch Dispatcher',
        managerPhone: managerPhone || '+91 98390 54321',
        gstin,
        address,
        city,
        state,
        pincode,
        coordinates: { lat: 26.8467, lng: 80.9462 },
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
        monthlyRevenue: 450000,
        activeOrdersCount: 8,
      });
    }
    setShowCreateModal(false);
    resetForm();
  };

  const handleExportCsv = () => {
    const headers = ['Outlet Code', 'Name', 'Model', 'Status', 'City', 'PIN Code', 'Manager', 'Phone', 'Revenue'];
    const rows = filteredOutlets.map((o) => [
      o.code,
      `"${o.name}"`,
      o.ownershipModel,
      o.status,
      o.city,
      o.pincode,
      `"${o.managerName}"`,
      o.managerPhone,
      o.monthlyRevenue || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `javed_electronics_outlets_${Date.now()}.csv`);
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
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><ShieldAlert className="w-3 h-3" /> Suspended</span>;
      case 'pending_approval':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Outlets</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{outlets.length} Outlets</div>
          <span className="text-[11px] text-blue-600 font-medium">Across Lucknow & UP</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">COCO Outlets</span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
            {outlets.filter((o) => o.ownershipModel === 'COCO').length}
          </div>
          <span className="text-[11px] text-slate-500">100% Company Owned</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Franchise & Dealer</span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
            {outlets.filter((o) => o.ownershipModel === 'FOCO' || o.ownershipModel === 'FOFO' || o.ownershipModel === 'dealer').length}
          </div>
          <span className="text-[11px] text-purple-600">FOCO / FOFO / Dealers</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Operational</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {outlets.filter((o) => o.status === 'active').length}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Live for customer orders</span>
        </div>
      </div>

      {/* Control Bar: Search, Filter, Export, Add Outlet */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search outlet code, name, city, owner..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Ownership Models</option>
            <option value="COCO">COCO (Company)</option>
            <option value="FOCO">FOCO (Franchise-Owned)</option>
            <option value="FOFO">FOFO (Franchise-Operated)</option>
            <option value="dealer">Authorized Dealer</option>
            <option value="marketplace_seller">Marketplace Seller</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending_approval">Pending Approval</option>
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
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Outlet</span>
            </button>
          )}
        </div>
      </div>

      {/* Outlets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map((outlet) => {
          const isSelected = activeOutletId === outlet.id;
          return (
            <div
              key={outlet.id}
              className={`bg-white rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between shadow-xs ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      {outlet.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{outlet.name}</h3>
                  </div>
                  {getStatusBadge(outlet.status)}
                </div>

                {/* Model badge and address */}
                <div className="flex items-center gap-1.5 flex-wrap my-2">
                  {getModelBadge(outlet.ownershipModel)}
                  <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {outlet.city}, {outlet.pincode}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{outlet.address}</p>

                {/* Specific details */}
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
                    <span>{outlet.operatingHours.open} - {outlet.operatingHours.close}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Delivery Radius:</span>
                    <span className="font-semibold text-blue-700">{outlet.deliveryRadiusKm} km</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">GSTIN:</span>
                    <span className="font-mono text-[10px] text-slate-600">{outlet.gstin}</span>
                  </div>
                </div>

                {/* Serviceable PIN codes pill preview */}
                <div className="mb-3">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Serviceable PIN Codes ({outlet.serviceablePincodes.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {outlet.serviceablePincodes.slice(0, 4).map((pin) => (
                      <span key={pin} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-mono">
                        {pin}
                      </span>
                    ))}
                    {outlet.serviceablePincodes.length > 4 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">
                        +{outlet.serviceablePincodes.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveOutletId(outlet.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                  }`}
                >
                  {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                  <span>{isSelected ? 'Active Context' : 'Select Branch'}</span>
                </button>

                <div className="flex items-center gap-1">
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleOpenEdit(outlet)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Outlet"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT OUTLET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingOutlet ? `Edit Outlet: ${editingOutlet.name}` : 'Create New Multi-Business Outlet'}
                </h3>
                <p className="text-xs text-slate-500">Configure franchise rules, ownership model, and location details</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outlet Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gomti Nagar Tech Hub"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outlet Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. OUT-LKO-004"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <option value="active">Active & Open</option>
                    <option value="inactive">Temporarily Inactive</option>
                    <option value="suspended">Suspended (Audit/Dispute)</option>
                    <option value="pending_approval">Pending Inspection / Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Franchisee Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Tariq Ansari"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Contact Phone</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+91 98390 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Manager Name</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Imran Siddiqui"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Phone</label>
                  <input
                    type="text"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+91 98390 98765"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Physical Street Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop #12, Ground Floor, Vibhuti Khand..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="09AAACJ1234F1Z5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Radius (km)</label>
                  <input
                    type="number"
                    value={deliveryRadius}
                    onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Commission %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
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
                  placeholder="226001, 226010, 226024, 226028"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                />
              </div>

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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingOutlet ? 'Save Changes' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
