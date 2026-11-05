import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  X,
  ArrowLeft,
  User,
  Package,
  Heart,
  Share2,
  Gift,
  Tag,
  MapPin,
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
  ShoppingCart,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Star,
  Zap,
  RotateCcw,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Smartphone,
} from 'lucide-react';
import { Product } from '../../types';

export const CustomerAccountModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentUser,
    orders,
    wishlist,
    toggleWishlist,
    products,
    coupons,
    cart,
    cartSubtotal,
    addToCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setSelectedOrderForModal,
    setSelectedProductForDetail,
    logoutUser,
    updateUserProfile,
    addSavedAddress,
    deleteSavedAddress,
    setDefaultAddress,
    redeemReferralCode,
    referralProgramConfig,
    returnExchangeRequests,
    jeCashTransactions,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'jecash' | 'referrals' | 'wishlist' | 'coupons' | 'profile'>('orders');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // JE Cash (Non-Refillable Store Credit) Passbook Filter
  const [passbookFilter, setPassbookFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Referral Redemption State
  const [friendRefCode, setFriendRefCode] = useState('');

  // Custom Coupon Code Input State
  const [customCouponInput, setCustomCouponInput] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);

  // Add Address Form State
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddrName, setNewAddrName] = useState(currentUser.name);
  const [newAddrPhone, setNewAddrPhone] = useState(currentUser.phone);
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrArea, setNewAddrArea] = useState('Nalasopara East');
  const [newAddrCity, setNewAddrCity] = useState('Nalasopara, Palghar (Mumbai)');
  const [newAddrPincode, setNewAddrPincode] = useState('401209');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');
  const [newAddrTag, setNewAddrTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddrDefault, setNewAddrDefault] = useState(true);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Strict Customer Privacy: Customer can only see their own placed orders
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    const curPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const curEmail = (currentUser.email || '').trim().toLowerCase();
    const curId = currentUser.id;
    const curName = (currentUser.name || '').trim().toLowerCase();

    return orders.filter((o) => {
      // 1. Direct userId on order
      if (o.userId && o.userId === curId) return true;
      if (o.customer?.id && o.customer.id === curId) return true;

      // 2. Phone match (exact last 10 digits)
      if (curPhone && o.customer?.phone) {
        const orderPhone = o.customer.phone.replace(/\D/g, '').slice(-10);
        if (orderPhone && orderPhone === curPhone) return true;
      }

      // 3. Email match (case-insensitive)
      if (curEmail && o.customer?.email) {
        if (o.customer.email.trim().toLowerCase() === curEmail) return true;
      }

      // 4. Exact customer full name match
      if (curName && o.customer?.name) {
        if (o.customer.name.trim().toLowerCase() === curName) return true;
      }

      return false;
    });
  }, [orders, currentUser]);
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));
  const activeCoupons = coupons.filter((c) => c.isActive);

  const referralCode = currentUser.referralCode || 'JAVED-VIP100';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}?ref=${referralCode}`
      : `https://javed-electronics.in?ref=${referralCode}`;

  const shareWhatsAppUrl = getWhatsAppClickToChatUrl(
    '',
    `Hey! Check out Javed Electronics (Nalasopara & Mumbai MMR). Genuine smartphones, audio gear, and express local delivery! Use my referral code *${referralCode}* to get ₹100 OFF on your order: ${referralLink}`
  );

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    showToast(`Referral code ${referralCode} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Javed Electronics Referral — Get ₹100 Off',
          text: `Use my referral code ${referralCode} on Javed Electronics to get ₹100 off your order!`,
          url: referralLink,
        });
      } catch {
        handleCopyReferral();
      }
    } else {
      handleCopyReferral();
    }
  };

  const handleRedeemFriendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = redeemReferralCode(friendRefCode);
    if (res.success) {
      showToast(res.message, 'success');
      setFriendRefCode('');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConvertRewardToCoupon = () => {
    if ((currentUser.rewardBalance || 0) < 100) {
      showToast('You need at least ₹100 reward balance to apply on cart.', 'error');
      return;
    }
    if (cart.length === 0) {
      // Add a coupon or copy code
      navigator.clipboard?.writeText('FESTIVE500');
      showToast('Add items to your cart first, then click Apply to use your reward discount!', 'success');
      return;
    }
    const res = applyCoupon('REF100');
    if (res.success) {
      showToast('₹100 Referral Reward applied to your active cart!', 'success');
    } else {
      // Fallback apply FIRSTBUY or notify
      showToast(res.message, 'error');
    }
  };

  const handleApplyCouponCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);

    if (cart.length === 0) {
      showToast(`Coupon ${code} copied! Add products to cart to apply at checkout.`, 'success');
      return;
    }

    const res = applyCoupon(code);
    if (res.success) {
      showToast(`${res.message} Discount applied to your cart!`, 'success');
    } else {
      showToast(`Copied ${code}! (${res.message})`, 'error');
    }
  };

  const handleCustomCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCouponInput.trim()) return;
    handleApplyCouponCode(customCouponInput.trim().toUpperCase());
    setCustomCouponInput('');
  };

  const handleMoveWishlistItemToCart = (product: Product) => {
    const res = addToCart(product, 1);
    if (res.success) {
      showToast(`${product.name} added to cart!`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleAddAllWishlistToCart = () => {
    let added = 0;
    wishlistProducts.forEach((p) => {
      const res = addToCart(p, 1);
      if (res.success) added++;
    });
    if (added > 0) {
      showToast(`Added ${added} wishlist item${added > 1 ? 's' : ''} to your cart!`, 'success');
    } else {
      showToast('Could not add items to cart (check stock).', 'error');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim()) {
      showToast('Name and mobile number are required.', 'error');
      return;
    }
    const res = updateUserProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
    });
    if (res.success) {
      setIsEditingProfile(false);
      showToast(res.message, 'success');
    }
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLine.trim() || !newAddrPincode.trim()) {
      showToast('Please enter full address line and pincode.', 'error');
      return;
    }
    addSavedAddress({
      fullName: newAddrName.trim() || currentUser.name,
      phone: newAddrPhone.trim() || currentUser.phone,
      addressLine: newAddrLine.trim(),
      area: newAddrArea.trim() || 'Nalasopara East',
      city: newAddrCity.trim() || 'Nalasopara',
      state: 'Maharashtra',
      pincode: newAddrPincode.trim(),
      landmark: newAddrLandmark.trim(),
      tag: newAddrTag,
      isDefault: newAddrDefault,
      coordinates: { lat: 19.418, lng: 72.829 },
    });
    setNewAddrLine('');
    setNewAddrLandmark('');
    setShowAddAddressForm(false);
    showToast('New delivery address saved to your profile!', 'success');
  };

  if (activeModal !== 'customer_account') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col w-screen h-screen pb-14 overflow-hidden animate-in fade-in duration-200">
      {/* Top Full-Screen Sticky Header */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to Store"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {currentUser.name}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Account
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono truncate">
              <span className="truncate">{currentUser.phone}</span>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setActiveTab('jecash')}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer shrink-0 transition-colors"
                title="View JE Cash Balance & Passbook"
              >
                <Wallet className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>JE Cash: {formatINR(currentUser.rewardBalance || currentUser.jeCashBalance || 0)}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal('cart')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cart</span>
              <span className="font-mono">({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveModal('auth')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 font-bold cursor-pointer transition-colors"
            title="Switch Account or Staff Login"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Switch Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logoutUser();
              setActiveModal(null);
            }}
            title="Sign Out"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            title="Close Profile"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category-Style E-Commerce Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 shrink-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: 'orders',
              label: `My Orders (${myOrders.length})`,
              icon: <Package className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
            },
            {
              id: 'jecash',
              label: `JE Cash (${formatINR(currentUser.rewardBalance || currentUser.jeCashBalance || 0)})`,
              icon: <Wallet className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
            },
            {
              id: 'referrals',
              label: 'Refer & Earn ₹100',
              icon: <Gift className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
            },
            {
              id: 'wishlist',
              label: `Wishlist (${wishlistProducts.length})`,
              icon: <Heart className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
            },
            {
              id: 'coupons',
              label: `Coupons (${activeCoupons.length})`,
              icon: <Tag className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
            },
            {
              id: 'profile',
              label: `Profile & Addresses (${currentUser.savedAddresses.length})`,
              icon: <MapPin className="w-4 h-4 shrink-0" />,
              activeClass: 'bg-slate-900 text-white border-slate-900 shadow-xs',
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isActive
                    ? tab.activeClass
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {toastMsg && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-3 shrink-0">
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-150 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-slate-700 px-1.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Screen Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto pb-16">
          {/* ========================================================= */}
          {/* TAB 1: MY ORDERS */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Order History & Live Shipment Tracking
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track doorstep rider deliveries, download GST tax invoices, or view delivery PIN codes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer self-start sm:self-center shadow-2xs"
                >
                  + Continue Shopping
                </button>
              </div>

              {myOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No orders placed yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Explore smartphones, true wireless earbuds, smartwatches, and fast chargers with express local delivery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOrders.map((order) => {
                    const isCod = order.paymentMethod === 'cod';
                    const dispatch = order.dispatchDetails;

                    return (
                      <div
                        key={order.id}
                        className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all text-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {order.id}
                              </span>
                              {isCod ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                                  <Banknote className="w-3 h-3 text-amber-600" />
                                  <span>
                                    COD ({order.paymentStatus === 'verified_paid' ? 'Paid' : 'Due'})
                                  </span>
                                </span>
                              ) : order.paymentStatus === 'verifying' || order.orderStatus === 'payment_verifying' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Verifying Payment</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Prepaid</span>
                                </span>
                              )}
                            </div>

                            <span
                              className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase font-mono border ${
                                order.orderStatus === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : order.orderStatus === 'payment_verifying'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : order.orderStatus === 'in_progress'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : order.orderStatus === 'returned' || order.orderStatus === 'cancelled'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {order.orderStatus === 'payment_verifying'
                                ? 'VERIFYING PAYMENT'
                                : order.orderStatus === 'in_progress'
                                ? 'IN PROGRESS'
                                : order.orderStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-slate-700 font-medium line-clamp-2">
                            {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                          </div>

                          {dispatch && (
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {dispatch.fulfillmentType === 'express_partner' ? (
                                  <span className="text-[11px] text-slate-800">
                                    <strong>{dispatch.carrier} Express</strong> • AWB:{' '}
                                    <span className="font-mono font-bold text-blue-700">
                                      {dispatch.awbNumber || 'Pending'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-800">
                                    <strong>In-House Rider:</strong>{' '}
                                    {dispatch.riderName || order.deliveryStaffName || 'Ramesh Kumar'}
                                  </span>
                                )}
                              </div>

                              {order.deliveryCode && order.orderStatus === 'out_for_delivery' && (
                                <span className="text-[10px] font-mono font-black bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                                  PIN: {order.deliveryCode}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Return / Exchange Status Banner */}
                          {(() => {
                            const requests = returnExchangeRequests.filter((r) => r.orderId === order.id);
                            if (requests.length > 0) {
                              const activeReq = requests[0];
                              return (
                                <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                    <span>
                                      Return/Exchange: {activeReq.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-blue-700">
                                    {activeReq.id}
                                  </span>
                                </div>
                              );
                            }
                            if (order.orderStatus === 'delivered') {
                              return (
                                <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Category-protected return & exchange eligible</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-bold">
                                    Doorstep Pickup
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 font-mono">
                          <span className="text-slate-600">
                            Total:{' '}
                            <strong className="text-slate-900 font-black text-sm">
                              {formatINR(order.finalTotal)}
                            </strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {order.orderStatus === 'delivered' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForModal(order);
                                  setActiveModal('order_tracking');
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                                title="Request or view category return/exchange"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-700" />
                                <span>Return / Exchange</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForModal(order);
                                setActiveModal('order_tracking');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                            >
                              Track
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForModal(order);
                                setActiveModal('invoice');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: JE CASH (NON-REFILLABLE STORE CREDIT & PASSBOOK) */}
          {/* ========================================================= */}
          {activeTab === 'jecash' && (() => {
            const currentBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;

            const nonRefillTxns = (jeCashTransactions || []).filter((txn) => txn.category !== 'refill');
            const filteredTxns = nonRefillTxns.filter((txn) => {
              if (passbookFilter === 'credit') return txn.type === 'credit';
              if (passbookFilter === 'debit') return txn.type === 'debit';
              return true;
            });

            return (
              <div className="space-y-5">
                {/* 1. Hero Balance Showcase Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-7 shadow-lg border border-emerald-800/60">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Official JE Cash Balance</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-amber-300" />
                          Non-Refillable Store Credit
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/10 text-emerald-200 border border-white/15 px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-emerald-300" />
                          100% Usable at Checkout
                        </span>
                      </div>

                      <div>
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
                          <span>{formatINR(currentBal)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                          Official non-refillable store reward &amp; refund currency. Earned via Order Refunds (+5% bonus), Refer &amp; Earn rewards, and Promotional Cashbacks.
                        </p>
                      </div>

                      {/* Benefits Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-[11px]">
                          <span className="font-bold text-emerald-300 block">⚡ 1-Click Payment</span>
                          <span className="text-[10px] text-emerald-100/70">Zero OTP or gateway delays</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-[11px]">
                          <span className="font-bold text-amber-300 block">🎁 +5% Refund Bonus</span>
                          <span className="text-[10px] text-emerald-100/70">Credited on eligible returns</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-[11px]">
                          <span className="font-bold text-sky-300 block">🤝 ₹100 Referral Credit</span>
                          <span className="text-[10px] text-emerald-100/70">Earned per friend order</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-[11px]">
                          <span className="font-bold text-purple-300 block">🔒 Non-Refillable</span>
                          <span className="text-[10px] text-emerald-100/70">Earned via store rewards only</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('referrals')}
                        className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Gift className="w-4 h-4 text-slate-950" />
                        <span>Earn ₹100 via Referrals</span>
                      </button>

                      {cart.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setActiveModal('checkout')}
                          className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Pay with JE Cash</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveModal(null)}
                          className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Shop &amp; Use Balance</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Non-Refillable Policy & How to Earn JE Cash */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>How JE Cash Works (Non-Refillable Store Credit)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        JE Cash is an exclusive promotional &amp; refund balance and cannot be manually topped up or recharged.
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <span>Non-Refillable • Non-Transferable</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-black text-emerald-950">
                        <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Return Refunds (+5% Bonus)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Opt for <strong>JE Cash</strong> during an order return to receive 100% instant refund plus an extra <strong>5% bonus credit</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-black text-indigo-950">
                        <Gift className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>2. Refer &amp; Earn Rewards</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Share your referral code with friends. Earn <strong>₹{referralProgramConfig.referrerRewardAmount || 100} JE Cash</strong> automatically when their order is delivered.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-black text-amber-950">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>3. Pay at Checkout</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Select <strong>JE Cash</strong> as your payment method at checkout for instant 1-click order confirmation with zero fees.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Passbook & Transaction Ledger */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">
                          JE Cash Passbook &amp; History
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Complete verified ledger of referral rewards, return refund credits, bonuses, and order payments
                        </p>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      {[
                        { id: 'all', label: `All (${nonRefillTxns.length})` },
                        { id: 'credit', label: 'Credits (+)' },
                        { id: 'debit', label: 'Debits (-)' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setPassbookFilter(f.id as any)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            passbookFilter === f.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTxns.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <Wallet className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No {passbookFilter} transactions found in your passbook.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('referrals')}
                        className="text-xs text-emerald-600 font-bold underline cursor-pointer"
                      >
                        Earn JE Cash via Refer &amp; Earn →
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredTxns.map((txn) => {
                        const isCredit = txn.type === 'credit';
                        return (
                          <div
                            key={txn.id}
                            className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors px-1 rounded-xl"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCredit
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isCredit ? (
                                  <ArrowDownLeft className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {txn.description}
                                  </span>
                                  <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                                      txn.category === 'order_refund'
                                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                                        : txn.category === 'referral_bonus'
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {txn.category.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap font-mono">
                                  <span>
                                    {new Date(txn.timestamp).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                    ,{' '}
                                    {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {txn.paymentMethodUsed && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500">{txn.paymentMethodUsed}</span>
                                    </>
                                  )}
                                  {txn.referenceId && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500">Ref: {txn.referenceId}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-sm font-black font-mono block ${
                                  isCredit ? 'text-emerald-700' : 'text-slate-900'
                                }`}
                              >
                                {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                Bal: ₹{txn.balanceAfter.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 2: REFER & EARN */}
          {/* ========================================================= */}
          {activeTab === 'referrals' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* Left Column: Hero Banner + Share Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/15 px-2.5 py-1 rounded-full text-amber-300 border border-white/15">
                      ⚡ Javed Electronics VIP Referral Club
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                      {referralProgramConfig.programHeadline || 'Give ₹100, Get ₹100 Instant Credit!'}
                    </h3>
                    <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                      {referralProgramConfig.programDescription || 'Invite friends & family. When they place their first electronics order, both receive rewards!'}
                    </p>
                  </div>

                  <div className="p-4 bg-white/10 rounded-xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xs">
                    <div>
                      <span className="text-[10px] text-blue-200 uppercase font-bold block">
                        Your Available JE Cash Balance
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                        {formatINR(currentUser.rewardBalance || currentUser.jeCashBalance || 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('jecash')}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer transition-colors self-start sm:self-center flex items-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>View JE Cash Passbook →</span>
                    </button>
                  </div>
                </div>

                {/* Copy & Share Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs mb-1.5">
                      Your Personal Referral Code & Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-slate-50 border-2 border-dashed border-indigo-300 rounded-xl font-mono font-black text-base text-indigo-950 text-center tracking-wider">
                        {referralCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={shareWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Invite via WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleShareNative}
                      className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-3 px-4 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Referral Link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Redeem Friend's Code + How It Works */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Have a Friend&apos;s Referral Code?</h4>
                      <p className="text-[11px] text-slate-500">
                        Redeem it now for an instant ₹{referralProgramConfig.refereeRewardAmount} JE Cash credit + discount coupon
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRedeemFriendCode} className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={friendRefCode}
                      onChange={(e) => setFriendRefCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. JAVED-FRIEND99)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      Claim ₹{referralProgramConfig.refereeRewardAmount} Referral Bonus
                    </button>
                  </form>
                </div>

                {/* 3-Step Referral Guide */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    How Referral Rewards Work
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      {
                        step: '1',
                        title: 'Share Your Code on WhatsApp',
                        desc: 'Send your unique code to friends looking for smartphones or electronics.',
                      },
                      {
                        step: '2',
                        title: `Friend Gets ₹${referralProgramConfig.refereeRewardAmount} Instant Discount`,
                        desc: `Your friend unlocks ₹${referralProgramConfig.refereeRewardAmount} off on orders above ₹${referralProgramConfig.minOrderValueToQualify}.`,
                      },
                      {
                        step: '3',
                        title: `You Earn ₹${referralProgramConfig.referrerRewardAmount} JE Cash Cashback`,
                        desc: `Once their order is delivered, ₹${referralProgramConfig.referrerRewardAmount} is credited to your JE Cash balance!`,
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {item.step}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{item.title}</span>
                          <span className="text-[11px] text-slate-500">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: WISHLIST */}
          {/* ========================================================= */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    My Saved Wishlist ({wishlistProducts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compare prices, check live store stock, or move your favorite electronics straight to cart
                  </p>
                </div>

                {wishlistProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddAllWishlistToCart}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center shadow-xs transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add All ({wishlistProducts.length}) to Cart</span>
                  </button>
                )}
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <Heart className="w-10 h-10 text-rose-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Your wishlist is currently empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tap the heart icon on any product to save it here for quick price tracking and instant checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Browse Electronics
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistProducts.map((p) => {
                    const effectivePrice = p.dealPrice || p.regularPrice;
                    const discountPct = Math.round(((p.mrp - effectivePrice) / p.mrp) * 100);
                    const availableStock = p.stock.onHand - p.stock.reserved;

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-4 space-y-3"
                      >
                        <div>
                          <div className="relative flex items-center gap-3">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              onClick={() => {
                                setSelectedProductForDetail(p);
                                setActiveModal('product_detail');
                              }}
                              className="w-20 h-20 object-contain rounded-xl bg-slate-50 p-1.5 border border-slate-100 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                  {p.brand}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleWishlist(p.id);
                                    showToast(`Removed ${p.name} from wishlist.`);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                  title="Remove from Wishlist"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <h4
                                onClick={() => {
                                  setSelectedProductForDetail(p);
                                  setActiveModal('product_detail');
                                }}
                                className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer mt-0.5"
                              >
                                {p.name}
                              </h4>

                              <div className="flex items-baseline gap-1.5 mt-1.5">
                                <span className="font-mono font-black text-sm text-slate-900">
                                  {formatINR(effectivePrice)}
                                </span>
                                {p.mrp > effectivePrice && (
                                  <span className="font-mono text-[10px] text-slate-400 line-through">
                                    {formatINR(p.mrp)}
                                  </span>
                                )}
                                {discountPct > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                    {discountPct}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForDetail(p);
                              setActiveModal('product_detail');
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                          >
                            Full Details
                          </button>

                          <button
                            type="button"
                            disabled={availableStock <= 0}
                            onClick={() => handleMoveWishlistItemToCart(p)}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: COUPONS & OFFERS */}
          {/* ========================================================= */}
          {activeTab === 'coupons' && (
            <div className="space-y-5 text-xs">
              {/* Custom Promo Code Input Bar + Active Cart Status */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Store Coupons & Instant Promo Codes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current Cart Subtotal:{' '}
                    <strong className="font-mono text-slate-900">{formatINR(cartSubtotal)}</strong>
                    {appliedCoupon && (
                      <span className="ml-2 inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Applied: {appliedCoupon.code}
                        <button
                          type="button"
                          onClick={() => {
                            removeCoupon();
                            showToast('Removed applied coupon from cart.');
                          }}
                          className="ml-1 text-rose-600 hover:underline cursor-pointer"
                        >
                          (Remove)
                        </button>
                      </span>
                    )}
                  </p>
                </div>

                <form onSubmit={handleCustomCouponSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCouponInput}
                    onChange={(e) => setCustomCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code (e.g. FESTIVE500)"
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs"
                  >
                    Apply Code
                  </button>
                </form>
              </div>

              {/* Coupon Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCoupons.map((c) => {
                  const isCurrentlyApplied = appliedCoupon?.code.toUpperCase() === c.code.toUpperCase();
                  const isEligible = cartSubtotal >= c.minOrderValue;
                  const shortfall = Math.max(0, c.minOrderValue - cartSubtotal);

                  return (
                    <div
                      key={c.id}
                      className={`p-4 sm:p-5 bg-white rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                        isCurrentlyApplied
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-dashed border-blue-400 rounded-lg font-mono font-black text-blue-800 text-sm">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span>{c.code}</span>
                          </div>

                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            {c.discountType === 'fixed'
                              ? `FLAT ₹${c.value} OFF`
                              : c.discountType === 'percentage'
                              ? `${c.value}% OFF`
                              : 'FREE DELIVERY'}
                          </span>
                        </div>

                        <p className="text-slate-800 font-semibold text-xs leading-relaxed">
                          {c.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Min Order: {formatINR(c.minOrderValue)}</span>
                          {c.maxDiscount && <span>Max Savings: {formatINR(c.maxDiscount)}</span>}
                        </div>

                        {/* Progress Bar Toward Unlocking Coupon */}
                        {cart.length > 0 && !isEligible && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                            Add <strong>{formatINR(shortfall)}</strong> more to cart to unlock this coupon!
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(c.code);
                            setCopiedCouponCode(c.code);
                            showToast(`Copied coupon code ${c.code}`);
                            setTimeout(() => setCopiedCouponCode(null), 2500);
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          {copiedCouponCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedCouponCode === c.code ? 'Copied' : 'Copy Code'}</span>
                        </button>

                        {isCurrentlyApplied ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveModal('cart');
                            }}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Applied! Go to Checkout →</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyCouponCode(c.code)}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{cart.length > 0 ? 'Apply to Cart' : 'Copy & Use'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PROFILE & SAVED ADDRESSES */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* Personal Details Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-black text-slate-900">Personal Profile Details</h3>
                    </div>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileName(currentUser.name);
                          setProfilePhone(currentUser.phone);
                          setProfileEmail(currentUser.email);
                          setIsEditingProfile(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">
                          Customer Name
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{currentUser.name}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">
                          Registered Mobile (WhatsApp Updates)
                        </span>
                        <span className="font-mono font-bold text-slate-900">{currentUser.phone}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">
                          Email Address
                        </span>
                        <span className="text-slate-800">{currentUser.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Delivery Addresses Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Saved Delivery Addresses ({currentUser.savedAddresses.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Manage doorstep locations for express delivery
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm((prev) => !prev)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {showAddAddressForm && (
                    <form
                      onSubmit={handleAddAddressSubmit}
                      className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3"
                    >
                      <h4 className="font-bold text-blue-950 text-xs">Add New Delivery Address</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={newAddrName}
                          onChange={(e) => setNewAddrName(e.target.value)}
                          placeholder="Receiver Full Name *"
                          className="p-2.5 bg-white border border-slate-300 rounded-xl"
                          required
                        />
                        <input
                          type="text"
                          value={newAddrPhone}
                          onChange={(e) => setNewAddrPhone(e.target.value)}
                          placeholder="Mobile Number *"
                          className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono"
                          required
                        />
                      </div>

                      <input
                        type="text"
                        value={newAddrLine}
                        onChange={(e) => setNewAddrLine(e.target.value)}
                        placeholder="Flat / House No., Building, Street *"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                        required
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={newAddrArea}
                          onChange={(e) => setNewAddrArea(e.target.value)}
                          placeholder="Locality / Area *"
                          className="p-2.5 bg-white border border-slate-300 rounded-xl"
                          required
                        />
                        <input
                          type="text"
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          placeholder="City *"
                          className="p-2.5 bg-white border border-slate-300 rounded-xl"
                          required
                        />
                        <input
                          type="text"
                          value={newAddrPincode}
                          onChange={(e) => setNewAddrPincode(e.target.value)}
                          placeholder="PIN Code *"
                          className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          {(['Home', 'Work', 'Other'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setNewAddrTag(t)}
                              className={`px-3 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${
                                newAddrTag === t
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-600 border-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(false)}
                            className="px-3 py-1.5 text-slate-600 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold cursor-pointer"
                          >
                            Save Address
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {currentUser.savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-xl border transition-all space-y-1.5 ${
                          addr.isDefault
                            ? 'bg-blue-50/40 border-blue-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                            {addr.tag && (
                              <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                {addr.tag}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDefaultAddress(addr.id);
                                  showToast('Updated default delivery address.');
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                              >
                                Set Default
                              </button>
                            )}
                            {currentUser.savedAddresses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSavedAddress(addr.id);
                                  showToast('Address removed.');
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-700">
                          {addr.addressLine}, {addr.area}
                        </p>
                        <p className="text-slate-600">
                          {addr.city}, {addr.state} - <strong className="font-mono">{addr.pincode}</strong>
                        </p>
                        <p className="text-slate-500 font-mono text-[11px]">Phone: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
