import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  X,
  User,
  Package,
  Heart,
  Share2,
  Gift,
  Tag,
  MapPin,
  Clock,
  Printer,
  Copy,
  Check,
  MessageCircle,
  LogOut,
  KeyRound,
  Truck,
  ExternalLink,
  Banknote,
  ShieldCheck,
} from 'lucide-react';

export const CustomerAccountModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentUser,
    orders,
    wishlist,
    products,
    coupons,
    setSelectedOrderForModal,
    setSelectedProductForDetail,
    settings,
    logoutUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'referrals' | 'wishlist' | 'coupons' | 'profile'>('orders');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  if (activeModal !== 'customer_account') return null;

  // Filter orders placed by this customer or all recent customer orders
  const myOrders = orders;

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${currentUser.referralCode}`
    : `https://javed-electronics.in?ref=${currentUser.referralCode}`;

  const shareWhatsAppUrl = getWhatsAppClickToChatUrl(
    '',
    `Hey! Check out Javed Electronics in Lucknow. They offer genuine smartphones, audio gear, and 4-hour local delivery. Use my referral code *${currentUser.referralCode}* to get ₹100 off on your first order: ${referralLink}`
  );

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(currentUser.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 max-h-[92vh] flex flex-col box-border">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</h2>
              <span className="text-xs text-slate-500 font-mono block">{currentUser.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveModal('auth')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 font-semibold cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Account</span>
            </button>

            <button
              onClick={() => {
                logoutUser();
                setActiveModal(null);
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white overflow-x-auto scrollbar-none text-xs shrink-0 w-full max-w-full">
          {[
            { id: 'orders', label: `My Orders (${myOrders.length})`, icon: <Package className="w-3.5 h-3.5 shrink-0" /> },
            { id: 'referrals', label: 'Refer & Earn', icon: <Gift className="w-3.5 h-3.5 shrink-0" /> },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})`, icon: <Heart className="w-3.5 h-3.5 shrink-0" /> },
            { id: 'coupons', label: 'Coupons', icon: <Tag className="w-3.5 h-3.5 shrink-0" /> },
            { id: 'profile', label: 'Addresses', icon: <MapPin className="w-3.5 h-3.5 shrink-0" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  You haven't placed any orders yet.
                </div>
              ) : (
                myOrders.map((order) => {
                  const isCod = order.paymentMethod === 'cod';
                  const dispatch = order.dispatchDetails;

                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{order.id}</span>
                          {/* Payment Type Badge */}
                          {isCod ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              <Banknote className="w-3 h-3 text-amber-700" />
                              <span>COD ({order.paymentStatus === 'verified_paid' ? 'Paid' : 'Due at Doorstep'})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Prepaid</span>
                            </span>
                          )}
                        </div>

                        <span className="font-bold text-slate-700 bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-slate-600 line-clamp-1">
                        {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>

                      {/* Dispatch & AWB badge if available */}
                      {dispatch && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {dispatch.fulfillmentType === 'express_partner' ? (
                              <span className="text-[11px] text-slate-800">
                                <strong>{dispatch.carrier} Express</strong> • AWB:{' '}
                                <span className="font-mono font-bold text-blue-700">{dispatch.awbNumber || 'Pending'}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-800">
                                <strong>In-House Rider:</strong> {dispatch.riderName || 'Store Courier'}
                              </span>
                            )}
                          </div>

                          {dispatch.trackingUrl && (
                            <a
                              href={dispatch.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Live Courier Tracking</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-mono">
                        <span className="text-slate-600">
                          Total: <strong className="text-slate-900 font-black">{formatINR(order.finalTotal)}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrderForModal(order);
                              setActiveModal('order_tracking');
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Track Shipment
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrderForModal(order);
                              setActiveModal('invoice');
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-[11px] cursor-pointer flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: REFERRALS */}
          {activeTab === 'referrals' && (
            <div className="space-y-4 text-xs">
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  Customer Rewards Program
                </span>
                <h3 className="text-xl font-black mt-1">Refer Friends & Earn ₹100</h3>
                <p className="text-xs text-blue-100 mt-1">
                  Share your link. When a friend places their first electronics order in Lucknow, you both get ₹100 credit!
                </p>

                <div className="mt-4 p-3 bg-white/10 rounded-xl flex items-center justify-between backdrop-blur-xs">
                  <div>
                    <span className="text-[10px] text-blue-200 block">Your Available Reward Balance</span>
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {formatINR(currentUser.rewardBalance)}
                    </span>
                  </div>
                  <span className="text-[11px] bg-white text-blue-900 font-bold px-3 py-1 rounded-full shadow-xs">
                    Usable on next order
                  </span>
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-700 block">Your Unique Referral Code:</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-white border border-slate-300 rounded font-mono font-bold text-sm text-slate-900 text-center">
                    {currentUser.referralCode}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="px-4 py-2 bg-slate-900 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <a
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share with Friends on WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-3 text-xs">
              {wishlistProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Your wishlist is currently empty.</div>
              ) : (
                wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded bg-white" />
                      <div>
                        <span className="font-semibold text-slate-900 block">{p.name}</span>
                        <span className="font-mono font-bold text-blue-700">
                          {formatINR(p.dealPrice || p.regularPrice)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductForDetail(p);
                        setActiveModal('product_detail');
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold text-xs cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-3 text-xs">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono font-extrabold text-blue-700 text-sm">{c.code}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{c.description}</p>
                    <span className="text-[10px] text-slate-400">Min Order: {formatINR(c.minOrderValue)}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      setCopiedCouponCode(c.code);
                      setTimeout(() => setCopiedCouponCode(null), 2500);
                    }}
                    className={`px-3 py-1 rounded font-semibold text-xs transition-colors cursor-pointer ${
                      copiedCouponCode === c.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {copiedCouponCode === c.code ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB: PROFILE & ADDRESSES */}
          {activeTab === 'profile' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Saved Addresses
              </h4>
              {currentUser.savedAddresses.map((addr) => (
                <div key={addr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{addr.fullName}</span>
                    {addr.isDefault && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{addr.addressLine}, {addr.area}</p>
                  <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-slate-500 font-mono text-[11px]">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
