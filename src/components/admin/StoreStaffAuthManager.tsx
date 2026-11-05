import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Role,
  UserAccount,
  AccountStatus,
  AccountSanctionDuration,
  AccountSanction,
} from '../../types';
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  X,
  QrCode,
  Smartphone,
  ShieldAlert,
  AlertTriangle,
  Ban,
  PauseCircle,
  FileCheck2,
  Clock,
  Calendar,
  History,
  FileText,
  Sliders,
  ChevronRight,
  UserX,
  UserCheck,
} from 'lucide-react';
import { AdminAuthenticatorQrModal } from './AdminAuthenticatorQrModal';

export const StoreStaffAuthManager: React.FC = () => {
  const {
    accounts,
    outlets,
    currentUser,
    createStoreStaffAccount,
    updateStoreStaffAccount,
    deleteStoreStaffAccount,
    applyAccountSanction,
    liftAccountSanction,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // QR Modal for Google Authenticator 2FA Registration
  const [qrModalAccount, setQrModalAccount] = useState<UserAccount | null>(null);

  // Form states to create store login
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(outlets[0]?.id || '');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+91 ');
  const [staffPassword, setStaffPassword] = useState('store123');
  const [staffRole, setStaffRole] = useState<Role>('store_manager');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password reset inline state
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // SANCTION / GOVERNANCE MODAL STATE
  const [sanctionModalAccount, setSanctionModalAccount] = useState<UserAccount | null>(null);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('suspended');
  const [sanctionReason, setSanctionReason] = useState('');
  const [sanctionDuration, setSanctionDuration] = useState<AccountSanctionDuration>('48_hours');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [sanctionInternalNotes, setSanctionInternalNotes] = useState('');

  // AUDIT HISTORY MODAL
  const [historyModalAccount, setHistoryModalAccount] = useState<UserAccount | null>(null);

  // Preset reasons for quick selection
  const PRESET_REASONS: Record<AccountStatus, string[]> = {
    suspended: [
      'Discrepancy in Cash on Delivery (COD) batch remittance and cash bag deposits.',
      'Temporary suspension: high order cancellation spike and failed doorstep handovers.',
      'Repeated violation of customer delivery service standard operating procedures.',
      'Unusual login activity detected from unauthorized IP addresses.',
    ],
    terminated: [
      'Permanently Terminated: Repeated fraudulent automated fake orders and COD spam attacks.',
      'Severe policy violation: misappropriation of collected cash-on-delivery funds.',
      'Commercial sabotage / unauthorized data export breach.',
    ],
    on_hold: [
      'Account placed on temporary hold pending payment gateway fraud / chargeback dispute.',
      'Operations on hold for scheduled internal performance and compliance audit.',
      'Account under review following customer dispute on recent high-value order.',
    ],
    re_verification: [
      'Annual Trade License & Bank GST Certificate verification expired.',
      'Government Photo ID / Aadhar mismatch detected on courier partner registry.',
      'Bank passbook or cancelled cheque re-verification required for payout disbursement.',
      'Live photo selfie and address proof re-verification mandated by compliance.',
    ],
    active: ['Reinstated by administrator after successful audit clearance.'],
  };

  const STANDARD_DOCUMENTS = [
    'Government Photo ID (Aadhar / PAN / Voter ID)',
    'Proof of Address (Electricity Bill / Rent Agreement)',
    'Live Geotagged Selfie with ID Placard',
    'Bank Passbook / Cancelled Cheque (IFSC verified)',
    'Trade / Shop Act / FSSAI / Drug License Copy',
  ];

  // Helper to calculate expiry date string based on duration
  const computeExpiryIso = (dur: AccountSanctionDuration, customVal?: string): string | undefined => {
    const now = new Date();
    switch (dur) {
      case '24_hours':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case '48_hours':
        return new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
      case '7_days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case '14_days':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      case '30_days':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'custom':
        return customVal ? new Date(customVal).toISOString() : undefined;
      case 'permanent':
      default:
        return undefined;
    }
  };

  // Auto-generate random secure password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaffPassword(res);
  };

  // Handle Form Submit to Create Store Login
  const handleCreateStoreLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setFeedbackMsg({ type: 'error', text: 'Only Super Admin is authorized to create store and staff credentials.' });
      return;
    }

    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please fill in staff name, email, and password.' });
      return;
    }

    const res = createStoreStaffAccount({
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      password: staffPassword,
      role: staffRole,
      outletId: selectedOutletId || undefined,
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setShowCreateModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('+91 ');
      setStaffPassword('store123');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }

    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Copy credentials helper
  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `JE Retail Store Access:
Name: ${acc.name}
Role: ${acc.role.toUpperCase()}
Outlet: ${acc.outletName || 'All Stores'}
Login ID: ${acc.email}
Password: ${acc.password || 'Contact Admin'}
Login URL: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setFeedbackMsg({ type: 'success', text: `Credentials copied for ${acc.name}!` });
    setTimeout(() => {
      setCopiedId(null);
      setFeedbackMsg(null);
    }, 3000);
  };

  // Toggle reveal password
  const toggleRevealPassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save new password
  const handleSaveNewPassword = (id: string) => {
    if (!newPasswordValue.trim()) return;
    updateStoreStaffAccount(id, { password: newPasswordValue.trim() });
    setEditingPasswordId(null);
    setNewPasswordValue('');
    setFeedbackMsg({ type: 'success', text: 'Password updated successfully!' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Open Sanction Modal
  const handleOpenSanctionModal = (acc: UserAccount, prefillStatus: AccountStatus = 'suspended') => {
    setSanctionModalAccount(acc);
    setTargetStatus(prefillStatus);
    const presets = PRESET_REASONS[prefillStatus] || [];
    setSanctionReason(acc.sanction?.reason || presets[0] || '');
    setSanctionDuration(acc.sanction?.duration || (prefillStatus === 'terminated' ? 'permanent' : '48_hours'));
    setCustomExpiryDate(
      acc.sanction?.expiresAt
        ? new Date(acc.sanction.expiresAt).toISOString().slice(0, 16)
        : new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16)
    );
    setSelectedRequirements(acc.sanction?.reVerificationRequirements || []);
    setSanctionInternalNotes(acc.sanction?.notes || '');
  };

  // Submit Sanction from Modal
  const handleApplySanctionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionModalAccount) return;

    if (!sanctionReason.trim()) {
      alert('Please specify a valid operational or legal reason for this account action.');
      return;
    }

    if (targetStatus === 'active') {
      const res = liftAccountSanction(sanctionModalAccount.id, sanctionReason);
      setFeedbackMsg({ type: 'success', text: res.message });
      setSanctionModalAccount(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const expiresAt = computeExpiryIso(sanctionDuration, customExpiryDate);

    const res = applyAccountSanction(sanctionModalAccount.id, {
      status: targetStatus,
      reason: sanctionReason.trim(),
      duration: sanctionDuration,
      expiresAt,
      reVerificationRequirements:
        targetStatus === 're_verification' || selectedRequirements.length > 0
          ? selectedRequirements
          : undefined,
      notes: sanctionInternalNotes.trim() || undefined,
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setSanctionModalAccount(null);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }

    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1-Click Lift Sanction / Restore to Active
  const handleQuickLiftSanction = (acc: UserAccount) => {
    if (confirm(`Lift sanction and immediately restore ${acc.name} (${acc.email}) to Active standing?`)) {
      const res = liftAccountSanction(acc.id, 'Sanction lifted directly by Super Admin.');
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Format Status Badge
  const getAccountStatusBadge = (acc: UserAccount) => {
    const status: AccountStatus = acc.accountStatus || (acc.isActive ? 'active' : 'suspended');
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Suspended</span>
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            <span>Terminated</span>
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <PauseCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>On Hold</span>
          </span>
        );
      case 're_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Re-Verification</span>
          </span>
        );
    }
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter((acc) => {
    const currentStatus: AccountStatus = acc.accountStatus || (acc.isActive ? 'active' : 'suspended');
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.phone.includes(searchQuery) ||
      (acc.outletName && acc.outletName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.sanction?.reason && acc.sanction.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    const matchesOutlet = outletFilter === 'all' || acc.outletId === outletFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesOutlet;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
              Account Governance &amp; Security Controls
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Total Accounts: {accounts.length}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600 shrink-0" />
            <span>User &amp; Staff Account Governance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Admin can suspend, terminate, place on hold, or require re-verification with reasons and specific timeframes for any user, rider, store manager, or vendor account.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Store / Staff Login</span>
        </button>
      </div>

      {/* METRIC PILLS & STATUS TABS */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Accounts</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'active'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Active</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
            {accounts.filter((a) => (a.accountStatus || (a.isActive ? 'active' : 'suspended')) === 'active').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('suspended')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'suspended'
              ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Suspended</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {accounts.filter((a) => (a.accountStatus || (a.isActive ? 'active' : 'suspended')) === 'suspended').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('on_hold')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'on_hold'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-500'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <PauseCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>On Hold</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
            {accounts.filter((a) => a.accountStatus === 'on_hold').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('re_verification')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 're_verification'
              ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-500'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Re-Verification</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800">
            {accounts.filter((a) => a.accountStatus === 're_verification').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('terminated')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
            statusFilter === 'terminated'
              ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-600" />
          <span>Terminated</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800">
            {accounts.filter((a) => a.accountStatus === 'terminated').length}
          </span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account name, email, phone, outlet, or sanction reason..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">All Roles ({accounts.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="store_manager">Store Manager</option>
            <option value="outlet_owner">Outlet Owner</option>
            <option value="delivery_staff">Delivery Courier / Rider</option>
            <option value="customer">Registered Customer</option>
            <option value="vendor">Vendor / Supplier</option>
          </select>

          <select
            value={outletFilter}
            onChange={(e) => setOutletFilter(e.target.value)}
            className="text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 cursor-pointer max-w-[200px]"
          >
            <option value="all">All Outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Credentials & Governance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const isCopied = copiedId === acc.id;
          const isVisible = visiblePasswords[acc.id];
          const isSuperAdminRole = acc.role === 'super_admin';
          const sanction = acc.sanction;
          const currentStatus: AccountStatus = acc.accountStatus || (acc.isActive ? 'active' : 'suspended');

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 space-y-3 shadow-2xs transition-all relative flex flex-col justify-between ${
                currentStatus === 'terminated'
                  ? 'border-rose-300 bg-rose-50/30'
                  : currentStatus === 'suspended'
                  ? 'border-amber-300 bg-amber-50/20'
                  : currentStatus === 'on_hold'
                  ? 'border-indigo-300 bg-indigo-50/20'
                  : currentStatus === 're_verification'
                  ? 'border-purple-300 bg-purple-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header: Outlet & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          acc.role === 'super_admin'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : acc.role === 'store_manager'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : acc.role === 'delivery_staff'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : acc.role === 'customer'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {acc.role.replace('_', ' ')}
                      </span>
                      {getAccountStatusBadge(acc)}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug truncate">
                      {acc.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{acc.outletName || 'Global Platform'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCredentials(acc)}
                    title="Copy Login Credentials"
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                      isCopied
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* ACTIVE SANCTION BANNER ON CARD */}
                {sanction && currentStatus !== 'active' && (
                  <div
                    className={`mt-2.5 p-2.5 rounded-lg border text-xs space-y-1.5 ${
                      currentStatus === 'terminated'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : currentStatus === 'suspended'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : currentStatus === 'on_hold'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-purple-50 border-purple-200 text-purple-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sanction.duration === 'permanent'
                          ? 'Permanent / Indefinite'
                          : sanction.expiresAt
                          ? `Expires: ${new Date(sanction.expiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : sanction.duration.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-normal text-slate-500">By {sanction.appliedBy.split(' ')[0]}</span>
                    </div>

                    <p className="text-[11px] font-medium leading-relaxed">
                      <span className="font-bold">Reason:</span> {sanction.reason}
                    </p>

                    {sanction.reVerificationRequirements && sanction.reVerificationRequirements.length > 0 && (
                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold block mb-0.5">Required Documents:</span>
                        <ul className="text-[10px] list-disc list-inside space-y-0.5">
                          {sanction.reVerificationRequirements.map((req, idx) => (
                            <li key={idx} className="truncate">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Credentials Box */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono mt-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[10px] uppercase font-sans font-bold text-slate-400">Login ID</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[190px]">{acc.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-sans font-bold text-slate-400">Password</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900">
                        {isVisible ? acc.password || '••••••' : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRevealPassword(acc.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {acc.phone && (
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span className="text-[10px] uppercase font-sans font-bold text-slate-400">Phone</span>
                      <span className="text-slate-700">{acc.phone}</span>
                    </div>
                  )}
                </div>

                {/* Inline Password Edit Form */}
                {editingPasswordId === acc.id ? (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2 mt-2">
                    <label className="text-[10px] font-bold text-blue-900 block">Set New Password</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder="e.g. storeNewPass123"
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNewPassword(acc.id)}
                        className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded cursor-pointer shrink-0"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPasswordId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ACTION BUTTONS & GOVERNANCE BAR */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {/* Primary Governance Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSanctionModal(acc, currentStatus === 'active' ? 'suspended' : currentStatus)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Action / Sanction</span>
                  </button>

                  {currentStatus !== 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleQuickLiftSanction(acc)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSanctionModal(acc, 'suspended')}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Suspend</span>
                    </button>
                  )}
                </div>

                {/* Secondary Row: Password, QR & Audit History */}
                <div className="flex items-center justify-between text-xs gap-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPasswordId(acc.id);
                        setNewPasswordValue(acc.password || '');
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Password
                    </button>

                    {(acc.sanctionHistory && acc.sanctionHistory.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setHistoryModalAccount(acc)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
                      >
                        <History className="w-3 h-3 text-slate-400" />
                        <span>History ({acc.sanctionHistory.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(acc.role === 'super_admin' || acc.role === 'store_manager' || acc.twoFactorEnabled) && (
                      <button
                        type="button"
                        onClick={() => setQrModalAccount(acc)}
                        className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors"
                        title="View Google Authenticator QR Code"
                      >
                        <QrCode className="w-3 h-3 text-indigo-600" />
                        <span>2FA QR</span>
                      </button>
                    )}

                    {!isSuperAdminRole && (
                      deletingAccountId === acc.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteStoreStaffAccount(acc.id);
                              setDeletingAccountId(null);
                              setFeedbackMsg({ type: 'success', text: 'Account deleted.' });
                              setTimeout(() => setFeedbackMsg(null), 3000);
                            }}
                            className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAccountId(null)}
                            className="text-[10px] text-slate-500 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingAccountId(acc.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: INTERACTIVE SANCTION & ACCOUNT GOVERNANCE MODAL */}
      {sanctionModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  Governance Action
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Manage Account Standing: {sanctionModalAccount.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {sanctionModalAccount.email} • {sanctionModalAccount.role.replace('_', ' ').toUpperCase()} • {sanctionModalAccount.outletName || 'Global'}
                </p>
              </div>
              <button
                onClick={() => setSanctionModalAccount(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleApplySanctionSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* STEP 1: SELECT ACTION / STATUS */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Choose Account Action *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => {
                      setTargetStatus('suspended');
                      setSanctionReason(PRESET_REASONS.suspended[0]);
                      setSanctionDuration('48_hours');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      targetStatus === 'suspended'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Suspend</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Temporarily lock access for a defined time window</p>
                  </div>

                  <div
                    onClick={() => {
                      setTargetStatus('on_hold');
                      setSanctionReason(PRESET_REASONS.on_hold[0]);
                      setSanctionDuration('7_days');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      targetStatus === 'on_hold'
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold mb-1">
                      <PauseCircle className="w-4 h-4" />
                      <span>Place On Hold</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Pause orders/payouts while audit is underway</p>
                  </div>

                  <div
                    onClick={() => {
                      setTargetStatus('re_verification');
                      setSanctionReason(PRESET_REASONS.re_verification[0]);
                      setSanctionDuration('7_days');
                      if (selectedRequirements.length === 0) {
                        setSelectedRequirements([STANDARD_DOCUMENTS[0], STANDARD_DOCUMENTS[1]]);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      targetStatus === 're_verification'
                        ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold mb-1">
                      <FileCheck2 className="w-4 h-4" />
                      <span>Re-Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Require updated KYC / trade documents</p>
                  </div>

                  <div
                    onClick={() => {
                      setTargetStatus('terminated');
                      setSanctionReason(PRESET_REASONS.terminated[0]);
                      setSanctionDuration('permanent');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      targetStatus === 'terminated'
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1">
                      <Ban className="w-4 h-4" />
                      <span>Terminate</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Permanent ban and revocation of credentials</p>
                  </div>

                  <div
                    onClick={() => {
                      setTargetStatus('active');
                      setSanctionReason('Cleared of all audit concerns; account restored.');
                      setSanctionDuration('permanent');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      targetStatus === 'active'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                      <UserCheck className="w-4 h-4" />
                      <span>Reactivate / Clear</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Restore to active standing with no sanctions</p>
                  </div>
                </div>
              </div>

              {/* STEP 2: REASON SELECTION & PRESETS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Reason for Action *
                  </label>
                  <span className="text-[11px] text-slate-500">Will be logged in audit trail &amp; shown to user</span>
                </div>

                {/* Presets Pills */}
                {PRESET_REASONS[targetStatus] && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Quick Preset Reasons (Click to fill):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_REASONS[targetStatus].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSanctionReason(preset)}
                          className="text-[11px] text-left px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors max-w-full truncate"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  required
                  value={sanctionReason}
                  onChange={(e) => setSanctionReason(e.target.value)}
                  placeholder="Explain the specific reason, evidence, or discrepancy necessitating this action..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* STEP 3: SPECIFIC TIMEFRAME / DURATION */}
              {targetStatus !== 'active' && (
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      3. Duration &amp; Specific Timeframe
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Auto-lifts when time expires (except Terminated)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: '24_hours', label: '24 Hours (1 Day)' },
                      { key: '48_hours', label: '48 Hours (2 Days)' },
                      { key: '7_days', label: '7 Days (1 Week)' },
                      { key: '14_days', label: '14 Days (2 Weeks)' },
                      { key: '30_days', label: '30 Days (1 Month)' },
                      { key: 'custom', label: 'Specific Date & Time' },
                      { key: 'permanent', label: 'Indefinite / Permanent' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSanctionDuration(item.key as AccountSanctionDuration)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          sanctionDuration === item.key
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom DateTime Picker */}
                  {sanctionDuration === 'custom' && (
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Exact Expiration Date and Time:
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: RE-VERIFICATION REQUIREMENTS (IF APPLICABLE) */}
              {(targetStatus === 're_verification' || targetStatus === 'suspended') && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2.5">
                  <label className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                    Mandatory Re-Verification Checklist
                  </label>
                  <p className="text-[11px] text-purple-700">
                    Select documents the user or courier staff member must submit to clear this status:
                  </p>

                  <div className="space-y-1.5">
                    {STANDARD_DOCUMENTS.map((doc, idx) => {
                      const isChecked = selectedRequirements.includes(doc);
                      return (
                        <label
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedRequirements((prev) =>
                                isChecked ? prev.filter((d) => d !== doc) : [...prev, doc]
                              );
                            }}
                            className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                          />
                          <span>{doc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: INTERNAL ADMIN NOTES */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Internal Administrative Notes (Optional)
                </label>
                <input
                  type="text"
                  value={sanctionInternalNotes}
                  onChange={(e) => setSanctionInternalNotes(e.target.value)}
                  placeholder="e.g. Audit ticket #AUD-2026-891; assigned to Senior Inspector"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSanctionModalAccount(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    targetStatus === 'terminated'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : targetStatus === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : targetStatus === 'suspended'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {targetStatus === 'active'
                      ? 'Reactivate Account'
                      : `Apply ${targetStatus.replace('_', ' ').toUpperCase()} Now`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUDIT & SANCTION HISTORY MODAL */}
      {historyModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Sanction &amp; Audit Log: {historyModalAccount.name}</span>
                </h3>
                <p className="text-xs text-slate-500">{historyModalAccount.email}</p>
              </div>
              <button
                onClick={() => setHistoryModalAccount(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {historyModalAccount.sanctionHistory && historyModalAccount.sanctionHistory.length > 0 ? (
                historyModalAccount.sanctionHistory.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold uppercase text-[11px] text-slate-800">
                        {s.status.replace('_', ' ')} • {s.duration.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(s.appliedAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Reason:</span> {s.reason}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Applied by: {s.appliedBy}</span>
                      {s.expiresAt && (
                        <span>Expires: {new Date(s.expiresAt).toLocaleDateString('en-IN')}</span>
                      )}
                    </div>

                    {s.resolvedAt && (
                      <div className="mt-1 p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-[11px]">
                        <span className="font-bold">Resolved by {s.resolvedBy} on {new Date(s.resolvedAt).toLocaleDateString('en-IN')}:</span>
                        <p>{s.resolutionNote || 'Restored to active.'}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No historical sanctions on record for this account.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setHistoryModalAccount(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STORE LOGIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Create New Login Credentials</h3>
                <p className="text-xs text-slate-500">Provide staff name, branch outlet, and secure password</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStoreLogin} className="overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff / Manager Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email / Username *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. rahul.manager@javedgroup.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 98390 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                  >
                    <option value="store_manager">Store Manager</option>
                    <option value="outlet_owner">Outlet Franchise Owner</option>
                    <option value="franchise_manager">Franchise Operations Manager</option>
                    <option value="delivery_staff">Delivery Courier / Rider</option>
                    <option value="category_manager">Category Manager</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="vendor">Vendor / Supplier</option>
                    <option value="customer">Registered Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Store Outlet</label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white"
                >
                  <option value="">Global / All Stores</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Initial Password *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Set login password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-xs"
                >
                  Create &amp; Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Authenticator Registration QR Modal */}
      {qrModalAccount && (
        <AdminAuthenticatorQrModal
          account={qrModalAccount}
          isOpen={Boolean(qrModalAccount)}
          onClose={() => setQrModalAccount(null)}
          onUpdateAccount={(accId, updates) => {
            updateStoreStaffAccount(accId, updates);
          }}
        />
      )}
    </div>
  );
};
