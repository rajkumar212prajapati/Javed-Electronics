import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  FranchiseAgreement,
  OutletOwnershipModelType,
  StoreType,
  FranchiseFinancialDetails,
  FranchiseSettlementStructure,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building,
  Edit2,
  X,
  MapPin,
  Navigation,
  Compass,
  CreditCard,
  Landmark,
  RefreshCw,
  User,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Percent,
  Check,
  ChevronRight,
  Store,
} from 'lucide-react';

const INDIAN_STATES = [
  'Uttar Pradesh',
  'Maharashtra',
  'Delhi NCR',
  'Karnataka',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Bihar',
  'West Bengal',
  'Tamil Nadu',
  'Telangana',
  'Haryana',
  'Punjab',
];

const STORE_CATEGORY_OPTIONS: { id: StoreType; label: string }[] = [
  { id: 'electronics_superstore', label: 'Electronics & Smart Gadgets' },
  { id: 'grocery', label: 'Grocery & Daily Essentials' },
  { id: 'pharma', label: 'Pharmacy & Healthcare' },
  { id: 'cafe_kitchen', label: 'Cafe & Cloud Kitchen' },
  { id: 'fruits_veg_dairy', label: 'Fruits, Vegetables & Dairy' },
  { id: 'service_provider', label: 'Doorstep Tech Services & Repair' },
];

