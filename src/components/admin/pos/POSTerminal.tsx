import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Product, ProductCategory, Order } from '../../../types';
import {
  POSCartItem,
  POSCustomer,
  POSHeldTicket,
  POSShiftSession,
  POSTenderMode,
  POSTenderPayment,
  POSReceiptData,
} from '../../../types/pos';
import { formatINR } from '../../../utils/currency';
import { playBeepSound } from '../../../utils/audio';
import { buildUpiPaymentUri, generateQrDataUrl } from '../../../utils/qrcode';
import { validateGSTIN } from '../../../utils/gstTaxEngine';
import { POSThermalReceipt } from './POSThermalReceipt';
import { POSShiftModal } from './POSShiftModal';
import { POSDashboardView } from './POSDashboardView';
import { POSReturnsModal } from './POSReturnsModal';
import { POSReturnRecord, POSQuotation, POSHardwareStatus } from '../../../types/pos';
import {
  Scan,
  Search,
  Plus,
  Minus,
  Trash2,
  Pause,
  Play,
  RotateCcw,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  Sparkles,
  User,
  Building2,
  Clock,
  Printer,
  ChevronRight,
  X,
  Store,
  Tag,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  Minimize2,
  Percent,
  Sliders,
  DollarSign,
  AlertTriangle,
  Camera,
  History,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Gift,
  Info,
  LayoutDashboard,
  BarChart3,
  FileText,
  Smartphone,
  Cpu,
  Package,
} from 'lucide-react';

