import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Participant, PayoutItem, PayoutStatus, FinancialLedgerEntry, ParticipantType } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Truck,
  Users,
  Layers,
  FileSpreadsheet,
  Plus,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const PayoutsLedgerManager: React.FC = () => {
  const {
    participants,
    payoutItems,
    financialLedger,
    updatePayoutStatus,
    createPayoutItem,
    addLedgerEntry,
    currentRole,
    outlets,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  const [activeSubTab, setActiveSubTab] = useState<'payouts' | 'ledger' | 'participants'>('payouts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal for Payout Detail / Approval
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [txnRefInput, setTxnRefInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal for New Payout Run
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [grossAmountInput, setGrossAmountInput] = useState(12500);
  const [deductionsInput, setDeductionsInput] = useState(1200);
  const [incentivesInput, setIncentivesInput] = useState(450);
  const [payoutNotes, setPayoutNotes] = useState('Bi-weekly settlement run');

  // KPI Calculations
  const stats = useMemo(() => {
    let totalPaid = 0;
    let pendingApproval = 0;
    let processingDisbursement = 0;
    let totalLedgerVolume = 0;

    payoutItems.forEach((p) => {
      if (p.status === 'paid') totalPaid += p.netPayable;
      if (p.status === 'pending_verification' || p.status === 'calculated') pendingApproval += p.netPayable;
      if (p.status === 'approved' || p.status === 'scheduled' || p.status === 'processing') processingDisbursement += p.netPayable;
    });

    financialLedger.forEach((entry) => {
      totalLedgerVolume += entry.amount;
    });

    return { totalPaid, pendingApproval, processingDisbursement, totalLedgerVolume };
  }, [payoutItems, financialLedger]);

  const filteredPayouts = payoutItems.filter((p) => {
    const matchesSearch =
      p.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payoutId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.outletName && p.outletName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.participantType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredLedger = financialLedger.filter((entry) => {
    return (
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountDebit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountCredit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Paid & Reconciled</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Approved</span>;
      case 'processing':
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1"><Clock className="w-3 h-3" /> In Bank Queue</span>;
      case 'pending_verification':
      case 'calculated':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pending Audit</span>;
      case 'failed':
      case 'reversed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> {status.toUpperCase()}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getParticipantTypeBadge = (t: ParticipantType) => {
    switch (t) {
      case 'rider':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">Rider Partner</span>;
      case 'vendor':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Vendor</span>;
      case 'franchise_partner':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Franchisee</span>;
      case 'supplier':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">OEM Supplier</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{t}</span>;
    }
  };

  const handleCreatePayoutRun = (e: React.FormEvent) => {
    e.preventDefault();
    const part = participants.find((p) => p.id === selectedParticipantId);
    if (!part) return;

    const net = Math.max(0, Number(grossAmountInput) - Number(deductionsInput) + Number(incentivesInput));

    createPayoutItem({
      payoutId: `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      participantId: part.id,
      participantName: part.name,
      participantType: part.type,
      outletId: part.linkedOutletId,
      outletName: part.outletName,
      periodStart: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      grossAmount: Number(grossAmountInput),
      deductions: Number(deductionsInput),
      incentives: Number(incentivesInput),
      netPayable: net,
      calculationBreakdown: {
        baseAmount: Number(grossAmountInput),
        ordersCount: 28,
        distanceBonus: Number(incentivesInput),
        codReconciled: Number(deductionsInput),
        notes: payoutNotes,
      },
      status: 'pending_verification',
      paymentMethod: 'bank_neft',
    });

    setShowNewRunModal(false);
  };

  const handleExportLedgerCsv = () => {
    const headers = ['Date', 'Reference ID', 'Debit Account', 'Credit Account', 'Category', 'Outlet', 'Amount'];
    const rows = filteredLedger.map((e) => [
      e.entryDate.split('T')[0],
      e.referenceId,
      `"${e.accountDebit}"`,
      `"${e.accountCredit}"`,
      e.category,
      `"${e.outletName || 'Central'}"`,
      e.amount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `financial_subledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Financial KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Disbursed Payouts
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatINR(stats.totalPaid)}
          </div>
          <span className="text-[11px] text-slate-500">To riders, vendors & franchise</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pending Audit & Approval
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
            {formatINR(stats.pendingApproval)}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting Super Admin</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Scheduled for Bank Dispatch
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono mt-1">
            {formatINR(stats.processingDisbursement)}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">NEFT / RTGS batch queue</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Financial Subledger Volume
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-1">
            {formatINR(stats.totalLedgerVolume)}
          </div>
          <span className="text-[11px] text-purple-600 font-medium">Audited journal entries</span>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('payouts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'payouts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Disbursement Payouts ({payoutItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'ledger' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Financial Subledger & Audits ({financialLedger.length})
          </button>
          <button
            onClick={() => setActiveSubTab('participants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'participants' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Beneficiary Accounts ({participants.length})
          </button>
        </div>

        {activeSubTab === 'payouts' && isSuperAdmin && (
          <button
            onClick={() => setShowNewRunModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Payout Run</span>
          </button>
        )}
        {activeSubTab === 'ledger' && (
          <button
            onClick={handleExportLedgerCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Subledger CSV</span>
          </button>
        )}
      </div>

      {/* TAB 1: PAYOUTS LIST */}
      {activeSubTab === 'payouts' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payout ID, participant, or branch..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Beneficiary Roles</option>
                <option value="rider">Rider Partners</option>
                <option value="vendor">Local Vendors</option>
                <option value="franchise_partner">Franchise Partners</option>
                <option value="supplier">OEM Suppliers</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Payout Statuses</option>
                <option value="paid">Paid & Settled</option>
                <option value="approved">Approved</option>
                <option value="pending_verification">Pending Audit</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Payout Ref</th>
                  <th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">Branch Outlet</th>
                  <th className="px-4 py-3">Gross & Deductions</th>
                  <th className="px-4 py-3 text-right">Net Payable</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {item.payoutId}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        {item.periodStart} to {item.periodEnd}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.participantName}</div>
                      <div className="mt-0.5">{getParticipantTypeBadge(item.participantType)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.outletName || 'Central Platform'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div>Gross: {formatINR(item.grossAmount)}</div>
                      <div className="text-rose-600 text-[11px]">Ded: -{formatINR(item.deductions)}</div>
                      {item.incentives > 0 && (
                        <div className="text-emerald-600 text-[11px]">Inc: +{formatINR(item.incentives)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-sm text-slate-900">
                      {formatINR(item.netPayable)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPayout(item);
                          setTxnRefInput(item.transactionReference || `TXN-NEFT-${Date.now().toString().slice(-6)}`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL SUBLEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Entry Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Debit Account</th>
                <th className="px-4 py-3">Credit Account</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors font-mono">
                  <td className="px-4 py-3 text-slate-500">{entry.entryDate.split('T')[0]}</td>
                  <td className="px-4 py-3 font-bold text-blue-700">{entry.referenceId}</td>
                  <td className="px-4 py-3 text-slate-900 font-sans">{entry.accountDebit}</td>
                  <td className="px-4 py-3 text-slate-700 font-sans">{entry.accountCredit}</td>
                  <td className="px-4 py-3 text-slate-600 font-sans text-[11px]">{entry.description}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                    {formatINR(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeSubTab === 'participants' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{p.phone}</span>
                  </div>
                  {getParticipantTypeBadge(p.type)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1 mb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Linked Branch:</span>
                    <span className="font-semibold text-slate-800">{p.outletName || 'Central'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bank:</span>
                    <span className="font-semibold text-slate-800">{p.bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>A/C No:</span>
                    <span className="font-mono">{p.bankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IFSC:</span>
                    <span className="font-mono text-[10px]">{p.bankAccount.ifscCode}</span>
                  </div>
                  {p.bankAccount.upiId && (
                    <div className="flex justify-between text-slate-600">
                      <span>UPI:</span>
                      <span className="font-mono text-blue-700">{p.bankAccount.upiId}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded">
                    <span className="text-[10px] text-emerald-800 block">Pending Balance</span>
                    <span className="font-bold text-emerald-900 font-mono">{formatINR(p.pendingBalance)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                    <span className="text-[10px] text-slate-600 block">Lifetime Paid</span>
                    <span className="font-bold text-slate-900 font-mono">{formatINR(p.paidTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYOUT DETAIL & APPROVAL MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-700">{selectedPayout.payoutId}</span>
                  {getStatusBadge(selectedPayout.status)}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedPayout.participantName}</h3>
                <span className="text-xs text-slate-500">
                  {selectedPayout.outletName || 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209'} • {selectedPayout.periodStart} to {selectedPayout.periodEnd}
                </span>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* In-Modal Feedback Alert */}
            {actionSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Gross Deliveries / Sales:</span>
                <span className="font-bold font-mono">{formatINR(selectedPayout.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Deductions (COD / Commission / TDS):</span>
                <span className="font-bold font-mono">-{formatINR(selectedPayout.deductions)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Incentives / Distance Bonus:</span>
                <span className="font-bold font-mono">+{formatINR(selectedPayout.incentives)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-black text-slate-900">
                <span>Net Payable Disbursal:</span>
                <span className="text-blue-700 font-mono">{formatINR(selectedPayout.netPayable)}</span>
              </div>
            </div>

            {selectedPayout.status !== 'paid' && isSuperAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank UTR / NEFT Reference Number
                </label>
                <input
                  type="text"
                  value={txnRefInput}
                  onChange={(e) => setTxnRefInput(e.target.value)}
                  placeholder="e.g. TXN-NEFT-889024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
              {isSuperAdmin && selectedPayout.status === 'pending_verification' && (
                <button
                  onClick={() => {
                    const targetId = selectedPayout.id || selectedPayout.payoutId;
                    updatePayoutStatus(targetId, 'approved');
                    const updated = {
                      ...selectedPayout,
                      status: 'approved' as PayoutStatus,
                      approvedBy: 'Super Admin',
                      approvedAt: new Date().toISOString(),
                    };
                    setSelectedPayout(updated);
                    setActionSuccessMessage(`Approved for Bank Dispatch! Status updated to 'Approved'.`);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Approve for Bank Dispatch
                </button>
              )}

              {isSuperAdmin && (selectedPayout.status === 'approved' || selectedPayout.status === 'scheduled') && (
                <button
                  onClick={() => {
                    const targetId = selectedPayout.id || selectedPayout.payoutId;
                    const refCode = txnRefInput.trim() || 'TXN-NEFT-889024';
                    updatePayoutStatus(targetId, 'paid', refCode);
                    const updated = {
                      ...selectedPayout,
                      status: 'paid' as PayoutStatus,
                      transactionReference: refCode,
                      paidAt: new Date().toISOString(),
                    };
                    setSelectedPayout(updated);
                    setActionSuccessMessage(`Bank Transfer confirmed & posted to financial subledger!`);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Bank Transfer & Post to Ledger
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setActionSuccessMessage(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PAYOUT RUN MODAL */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Generate Beneficiary Payout Run</h3>
                <p className="text-xs text-slate-500">Calculate net settlement with atomic ledger posting</p>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayoutRun} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Beneficiary</label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type}) — {p.outletName || 'Central'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gross (INR)</label>
                  <input
                    type="number"
                    value={grossAmountInput}
                    onChange={(e) => setGrossAmountInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deductions</label>
                  <input
                    type="number"
                    value={deductionsInput}
                    onChange={(e) => setDeductionsInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Incentives</label>
                  <input
                    type="number"
                    value={incentivesInput}
                    onChange={(e) => setIncentivesInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-900">Net Disbursal:</span>
                <span className="font-black text-sm text-blue-900 font-mono">
                  {formatINR(Math.max(0, grossAmountInput - deductionsInput + incentivesInput))}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRunModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Create Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
