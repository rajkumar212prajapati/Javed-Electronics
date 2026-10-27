import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  generateGstr1Summary,
  exportHsnSummaryCsv,
  exportB2bInvoicesCsv,
  STANDARD_HSN_CATALOG,
  validateGSTIN,
  GST_STATE_CODES,
} from '../../utils/gstTaxEngine';
import { HsnMasterRecord } from '../../types';
import {
  Receipt,
  Download,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Check,
  Printer,
  Calendar,
} from 'lucide-react';

export const GstTaxationManager: React.FC = () => {
  const {
    orders,
    settings,
    updateSettings,
    products,
    setActiveModal,
    setSelectedOrderForModal,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'gstr1' | 'gstr3b' | 'hsn_master' | 'settings'>('gstr1');
  const [searchTerm, setSearchTerm] = useState('');
  const [hsnCatalog, setHsnCatalog] = useState<HsnMasterRecord[]>(STANDARD_HSN_CATALOG);

  // New HSN Modal
  const [showAddHsnModal, setShowAddHsnModal] = useState(false);
  const [newHsnCode, setNewHsnCode] = useState('');
  const [newHsnDesc, setNewHsnDesc] = useState('');
  const [newHsnCategory, setNewHsnCategory] = useState<any>('smartphones');
  const [newHsnRate, setNewHsnRate] = useState<number>(18);

  // Tax Settings Form State
  const [gstinInput, setGstinInput] = useState(settings.gstin || '09AAAFJ1234F1Z8');
  const [legalNameInput, setLegalNameInput] = useState(settings.gstLegalBusinessName || 'JAVED ELECTRONICS PRIVATE LIMITED');
  const [tradeNameInput, setTradeNameInput] = useState(settings.gstTradeName || settings.storeName);
  const [stateInput, setStateInput] = useState(settings.gstState || 'Uttar Pradesh');
  const [stateCodeInput, setStateCodeInput] = useState(settings.gstStateCode || '09');
  const [panInput, setPanInput] = useState(settings.gstPanNumber || 'AAAFJ1234F');
  const [eWayBillThresholdInput, setEWayBillThresholdInput] = useState(settings.eWayBillThreshold || 50000);
  const [shippingGstRateInput, setShippingGstRateInput] = useState(settings.shippingGstRate || 18);
  const [isComposition, setIsComposition] = useState(settings.isCompositionScheme || false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Compute GSTR-1 Summary
  const gstrSummary = useMemo(() => {
    return generateGstr1Summary(orders, settings);
  }, [orders, settings]);

  // Filtered B2B Orders
  const b2bOrders = useMemo(() => {
    return orders.filter((o) => {
      const isB2bOrder = !!o.isB2BOrder || !!o.customer.gstin;
      if (!isB2bOrder) return false;
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        o.invoiceNumber.toLowerCase().includes(s) ||
        (o.customer.gstin && o.customer.gstin.toLowerCase().includes(s)) ||
        (o.b2bBusinessName && o.b2bBusinessName.toLowerCase().includes(s)) ||
        o.customer.name.toLowerCase().includes(s)
      );
    });
  }, [orders, searchTerm]);

  // CSV Exporters
  const handleDownloadHsnCsv = () => {
    const csvContent = exportHsnSummaryCsv(gstrSummary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GSTR1_Table12_HSN_Summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadB2bCsv = () => {
    const csvContent = exportB2bInvoicesCsv(orders, settings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GSTR1_Table4A_B2B_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveTaxSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const gstinValidation = validateGSTIN(gstinInput);
    if (!gstinValidation.isValid) {
      setSettingsFeedback(`Error: ${gstinValidation.error}`);
      return;
    }

    updateSettings({
      gstin: gstinInput.trim().toUpperCase(),
      gstLegalBusinessName: legalNameInput.trim(),
      gstTradeName: tradeNameInput.trim(),
      gstState: stateInput.trim(),
      gstStateCode: stateCodeInput.trim(),
      gstPanNumber: panInput.trim().toUpperCase(),
      eWayBillThreshold: Number(eWayBillThresholdInput),
      shippingGstRate: Number(shippingGstRateInput),
      isCompositionScheme: isComposition,
    });

    setSettingsFeedback('GST Registration and Tax Compliance settings saved successfully!');
    setTimeout(() => setSettingsFeedback(null), 4000);
  };

  const handleAddHsnRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHsnCode.trim() || !newHsnDesc.trim()) return;

    const newRecord: HsnMasterRecord = {
      hsnCode: newHsnCode.trim(),
      description: newHsnDesc.trim(),
      category: newHsnCategory,
      gstRate: Number(newHsnRate),
      isService: newHsnCategory === 'shipping',
    };

    setHsnCatalog((prev) => [newRecord, ...prev]);
    setShowAddHsnModal(false);
    setNewHsnCode('');
    setNewHsnDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl shrink-0">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  GST & Taxation Compliance Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  GSTIN: {settings.gstin || '09AAAFJ1234F1Z8'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  State: 09 - UP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Indian GSTR-1, GSTR-3B monthly return estimates, HSN code breakdown, and B2B Input Tax Credit reconciliation.
              </p>
            </div>
          </div>

          {/* Quick Actions & CSV Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleDownloadHsnCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export HSN CSV</span>
            </button>

            <button
              onClick={handleDownloadB2bCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GSTR-1 (B2B)</span>
            </button>
          </div>
        </div>

        {/* High-Level Tax Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Gross Sales</span>
            <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
              {formatINR(gstrSummary.totalGrossSales)}
            </div>
            <span className="text-[10px] text-slate-500">All non-cancelled orders</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Net Taxable Value</span>
            <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
              {formatINR(gstrSummary.totalTaxableSales)}
            </div>
            <span className="text-[10px] text-slate-500">Base turnover for GST</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Output GST</span>
            <div className="text-lg font-extrabold text-blue-700 font-mono mt-0.5">
              {formatINR(gstrSummary.totalTaxCollected)}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Collected liability</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">CGST (Central)</span>
            <div className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
              {formatINR(gstrSummary.totalCgst)}
            </div>
            <span className="text-[10px] text-slate-500">Intra-State 9% share</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">SGST (State)</span>
            <div className="text-lg font-extrabold text-purple-700 font-mono mt-0.5">
              {formatINR(gstrSummary.totalSgst)}
            </div>
            <span className="text-[10px] text-slate-500">UP Commercial Taxes</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">B2B ITC Invoices</span>
            <div className="text-lg font-extrabold text-amber-700 font-mono mt-0.5">
              {gstrSummary.b2bSummary.count}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">
              {formatINR(gstrSummary.b2bSummary.taxableValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('gstr1')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'gstr1'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>GSTR-1 Outward Supplies</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gstr3b')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'gstr3b'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>GSTR-3B Tax Liability</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hsn_master')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'hsn_master'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>HSN & Tax Slabs ({hsnCatalog.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>GST Registration & Slabs</span>
        </button>
      </div>

      {/* TAB 1: GSTR-1 OUTWARD SUPPLIES */}
      {activeSubTab === 'gstr1' && (
        <div className="space-y-6">
          {/* Section 1: HSN Table 12 Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Table 12: HSN-Wise Summary of Outward Supplies</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory under GST rules for all electronics & courier shipments
                </p>
              </div>

              <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-700">
                Period: {gstrSummary.period}
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-700">
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3">Description of Goods</th>
                    <th className="py-2.5 px-3">UQC</th>
                    <th className="py-2.5 px-3 text-center">Total Qty</th>
                    <th className="py-2.5 px-3 text-right">Total Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {gstrSummary.hsnTable12.map((hsn) => (
                    <tr key={hsn.hsnCode} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{hsn.hsnCode}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 font-medium">{hsn.description}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{hsn.uqc}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{hsn.totalQuantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(hsn.totalValue)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-800">{formatINR(hsn.taxableValue)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">{formatINR(hsn.centralTax)}</td>
                      <td className="py-2.5 px-3 text-right text-purple-700">{formatINR(hsn.stateTax)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{formatINR(hsn.integratedTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Table 4A: B2B Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Table 4A: Taxable Supplies to Registered Persons (B2B Invoices)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Customers claiming Input Tax Credit (ITC) with valid 15-digit GSTIN
                </p>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search B2B Invoices / GSTIN..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {b2bOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No B2B orders found matching your search. Place a checkout with "Claim GST Input Tax Credit" checked to test.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-700">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Recipient GSTIN</th>
                      <th className="py-2.5 px-3">Business / Legal Name</th>
                      <th className="py-2.5 px-3">Place of Supply</th>
                      <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                      <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Invoice Value</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {b2bOrders.map((order) => {
                      const taxable = order.taxableAmount || (order.finalTotal - order.taxAmount);
                      const cgst = order.cgstAmount ?? (order.taxAmount / 2);
                      const sgst = order.sgstAmount ?? (order.taxAmount / 2);

                      return (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{order.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {order.b2bGstin || order.customer.gstin || '09AABPJ1234F1Z5'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {order.b2bBusinessName || order.customer.businessName || order.customer.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {order.placeOfSupply || '09-Uttar Pradesh'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatINR(taxable)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatINR(cgst)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-700">{formatINR(sgst)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatINR(order.finalTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedOrderForModal(order);
                                setActiveModal('invoice');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-200"
                            >
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-3B MONTHLY TAX LIABILITY ESTIMATOR */}
      {activeSubTab === 'gstr3b' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  GSTR-3B Monthly Tax Liability Worksheet
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary of Outward Taxable Supplies & Input Tax Offsets for the month of {gstrSummary.period}.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Regular Scheme (Monthly)
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  3.1 Details of Outward Supplies and inward supplies liable to reverse charge
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-700">Total Taxable Value of Outward Supplies:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(gstrSummary.totalTaxableSales)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-700">Integrated Tax (IGST) Payable:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(gstrSummary.totalIgst)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-700">Central Tax (CGST) Payable:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(gstrSummary.totalCgst)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-700">State Tax (SGST) Payable:</span>
                    <span className="font-mono font-bold text-purple-700">{formatINR(gstrSummary.totalSgst)}</span>
                  </div>

                  <div className="flex justify-between py-2 pt-3 border-t-2 border-slate-300 text-sm font-extrabold">
                    <span className="text-slate-900">Total Output Tax Liability:</span>
                    <span className="font-mono text-blue-800">{formatINR(gstrSummary.totalTaxCollected)}</span>
                  </div>
                </div>
              </div>

              {/* Offset Simulation */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GST Portal Payment Ready</span>
                </div>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  All output tax collected from customer orders is digitally categorized. You can file GSTR-3B on the official GST portal (<a href="https://gst.gov.in" target="_blank" rel="noreferrer" className="underline font-bold">gst.gov.in</a>) before the 20th of the following month.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HSN MASTER DIRECTORY & TAX SLABS */}
      {activeSubTab === 'hsn_master' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Electronics HSN Master Directory & GST Rates
                </h3>
                <p className="text-xs text-slate-500">
                  Harmonized System of Nomenclature codes mapped to standard Indian GST slabs (0%, 5%, 12%, 18%, 28%)
                </p>
              </div>

              <button
                onClick={() => setShowAddHsnModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add HSN Code</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-700">
                    <th className="py-2.5 px-3">HSN / SAC Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Mapped Product Category</th>
                    <th className="py-2.5 px-3 text-center">GST Slab</th>
                    <th className="py-2.5 px-3 text-center">CGST / SGST Rate</th>
                    <th className="py-2.5 px-3">Nature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hsnCatalog.map((hsn) => (
                    <tr key={hsn.hsnCode} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">{hsn.hsnCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{hsn.description}</td>
                      <td className="py-2.5 px-3 font-semibold text-blue-700 uppercase text-[10px]">
                        {hsn.category.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {hsn.gstRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                        {hsn.gstRate / 2}% + {hsn.gstRate / 2}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            hsn.isService
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {hsn.isService ? 'Service (SAC)' : 'Goods (HSN)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GST REGISTRATION & COMPLIANCE SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                GST Registration & Invoicing Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure your official Legal Entity Name, GSTIN number, State, and E-Way Bill parameters.
              </p>
            </div>
          </div>

          {settingsFeedback && (
            <div className="mt-4 p-3 rounded-xl border text-xs bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSaveTaxSettings} className="space-y-4 mt-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Official GSTIN (15-Characters) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={gstinInput}
                onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                maxLength={15}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Format: 2-digit state code + 10-char PAN + 1 + Z + checksum (e.g. 09AAAFJ1234F1Z8)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Legal Business Name (As on PAN/GST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={legalNameInput}
                  onChange={(e) => setLegalNameInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trade Name / Brand:</label>
                <input
                  type="text"
                  value={tradeNameInput}
                  onChange={(e) => setTradeNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">State:</label>
                <input
                  type="text"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">State Code (2-Digits):</label>
                <input
                  type="text"
                  value={stateCodeInput}
                  onChange={(e) => setStateCodeInput(e.target.value)}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Income Tax PAN:</label>
                <input
                  type="text"
                  value={panInput}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  E-Way Bill Mandatory Threshold (₹):
                </label>
                <input
                  type="number"
                  value={eWayBillThresholdInput}
                  onChange={(e) => setEWayBillThresholdInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: ₹50,000</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Shipping Courier GST Rate (%):
                </label>
                <input
                  type="number"
                  value={shippingGstRateInput}
                  onChange={(e) => setShippingGstRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">SAC Code 9968 (18%)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
              >
                Save GST Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add HSN Code Modal */}
      {showAddHsnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddHsnModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add HSN / SAC Record</h3>
            <p className="text-xs text-slate-500 mb-4">
              Map a new product category to its official Indian GST tariff chapter.
            </p>

            <form onSubmit={handleAddHsnRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">HSN or SAC Code (4-8 Digits):</label>
                <input
                  type="text"
                  value={newHsnCode}
                  onChange={(e) => setNewHsnCode(e.target.value)}
                  placeholder="e.g. 8517"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description:</label>
                <input
                  type="text"
                  value={newHsnDesc}
                  onChange={(e) => setNewHsnDesc(e.target.value)}
                  placeholder="e.g. Tablets & Cellular Accessories"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={newHsnCategory}
                    onChange={(e) => setNewHsnCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="smartphones">Smartphones</option>
                    <option value="audio">Audio</option>
                    <option value="chargers_cables">Chargers & Cables</option>
                    <option value="smartwatches">Smartwatches</option>
                    <option value="tvs_accessories">TVs & Displays</option>
                    <option value="computer_accessories">Computer Accessories</option>
                    <option value="home_electronics">Home Electronics</option>
                    <option value="small_appliances">Small Appliances</option>
                    <option value="shipping">Logistics Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Slab Rate (%):</label>
                  <select
                    value={newHsnRate}
                    onChange={(e) => setNewHsnRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard Electronics)</option>
                    <option value={28}>28% (Luxury / Large Appliances)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHsnModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Save HSN Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
