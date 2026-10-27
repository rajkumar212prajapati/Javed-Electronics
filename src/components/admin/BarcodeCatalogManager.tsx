import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductBarcodeRecord, BarcodeType } from '../../types';
import {
  Barcode,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Scan,
  ShieldCheck,
  Tag,
  Building2,
  ExternalLink,
  Layers,
  Sparkles,
  XCircle,
} from 'lucide-react';

export const BarcodeCatalogManager: React.FC = () => {
  const { barcodeRecords, registerBarcodeRecord, verifyBarcodeLookup, products, outlets, activeOutlet, currentUser, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';
  const myStoreId = currentUser.storeId || activeOutlet?.id || 'out_hazratganj';
  const myStoreOutlet = outlets.find((o) => o.id === myStoreId) || activeOutlet;

  const [scanInput, setScanInput] = useState('');
  const [scannedResult, setScannedResult] = useState<ProductBarcodeRecord | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('EAN-13');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [isOfficialGtin, setIsOfficialGtin] = useState(true);
  const [packSize, setPackSize] = useState('1 Unit');
  const [registerStatusMsg, setRegisterStatusMsg] = useState<{ success: boolean; message: string } | null>(null);

  const handleSimulateScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;
    const found = verifyBarcodeLookup(scanInput.trim());
    setScannedResult(found || null);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || !barcodeValue) return;

    const res = registerBarcodeRecord({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      barcodeType,
      barcodeValue: barcodeValue.trim(),
      isOfficialGtin,
      brand: prod.brand,
      category: prod.categoryId,
      outletAvailability: outlets.map((o) => o.id),
      unit: 'Piece',
      packSize,
      verified: true,
      lastScannedAt: new Date().toISOString(),
    });

    setRegisterStatusMsg(res);
    if (res.success) {
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterStatusMsg(null);
        setBarcodeValue('');
      }, 1500);
    }
  };

  const filteredBarcodes = barcodeRecords.filter((b) => {
    if (!isSuperAdmin && !b.outletAvailability.includes(myStoreId)) {
      return false;
    }
    const matchesSearch =
      b.barcodeValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || b.barcodeType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intro & Live Barcode Scanner Simulation */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 rounded-lg text-white">
                <Scan className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Official GS1 & Barcode Engine
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">
              Instant Barcode Verification & Warehouse Lookup
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Scan or enter EAN-13, EAN-8, UPC-A, or GTIN numbers to verify GS1 compliance, outlet inventory, and SKU mapping.
            </p>
          </div>

          {/* Scanner Simulator Input Form */}
          <form onSubmit={handleSimulateScan} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode or type EAN (e.g. 8901234567890)"
                className="w-full pl-10 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Scan Result Dropdown / Banner */}
        {scannedResult !== undefined && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            {scannedResult ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-300">{scannedResult.barcodeValue}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold">
                        {scannedResult.barcodeType} Verified
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{scannedResult.productName}</h4>
                    <span className="text-slate-300 text-[11px]">
                      Brand: {scannedResult.brand} • SKU: {scannedResult.sku} • Pack: {scannedResult.packSize}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 block">
                    {isSuperAdmin ? 'Available Across' : 'Store Status'}
                  </span>
                  <span className="font-bold text-white font-mono">
                    {isSuperAdmin ? `${scannedResult.outletAvailability.length} Branches` : `${myStoreOutlet?.name || 'In Store'}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-3.5 flex items-center gap-3 text-xs text-rose-200">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold">Barcode Not Found: </span>
                  No registered product matching barcode &quot;{scanInput}&quot; was found. Click below to register it.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search barcode, product name, brand..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="all">All Barcode Types</option>
            <option value="EAN-13">EAN-13 (Standard Retail)</option>
            <option value="EAN-8">EAN-8 (Compact Package)</option>
            <option value="UPC-A">UPC-A</option>
            <option value="GTIN-14">GTIN-14 (Case Pack)</option>
            <option value="INTERNAL-SKU">Internal SKU</option>
          </select>
        </div>

        <button
          onClick={() => {
            setBarcodeValue(scanInput || '8901234' + Math.floor(100000 + Math.random() * 900000));
            setShowRegisterModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Register Barcode</span>
        </button>
      </div>

      {/* Barcode Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Barcode Value</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Brand & SKU</th>
              <th className="px-4 py-3">GS1 Verification</th>
              <th className="px-4 py-3">Outlet Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredBarcodes.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-blue-700">
                  <span className="flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{item.barcodeValue}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {item.barcodeType}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans font-semibold text-slate-900">{item.productName}</td>
                <td className="px-4 py-3 font-sans text-slate-600">
                  <div>{item.brand}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                </td>
                <td className="px-4 py-3 font-sans">
                  {item.isOfficialGtin ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> GS1 Official
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      Store Internal
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-sans text-slate-600">
                  {isSuperAdmin ? (
                    <>
                      <span className="font-semibold text-slate-800">{item.outletAvailability.length}</span> Outlets
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-700">{myStoreOutlet?.name || 'Available in Store'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REGISTER BARCODE MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register Product Barcode</h3>
                <p className="text-xs text-slate-500">Bind physical EAN/GTIN code to product inventory</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand} - {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode Standard</label>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  >
                    <option value="EAN-13">EAN-13</option>
                    <option value="EAN-8">EAN-8</option>
                    <option value="UPC-A">UPC-A</option>
                    <option value="GTIN-14">GTIN-14</option>
                    <option value="INTERNAL-SKU">Internal SKU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="1 Unit / Box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode Digits / Value *</label>
                <input
                  type="text"
                  required
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={isOfficialGtin}
                  onChange={(e) => setIsOfficialGtin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Verified GS1 Official Manufacturer Barcode</span>
              </label>

              {registerStatusMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs ${
                    registerStatusMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {registerStatusMsg.message}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