interface POSTerminalProps {
  onClose?: () => void;
  isFullScreenMode?: boolean;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({ onClose, isFullScreenMode = false }) => {
  const {
    products,
    outlets,
    activeOutletId,
    setActiveOutletId,
    activeOutlet,
    settings,
    currentUser,
    currentRole,
    brandingSettings,
    createOrder,
    adjustStock,
    barcodeRecords,
    orders,
  } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  // POS State
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [isFullScreen, setIsFullScreen] = useState(isFullScreenMode);

  // Active POS Sub-Module Tab: 'terminal' | 'dashboard' | 'returns' | 'hardware'
  const [activePosModule, setActivePosModule] = useState<'terminal' | 'dashboard' | 'returns' | 'hardware'>('terminal');

  // Responsive Catalog vs Cart tab for screens under 1024px (prevents crushing & overlap)
  const [activePane, setActivePane] = useState<'catalog' | 'cart'>('catalog');

  // Quotations List
  const [quotations, setQuotations] = useState<POSQuotation[]>(() => {
    try {
      const saved = localStorage.getItem('je_pos_quotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showQuotationModal, setShowQuotationModal] = useState<boolean>(false);

  // Hardware Status State & testing
  const [hardwareStatus, setHardwareStatus] = useState<POSHardwareStatus>({
    barcodeScanner: 'connected',
    thermalPrinter: 'ready',
    cashDrawer: 'ready',
    customerDisplay: 'online',
    weighingScale: 'connected',
  });
  const [hardwareTestMessage, setHardwareTestMessage] = useState<string | null>(null);

  // Manager Approval PIN for sensitive actions (>25% discount, price override)
  const [showManagerPinModal, setShowManagerPinModal] = useState<boolean>(false);
  const [managerPinInput, setManagerPinInput] = useState<string>('');
  const [managerPinError, setManagerPinError] = useState<string | null>(null);
  const [managerPinPendingAction, setManagerPinPendingAction] = useState<(() => void) | null>(null);

  // In-Terminal Toast Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3800);
  };

  // Cart Clear Confirmation Dialog
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Cart-level Overall Discount
  const [cartDiscountType, setCartDiscountType] = useState<'none' | 'percentage' | 'flat'>('none');
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);

  // Custom Item / Service Fee modal
  const [showCustomItemModal, setShowCustomItemModal] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [customItemGst, setCustomItemGst] = useState<number>(18);
  const [customItemIsService, setCustomItemIsService] = useState<boolean>(false);

  // Camera Barcode Scanner
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recent Completed Receipts / Invoices
  const [recentReceipts, setRecentReceipts] = useState<POSReceiptData[]>(() => {
    try {
      const saved = localStorage.getItem('je_pos_recent_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showRecentReceiptsModal, setShowRecentReceiptsModal] = useState<boolean>(false);

  // Customer selection
  const [customer, setCustomer] = useState<POSCustomer>({
    id: 'walk-in',
    name: 'Walk-in Customer',
    phone: '',
    rewardPoints: 120,
    isB2B: false,
  });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerGstinInput, setCustomerGstinInput] = useState('');
  const [customerBusinessInput, setCustomerBusinessInput] = useState('');

  // Held Tickets (Parked Bills)
  const [heldTickets, setHeldTickets] = useState<POSHeldTicket[]>(() => {
    try {
      const saved = localStorage.getItem('je_pos_held_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [holdNoteInput, setHoldNoteInput] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('je_pos_held_tickets', JSON.stringify(heldTickets));
    } catch {}
  }, [heldTickets]);

  // Shift & Cash Drawer Session
  const [shiftSession, setShiftSession] = useState<POSShiftSession>(() => {
    try {
      const saved = localStorage.getItem('je_pos_shift_session');
      return saved
        ? JSON.parse(saved)
        : {
            id: `shift-${Date.now()}`,
            cashierName: currentUser.name || 'Store Cashier',
            outletId: activeOutletId,
            outletName: activeOutlet?.name || 'Hazratganj Flagship',
            registerId: 'REG-01-LKO',
            startTime: new Date().toISOString(),
            openingFloat: 5000,
            cashSales: 0,
            upiSales: 0,
            cardSales: 0,
            totalDiscounts: 0,
            totalTransactions: 0,
            status: 'open',
          };
    } catch {
      return {
        id: `shift-${Date.now()}`,
        cashierName: currentUser.name || 'Store Cashier',
        outletId: activeOutletId,
        outletName: activeOutlet?.name || 'Hazratganj Flagship',
        registerId: 'REG-01-LKO',
        startTime: new Date().toISOString(),
        openingFloat: 5000,
        cashSales: 0,
        upiSales: 0,
        cardSales: 0,
        totalDiscounts: 0,
        totalTransactions: 0,
        status: 'open',
      };
    }
  });
  const [showShiftModal, setShowShiftModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('je_pos_shift_session', JSON.stringify(shiftSession));
    } catch {}
  }, [shiftSession]);

  // Payment Tender Modal
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [tenderMode, setTenderMode] = useState<POSTenderMode>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [cardLast4, setCardLast4] = useState<string>('');
  const [cardAuthCode, setCardAuthCode] = useState<string>('');
  const [cardType, setCardType] = useState<'Visa' | 'MasterCard' | 'RuPay'>('Visa');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [tenderUpiQr, setTenderUpiQr] = useState<string>('');
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Line item discount / Serial Number modal
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [lineDiscountPercent, setLineDiscountPercent] = useState<number>(0);
  const [lineSerialInput, setLineSerialInput] = useState<string>('');

  // Completed Receipt Modal
  const [completedReceipt, setCompletedReceipt] = useState<POSReceiptData | null>(null);

  // Refs for scanner focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode scanner on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in standard text inputs (unless function keys)
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (cartItems.length > 0) handleParkTicket();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowHeldModal(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (cartItems.length > 0 && !showTenderModal) handleOpenTender();
      } else if (e.key === 'Escape') {
        if (showTenderModal) setShowTenderModal(false);
        else if (showCustomerModal) setShowCustomerModal(false);
        else if (showHeldModal) setShowHeldModal(false);
        else if (editingItemIndex !== null) setEditingItemIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(q);
        const mBrand = p.brand.toLowerCase().includes(q);
        const mSku = p.sku.toLowerCase().includes(q);
        const mBarcode = p.barcode.toLowerCase().includes(q);
        return mName || mBrand || mSku || mBarcode;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Suggested customers from order history
  const suggestedCustomers = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const map = new Map<string, POSCustomer>();
    orders.forEach((o) => {
      if (o.customer && o.customer.phone && !map.has(o.customer.phone)) {
        map.set(o.customer.phone, {
          id: o.customer.id || `cust-${o.customer.phone}`,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.customer.email,
          address: o.customer.address,
          rewardPoints: 120,
          isB2B: !!o.customer.isB2B,
          businessName: o.customer.businessName,
          gstin: o.customer.gstin,
        });
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [orders]);

  // Camera stream cleanup/lifecycle
  useEffect(() => {
    if (showCameraScanner) {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Camera stream error:', err);
          setCameraError(
            'Camera permission is required or device camera is in use. You can also scan with hardware USB gun or select demo barcodes below.'
          );
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraScanner]);

  // Financial Calculations
  const { subtotal, lineDiscountTotal, cartDiscountAmount, discountTotal, taxableAmount, cgstAmount, sgstAmount, totalTax, finalTotal } = useMemo(() => {
    let sub = 0;
    let lineDisc = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;

    cartItems.forEach((item) => {
      sub += item.unitPrice * item.quantity;
      const lineD =
        item.discountType === 'percentage'
          ? Math.round(((item.unitPrice * item.discountValue) / 100) * item.quantity)
          : item.discountType === 'fixed'
          ? item.discountValue * item.quantity
          : 0;
      lineDisc += lineD;

      const netLine = Math.max(0, item.unitPrice * item.quantity - lineD);
      const rate = item.gstRate || 18;
      const baseVal = Math.round((netLine * 100) / (100 + rate));
      const taxVal = netLine - baseVal;
      taxable += baseVal;
      cgst += Math.round(taxVal / 2);
      sgst += Math.round(taxVal / 2);
    });

    // Bill-level overall cart discount
    let billDisc = 0;
    if (cartDiscountType === 'percentage' && cartDiscountValue > 0) {
      billDisc = Math.round(((sub - lineDisc) * Math.min(100, cartDiscountValue)) / 100);
    } else if (cartDiscountType === 'flat' && cartDiscountValue > 0) {
      billDisc = Math.min(sub - lineDisc, cartDiscountValue);
    }

    // Loyalty points deduction
    const loyaltySavings = redeemPoints ? Math.min(customer.rewardPoints, Math.max(0, sub - lineDisc - billDisc)) : 0;
    const totalD = lineDisc + billDisc + loyaltySavings;

    const netFinal = Math.max(0, sub - totalD);
    const taxSum = cgst + sgst;

    return {
      subtotal: sub,
      lineDiscountTotal: lineDisc,
      cartDiscountAmount: billDisc,
      discountTotal: totalD,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalTax: taxSum,
      finalTotal: netFinal,
    };
  }, [cartItems, redeemPoints, customer.rewardPoints, cartDiscountType, cartDiscountValue]);

  // Add custom item / service fee
  const handleAddCustomItem = (name: string, price: number, gstRate: number = 18, isService: boolean = false) => {
    const dummyProduct: Product = {
      id: `custom-${Date.now()}`,
      name,
      sku: isService ? 'SRV-CUSTOM' : 'ITEM-CUSTOM',
      brand: 'Javed Service',
      categoryId: 'computer_accessories',
      mrp: price,
      regularPrice: price,
      dealPrice: price,
      purchaseCost: Math.round(price * 0.7),
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'],
      rating: 5,
      reviewsCount: 1,
      isFeatured: false,
      description: name,
      specifications: {},
      hsnCode: isService ? '9987' : '8504',
      gstRate,
      isTaxInclusive: true,
      warrantyMonths: isService ? 3 : 6,
      returnEligibleDays: 7,
      weightKg: 0.1,
      dimensions: 'N/A',
      status: 'published',
      stock: {
        onHand: 999,
        reserved: 0,
        minStockLevel: 5,
      },
      barcode: `CUST-${Date.now().toString().slice(-6)}`,
    };

    addProductToCart(dummyProduct);
    showNotification(`Added "${name}" (${formatINR(price)}) to bill.`, 'success');
  };

  // Add product to cart helper
  const addProductToCart = (prod: Product, variant?: string) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productId === prod.id && item.selectedVariant === variant
    );

    const price = prod.dealPrice || prod.regularPrice;
    const gstRate = prod.gstRate || 18;

    if (existingIndex >= 0) {
      setCartItems((prev) =>
        prev.map((item, idx) => {
          if (idx === existingIndex) {
            const newQty = item.quantity + 1;
            const lineTotal = price * newQty;
            return {
              ...item,
              quantity: newQty,
              total: lineTotal,
            };
          }
          return item;
        })
      );
    } else {
      const newItem: POSCartItem = {
        id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        product: prod,
        quantity: 1,
        selectedVariant: variant || (prod.variants && prod.variants[0]?.name),
        unitPrice: price,
        discountType: 'none',
        discountValue: 0,
        warrantyMonths: prod.warrantyMonths || 12,
        hsnCode: prod.hsnCode || '8517',
        gstRate,
        cgstAmount: Math.round(((price * (gstRate / 2)) / (100 + gstRate))),
        sgstAmount: Math.round(((price * (gstRate / 2)) / (100 + gstRate))),
        taxableValue: Math.round((price * 100) / (100 + gstRate)),
        total: price,
      };
      setCartItems((prev) => [newItem, ...prev]);
    }

    playBeepSound('success');
  };

  // Barcode scanner trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search by product barcode, sku, or gtin
    const match = products.find(
      (p) => p.barcode.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (match) {
      addProductToCart(match);
      setBarcodeInput('');
    } else {
      // Check barcode registry
      const regRecord = barcodeRecords.find((b) => b.barcodeValue === code);
      if (regRecord) {
        const pMatch = products.find((p) => p.id === regRecord.productId);
        if (pMatch) {
          addProductToCart(pMatch);
          setBarcodeInput('');
          return;
        }
      }

      playBeepSound('error');
      showNotification(`Barcode "${code}" not found in current inventory.`, 'error');
    }
  };

  // Quantity updates
  const updateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    setCartItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const lineTotal = item.unitPrice * newQty;
          return {
            ...item,
            quantity: newQty,
            total: lineTotal,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (index: number) => {
    playBeepSound('delete');
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Park / Hold bill
  const handleParkTicket = () => {
    if (cartItems.length === 0) return;
    const ticketNum = `PARK-${(heldTickets.length + 1).toString().padStart(3, '0')}`;
    const newHeld: POSHeldTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: ticketNum,
      customer,
      note: holdNoteInput || 'Customer browsing more accessories',
      items: cartItems,
      subtotal,
      discountTotal,
      taxTotal: totalTax,
      finalTotal,
      heldAt: new Date().toISOString(),
      cashierName: currentUser.name || 'Store Cashier',
      registerId: shiftSession.registerId,
    };

    setHeldTickets((prev) => [newHeld, ...prev]);
    setCartItems([]);
    setHoldNoteInput('');
    playBeepSound('hold');
  };

  // Recall held ticket
  const handleRecallTicket = (ticket: POSHeldTicket) => {
    setCartItems(ticket.items);
    setCustomer(ticket.customer);
    setHeldTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    setShowHeldModal(false);
    playBeepSound('success');
  };

  // Open Payment Tender Modal
  const handleOpenTender = () => {
    setCashTendered(finalTotal);
    setSplitCash(Math.round(finalTotal / 2));
    setSplitUpi(finalTotal - Math.round(finalTotal / 2));
    setSplitCard(0);
    setShowTenderModal(true);

    // Generate dynamic UPI QR
    const tempRef = `POS-${Date.now().toString().slice(-6)}`;
    const upiString = buildUpiPaymentUri({
      upiId: settings.upiId || 'javed.electronics@okhdfcbank',
      payeeName: settings.upiName || 'Javed Electronics',
      amount: finalTotal,
      transactionRef: tempRef,
      note: `POS Counter Bill ${tempRef}`,
    });
    generateQrDataUrl(upiString, { width: 220 }).then(setTenderUpiQr);
  };

  // Complete Sale & Commit
  const handleFinalizeSale = async () => {
    const invNumber = `JE-POS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const changeDue = tenderMode === 'cash' ? Math.max(0, cashTendered - finalTotal) : 0;

    const tenderPayment: POSTenderPayment = {
      mode: tenderMode,
      cashTendered: tenderMode === 'cash' ? cashTendered : undefined,
      changeDue,
      cardLast4: tenderMode === 'card_pos' ? cardLast4 || '8821' : undefined,
      cardAuthCode: tenderMode === 'card_pos' ? cardAuthCode || '928102' : undefined,
      cardType: tenderMode === 'card_pos' ? cardType : undefined,
      upiTxnRef: tenderMode === 'upi_qr' ? `TXN-UPI-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
      splitDetails:
        tenderMode === 'split'
          ? {
              cash: splitCash,
              upi: splitUpi,
              card: splitCard,
            }
          : undefined,
      rewardPointsRedeemed: redeemPoints ? Math.min(customer.rewardPoints, finalTotal) : 0,
    };

    // Update shift metrics
    setShiftSession((prev) => {
      let addCash = 0;
      let addUpi = 0;
      let addCard = 0;

      if (tenderMode === 'cash') addCash = finalTotal;
      else if (tenderMode === 'upi_qr') addUpi = finalTotal;
      else if (tenderMode === 'card_pos') addCard = finalTotal;
      else if (tenderMode === 'split') {
        addCash = splitCash;
        addUpi = splitUpi;
        addCard = splitCard;
      }

      return {
        ...prev,
        cashSales: prev.cashSales + addCash,
        upiSales: prev.upiSales + addUpi,
        cardSales: prev.cardSales + addCard,
        totalDiscounts: prev.totalDiscounts + discountTotal,
        totalTransactions: prev.totalTransactions + 1,
      };
    });

    // Deduct stock for all purchased items
    cartItems.forEach((ci) => {
      const p = products.find((pr) => pr.id === ci.productId);
      if (p) {
        const newStock = Math.max(0, p.stock.onHand - ci.quantity);
        adjustStock(p.id, newStock, `POS Counter Sale (Inv: ${invNumber})`, currentUser.name || 'POS Cashier');
      }
    });

    // Create Order record in StoreContext
    try {
      await createOrder({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone || '919876543210',
          email: customer.email,
          address: `Store Counter: ${activeOutlet?.address || settings.address}`,
          area: activeOutlet?.name || 'Hazratganj Store',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: activeOutlet?.pincode || settings.pincode,
          isB2B: customer.isB2B,
          businessName: customer.businessName,
          gstin: customer.gstin,
        },
        deliveryType: 'store_pickup',
        deliverySlot: 'Immediate POS Counter Delivery',
        paymentMethod: tenderMode === 'cash' ? 'store_pickup_pay' : tenderMode === 'upi_qr' ? 'upi_qr' : 'online_razorpay',
        isWhatsAppCheckout: false,
      });
    } catch (err) {
      console.warn('POS Order sync warning:', err);
    }

    const receiptData: POSReceiptData = {
      invoiceNumber: invNumber,
      orderId: `JE-ORD-${invNumber.slice(-6)}`,
      createdAt: nowIso,
      outletName: activeOutlet?.name || 'Hazratganj Flagship Store',
      outletAddress: activeOutlet?.address || '12-A, Hazratganj Market, Lucknow',
      outletPhone: activeOutlet?.managerPhone || activeOutlet?.ownerPhone || settings.phone,
      outletGstin: settings.gstin || '09AABPJ9876F1Z8',
      cashierName: currentUser.name || 'Store Cashier',
      registerId: shiftSession.registerId,
      customer,
      items: cartItems,
      subtotal,
      totalDiscount: discountTotal,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalTax,
      finalTotal,
      tender: tenderPayment,
      barcodeValue: invNumber,
    };

    setCompletedReceipt(receiptData);
    setRecentReceipts((prev) => {
      const updated = [receiptData, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('je_pos_recent_receipts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setShowTenderModal(false);
    setCartItems([]);
    setCartDiscountType('none');
    setCartDiscountValue(0);
    setCustomer({
      id: 'walk-in',
      name: 'Walk-in Customer',
      phone: '',
      rewardPoints: 120,
      isB2B: false,
    });
    setRedeemPoints(false);
    playBeepSound('success');
    showNotification(`Invoice ${invNumber} generated successfully!`, 'success');
  };

  const handleSaveAsQuotation = () => {
    if (cartItems.length === 0) return;
    const quoteNum = `JE-QT-${Date.now().toString().slice(-6)}`;
    const newQuote: POSQuotation = {
      id: `quote-${Date.now()}`,
      quoteNumber: quoteNum,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
      customer,
      items: [...cartItems],
      subtotal,
      discountTotal,
      taxTotal: totalTax,
      finalTotal,
      status: 'active',
    };
    const updated = [newQuote, ...quotations];
    setQuotations(updated);
    try {
      localStorage.setItem('je_pos_quotations', JSON.stringify(updated));
    } catch {}
    showNotification(`Quotation ${quoteNum} saved for ${customer.name}!`, 'success');
  };

  const handleConvertQuotationToCart = (quote: POSQuotation) => {
    setCartItems(quote.items);
    setCustomer(quote.customer);
    setShowQuotationModal(false);
    setActivePosModule('terminal');
    setActivePane('cart');
    showNotification(`Quotation ${quote.quoteNumber} loaded into active cart!`, 'info');
  };

  const handleTestHardware = (device: keyof POSHardwareStatus) => {
    if (device === 'thermalPrinter') {
      setHardwareTestMessage('Testing 80mm ESC/POS Thermal Printer: Printing sample alignment receipt...');
      playBeepSound('success');
      setTimeout(() => {
        setHardwareStatus((prev) => ({ ...prev, thermalPrinter: 'ready' }));
        setHardwareTestMessage('Thermal Printer test passed! ESC/POS cutter engaged successfully.');
      }, 1200);
    } else if (device === 'cashDrawer') {
      setHardwareTestMessage('Sending RJ11 24V pulse kick command to Cash Drawer...');
      playBeepSound('success');
      setTimeout(() => {
        setHardwareStatus((prev) => ({ ...prev, cashDrawer: 'open' }));
        setHardwareTestMessage('Cash Drawer kick signal confirmed (Drawer Opened).');
        setTimeout(() => setHardwareStatus((prev) => ({ ...prev, cashDrawer: 'ready' })), 3000);
      }, 1000);
    } else if (device === 'barcodeScanner') {
      setHardwareTestMessage('USB/HID Barcode scanner ready. Emulating laser trigger...');
      playBeepSound('success');
      setTimeout(() => {
        setHardwareTestMessage('Scanner trigger ok. Supported: UPC-A, EAN-13, Code 128, QR Code.');
      }, 800);
    } else if (device === 'customerDisplay') {
      setHardwareTestMessage('VFD Customer Display: Synchronizing total amount...');
      setTimeout(() => {
        setHardwareTestMessage(`Display line 1: WELCOME TO ${activeOutlet?.name || 'STORE'} | Line 2: PAYABLE ${formatINR(finalTotal)}`);
      }, 800);
    } else if (device === 'weighingScale') {
      setHardwareTestMessage('RS232 Electronic Weighing Scale: Reading tare weight...');
      setTimeout(() => {
        setHardwareTestMessage('Scale Tare: 0.000 kg | Net: 0.250 kg | Calibration valid.');
      }, 800);
    }
  };

  return (
    <div
      className={`bg-slate-900 text-slate-100 flex flex-col font-sans select-none ${
        isFullScreen ? 'fixed inset-0 z-50 overflow-hidden' : 'rounded-2xl border border-slate-800 shadow-2xl h-[88vh] min-h-[640px] overflow-hidden'
      }`}
    >
      {/* 1. TOP POS REGISTER BAR */}
      <div className="bg-slate-950 px-3 sm:px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shrink-0 shadow-md">
            JE
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                Store POS Terminal
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                {shiftSession.registerId}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <Store className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{activeOutlet?.name || 'Hazratganj Flagship'}</span>
              <span>•</span>
              <span className="text-slate-300">Cashier: {currentUser.name || 'Store Staff'}</span>
            </div>
          </div>
        </div>

        {/* Outlet Switcher (Super Admin only) & Register Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isSuperAdmin ? (
            <select
              value={activeOutletId}
              onChange={(e) => setActiveOutletId(e.target.value)}
              className="hidden md:block bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900 text-emerald-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-800/60">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeOutlet?.name || 'Assigned Store'}</span>
            </div>
          )}

          {/* Recent Invoices / Receipts Drawer */}
          <button
            onClick={() => setShowRecentReceiptsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="View Recent Invoices & Re-print / WhatsApp"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Recent Bills</span>
            {recentReceipts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono">
                {recentReceipts.length}
              </span>
            )}
          </button>

          {/* Shift / Cash Drawer Button */}
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Cash Drawer & Shift Reconciliation"
          >
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Shift / Cash Drawer</span>
            <span className="font-mono text-amber-300 text-[11px]">
              {formatINR(shiftSession.openingFloat + shiftSession.cashSales)}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen POS Mode'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close POS"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MODULE SWITCHER TABS: Terminal, Dashboard, Returns, Quotations, Hardware */}
      <div className="bg-slate-950/90 px-3 sm:px-5 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActivePosModule('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePosModule === 'terminal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Counter Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePosModule('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePosModule === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span>POS Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePosModule('returns')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePosModule === 'returns'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Returns & Exchanges</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuotationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Quotations ({quotations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePosModule('hardware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePosModule === 'hardware'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hardware & Peripherals</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Register Online</span>
          </span>
          <span>•</span>
          <span>GST Enabled (18% / 12% / 28%)</span>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border backdrop-blur-md ${
              notification.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-700 shadow-rose-950/50'
                : notification.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700 shadow-emerald-950/50'
                : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/50'
            }`}
          >
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN LAYOUT: CATALOG & BILLING */}
      {activePosModule === 'terminal' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Mobile/Tablet Screen Tab Switcher (Visible on < lg screens to eliminate overlapping) */}
          <div className="lg:hidden bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full">
              <button
                type="button"
                onClick={() => setActivePane('catalog')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                  activePane === 'catalog'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛍️ Catalog & Items ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePane('cart')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePane === 'cart'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🛒 Active Bill ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                {finalTotal > 0 && <span className="font-mono text-emerald-300 font-black">({formatINR(finalTotal)})</span>}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* LEFT COLUMN: SCANNER & VISUAL QUICK PICK */}
            <div className={`${activePane === 'catalog' ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60 h-full`}>
              {/* Top Barcode & Search Controls */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900 space-y-2.5 shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Barcode Scanner Input with Camera Toggle */}
                  <form onSubmit={handleBarcodeSubmit} className="relative sm:col-span-7">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scan Barcode / SKU / GTIN (F4)..."
                      className="w-full pl-9 pr-24 py-2 bg-slate-950 text-white placeholder:text-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowCameraScanner(true)}
                        className="p-1 hover:bg-slate-800 text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Scan using Device Camera / Webcam"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Enter
                      </button>
                    </div>
                  </form>

                  {/* Text Search Box */}
                  <div className="relative sm:col-span-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Products by Name (F2)..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 text-white placeholder:text-slate-500 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Quick Pick Tabs & Custom Service Button */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'smartphones', label: 'Smartphones' },
                    { id: 'audio', label: 'Audio & Sound' },
                    { id: 'chargers_cables', label: 'Chargers & Cables' },
                    { id: 'smartwatches', label: 'Smartwatches' },
                    { id: 'tvs_accessories', label: 'Smart TVs' },
                    { id: 'computer_accessories', label: 'Computers & IT' },
                    { id: 'home_electronics', label: 'Home Appliances' },
                    { id: 'small_appliances', label: 'Small Appliances' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                        selectedCategory === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  </div>

                  {/* Quick Custom Item / Service Charge Button */}
                  <button
                    type="button"
                    onClick={() => setShowCustomItemModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    title="Add Custom Product or Repair/Service Charge"
                  >
                    <Wrench className="w-3.5 h-3.5 text-purple-300" />
                    <span>+ Custom / Service</span>
                  </button>
                </div>
              </div>

              {/* Visual Product Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                {filteredProducts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                    <Package className="w-12 h-12 text-slate-600 mb-2 stroke-[1.5]" />
                    <div className="text-sm font-bold text-slate-300">No products found</div>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      {searchQuery
                        ? `No products matching "${searchQuery}".`
                        : `No products available in this category.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {filteredProducts.map((p) => {
                      const price = p.dealPrice || p.regularPrice;
                      const isOutOfStock = p.stock.onHand <= 0;

                      return (
                        <button
                          key={p.id}
                          disabled={isOutOfStock}
                          onClick={() => addProductToCart(p)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isOutOfStock
                              ? 'opacity-40 bg-slate-900 border-slate-800 cursor-not-allowed'
                              : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-blue-500 shadow-sm'
                          }`}
                        >
                          <div className="w-full">
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-900 mb-2">
                              <img
                                src={p.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'}
                                alt={p.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
                                }}
                                className="w-full h-full object-cover"
                              />
                              <span
                                className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  p.stock.onHand > 5
                                    ? 'bg-emerald-900/90 text-emerald-300'
                                    : p.stock.onHand > 0
                                    ? 'bg-amber-900/90 text-amber-300'
                                    : 'bg-rose-900/90 text-rose-300'
                                }`}
                              >
                                Stock: {p.stock.onHand}
                              </span>
                            </div>

                            <div className="text-[10px] text-blue-400 font-bold uppercase truncate">{p.brand}</div>
                            <div className="text-xs font-bold text-white truncate" title={p.name}>
                              {p.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate">SKU: {p.sku}</div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between w-full">
                            <span className="font-mono font-bold text-sm text-emerald-400">{formatINR(price)}</span>
                            <span className="w-6 h-6 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                              +
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Quick Review / Floating bottom bar when cart has items */}
              {cartItems.length > 0 && (
                <div className="lg:hidden p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">
                      {cartItems.reduce((a, b) => a + b.quantity, 0)} items in bill
                    </div>
                    <div className="text-sm font-black text-emerald-400 font-mono truncate">
                      {formatINR(finalTotal)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePane('cart')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <span>Review Bill & Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ACTIVE CART & REGISTER */}
            <div className={`${activePane === 'cart' ? 'flex' : 'hidden lg:flex'} w-full lg:w-[420px] xl:w-[460px] flex-col bg-slate-950 shrink-0 h-full border-t lg:border-t-0 border-slate-800`}>
          {/* Customer Bar */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{customer.name}</span>
                  {customer.isB2B && (
                    <span className="text-[9px] font-bold bg-purple-900 text-purple-300 px-1 rounded">
                      B2B GST
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {customer.phone || 'Cash Sale'} • {customer.rewardPoints} pts
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setCustomerPhoneInput(customer.phone);
                  setCustomerNameInput(customer.name);
                  setCustomerGstinInput(customer.gstin || '');
                  setCustomerBusinessInput(customer.businessName || '');
                  setShowCustomerModal(true);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Scan className="w-12 h-12 text-slate-700 stroke-[1.5] mb-2 animate-pulse" />
                <div className="text-xs font-bold text-slate-400">POS Register Empty</div>
                <p className="text-[11px] text-slate-600 max-w-xs mt-1">
                  Scan barcode with physical scanner or click items from left quick-pick grid to start bill.
                </p>
                <div className="mt-3 text-[10px] text-slate-500 font-mono">
                  Shortcuts: F4 (Barcode) • F2 (Search) • F10 (Tender)
                </div>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <img
                        src={item.product.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'}
                        alt={item.product.name}
                        className="w-9 h-9 object-cover rounded-md bg-slate-950 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate" title={item.product.name}>
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{formatINR(item.unitPrice)} each</span>
                          {item.selectedVariant && (
                            <span className="text-blue-400">({item.selectedVariant})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(index)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Stepper & Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                      <button
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItemIndex(index);
                          setLineDiscountPercent(item.discountValue);
                          setLineSerialInput(item.serialNumberOrImei || '');
                        }}
                        className="text-[10px] text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Serial/Disc</span>
                      </button>

                      <span className="font-mono font-bold text-xs text-white">
                        {formatINR(item.total)}
                      </span>
                    </div>
                  </div>

                  {/* Serial / IMEI tag if attached */}
                  {item.serialNumberOrImei && (
                    <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>S/N: {item.serialNumberOrImei}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Parked Tickets & Register Actions Bar */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <button
              disabled={cartItems.length === 0}
              onClick={handleParkTicket}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                cartItems.length === 0
                  ? 'opacity-40 text-slate-500 bg-slate-800/40 cursor-not-allowed'
                  : 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 border border-amber-600/40'
              }`}
              title="Park / Hold current ticket to attend next customer (F7)"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Hold (F7)</span>
            </button>

            <button
              disabled={cartItems.length === 0}
              onClick={handleSaveAsQuotation}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                cartItems.length === 0
                  ? 'opacity-40 text-slate-500 bg-slate-800/40 cursor-not-allowed'
                  : 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-600/40'
              }`}
              title="Save current cart as Quotation (Proforma invoice)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quote</span>
            </button>

            <button
              onClick={() => setShowHeldModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              title="Recall Parked Tickets (F8)"
            >
              <Play className="w-3.5 h-3.5 text-blue-400" />
              <span>Recall (F8)</span>
              {heldTickets.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {heldTickets.length}
                </span>
              )}
            </button>

            <button
              disabled={cartItems.length === 0}
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {/* Financial Totals Recap */}
          <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-1.5 text-xs shrink-0">
            <div className="flex justify-between text-slate-400">
              <span>Gross Items Subtotal:</span>
              <span className="font-mono text-slate-200">{formatINR(subtotal)}</span>
            </div>

            {/* Bill-Level Discount Toggle */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                <Percent className="w-3 h-3" />
                <span>{cartDiscountAmount > 0 ? 'Edit Bill Discount' : '+ Add Bill Discount'}</span>
              </button>
              {cartDiscountAmount > 0 && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                  <span>
                    -{formatINR(cartDiscountAmount)}
                    {cartDiscountType === 'percentage' && ` (${cartDiscountValue}%)`}
                  </span>
                  <button
                    onClick={() => {
                      setCartDiscountType('none');
                      setCartDiscountValue(0);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Remove Bill Discount"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Total Savings & Discounts:</span>
                <span className="font-mono">-{formatINR(discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Tax Included (CGST 9% + SGST 9%):</span>
              <span className="font-mono">{formatINR(totalTax)}</span>
            </div>

            {/* Total Payable */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Payable
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items in bill
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatINR(finalTotal)}
              </span>
            </div>

            {/* BIG PRIMARY TENDER BUTTON */}
            <button
              disabled={cartItems.length === 0}
              onClick={handleOpenTender}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer mt-2 ${
                cartItems.length === 0
                  ? 'opacity-40 bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-[1.01]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>PAY / TENDER (F10) • {formatINR(finalTotal)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* POS DASHBOARD VIEW */}
  {activePosModule === 'dashboard' && (
    <div className="flex-1 overflow-y-auto bg-slate-900">
      <POSDashboardView
        shiftSession={shiftSession}
        recentReceipts={recentReceipts}
        onOpenRegister={() => setActivePosModule('terminal')}
        onOpenShiftModal={() => setShowShiftModal(true)}
        onOpenReturns={() => setActivePosModule('returns')}
        onOpenPettyCash={() => setShowShiftModal(true)}
      />
    </div>
  )}

  {/* POS RETURNS & EXCHANGES VIEW */}
  {activePosModule === 'returns' && (
    <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
      <POSReturnsModal
        recentReceipts={recentReceipts}
        onCompleteReturn={(returnRecord) => {
          showNotification(`Credit note generated for ${formatINR(returnRecord.totalRefund)}!`, 'success');
          if (returnRecord.refundMethod === 'cash') {
            setShiftSession((prev) => ({
              ...prev,
              cashSales: Math.max(0, prev.cashSales - returnRecord.totalRefund),
            }));
          }
          setActivePosModule('terminal');
        }}
        onClose={() => setActivePosModule('terminal')}
      />
    </div>
  )}

  {/* POS HARDWARE & PERIPHERALS WORKBENCH */}
  {activePosModule === 'hardware' && (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Hardware & POS Peripherals Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verify physical cash drawer kick, 80mm ESC/POS thermal receipt printing, USB/Bluetooth barcode scanners, and customer displays.
          </p>
        </div>
        <button
          onClick={() => setActivePosModule('terminal')}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold self-start cursor-pointer"
        >
          Back to Terminal
        </button>
      </div>

      {hardwareTestMessage && (
        <div className="p-3 bg-blue-950/80 border border-blue-700/60 rounded-xl text-blue-200 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{hardwareTestMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Thermal Receipt Printer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Printer className="w-4 h-4 text-blue-400" />
                <span>80mm Thermal Receipt Printer</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Standard ESC/POS 203 DPI thermal printer over USB / LAN / Bluetooth. Auto-cutter enabled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTestHardware('thermalPrinter')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Print Alignment Test Slip
          </button>
        </div>

        {/* 2. Cash Drawer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>Heavy Duty Cash Drawer</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hardwareStatus.cashDrawer === 'open' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {hardwareStatus.cashDrawer === 'open' ? 'Opened' : 'Armed'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              RJ11 24V solenoid pulse kick connection triggered automatically on cash tenders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTestHardware('cashDrawer')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Kick Open Cash Drawer (Test)
          </button>
        </div>

        {/* 3. Barcode Scanner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Scan className="w-4 h-4 text-emerald-400" />
                <span>Barcode / 2D QR Scanner</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                HID Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              USB keyboard emulation (HID) mode + built-in Device Camera barcode decoder for mobile billing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTestHardware('barcodeScanner')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Test Laser / Camera Trigger
          </button>
        </div>

        {/* 4. Customer Display */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Customer Facing Pole Display (VFD)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              2x20 vacuum fluorescent pole display reflecting live item additions and final bill total.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTestHardware('customerDisplay')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Test Customer Display Feed
          </button>
        </div>

        {/* 5. Weighing Scale */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Electronic Weighing Scale</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Calibrated
              </span>
            </div>
            <p className="text-xs text-slate-400">
              RS232 interface for continuous weight polling and weight-embedded barcodes (EAN-13 prefix 20).
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTestHardware('weighingScale')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Read Tare / Net Weight
          </button>
        </div>
      </div>
    </div>
  )}

      {/* 3. TENDER / PAYMENT MODAL */}
      {showTenderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Payment Tender</h3>
                <p className="text-[11px] text-slate-400">Total Bill Amount: {formatINR(finalTotal)}</p>
              </div>
              <button
                onClick={() => setShowTenderModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Tender Mode Selector */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4 text-amber-400" /> },
                  { id: 'upi_qr', label: 'UPI QR', icon: <QrCode className="w-4 h-4 text-purple-400" /> },
                  { id: 'card_pos', label: 'Card POS', icon: <CreditCard className="w-4 h-4 text-blue-400" /> },
                  { id: 'split', label: 'Split', icon: <Layers className="w-4 h-4 text-emerald-400" /> },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTenderMode(mode.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                      tenderMode === mode.id
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.icon}
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* CASH MODE */}
              {tenderMode === 'cash' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Net Bill Amount:</span>
                    <span className="font-mono font-bold text-white text-sm">{formatINR(finalTotal)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Cash Tendered by Customer (₹):
                    </label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      { label: 'Exact', val: finalTotal },
                      { label: '+₹100', val: Math.ceil(finalTotal / 100) * 100 },
                      { label: '+₹500', val: Math.ceil(finalTotal / 500) * 500 },
                      { label: '+₹2000', val: Math.ceil(finalTotal / 2000) * 2000 },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCashTendered(btn.val)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-md border border-slate-700 cursor-pointer"
                      >
                        {btn.label} ({formatINR(btn.val)})
                      </button>
                    ))}
                  </div>

                  {/* Change Due Display */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Change Return to Customer:</span>
                    <span
                      className={`text-base font-black font-mono ${
                        cashTendered >= finalTotal ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {cashTendered >= finalTotal
                        ? formatINR(cashTendered - finalTotal)
                        : `Short by ${formatINR(finalTotal - cashTendered)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI QR MODE */}
              {tenderMode === 'upi_qr' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Dynamic Counter UPI QR Code</span>
                  </span>

                  {tenderUpiQr ? (
                    <img
                      src={tenderUpiQr}
                      alt="UPI QR"
                      className="w-36 h-36 bg-white p-2 rounded-xl border border-purple-400/40 shadow-md"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-500">
                      Generating QR...
                    </div>
                  )}

                  <div className="text-xs font-mono text-slate-300">
                    VPA: <strong>{settings.upiId || 'javed.electronics@okhdfcbank'}</strong>
                  </div>
                  <div className="text-sm font-black text-emerald-400 font-mono">
                    Amount: {formatINR(finalTotal)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Customer scans using Google Pay, PhonePe, Paytm, or BHIM.
                  </p>
                </div>
              )}

              {/* CARD POS MODE */}
              {tenderMode === 'card_pos' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span>Swipe / Dip Card on EDC Machine</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">EDC Terminal #01</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Card Network:</label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="Visa">Visa</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="RuPay">RuPay</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Card Last 4 Digits:</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 4021"
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Bank Auth Code (From Slip):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 98214"
                      value={cardAuthCode}
                      onChange={(e) => setCardAuthCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* SPLIT TENDER MODE */}
              {tenderMode === 'split' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center font-bold text-emerald-400 mb-1">
                    <span>Split Multiple Tenders</span>
                    <span>Total: {formatINR(finalTotal)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Cash Part (₹):</label>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">UPI Part (₹):</label>
                      <input
                        type="number"
                        value={splitUpi}
                        onChange={(e) => setSplitUpi(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Card Part (₹):</label>
                      <input
                        type="number"
                        value={splitCard}
                        onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Total Tendered:</span>
                    <span
                      className={`font-mono font-bold ${
                        splitCash + splitUpi + splitCard >= finalTotal
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatINR(splitCash + splitUpi + splitCard)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Sale Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setShowTenderModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Back to Cart
              </button>

              <button
                disabled={tenderMode === 'cash' && cashTendered < finalTotal}
                onClick={handleFinalizeSale}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer ${
                  tenderMode === 'cash' && cashTendered < finalTotal
                    ? 'opacity-40 bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Complete Bill & Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER LOOKUP & B2B MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-400" />
                <span>Customer & B2B Invoicing</span>
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Returning Customer Autocomplete */}
              {suggestedCustomers.length > 0 && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Recent Store Customers (1-Click Fill)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedCustomers.map((sc) => (
                      <button
                        key={sc.phone}
                        type="button"
                        onClick={() => {
                          setCustomerPhoneInput(sc.phone);
                          setCustomerNameInput(sc.name);
                          if (sc.isB2B) {
                            setCustomer((prev) => ({ ...prev, isB2B: true }));
                            setCustomerBusinessInput(sc.businessName || '');
                            setCustomerGstinInput(sc.gstin || '');
                          }
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-700/60 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <User className="w-3 h-3 text-blue-400" />
                        <span>{sc.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({sc.phone.slice(-4)})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1">Customer Mobile Number:</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Customer Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* B2B Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customer.isB2B}
                    onChange={(e) =>
                      setCustomer((prev) => ({ ...prev, isB2B: e.target.checked }))
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span className="font-bold text-white flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Company GST Invoice (B2B Tax Credit)</span>
                  </span>
                </label>
              </div>

              {customer.isB2B && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Company / Business Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Skyline Tech Solutions Pvt Ltd"
                      value={customerBusinessInput}
                      onChange={(e) => setCustomerBusinessInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">15-Digit GSTIN:</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 09AABPJ1234F1Z5"
                      value={customerGstinInput}
                      onChange={(e) => setCustomerGstinInput(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCustomer({
                    id: 'walk-in',
                    name: 'Walk-in Customer',
                    phone: '',
                    rewardPoints: 0,
                    isB2B: false,
                  });
                  setShowCustomerModal(false);
                }}
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset to Walk-in
              </button>

              <button
                onClick={() => {
                  setCustomer((prev) => ({
                    ...prev,
                    name: customerNameInput.trim() || 'Walk-in Customer',
                    phone: customerPhoneInput.trim(),
                    businessName: customerBusinessInput.trim() || undefined,
                    gstin: customerGstinInput.trim() || undefined,
                  }));
                  setShowCustomerModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Apply Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. RECALL PARKED TICKETS MODAL */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Parked / Held Bills ({heldTickets.length})</h3>
              </div>
              <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {heldTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No parked bills in queue. Press F7 anytime to hold an active cart.
                </div>
              ) : (
                heldTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-xs font-bold text-white">{ticket.customer.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ticket.items.length} items • {formatINR(ticket.finalTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        Note: {ticket.note}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRecallTicket(ticket)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Recall (Load)
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHeldModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. LINE SERIAL / DISCOUNT MODAL */}
      {editingItemIndex !== null && cartItems[editingItemIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white truncate pr-2">
                Item Options: {cartItems[editingItemIndex].product.name}
              </h3>
              <button onClick={() => setEditingItemIndex(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  Product Serial Number / IMEI (For Warranty):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 359812049182391"
                  value={lineSerialInput}
                  onChange={(e) => setLineSerialInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cashier Line Discount (%):</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  placeholder="e.g. 5 for 5% off"
                  value={lineDiscountPercent}
                  onChange={(e) => setLineDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingItemIndex(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCartItems((prev) =>
                    prev.map((item, idx) => {
                      if (idx === editingItemIndex) {
                        return {
                          ...item,
                          serialNumberOrImei: lineSerialInput.trim() || undefined,
                          discountType: lineDiscountPercent > 0 ? 'percentage' : 'none',
                          discountValue: lineDiscountPercent,
                        };
                      }
                      return item;
                    })
                  );
                  setEditingItemIndex(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRINTABLE THERMAL RECEIPT MODAL */}
      {completedReceipt && (
        <POSThermalReceipt
          receipt={completedReceipt}
          onNewSale={() => {
            setCompletedReceipt(null);
            barcodeInputRef.current?.focus();
          }}
          onClose={() => setCompletedReceipt(null)}
        />
      )}

      {/* 8. SHIFT RECONCILIATION MODAL */}
      {showShiftModal && (
        <POSShiftModal
          session={shiftSession}
          onCloseShift={(actualCounted, notes) => {
            setShiftSession((prev) => ({
              ...prev,
              status: 'closed',
              closingCashActual: actualCounted,
              endTime: new Date().toISOString(),
            }));
            setShowShiftModal(false);
            showNotification(
              `Shift closed. Net Cash Collected: ${formatINR(shiftSession.cashSales)}.`,
              'success'
            );
          }}
          onUpdateOpeningFloat={(newFloat) => {
            setShiftSession((prev) => ({ ...prev, openingFloat: newFloat }));
          }}
          onClose={() => setShowShiftModal(false)}
        />
      )}

      {/* 9. CLEAR CART CONFIRMATION DIALOG */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Clear Active POS Bill?</h3>
              <p className="text-xs text-slate-400 mt-1">
                All {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items in the current register bill will be removed.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Keep Bill
              </button>
              <button
                onClick={() => {
                  setCartItems([]);
                  setCartDiscountType('none');
                  setCartDiscountValue(0);
                  setShowClearConfirm(false);
                  playBeepSound('delete');
                  showNotification('POS Cart cleared.', 'info');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. BILL-LEVEL DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>Overall Bill Discount</span>
              </h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">Discount Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCartDiscountType('percentage')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      cartDiscountType === 'percentage'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCartDiscountType('flat')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      cartDiscountType === 'flat'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">
                  Discount Value {cartDiscountType === 'percentage' ? '(%)' : '(₹)'}:
                </label>
                <input
                  type="number"
                  min={0}
                  max={cartDiscountType === 'percentage' ? 100 : subtotal}
                  value={cartDiscountValue || ''}
                  onChange={(e) => setCartDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={cartDiscountType === 'percentage' ? 'e.g. 5 for 5%' : 'e.g. 500 for ₹500 off'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(cartDiscountType === 'percentage' ? [3, 5, 10, 15] : [100, 250, 500, 1000]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCartDiscountValue(preset)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
                  >
                    {cartDiscountType === 'percentage' ? `${preset}%` : formatINR(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCartDiscountType('none');
                  setCartDiscountValue(0);
                  setShowDiscountModal(false);
                }}
                className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
              >
                Clear Discount
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cartDiscountValue > 0 && cartDiscountType === 'none') {
                    setCartDiscountType('percentage');
                  }
                  setShowDiscountModal(false);
                  showNotification('Bill discount applied.', 'success');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Apply to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. CUSTOM ITEM / SERVICE FEE MODAL */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Add Custom Item or Service Charge</span>
              </h3>
              <button onClick={() => setShowCustomItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Popular Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Popular Quick Services & Add-ons
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Tempered Glass Installation', price: 149, isService: true },
                  { name: 'Data Transfer & Setup', price: 299, isService: true },
                  { name: 'Extended 1-Year Brand Shield', price: 799, isService: true },
                  { name: 'Port Cleaning & Diagnostic', price: 99, isService: true },
                  { name: 'Type-C Braided Cable (OEM)', price: 249, isService: false },
                  { name: 'Gift Wrap & Premium Box', price: 50, isService: false },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleAddCustomItem(item.name, item.price, 18, item.isService);
                      setShowCustomItemModal(false);
                    }}
                    className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-purple-500 text-left transition-all cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                      {formatINR(item.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Fields */}
            <div className="pt-2 border-t border-slate-800 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Item or Service Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Broken Display Replacement Labor"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Amount / Price (₹):</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 450"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">GST Tax Rate (%):</label>
                  <select
                    value={customItemGst}
                    onChange={(e) => setCustomItemGst(parseInt(e.target.value) || 18)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customItemIsService}
                    onChange={(e) => setCustomItemIsService(e.target.checked)}
                    className="rounded text-purple-600 w-4 h-4"
                  />
                  <span className="text-slate-300 text-[11px]">Mark as Repair / Labor Service (SAC 9987)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customItemName.trim() || !(parseFloat(customItemPrice) > 0)}
                onClick={() => {
                  const p = parseFloat(customItemPrice) || 0;
                  if (p > 0 && customItemName.trim()) {
                    handleAddCustomItem(customItemName.trim(), p, customItemGst, customItemIsService);
                    setCustomItemName('');
                    setCustomItemPrice('');
                    setShowCustomItemModal(false);
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. CAMERA BARCODE SCANNER MODAL */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white">Device Camera Barcode Scanner</h3>
              </div>
              <button onClick={() => setShowCameraScanner(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center space-y-3">
              {/* Camera Feed / Viewfinder */}
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Scanning Laser Beam Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-32 border-2 border-emerald-400/80 rounded-lg relative overflow-hidden">
                    <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[bounce_1.5s_infinite]" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center text-xs text-rose-300">
                    <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                    <p>{cameraError}</p>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Point camera lens at barcode printed on product box. Or click demo barcode below:
              </p>

              {/* Quick Sample Barcodes */}
              <div className="w-full space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Quick Barcode Test Samples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        addProductToCart(p);
                        setShowCameraScanner(false);
                        showNotification(`Scanned "${p.name}" via camera.`, 'success');
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Scan className="w-3 h-3 text-emerald-400" />
                      <span className="truncate max-w-[120px]">{p.barcode || p.sku}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCameraScanner(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. RECENT INVOICES & RECEIPT REPRINT MODAL */}
      {showRecentReceiptsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Recent Register Invoices ({recentReceipts.length})
                </h3>
              </div>
              <button
                onClick={() => setShowRecentReceiptsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {recentReceipts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No completed sales in this register session yet.
                </div>
              ) : (
                recentReceipts.map((rec) => (
                  <div
                    key={rec.invoiceNumber}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">
                          {rec.invoiceNumber}
                        </span>
                        <span className="font-bold text-white">{rec.customer.name}</span>
                        {rec.customer.isB2B && (
                          <span className="text-[9px] font-bold bg-purple-900 text-purple-300 px-1 rounded">
                            B2B
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {rec.items.length} items • <strong className="text-emerald-400 font-mono">{formatINR(rec.finalTotal)}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">
                        Tender: {rec.tender.mode}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setCompletedReceipt(rec);
                          setShowRecentReceiptsModal(false);
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="View & Re-print Thermal Bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRecentReceiptsModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. QUOTATIONS / PROFORMA ESTIMATES MODAL */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Quotations & Proforma Estimates ({quotations.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Convert saved quotations into live counter invoices with 1-click.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5">
              {quotations.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-400">No Saved Quotations</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    To generate a quotation, add items to cart and click "Quote" in the cart actions bar.
                  </p>
                </div>
              ) : (
                quotations.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-400">{q.quoteNumber}</span>
                        <span className="font-bold text-white">{q.customer.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-900/60 text-purple-300 rounded font-bold">
                          Valid 15 Days
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString()} • {q.items.length} items •{' '}
                        <strong className="text-emerald-400 font-mono">{formatINR(q.finalTotal)}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-md">
                        Items: {q.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleConvertQuotationToCart(q)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Convert to Invoice</span>
                      </button>
                      <button
                        onClick={() => {
                          const updated = quotations.filter((item) => item.id !== q.id);
                          setQuotations(updated);
                          try {
                            localStorage.setItem('je_pos_quotations', JSON.stringify(updated));
                          } catch {}
                          showNotification(`Quotation ${q.quoteNumber} removed.`, 'info');
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowQuotationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. MANAGER APPROVAL PIN MODAL (Role-based security) */}
      {showManagerPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Manager PIN Override</h3>
                <p className="text-[11px] text-slate-400">Supervisor authorization required</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                A manager PIN is required to authorize price overrides or discounts exceeding 25%.
              </p>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Enter Manager 4-Digit PIN (Default: 1234):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={managerPinInput}
                  onChange={(e) => {
                    setManagerPinInput(e.target.value);
                    setManagerPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono text-lg font-bold text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {managerPinError && (
                <p className="text-xs text-rose-400 font-semibold">{managerPinError}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowManagerPinModal(false);
                  setManagerPinPendingAction(null);
                  setManagerPinInput('');
                  setManagerPinError(null);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (managerPinInput === '1234' || currentUser.role === 'super_admin' || currentUser.role === 'store_manager') {
                    setShowManagerPinModal(false);
                    if (managerPinPendingAction) {
                      managerPinPendingAction();
                    }
                    showNotification('Manager authorization granted.', 'success');
                    setManagerPinInput('');
                    setManagerPinPendingAction(null);
                  } else {
                    setManagerPinError('Invalid Manager PIN. Contact store supervisor.');
                    playBeepSound('error');
                  }
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