export const FranchiseAgreementsManager: React.FC = () => {
  const {
    franchiseAgreements,
    createAgreement,
    updateAgreement,
    outlets,
    updateOutlet,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelTypeFilter, setModelTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<FranchiseAgreement | null>(null);
  const [isModalFullscreen, setIsModalFullscreen] = useState(true);
  const [modalActiveTab, setModalActiveTab] = useState<
    'identity' | 'location_geofence' | 'payment_structure' | 'financial_settlement'
  >('identity');

  // 1. Outlet & Legal Identity
  const [outletId, setOutletId] = useState(outlets[0]?.id || '');
  const [outletCode, setOutletCode] = useState('');
  const [outletName, setOutletName] = useState('');
  const [outletType, setOutletType] = useState<OutletOwnershipModelType>('FOCO');
  const [outletCategory, setOutletCategory] = useState<StoreType>('electronics_superstore');
  const [partnerName, setPartnerName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [shopEstablishmentNumber, setShopEstablishmentNumber] = useState('');
  const [pan, setPan] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');

  // 2. Location & Geofencing
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [districtName, setDistrictName] = useState('Lucknow');
  const [zonalOrAreaName, setZonalOrAreaName] = useState('Gomti Nagar Phase 2');
  const [pincode, setPincode] = useState('226010');
  const [serviceablePincodes, setServiceablePincodes] = useState('226010, 226016, 226024, 226028');
  const [geofenceLat, setGeofenceLat] = useState(26.8532);
  const [geofenceLng, setGeofenceLng] = useState(80.9984);
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(12);
  const [completeAddress, setCompleteAddress] = useState('');

  // 3. Payment Structure
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0]);
  const [renewalDate, setRenewalDate] = useState(new Date(Date.now() + 670 * 86400000).toISOString().split('T')[0]);
  const [revenueShare, setRevenueShare] = useState(18);
  const [royalty, setRoyalty] = useState(8);
  const [platformFee, setPlatformFee] = useState(7500);
  const [minimumGuarantee, setMinimumGuarantee] = useState(75000);
  const [orderCommission, setOrderCommission] = useState(8);
  const [deliveryFeeShare, setDeliveryFeeShare] = useState(70);
  const [marketingLevy, setMarketingLevy] = useState(2);
  const [tdsRate, setTdsRate] = useState(1);
  const [complianceScore, setComplianceScore] = useState(98);
  const [status, setStatus] = useState<FranchiseAgreement['status']>('active');

  // 4. Financial & Settlement Cycle
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [accountType, setAccountType] = useState<'current' | 'escrow' | 'savings'>('current');
  const [upiId, setUpiId] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState(500000);
  const [bankGuarantee, setBankGuarantee] = useState(1000000);
  const [settlementCycle, setSettlementCycle] = useState<
    'daily_t1' | 'weekly_monday' | 'biweekly' | 'monthly_1st'
  >('daily_t1');
  const [settlementMode, setSettlementMode] = useState<
    'imps_neft' | 'escrow_auto_split' | 'upi_transfer'
  >('escrow_auto_split');
  const [payoutCutoffTime, setPayoutCutoffTime] = useState('23:59');
  const [minPayoutThreshold, setMinPayoutThreshold] = useState(1000);
  const [rollingReservePercent, setRollingReservePercent] = useState(5);

  const handleGenerateOutletCode = (st = stateName, dist = districtName, model = outletType) => {
    const stCode = (st.substring(0, 2) || 'UP').toUpperCase();
    const dtCode = (dist.substring(0, 3) || 'LKO').toUpperCase();
    const year = new Date().getFullYear();
    const modCode = (model.substring(0, 4) || 'FRAN').toUpperCase();
    const randSeq = Math.floor(100 + Math.random() * 900);
    const newCode = `${stCode}-${dtCode}-${year}-${modCode}-${randSeq}`;
    setOutletCode(newCode);
    return newCode;
  };

  const handleAutoDetectGPS = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeofenceLat(Number(pos.coords.latitude.toFixed(6)));
          setGeofenceLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          setGeofenceLat(26.8532);
          setGeofenceLng(80.9984);
        }
      );
    } else {
      setGeofenceLat(26.8532);
      setGeofenceLng(80.9984);
    }
  };

  const handleOpenEdit = (agr: FranchiseAgreement) => {
    const matchedOutlet = outlets.find((o) => o.id === agr.outletId);

    setEditingAgreement(agr);
    setOutletId(agr.outletId);
    setOutletCode(agr.outletCode || agr.documentNumber || handleGenerateOutletCode());
    setOutletName(agr.outletName);
    setOutletType(agr.outletType || agr.modelType || 'FOCO');
    setOutletCategory(
      agr.outletCategory || (matchedOutlet?.storeType as StoreType) || 'electronics_superstore'
    );
    setPartnerName(agr.franchisePartnerName);
    setOwnerName(agr.ownerName || matchedOutlet?.ownerName || 'Vipin Agrawal');
    setOwnerPhone(agr.ownerPhone || matchedOutlet?.ownerPhone || '+91 98390 12345');
    setOwnerEmail(agr.ownerEmail || matchedOutlet?.ownerEmail || 'vipin@agrawaltech.com');
    setManagerName(agr.managerName || matchedOutlet?.managerName || 'Amit Saxena');
    setManagerPhone(agr.managerPhone || matchedOutlet?.managerPhone || '+91 98390 54321');
    setManagerEmail(agr.managerEmail || 'manager@jeelectronics.in');
    setGstin(agr.gstin || matchedOutlet?.gstin || '09AAACH7409R1ZZ');
    setShopEstablishmentNumber(agr.shopEstablishmentNumber || 'LKO/SE/2024/8892');
    setPan(agr.pan || matchedOutlet?.pan || 'AAACH7409R');
    setFssaiNumber(agr.fssaiNumber || matchedOutlet?.fssaiNumber || '');
    setDrugLicenseNumber(agr.drugLicenseNumber || matchedOutlet?.drugLicenseNumber || '');
    setStateName(agr.stateName || matchedOutlet?.state || 'Uttar Pradesh');
    setDistrictName(agr.districtName || matchedOutlet?.city || 'Lucknow');
    setZonalOrAreaName(agr.zonalOrAreaName || 'Gomti Nagar Phase 2');
    setPincode(agr.pincode || matchedOutlet?.pincode || '226010');
    setServiceablePincodes(
      agr.serviceablePincodes?.join(', ') ||
        matchedOutlet?.serviceablePincodes?.join(', ') ||
        '226010, 226016, 226024'
    );
    setGeofenceLat(agr.geofenceLatitude || matchedOutlet?.coordinates?.lat || 26.8532);
    setGeofenceLng(agr.geofenceLongitude || matchedOutlet?.coordinates?.lng || 80.9984);
    setGeofenceRadiusKm(agr.geofenceRadiusKm || matchedOutlet?.deliveryRadiusKm || 12);
    setCompleteAddress(
      agr.completeAddress ||
        matchedOutlet?.address ||
        'Plot 4A, Cyber Heights, Vibhuti Khand, Gomti Nagar, Lucknow, UP 226010'
    );
    setStartDate(agr.startDate);
    setEndDate(agr.endDate);
    setRenewalDate(agr.renewalDate);
    setRevenueShare(agr.revenueSharePercent);
    setRoyalty(agr.royaltyPercent);
    setPlatformFee(agr.platformFeeMonthly);
    setMinimumGuarantee(agr.minimumMonthlyGuarantee);
    setComplianceScore(agr.complianceScore);
    setStatus(agr.status);

    if (agr.financialDetails) {
      setBankName(agr.financialDetails.bankName);
      setAccountHolderName(agr.financialDetails.accountHolderName);
      setAccountNumber(agr.financialDetails.accountNumber);
      setIfscCode(agr.financialDetails.ifscCode);
      setAccountType(agr.financialDetails.accountType);
      setUpiId(agr.financialDetails.upiId || '');
      setSecurityDeposit(agr.financialDetails.securityDepositAmount || 500000);
      setBankGuarantee(agr.financialDetails.bankGuaranteeAmount || 1000000);
    } else {
      setBankName('HDFC Bank Ltd');
      setAccountHolderName(agr.franchisePartnerName);
      setAccountNumber('50200067891234');
      setIfscCode('HDFC0001234');
      setAccountType('current');
      setUpiId(`${agr.outletName.toLowerCase().replace(/\s+/g, '')}@hdfcbank`);
      setSecurityDeposit(500000);
      setBankGuarantee(1000000);
    }

    if (agr.paymentSettlement) {
      setSettlementCycle(agr.paymentSettlement.settlementCycle);
      setSettlementMode(agr.paymentSettlement.settlementMode);
      setPayoutCutoffTime(agr.paymentSettlement.payoutCutoffTime);
      setMinPayoutThreshold(agr.paymentSettlement.minPayoutThreshold);
      setRollingReservePercent(agr.paymentSettlement.rollingReservePercent);
      setOrderCommission(agr.paymentSettlement.orderCommissionPercent);
      setDeliveryFeeShare(agr.paymentSettlement.deliveryFeeSharePercent);
      setMarketingLevy(agr.paymentSettlement.marketingLevyPercent);
      setTdsRate(agr.paymentSettlement.tdsRatePercent);
    } else {
      setSettlementCycle('daily_t1');
      setSettlementMode('escrow_auto_split');
      setPayoutCutoffTime('23:59');
      setMinPayoutThreshold(1000);
      setRollingReservePercent(5);
      setOrderCommission(8);
      setDeliveryFeeShare(70);
      setMarketingLevy(2);
      setTdsRate(1);
    }

    setModalActiveTab('identity');
    setShowCreateModal(true);
  };

  const handleOpenCreateNew = () => {
    setEditingAgreement(null);
    const firstOut = outlets[0];
    const generatedCode = handleGenerateOutletCode('Uttar Pradesh', 'Lucknow', 'FOCO');

    setOutletId(firstOut?.id || 'out_gomti_nagar');
    setOutletCode(generatedCode);
    setOutletName('');
    setOutletType('FOCO');
    setOutletCategory('electronics_superstore');
    setPartnerName('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setManagerName('');
    setManagerPhone('');
    setManagerEmail('');
    setGstin('');
    setShopEstablishmentNumber('');
    setPan('');
    setFssaiNumber('');
    setDrugLicenseNumber('');
    setStateName('Uttar Pradesh');
    setDistrictName('Lucknow');
    setZonalOrAreaName('');
    setPincode('226001');
    setServiceablePincodes('226001, 226010');
    setGeofenceLat(26.8467);
    setGeofenceLng(80.9462);
    setGeofenceRadiusKm(10);
    setCompleteAddress('');
    setRevenueShare(18);
    setRoyalty(8);
    setPlatformFee(7500);
    setMinimumGuarantee(75000);
    setOrderCommission(8);
    setDeliveryFeeShare(70);
    setMarketingLevy(2);
    setTdsRate(1);
    setComplianceScore(95);
    setStatus('active');
    setBankName('');
    setAccountHolderName('');
    setAccountNumber('');
    setIfscCode('');
    setAccountType('current');
    setUpiId('');
    setSecurityDeposit(500000);
    setBankGuarantee(1000000);
    setSettlementCycle('daily_t1');
    setSettlementMode('escrow_auto_split');
    setPayoutCutoffTime('23:59');
    setMinPayoutThreshold(1000);
    setRollingReservePercent(5);

    setModalActiveTab('identity');
    setShowCreateModal(true);
  };

  const handleSaveAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const out = outlets.find((o) => o.id === outletId);

    const financialData: FranchiseFinancialDetails = {
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim() || partnerName,
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      accountType,
      upiId: upiId.trim(),
      panNumber: pan.trim() || 'AAACH7409R',
      securityDepositAmount: Number(securityDeposit),
      bankGuaranteeAmount: Number(bankGuarantee),
    };

    const settlementData: FranchiseSettlementStructure = {
      settlementCycle,
      settlementMode,
      payoutCutoffTime,
      minPayoutThreshold: Number(minPayoutThreshold),
      rollingReservePercent: Number(rollingReservePercent),
      orderCommissionPercent: Number(orderCommission),
      deliveryFeeSharePercent: Number(deliveryFeeShare),
      marketingLevyPercent: Number(marketingLevy),
      tdsRatePercent: Number(tdsRate),
      gstOnFeesPercent: 18,
    };

    const parsedPincodes = serviceablePincodes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const agreementPayload: FranchiseAgreement = {
      id: editingAgreement
        ? editingAgreement.id
        : `AGR-${outletType}-${Date.now().toString().slice(-4)}`,
      outletId,
      outletCode:
        outletCode ||
        editingAgreement?.documentNumber ||
        `UP-LKO-2026-FRAN-${Date.now().toString().slice(-3)}`,
      outletName: outletName || out?.name || 'Franchise Outlet',
      outletType,
      outletCategory,
      franchisePartnerName: partnerName || 'Regional Franchisee',
      ownerName,
      ownerPhone,
      ownerEmail,
      managerName,
      managerPhone,
      managerEmail,
      gstin: gstin.toUpperCase(),
      shopEstablishmentNumber,
      pan: pan.toUpperCase(),
      fssaiNumber,
      drugLicenseNumber,
      stateName,
      districtName,
      zonalOrAreaName,
      pincode,
      serviceablePincodes: parsedPincodes,
      geofenceLatitude: Number(geofenceLat),
      geofenceLongitude: Number(geofenceLng),
      geofenceRadiusKm: Number(geofenceRadiusKm),
      completeAddress,
      financialDetails: financialData,
      paymentSettlement: settlementData,
      modelType: outletType,
      startDate,
      endDate,
      renewalDate,
      revenueSharePercent: Number(revenueShare),
      royaltyPercent: Number(royalty),
      platformFeeMonthly: Number(platformFee),
      minimumMonthlyGuarantee: Number(minimumGuarantee),
      inventoryOwnership: outletType === 'FOCO' ? 'company' : 'franchise',
      pricingAuthority: 'central',
      complianceScore: Number(complianceScore),
      status,
      documentNumber:
        outletCode || editingAgreement?.documentNumber || `UP-LKO-2026-FRAN-889`,
    };

    if (editingAgreement) {
      updateAgreement(agreementPayload);
    } else {
      createAgreement(agreementPayload);
    }

    if (out) {
      updateOutlet({
        ...out,
        name: outletName || out.name,
        code: outletCode || out.code,
        storeType: outletCategory,
        ownershipModel: outletType,
        ownerName: ownerName || out.ownerName,
        ownerPhone: ownerPhone || out.ownerPhone,
        ownerEmail: ownerEmail || out.ownerEmail,
        managerName: managerName || out.managerName,
        managerPhone: managerPhone || out.managerPhone,
        gstin: gstin || out.gstin,
        pan: pan || out.pan,
        fssaiNumber: fssaiNumber || out.fssaiNumber,
        drugLicenseNumber: drugLicenseNumber || out.drugLicenseNumber,
        address: completeAddress || out.address,
        city: districtName || out.city,
        state: stateName || out.state,
        pincode: pincode || out.pincode,
        serviceablePincodes: parsedPincodes.length > 0 ? parsedPincodes : out.serviceablePincodes,
        deliveryRadiusKm: Number(geofenceRadiusKm) || out.deliveryRadiusKm,
        coordinates: {
          lat: Number(geofenceLat) || out.coordinates.lat,
          lng: Number(geofenceLng) || out.coordinates.lng,
        },
      });
    }

    setShowCreateModal(false);
    setEditingAgreement(null);
  };

  const filteredAgreements = franchiseAgreements.filter((agr) => {
    const matchesSearch =
      agr.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.franchisePartnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agr.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agr.outletCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agr.districtName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agr.status === statusFilter;
    const matchesModel =
      modelTypeFilter === 'all' || (agr.modelType || agr.outletType) === modelTypeFilter;
    return matchesSearch && matchesStatus && matchesModel;
  });

  const getStatusBadge = (s: FranchiseAgreement['status']) => {
    switch (s) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'renewal_due':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Renewal Due</span>
          </span>
        );
      case 'under_audit':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Under Audit</span>
          </span>
        );
      case 'expired':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Expired</span>
          </span>
        );
      case 'terminated':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            Terminated
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Franchise Contracts</h2>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search outlet, partner, code, or district..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="renewal_due">Renewal Due</option>
            <option value="under_audit">Under Audit</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={modelTypeFilter}
            onChange={(e) => setModelTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium cursor-pointer"
          >
            <option value="all">All Models</option>
            <option value="FOCO">FOCO</option>
            <option value="FOFO">FOFO</option>
            <option value="COCO">COCO</option>
            <option value="dealer">Dealer</option>
          </select>
        </div>
      </div>

      {/* Agreements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgreements.map((agr) => {
          const settlement = agr.paymentSettlement;

          return (
            <div
              key={agr.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {agr.outletCode || agr.documentNumber}
                  </span>
                  {getStatusBadge(agr.status)}
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-1">{agr.outletName}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Partner: <span className="font-semibold text-slate-800">{agr.franchisePartnerName}</span>
                </div>

                {/* Key Terms Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs my-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Model</span>
                    <span className="font-bold text-slate-900">{agr.modelType || agr.outletType}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Royalty</span>
                    <span className="font-bold font-mono text-slate-900">{agr.royaltyPercent}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Rev Share</span>
                    <span className="font-bold font-mono text-slate-900">{agr.revenueSharePercent}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Min Guarantee</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatINR(agr.minimumMonthlyGuarantee)}
                    </span>
                  </div>
                </div>

                {/* Clean Info Summary */}
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">GSTIN:</span>
                    <span className="font-mono text-slate-700">{agr.gstin || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-700">
                      {agr.districtName || 'Lucknow'}, {agr.stateName || 'UP'} ({agr.pincode || '226010'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Settlement:</span>
                    <span className="text-slate-700 capitalize">
                      {settlement?.settlementCycle?.replace('_', ' ') || 'Daily T+1'}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 mt-2.5 border-t border-slate-100">
                  <span>Start: {agr.startDate}</span>
                  <span>Renewal: {agr.renewalDate}</span>
                  <span>End: {agr.endDate}</span>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(agr)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Contract</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FULL-SCREEN CONTRACT & ONBOARDING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/70 flex flex-col items-center justify-center overflow-hidden">
          <div
            className={`bg-white w-full h-full flex flex-col overflow-hidden ${
              isModalFullscreen
                ? 'sm:w-full sm:h-full sm:rounded-none'
                : 'sm:max-w-4xl sm:h-auto sm:max-h-[94vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200'
            }`}
          >
            {/* Clean Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {editingAgreement ? `Edit Contract: ${editingAgreement.outletName}` : 'New Franchise Contract'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen(!isModalFullscreen)}
                  className="hidden sm:inline-flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title={isModalFullscreen ? 'Compact Window' : 'Full Screen'}
                >
                  {isModalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clean Step Tabs */}
            <div className="px-4 sm:px-6 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center gap-2 overflow-x-auto py-2">
              <button
                type="button"
                onClick={() => setModalActiveTab('identity')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  modalActiveTab === 'identity'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>1. Outlet &amp; Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('location_geofence')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  modalActiveTab === 'location_geofence'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Location &amp; Geofence</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('payment_structure')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  modalActiveTab === 'payment_structure'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>3. Payment Structure</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('financial_settlement')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  modalActiveTab === 'financial_settlement'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>4. Financials &amp; Settlement</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveAgreement} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
                {/* TAB 1: OUTLET & OWNER */}
                {modalActiveTab === 'identity' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Outlet Type *</label>
                        <select
                          value={outletType}
                          onChange={(e) => {
                            const newModel = e.target.value as OutletOwnershipModelType;
                            setOutletType(newModel);
                            handleGenerateOutletCode(stateName, districtName, newModel);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 cursor-pointer"
                          required
                        >
                          <option value="FOCO">FOCO (Franchise Owned, Company Operated)</option>
                          <option value="FOFO">FOFO (Franchise Owned, Franchise Operated)</option>
                          <option value="COCO">COCO (Company Owned, Company Operated)</option>
                          <option value="dealer">Authorized Regional Dealer</option>
                          <option value="joint_venture">Joint Venture Store</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Outlet Category *</label>
                        <select
                          value={outletCategory}
                          onChange={(e) => setOutletCategory(e.target.value as StoreType)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 cursor-pointer"
                          required
                        >
                          {STORE_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700">Outlet Code *</label>
                          <button
                            type="button"
                            onClick={() => handleGenerateOutletCode(stateName, districtName, outletType)}
                            className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Auto Generate</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={outletCode}
                          onChange={(e) => setOutletCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          placeholder="UP-LKO-2026-FRAN-889"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Outlet Name *</label>
                        <input
                          type="text"
                          value={outletName}
                          onChange={(e) => setOutletName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                          placeholder="Enter outlet name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Franchise Partner / Firm Name *</label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                        placeholder="Enter registered business or partner name"
                        required
                      />
                    </div>

                    {/* Statutory IDs */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h5 className="font-bold text-slate-800 text-xs">Statutory &amp; Registration Numbers</h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">GSTIN *</label>
                          <input
                            type="text"
                            maxLength={15}
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="09AAACH7409R1ZZ"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Shop Establishment No. *</label>
                          <input
                            type="text"
                            value={shopEstablishmentNumber}
                            onChange={(e) => setShopEstablishmentNumber(e.target.value.toUpperCase())}
                            placeholder="LKO/SE/2024/8892"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">PAN *</label>
                          <input
                            type="text"
                            maxLength={10}
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                            placeholder="AAACH7409R"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">FSSAI Number (Optional)</label>
                          <input
                            type="text"
                            value={fssaiNumber}
                            onChange={(e) => setFssaiNumber(e.target.value)}
                            placeholder="Optional"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Drug License No. (Optional)</label>
                          <input
                            type="text"
                            value={drugLicenseNumber}
                            onChange={(e) => setDrugLicenseNumber(e.target.value)}
                            placeholder="Optional"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Owner & Manager */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <span className="font-bold text-slate-800 text-xs block">Outlet Owner</span>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Name *</label>
                          <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="Owner full name"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Phone *</label>
                            <input
                              type="tel"
                              value={ownerPhone}
                              onChange={(e) => setOwnerPhone(e.target.value)}
                              placeholder="+91"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Email *</label>
                            <input
                              type="email"
                              value={ownerEmail}
                              onChange={(e) => setOwnerEmail(e.target.value)}
                              placeholder="Email"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <span className="font-bold text-slate-800 text-xs block">Outlet Manager</span>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Name *</label>
                          <input
                            type="text"
                            value={managerName}
                            onChange={(e) => setManagerName(e.target.value)}
                            placeholder="Manager full name"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Phone *</label>
                            <input
                              type="tel"
                              value={managerPhone}
                              onChange={(e) => setManagerPhone(e.target.value)}
                              placeholder="+91"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Email</label>
                            <input
                              type="email"
                              value={managerEmail}
                              onChange={(e) => setManagerEmail(e.target.value)}
                              placeholder="Email"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('location_geofence')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Location &amp; Geofence</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: LOCATION & GEOFENCE */}
                {modalActiveTab === 'location_geofence' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">State Name *</label>
                        <select
                          value={stateName}
                          onChange={(e) => {
                            setStateName(e.target.value);
                            handleGenerateOutletCode(e.target.value, districtName, outletType);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">District Name *</label>
                        <input
                          type="text"
                          value={districtName}
                          onChange={(e) => {
                            setDistrictName(e.target.value);
                            handleGenerateOutletCode(stateName, e.target.value, outletType);
                          }}
                          placeholder="District"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Zonal / Area *</label>
                        <input
                          type="text"
                          value={zonalOrAreaName}
                          onChange={(e) => setZonalOrAreaName(e.target.value)}
                          placeholder="Zone or area"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Pincode *</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="226010"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Serviceable Pincodes (Comma separated) *
                      </label>
                      <input
                        type="text"
                        value={serviceablePincodes}
                        onChange={(e) => setServiceablePincodes(e.target.value)}
                        placeholder="226010, 226016, 226024"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                        required
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Geofence Location</span>
                        <button
                          type="button"
                          onClick={handleAutoDetectGPS}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Detect GPS</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Latitude *</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={geofenceLat}
                            onChange={(e) => setGeofenceLat(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Longitude *</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={geofenceLng}
                            onChange={(e) => setGeofenceLng(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">
                            Geofence Radius (KM) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={geofenceRadiusKm}
                            onChange={(e) => setGeofenceRadiusKm(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Complete Address *</label>
                      <textarea
                        value={completeAddress}
                        onChange={(e) => setCompleteAddress(e.target.value)}
                        rows={3}
                        placeholder="Enter complete street address..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 resize-none"
                        required
                      />
                    </div>

                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('identity')}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('payment_structure')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Payment Structure</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: PAYMENT STRUCTURE */}
                {modalActiveTab === 'payment_structure' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Revenue Share % *</label>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={100}
                          value={revenueShare}
                          onChange={(e) => setRevenueShare(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Royalty % *</label>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={100}
                          value={royalty}
                          onChange={(e) => setRoyalty(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Monthly Platform Fee (₹)</label>
                        <input
                          type="number"
                          value={platformFee}
                          onChange={(e) => setPlatformFee(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Min Guarantee (₹)</label>
                        <input
                          type="number"
                          value={minimumGuarantee}
                          onChange={(e) => setMinimumGuarantee(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Order Commission %</label>
                        <input
                          type="number"
                          step="0.5"
                          value={orderCommission}
                          onChange={(e) => setOrderCommission(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Delivery Fee Share %</label>
                        <input
                          type="number"
                          step="1"
                          value={deliveryFeeShare}
                          onChange={(e) => setDeliveryFeeShare(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Marketing Levy %</label>
                        <input
                          type="number"
                          step="0.5"
                          value={marketingLevy}
                          onChange={(e) => setMarketingLevy(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">TDS Rate %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={tdsRate}
                          onChange={(e) => setTdsRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Renewal Date *</label>
                        <input
                          type="date"
                          value={renewalDate}
                          onChange={(e) => setRenewalDate(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                        >
                          <option value="active">Active</option>
                          <option value="renewal_due">Renewal Due</option>
                          <option value="under_audit">Under Audit</option>
                          <option value="expired">Expired</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('location_geofence')}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('financial_settlement')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Financials &amp; Settlement</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: FINANCIAL DETAILS & SETTLEMENT CYCLE (Clean Closing Onboarding Section) */}
                {modalActiveTab === 'financial_settlement' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Payment Settlement Cycle *</label>
                        <select
                          value={settlementCycle}
                          onChange={(e) => setSettlementCycle(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 cursor-pointer"
                          required
                        >
                          <option value="daily_t1">Daily T+1</option>
                          <option value="weekly_monday">Weekly (Monday)</option>
                          <option value="biweekly">Bi-Weekly (1st &amp; 16th)</option>
                          <option value="monthly_1st">Monthly (1st)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Settlement Mode *</label>
                        <select
                          value={settlementMode}
                          onChange={(e) => setSettlementMode(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 cursor-pointer"
                          required
                        >
                          <option value="escrow_auto_split">Escrow Auto-Split</option>
                          <option value="imps_neft">Bank IMPS / NEFT</option>
                          <option value="upi_transfer">Instant UPI Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Payout Cut-off Time</label>
                        <input
                          type="text"
                          value={payoutCutoffTime}
                          onChange={(e) => setPayoutCutoffTime(e.target.value)}
                          placeholder="23:59"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Min Payout Threshold (₹)</label>
                        <input
                          type="number"
                          value={minPayoutThreshold}
                          onChange={(e) => setMinPayoutThreshold(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Rolling Reserve %</label>
                        <input
                          type="number"
                          step="0.5"
                          value={rollingReservePercent}
                          onChange={(e) => setRollingReservePercent(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h5 className="font-bold text-slate-800 text-xs">Bank Account &amp; Financial Details</h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Bank Name *</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Bank Name"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Account Holder *</label>
                          <input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Account Holder Name"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Account Type *</label>
                          <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                          >
                            <option value="current">Current Account</option>
                            <option value="escrow">Escrow Account</option>
                            <option value="savings">Savings Account</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Account Number *</label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Account Number"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">IFSC Code *</label>
                          <input
                            type="text"
                            maxLength={11}
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                            placeholder="IFSC Code"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">UPI ID</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                            placeholder="store@bank"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Security Deposit (₹)</label>
                          <input
                            type="number"
                            value={securityDeposit}
                            onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Bank Guarantee (₹)</label>
                          <input
                            type="number"
                            value={bankGuarantee}
                            onChange={(e) => setBankGuarantee(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setModalActiveTab('payment_structure')}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Closing Footer (No cluttered badges or extra highlights) */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAgreement ? 'Save Contract' : 'Complete Onboarding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
