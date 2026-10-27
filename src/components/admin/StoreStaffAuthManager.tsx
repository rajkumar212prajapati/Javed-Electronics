import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Role, UserAccount } from '../../types';
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
} from 'lucide-react';
import { AdminAuthenticatorQrModal } from './AdminAuthenticatorQrModal';

export const StoreStaffAuthManager: React.FC = () => {
  const {
    accounts,
    outlets,
    createStoreStaffAccount,
    updateStoreStaffAccount,
    deleteStoreStaffAccount,
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

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
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
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('+91 ');
      setStaffPassword('store123');
      setShowCreateModal(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Copy credentials to share with store manager
  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `*Javed Electronics Store Login Credentials*\nStore: ${acc.outletName || 'All Branches'}\nRole: ${acc.role.toUpperCase()}\nUsername / Email: ${acc.email}\nPassword: ${acc.password || '(not set)'}\nLogin Link: ${window.location.origin}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
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

  // Filtered accounts (exclude pure customers unless needed)
  const staffAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.phone.includes(searchQuery) ||
      (acc.outletName && acc.outletName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    const matchesOutlet = outletFilter === 'all' || acc.outletId === outletFilter;

    return matchesSearch && matchesRole && matchesOutlet;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              Access Control & Security
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Total Logins: {accounts.length}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Store & Staff Logins Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Super Admins can create and manage dedicated login credentials for store managers, branch franchises, inventory handlers, and courier staff.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Store Login & Password</span>
        </button>
      </div>

      {/* Admin 2FA Authenticator OTP Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>Admin 2-Step Authenticator OTP Enforced</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Active</span>
            </h4>
            <p className="text-[11px] text-slate-300">
              All Super Admin and Store Manager accounts require 6-digit TOTP (Google Authenticator / Microsoft Authenticator) or WhatsApp SMS OTP before accessing merchant consoles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const adminAcc = accounts.find((a) => a.role === 'super_admin') || accounts[0];
              if (adminAcc) setQrModalAccount(adminAcc);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-300" />
            <span>Admin Google Authenticator QR</span>
          </button>
        </div>
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
            placeholder="Search by staff name, email, phone, or outlet..."
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
            <option value="franchise_manager">Franchise Manager</option>
            <option value="delivery_staff">Delivery Courier</option>
            <option value="customer">Registered Customer</option>
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

      {/* Grid of Credentials Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffAccounts.map((acc) => {
          const isCopied = copiedId === acc.id;
          const isVisible = visiblePasswords[acc.id];
          const isSuperAdminRole = acc.role === 'super_admin';

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all relative ${
                acc.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-rose-200 bg-rose-50/20 opacity-75'
              }`}
            >
              {/* Header: Outlet & Role */}
              <div className="flex items-start justify-between gap-2">
                <div>
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
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        acc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {acc.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{acc.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
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

              {/* Login Credentials Box */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400">Login ID / Email</span>
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

                {(acc.role === 'super_admin' || acc.role === 'store_manager' || acc.twoFactorEnabled) && (
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-sans font-bold text-slate-400">2FA Authenticator</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>OTP Enforced</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Password Edit Form */}
              {editingPasswordId === acc.id ? (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
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

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs gap-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPasswordId(acc.id);
                      setNewPasswordValue(acc.password || '');
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Change Password
                  </button>

                  {(acc.role === 'super_admin' || acc.role === 'store_manager' || acc.twoFactorEnabled) && (
                    <button
                      type="button"
                      onClick={() => setQrModalAccount(acc)}
                      className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors"
                      title="View & register Google Authenticator QR Code for this account"
                    >
                      <QrCode className="w-3 h-3 text-indigo-600" />
                      <span>2FA QR Code</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateStoreStaffAccount(acc.id, { isActive: !acc.isActive })}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                      acc.isActive
                        ? 'text-amber-700 hover:bg-amber-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {acc.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  {!isSuperAdminRole && (
                    deletingAccountId === acc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteStoreStaffAccount(acc.id);
                            setDeletingAccountId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAccountId(null)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingAccountId(acc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {staffAccounts.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
          <KeyRound className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No matching staff or store logins found</h4>
          <p className="text-xs text-slate-500">Try adjusting your search query or role filter.</p>
        </div>
      )}

      {/* CREATE STORE LOGIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Store Login & Password</h3>
                  <p className="text-xs text-slate-500">Assign role and store branch credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStoreLogin} className="p-4 sm:p-5 space-y-3.5">
              {/* Outlet branch assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Store Outlet Branch <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold cursor-pointer"
                    required
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.ownershipModel} - {o.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Role & Authority Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as Role)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold cursor-pointer"
                  required
                >
                  <option value="store_manager">Store Manager (Full Branch Operations)</option>
                  <option value="outlet_owner">Outlet Owner (Financial & Inventory Owner)</option>
                  <option value="franchise_manager">Franchise Manager (FOCO/FOFO Partner)</option>
                  <option value="delivery_staff">Delivery Courier (Dispatch & Orders)</option>
                  <option value="inventory_manager">Inventory Manager (Stock & Transfers)</option>
                </select>
              </div>

              {/* Staff Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Farhan Siddiqui"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Email / Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Email / Login ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="e.g. gomtinagar@javed-electronics.in"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password & Generate Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Store Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="e.g. store123"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 98390 12345"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
                <strong>Notification:</strong> After creating the credentials, you can immediately copy and forward them to the store manager via WhatsApp or SMS.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Create & Issue Credentials
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
