import React, { useState } from 'react';
import { Product, SellerListing } from '../../types';
import { formatINR } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Award,
  Clock,
  Edit2,
  Check,
  Plus,
  ShieldCheck,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface MultiSellerPriceModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const MultiSellerPriceModal: React.FC<MultiSellerPriceModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { outlets, updateSellerListingPrice, mapSellerToExistingProduct, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // Add new seller listing state
  const [showAddSellerForm, setShowAddSellerForm] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState(outlets[0]?.id || '');
  const [newSellerPrice, setNewSellerPrice] = useState<number>(product.dealPrice || product.regularPrice);
  const [newSellerCost, setNewSellerCost] = useState<number>(product.purchaseCost || Math.round(product.regularPrice * 0.78));
  const [newSellerStock, setNewSellerStock] = useState<number>(10);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const listings: SellerListing[] = product.sellerListings && product.sellerListings.length > 0
    ? product.sellerListings
    : [
        {
          id: 'sl-default-flagship',
          sellerId: 'out_hazratganj',
          sellerName: 'Hazratganj Flagship Store',
          outletId: 'out_hazratganj',
          outletName: 'Hazratganj Flagship Store',
          sellingPrice: product.dealPrice || product.regularPrice,
          mrp: product.mrp,
          purchaseCost: product.purchaseCost,
          stock: product.stock.onHand,
          isAvailable: true,
          deliveryPromiseHours: 4,
          isFeaturedSeller: true,
          lastUpdated: new Date().toISOString(),
        },
      ];

  // Find lowest price
  const availableListings = listings.filter((l) => l.isAvailable && l.stock > 0);
  const minPrice = availableListings.length > 0
    ? Math.min(...availableListings.map((l) => l.sellingPrice))
    : (product.dealPrice || product.regularPrice);

  const handleStartEdit = (listing: SellerListing) => {
    setEditingSellerId(listing.sellerId);
    setEditPrice(listing.sellingPrice);
    setEditStock(listing.stock);
  };

  const handleSaveEdit = (sellerId: string) => {
    if (editPrice <= 0) {
      setFeedback({ type: 'error', message: 'Selling price must be greater than zero.' });
      return;
    }
    const res = updateSellerListingPrice(product.id, sellerId, editPrice, editStock);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Seller listing updated successfully.' });
      setEditingSellerId(null);
    }
  };

  const handleAddSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];
    if (!outlet) return;

    const res = mapSellerToExistingProduct(product.id, {
      sellerId: outlet.id,
      sellerName: outlet.name,
      outletId: outlet.id,
      outletName: outlet.name,
      sellingPrice: Number(newSellerPrice),
      mrp: product.mrp,
      purchaseCost: Number(newSellerCost),
      stock: Number(newSellerStock),
      isAvailable: true,
      deliveryPromiseHours: 4,
      isFeaturedSeller: Number(newSellerPrice) <= minPrice,
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddSellerForm(false);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={product.images[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'}
              alt={product.name}
              className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-slate-700 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  Multi-Seller Marketplace
                </span>
                <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-slate-300">
                {listings.length} {listings.length === 1 ? 'store/seller' : 'stores/sellers'} actively listing this product
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs underline cursor-pointer ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Pricing Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">MRP</span>
              <span className="font-bold text-slate-700 line-through">{formatINR(product.mrp)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Lowest Market Price</span>
              <span className="font-extrabold text-emerald-600 text-sm">{formatINR(minPrice)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Sellers</span>
              <span className="font-bold text-slate-900">{listings.length} Stores</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddSellerForm(!showAddSellerForm)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddSellerForm ? 'Cancel Add' : 'Add Store Seller Listing'}</span>
          </button>
        </div>

        {/* Add Seller Form Drawer */}
        {showAddSellerForm && (
          <form onSubmit={handleAddSellerSubmit} className="p-4 bg-blue-50/60 border-b border-blue-200/80 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Map Another Branch / Store to this Product Catalogue</span>
              </span>
              <span className="text-[11px] text-blue-700">Prevents duplicate catalogue entries</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Store / Branch</label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={newSellerPrice}
                  onChange={(e) => setNewSellerPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  value={newSellerCost}
                  onChange={(e) => setNewSellerCost(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Stock on Hand</label>
                <input
                  type="number"
                  value={newSellerStock}
                  onChange={(e) => setNewSellerStock(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddSellerForm(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Store Listing</span>
              </button>
            </div>
          </form>
        )}

        {/* Sellers Breakdown Table */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Seller / Store Name</th>
                  <th className="py-2.5 px-3">Selling Price</th>
                  <th className="py-2.5 px-3">Wholesale Cost</th>
                  <th className="py-2.5 px-3">Gross Margin</th>
                  <th className="py-2.5 px-3">Available Stock</th>
                  <th className="py-2.5 px-3">Delivery SLA</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((item) => {
                  const isLowest = item.sellingPrice === minPrice;
                  const isEditing = editingSellerId === item.sellerId;
                  const cost = item.purchaseCost || product.purchaseCost;
                  const marginPercent = cost && item.sellingPrice > cost
                    ? Math.round(((item.sellingPrice - cost) / item.sellingPrice) * 1000) / 10
                    : null;

                  return (
                    <tr
                      key={item.id || item.sellerId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isLowest ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Seller Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.sellerName}</span>
                            <span className="text-[10px] text-slate-400">
                              {item.outletId ? `Branch ID: ${item.outletId}` : 'Verified Marketplace Merchant'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-white border border-blue-400 rounded font-mono font-bold text-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              {formatINR(item.sellingPrice)}
                            </span>
                            {isLowest && (
                              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Best Price</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {cost ? formatINR(cost) : '—'}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3">
                        {marginPercent !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                              marginPercent >= 20
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>{marginPercent}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white border border-blue-400 rounded font-mono text-xs"
                          />
                        ) : (
                          <span
                            className={`font-semibold text-xs ${
                              item.stock <= 3
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {item.stock} units
                          </span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.deliveryPromiseHours || 4}h Express</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.sellerId)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingSellerId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit this store's price or stock"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Multiple stores link to the same master catalogue item to prevent duplicate listings on the storefront.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
