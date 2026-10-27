import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Product,
  ProductCategory,
  SellerListing,
  ColorVariantOption,
  SizeVariantOption,
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { calculateVolumetricMetrics } from '../../utils/volumetricWeight';
import { VolumetricWeightCalculatorModal } from '../common/VolumetricWeightCalculatorModal';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Tag,
  Search,
  Check,
  X,
  Store,
  Layers,
  ShieldCheck,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Info,
  Box,
  Scale,
  Palette,
  Maximize2,
  Cpu,
} from 'lucide-react';

interface AIProductAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess?: () => void;
}

export const AIProductAssistantModal: React.FC<AIProductAssistantModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const {
    products,
    outlets,
    activeOutlet,
    currentRole,
    currentUser,
    addProduct,
    updateProduct,
    submitProductForApproval,
    mapSellerToExistingProduct,
    findMatchingCatalogueProducts,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // 1. Raw Inputs Form State
  const [rawTitle, setRawTitle] = useState('');
  const [rawBrand, setRawBrand] = useState('');
  const [rawCategory, setRawCategory] = useState<ProductCategory>('smartphones');
  const [rawMrp, setRawMrp] = useState<number | ''>('');
  const [rawPurchaseCost, setRawPurchaseCost] = useState<number | ''>('');
  const [rawNotes, setRawNotes] = useState('');

  // Image Upload State
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. AI Auto-Segregated Fields State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Segregated Outputs
  const [segregatedTitle, setSegregatedTitle] = useState('');
  const [segregatedBrand, setSegregatedBrand] = useState('');
  const [segregatedCategory, setSegregatedCategory] = useState<ProductCategory>('smartphones');
  const [segregatedDescription, setSegregatedDescription] = useState('');
  const [segregatedSeoTitle, setSegregatedSeoTitle] = useState('');
  const [segregatedSeoDescription, setSegregatedSeoDescription] = useState('');
  const [recommendedSalePrice, setRecommendedSalePrice] = useState<number>(0);
  const [grossMarginPercent, setGrossMarginPercent] = useState<number>(25);
  const [hsnCode, setHsnCode] = useState('8517');
  const [gstRate, setGstRate] = useState(18);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [pricingRationale, setPricingRationale] = useState('');
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // Physical Dimensions & Volumetric Weight
  const [lengthCm, setLengthCm] = useState<number>(18);
  const [widthCm, setWidthCm] = useState<number>(14);
  const [heightCm, setHeightCm] = useState<number>(8);
  const [deadWeightKg, setDeadWeightKg] = useState<number>(0.35);
  const [showVolumetricModal, setShowVolumetricModal] = useState<boolean>(false);

  // Model & Variations
  const [modelNumber, setModelNumber] = useState<string>('');
  const [moduleName, setModuleName] = useState<string>('');
  const [colorVariants, setColorVariants] = useState<ColorVariantOption[]>([
    { name: 'Midnight Black', hex: '#111827', priceDiff: 0 },
    { name: 'Glacier Blue', hex: '#38bdf8', priceDiff: 0 },
  ]);
  const [sizeVariants, setSizeVariants] = useState<SizeVariantOption[]>([
    { size: 'Standard Edition', priceDiff: 0, stock: 10 },
  ]);
  const [boxContents, setBoxContents] = useState<string[]>([
    'Main Unit',
    'Power Adapter & Cable',
    'User Manual & Warranty Card',
  ]);

  // Seller Inventory for this upload
  const [stockOnHand, setStockOnHand] = useState<number>(10);
  const [selectedOutletId, setSelectedOutletId] = useState(activeOutlet?.id || outlets[0]?.id || '');

  // 3. Duplicate / Multi-Seller Matching State
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Product | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Initialize or populate from productToEdit
  useEffect(() => {
    if (productToEdit) {
      setRawTitle(productToEdit.name);
      setRawBrand(productToEdit.brand);
      setRawCategory(productToEdit.categoryId);
      setRawMrp(productToEdit.mrp);
      setRawPurchaseCost(productToEdit.purchaseCost || '');
      setRawNotes(productToEdit.description);
      setImageUrl(productToEdit.images[0] || '');
      setImagePreview(productToEdit.images[0] || '');

      setSegregatedTitle(productToEdit.name);
      setSegregatedBrand(productToEdit.brand);
      setSegregatedCategory(productToEdit.categoryId);
      setSegregatedDescription(productToEdit.description);
      setSegregatedSeoTitle(productToEdit.seoTitle || `Buy ${productToEdit.name} Lucknow | Best Deal`);
      setSegregatedSeoDescription(productToEdit.seoDescription || `Order ${productToEdit.name} at Javed Electronics Lucknow.`);
      setRecommendedSalePrice(productToEdit.dealPrice || productToEdit.regularPrice);
      setHsnCode(productToEdit.hsnCode || '8517');
      setGstRate(productToEdit.gstRate || 18);
      setWarrantyMonths(productToEdit.warrantyMonths || 12);
      setStockOnHand(productToEdit.stock.onHand);

      setLengthCm(productToEdit.lengthCm || 18);
      setWidthCm(productToEdit.widthCm || 14);
      setHeightCm(productToEdit.heightCm || 8);
      setDeadWeightKg(productToEdit.deadWeightKg || productToEdit.weightKg || 0.35);
      setModelNumber(productToEdit.modelNumber || '');
      setModuleName(productToEdit.moduleName || '');
      if (productToEdit.colorVariants && productToEdit.colorVariants.length > 0) {
        setColorVariants(productToEdit.colorVariants);
      }
      if (productToEdit.sizeVariants && productToEdit.sizeVariants.length > 0) {
        setSizeVariants(productToEdit.sizeVariants);
      }
      if (productToEdit.boxContents && productToEdit.boxContents.length > 0) {
        setBoxContents(productToEdit.boxContents);
      }

      const specs = Object.entries(productToEdit.specifications || {}).map(([key, value]) => ({ key, value }));
      setSpecifications(specs);
      setAiGenerated(true);
    } else {
      // Reset
      setRawTitle('');
      setRawBrand('');
      setRawCategory('smartphones');
      setRawMrp('');
      setRawPurchaseCost('');
      setRawNotes('');
      setImageUrl('');
      setImageBase64('');
      setImagePreview('');
      setLengthCm(18);
      setWidthCm(14);
      setHeightCm(8);
      setDeadWeightKg(0.35);
      setModelNumber('');
      setModuleName('');
      setColorVariants([
        { name: 'Midnight Black', hex: '#111827', priceDiff: 0 },
        { name: 'Glacier Blue', hex: '#38bdf8', priceDiff: 0 },
      ]);
      setSizeVariants([
        { size: 'Standard Edition', priceDiff: 0, stock: 10 },
      ]);
      setBoxContents([
        'Main Unit',
        'Power Adapter & Cable',
        'User Manual & Warranty Card',
      ]);
      setAiGenerated(false);
      setMatchingProducts([]);
      setSelectedMatch(null);
    }
  }, [productToEdit, isOpen]);

  // Real-time catalogue duplicate check
  useEffect(() => {
    if (productToEdit) return; // Do not alert when editing an existing product
    const query = {
      title: segregatedTitle || rawTitle,
      brand: segregatedBrand || rawBrand,
      category: segregatedCategory || rawCategory,
    };
    if (query.title.length >= 4) {
      const matches = findMatchingCatalogueProducts(query);
      setMatchingProducts(matches);
      if (matches.length > 0 && !selectedMatch) {
        setSelectedMatch(matches[0]);
      }
    } else {
      setMatchingProducts([]);
      setSelectedMatch(null);
    }
  }, [rawTitle, segregatedTitle, rawBrand, segregatedBrand, rawCategory, segregatedCategory, findMatchingCatalogueProducts, productToEdit]);

  // Handle local image file upload (convert to Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Server-Side AI Auto-Segregation
  const handleAutoSegregate = async () => {
    if (!rawTitle.trim() && !rawNotes.trim() && !imagePreview) {
      setAnalysisError('Please enter a product title, supplier note, or upload a product image for the AI to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/product-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTitle,
          brand: rawBrand,
          category: rawCategory,
          mrp: rawMrp ? Number(rawMrp) : undefined,
          purchaseCost: rawPurchaseCost ? Number(rawPurchaseCost) : undefined,
          rawNotes,
          imageBase64: imageBase64 || (imagePreview.startsWith('data:') ? imagePreview : undefined),
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        setSegregatedTitle(d.name || rawTitle);
        setSegregatedBrand(d.brand || rawBrand || 'Javed Select');
        setSegregatedCategory(d.categoryId || rawCategory || 'smartphones');
        setSegregatedDescription(d.description || '');
        setSegregatedSeoTitle(d.seoTitle || `Buy ${d.name || rawTitle} Lucknow`);
        setSegregatedSeoDescription(d.seoDescription || '');
        setRecommendedSalePrice(d.recommendedSalePrice || (rawMrp ? Math.round(Number(rawMrp) * 0.8) : 999));
        setGrossMarginPercent(d.grossMarginPercent || 25);
        setHsnCode(d.hsnCode || '8517');
        setGstRate(d.gstRate || 18);
        setWarrantyMonths(d.warrantyMonths || 12);
        setPricingRationale(d.pricingRationale || '');

        if (d.specifications && typeof d.specifications === 'object') {
          const specs = Object.entries(d.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecifications(specs);
        }

        // Auto fallback sample image if none provided
        if (!imagePreview) {
          const sampleImg = d.categoryId === 'audio'
            ? 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
            : d.categoryId === 'chargers_cables'
            ? 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
            : d.categoryId === 'smartwatches'
            ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
            : 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80';
          setImagePreview(sampleImg);
          setImageUrl(sampleImg);
        }

        setAiGenerated(true);
      } else {
        setAnalysisError(result.error || 'Failed to auto-segregate product information. Please check inputs.');
      }
    } catch (err: any) {
      console.error('AI Product Assistant error:', err);
      setAnalysisError('Network error connecting to AI assistant. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add specification row
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;
    setSpecifications([...specifications, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
    setNewSpecKey('');
    setNewSpecValue('');
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Handle Mapping to Existing Master Catalogue (Preventing Duplicates)
  const handleMapToCatalogue = (targetProduct: Product) => {
    const outlet = outlets.find((o) => o.id === selectedOutletId) || activeOutlet || outlets[0];
    const cost = rawPurchaseCost ? Number(rawPurchaseCost) : (targetProduct.purchaseCost || Math.round(targetProduct.regularPrice * 0.78));
    const price = recommendedSalePrice || targetProduct.dealPrice || targetProduct.regularPrice;

    const res = mapSellerToExistingProduct(targetProduct.id, {
      sellerId: outlet.id,
      sellerName: outlet.name,
      outletId: outlet.id,
      outletName: outlet.name,
      sellingPrice: price,
      mrp: targetProduct.mrp,
      purchaseCost: cost,
      stock: Number(stockOnHand),
      isAvailable: true,
      deliveryPromiseHours: 4,
      isFeaturedSeller: price <= (targetProduct.dealPrice || targetProduct.regularPrice),
    });

    if (res.success) {
      alert(res.message);
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  // Handle Submit for Admin Approval or Direct Admin Publish
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = segregatedTitle || rawTitle;
    const finalBrand = segregatedBrand || rawBrand || 'Javed Select';
    const finalCategory = segregatedCategory || rawCategory;
    const finalMrp = rawMrp ? Number(rawMrp) : (recommendedSalePrice ? Math.round(recommendedSalePrice * 1.3) : 2999);
    const finalPrice = recommendedSalePrice || (rawMrp ? Math.round(Number(rawMrp) * 0.8) : 2399);
    const finalCost = rawPurchaseCost ? Number(rawPurchaseCost) : Math.round(finalPrice * 0.75);

    if (!finalTitle.trim()) {
      setAnalysisError('Product title is required.');
      return;
    }

    const specsObj: Record<string, string> = {};
    specifications.forEach((s) => {
      specsObj[s.key] = s.value;
    });

    const outlet = outlets.find((o) => o.id === selectedOutletId) || activeOutlet || outlets[0];

    const initialSellerListing: SellerListing = {
      id: `sl-${Date.now()}`,
      sellerId: outlet.id,
      sellerName: outlet.name,
      outletId: outlet.id,
      outletName: outlet.name,
      sellingPrice: finalPrice,
      mrp: finalMrp,
      purchaseCost: finalCost,
      stock: Number(stockOnHand),
      isAvailable: true,
      deliveryPromiseHours: 4,
      isFeaturedSeller: true,
      lastUpdated: new Date().toISOString(),
    };

    const volMetrics = calculateVolumetricMetrics({
      lengthCm,
      widthCm,
      heightCm,
      deadWeightKg,
    });
    const dimString = `${lengthCm} × ${widthCm} × ${heightCm} cm`;

    if (productToEdit) {
      // Edit existing product
      updateProduct({
        ...productToEdit,
        name: finalTitle,
        brand: finalBrand,
        categoryId: finalCategory,
        description: segregatedDescription || productToEdit.description,
        seoTitle: segregatedSeoTitle,
        seoDescription: segregatedSeoDescription,
        mrp: finalMrp,
        regularPrice: finalPrice,
        dealPrice: finalPrice,
        purchaseCost: finalCost,
        hsnCode,
        gstRate,
        warrantyMonths,
        images: imagePreview ? [imagePreview, ...(productToEdit.images.slice(1))] : productToEdit.images,
        specifications: specsObj,
        stock: {
          ...productToEdit.stock,
          onHand: Number(stockOnHand),
        },
        lengthCm,
        widthCm,
        heightCm,
        deadWeightKg,
        volumetricWeightKg: volMetrics.volumetricWeightKg,
        billableWeightKg: volMetrics.billableWeightKg,
        weightKg: deadWeightKg,
        dimensions: dimString,
        modelNumber: modelNumber.trim(),
        moduleName: moduleName.trim(),
        colorVariants,
        sizeVariants,
        boxContents,
      });
      alert('Product updated successfully with dimensions and variants.');
      if (onSuccess) onSuccess();
      onClose();
      return;
    }

    // New product flow
    const productPayload: Omit<Product, 'id'> = {
      sku: `JE-${finalBrand.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      barcode: `890${Date.now().toString().slice(-10)}`,
      name: finalTitle,
      brand: finalBrand,
      categoryId: finalCategory,
      images: [
        imagePreview || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
      ],
      description: segregatedDescription || `${finalTitle} available at Javed Electronics Lucknow with official warranty.`,
      specifications: specsObj,
      mrp: finalMrp,
      regularPrice: finalPrice,
      dealPrice: finalPrice,
      purchaseCost: finalCost,
      gstRate,
      hsnCode,
      isTaxInclusive: true,
      stock: {
        onHand: Number(stockOnHand),
        reserved: 0,
        minStockLevel: 3,
      },
      warrantyMonths,
      returnEligibleDays: 7,
      lengthCm,
      widthCm,
      heightCm,
      deadWeightKg,
      volumetricWeightKg: volMetrics.volumetricWeightKg,
      billableWeightKg: volMetrics.billableWeightKg,
      weightKg: deadWeightKg,
      dimensions: dimString,
      modelNumber: modelNumber.trim(),
      moduleName: moduleName.trim(),
      colorVariants,
      sizeVariants,
      boxContents,
      status: isSuperAdmin ? 'published' : 'draft',
      rating: 4.8,
      reviewsCount: 0,
      seoTitle: segregatedSeoTitle,
      seoDescription: segregatedSeoDescription,
      approvalStatus: isSuperAdmin ? 'approved' : 'pending',
      sellerListings: [initialSellerListing],
    };

    if (isSuperAdmin) {
      addProduct(productPayload);
      alert('Product published directly to the catalogue by Super Admin!');
    } else {
      const res = submitProductForApproval(productPayload, {
        userId: currentUser.id || 'usr_seller',
        userName: currentUser.name || 'Store Manager',
        role: currentRole,
        storeName: outlet.name,
      });
      alert(res.message);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden">
        {/* Header Bar */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {productToEdit ? 'AI Product Assistant: Modify & Edit' : 'AI Assistant for Product Upload & Catalogue Segregation'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Upload image, MRP & purchase cost. AI auto-segregates description, SEO title, metadata & optimal sale price.
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

        {/* Existing Master Catalogue Match Alert */}
        {matchingProducts.length > 0 && !productToEdit && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 block">
                  Existing Master Catalogue Match Found! ({matchingProducts.length} matching product)
                </span>
                <p className="text-amber-800 mt-0.5">
                  <strong>"{matchingProducts[0].name}"</strong> is already listed in the marketplace catalogue with {matchingProducts[0].sellerListings?.length || 1} active store seller(s).
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  💡 <strong>Suggestion:</strong> Avoid duplicate catalogue listings! List your store stock directly on this existing catalogue instead.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleMapToCatalogue(matchingProducts[0])}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>List on Same Catalogue</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysisError && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between px-5">
            <span>{analysisError}</span>
            <button onClick={() => setAnalysisError(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitProduct} className="p-5 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {/* STEP 1: UPLOAD & RAW PRODUCT INFORMATION INPUT */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>1. Upload Product Image & Raw Supplier Details</span>
              </span>
              <span className="text-[11px] text-slate-500">Provide rough details — AI will format everything</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Product Image / Packaging Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center min-h-[140px]"
                >
                  {imagePreview ? (
                    <div className="relative group w-full flex flex-col items-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-contain rounded-lg shadow-2xs"
                      />
                      <span className="text-[10px] text-blue-600 font-semibold mt-1 group-hover:underline">
                        Click to change photo
                      </span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-slate-700 font-semibold text-xs">Upload Image</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, or Packaging Photo</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="pt-1">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900"
                  />
                </div>
              </div>

              {/* Raw Financials & Category */}
              <div className="space-y-3 md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      MRP (Maximum Retail Price in ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={rawMrp}
                        onChange={(e) => setRawMrp(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 3990"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Purchase Cost (Wholesale in ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={rawPurchaseCost}
                        onChange={(e) => setRawPurchaseCost(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 890"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brand Name (Rough)</label>
                    <input
                      type="text"
                      value={rawBrand}
                      onChange={(e) => setRawBrand(e.target.value)}
                      placeholder="e.g. boAt, Xiaomi, Realme, Samsung"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category (or Auto-detect)</label>
                    <select
                      value={rawCategory}
                      onChange={(e) => setRawCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      <option value="smartphones">Smartphones</option>
                      <option value="audio">Audio & Headphones</option>
                      <option value="chargers_cables">Chargers & Cables</option>
                      <option value="smartwatches">Smartwatches</option>
                      <option value="tvs_accessories">Smart TVs</option>
                      <option value="computer_accessories">Computer Accessories</option>
                      <option value="home_electronics">Home Electronics</option>
                      <option value="small_appliances">Small Appliances</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rough Product Title or Supplier Invoice Line
                  </label>
                  <input
                    type="text"
                    value={rawTitle}
                    onChange={(e) => setRawTitle(e.target.value)}
                    placeholder="e.g. Boat Rockerz 450 blutooth on-ear headphone 40mm 15h battery"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* AI Action Trigger Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Click below to auto-segregate details, generate SEO copy, and calculate profit margins.
              </span>
              <button
                type="button"
                onClick={handleAutoSegregate}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI Segregating & Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Auto-Segregate with AI Assistant</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STEP 2: AI SEGREGATED OUTPUTS & OPTIMIZATIONS */}
          {aiGenerated && (
            <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/80 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. AI Auto-Segregated Product Information & SEO</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Segregated & Formatted
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Review or fine-tune before submitting</span>
              </div>

              {/* Segregated Title, Brand, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Commercial Product Title (Clean)</label>
                  <input
                    type="text"
                    value={segregatedTitle}
                    onChange={(e) => setSegregatedTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verified Brand</label>
                  <input
                    type="text"
                    value={segregatedBrand}
                    onChange={(e) => setSegregatedBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-900 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Pricing & Gross Margin Recommendation Card */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>AI Recommended Sale Price & Profit Margins:</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Margin: ~{grossMarginPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">MRP</label>
                    <div className="font-mono text-slate-700 line-through font-bold text-sm">
                      {rawMrp ? formatINR(Number(rawMrp)) : '—'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Wholesale Cost</label>
                    <div className="font-mono text-slate-700 font-bold text-sm">
                      {rawPurchaseCost ? formatINR(Number(rawPurchaseCost)) : '—'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-800 font-bold mb-0.5">Recommended Sale Price (₹)</label>
                    <input
                      type="number"
                      value={recommendedSalePrice}
                      onChange={(e) => setRecommendedSalePrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-400 rounded-lg font-mono font-extrabold text-slate-900 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">Customer Savings</label>
                    <div className="font-mono text-emerald-700 font-bold text-sm">
                      {rawMrp && recommendedSalePrice
                        ? `${formatINR(Number(rawMrp) - recommendedSalePrice)} (${Math.round(((Number(rawMrp) - recommendedSalePrice) / Number(rawMrp)) * 100)}% Off)`
                        : '—'}
                    </div>
                  </div>
                </div>

                {pricingRationale && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    💡 <strong>AI Pricing Rationale:</strong> {pricingRationale}
                  </p>
                )}
              </div>

              {/* Rich Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  AI-Generated Product Description & Highlights
                </label>
                <textarea
                  rows={4}
                  value={segregatedDescription}
                  onChange={(e) => setSegregatedDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-900 text-xs leading-relaxed"
                  placeholder="Comprehensive description generated by AI..."
                />
              </div>

              {/* SEO Meta Title & Meta Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">SEO Meta Title</label>
                    <span className="text-[10px] text-slate-400">{segregatedSeoTitle.length}/65 chars</span>
                  </div>
                  <input
                    type="text"
                    value={segregatedSeoTitle}
                    onChange={(e) => setSegregatedSeoTitle(e.target.value)}
                    maxLength={70}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">SEO Meta Description</label>
                    <span className="text-[10px] text-slate-400">{segregatedSeoDescription.length}/155 chars</span>
                  </div>
                  <input
                    type="text"
                    value={segregatedSeoDescription}
                    onChange={(e) => setSegregatedSeoDescription(e.target.value)}
                    maxLength={160}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Tax & Compliance Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warranty (Months)</label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Technical Specifications ({specifications.length} detected)
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 w-1/3 truncate">{spec.key}:</span>
                      <span className="text-slate-900 flex-1 truncate">{spec.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    placeholder="Spec Name (e.g. Battery)"
                    className="w-1/3 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Spec Value (e.g. 5000mAh 67W)"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Physical Dimensions & Volumetric Weight (Shiprocket Divisor 5000) */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      Physical Dimensions &amp; Volumetric Weight (Courier Standard)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVolumetricModal(true)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs"
                  >
                    📐 Volumetric Calculator
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Dead Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={deadWeightKg}
                      onChange={(e) => setDeadWeightKg(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Volumetric preview calculation */}
                {(() => {
                  const vm = calculateVolumetricMetrics({ lengthCm, widthCm, heightCm, deadWeightKg });
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-blue-200 text-[11px]">
                      <span>Volumetric Weight: <strong className="text-blue-700 font-mono">{vm.volumetricWeightKg} kg</strong></span>
                      <span>Chargeable Weight: <strong className="text-emerald-700 font-mono font-bold">{vm.billableWeightKg} kg</strong></span>
                      <span className="text-slate-500 font-medium">Package: {vm.packageCategory}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Hardware Model Number & Module Series */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Product Model / Part Number
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. MOD-JE-2026-X1"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Module / Hardware Series Name
                  </label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. High-Fidelity Audio Series"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STORE INVENTORY & SUBMISSION */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              3. Store Allocation & Approval Submission
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Outlet / Branch</label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Opening Stock (Units)</label>
                <input
                  type="number"
                  value={stockOnHand}
                  onChange={(e) => setStockOnHand(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                {isSuperAdmin ? (
                  <span>
                    As <strong>Super Admin</strong>, submitting will immediately publish this product to the marketplace catalogue and synchronize with local stores.
                  </span>
                ) : (
                  <span>
                    Submitting will route this product to the <strong>Admin Product Approval Queue</strong>. Once verified, it will be published to the storefront catalogue.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {matchingProducts.length > 0 && !productToEdit && (
                <button
                  type="button"
                  onClick={() => handleMapToCatalogue(matchingProducts[0])}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4" />
                  <span>Map to Existing Catalogue</span>
                </button>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{productToEdit ? 'Save Changes' : isSuperAdmin ? 'Publish to Catalogue' : 'Send for Admin Approval'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Volumetric Weight Calculator Modal */}
      {showVolumetricModal && (
        <VolumetricWeightCalculatorModal
          isOpen={showVolumetricModal}
          onClose={() => setShowVolumetricModal(false)}
          initialValues={{
            lengthCm,
            widthCm,
            heightCm,
            deadWeightKg,
            productName: segregatedTitle || rawTitle || 'New Product',
          }}
          onApply={(metrics) => {
            setLengthCm(metrics.lengthCm);
            setWidthCm(metrics.widthCm);
            setHeightCm(metrics.heightCm);
            setDeadWeightKg(metrics.deadWeightKg);
            setShowVolumetricModal(false);
          }}
        />
      )}
    </div>
  );
};
