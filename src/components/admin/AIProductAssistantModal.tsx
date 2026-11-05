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
  Check,
  X,
  Store,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Box,
  Scale,
  Maximize2,
  Minimize2,
  Sliders,
  Award,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface AIProductAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  initialCategory?: ProductCategory;
  onSuccess?: () => void;
}

export const AIProductAssistantModal: React.FC<AIProductAssistantModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  initialCategory,
  onSuccess,
}) => {
  const {
    products,
    categories,
    addCategory,
    outlets,
    activeOutlet,
    currentRole,
    currentUser,
    addProduct,
    updateProduct,
    submitProductForApproval,
    mapSellerToExistingProduct,
    findMatchingCatalogueProducts,
    getFormatForCategory,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // 1. Core Product Fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>(initialCategory || 'tvs_accessories');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const [subCategoryName, setSubCategoryName] = useState<string>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');

  // 2. Short Description & About Product
  const [shortDescription, setShortDescription] = useState('');
  const [aboutProduct, setAboutProduct] = useState('');

  // 3. Tax & Compliance (GST & HSN)
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState<string>('8517');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);

  // 4. Physical Dimensions & Weight
  const [lengthCm, setLengthCm] = useState<number>(18);
  const [widthCm, setWidthCm] = useState<number>(14);
  const [heightCm, setHeightCm] = useState<number>(8);
  const [deadWeightKg, setDeadWeightKg] = useState<number>(0.35);
  const [showVolumetricModal, setShowVolumetricModal] = useState<boolean>(false);

  // 5. Multi-Image Gallery (2 to 4 Images)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 6. Model, Series & Variants
  const [modelNumber, setModelNumber] = useState<string>('');
  const [moduleName, setModuleName] = useState<string>('');
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // 7. Store Stock Allocation
  const [stockOnHand, setStockOnHand] = useState<number>(10);
  const [selectedOutletId, setSelectedOutletId] = useState(activeOutlet?.id || outlets[0]?.id || '');

  // 8. AI Auto-Segregation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pricingRationale, setPricingRationale] = useState('');

  // 9. Quick Add Category State
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  // Duplicate / Multi-Seller Matching State
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);

  // Category-Based Format Field Values
  const [formatFieldValues, setFormatFieldValues] = useState<Record<string, string>>({});

  const activeCategoryFormat = useMemo(() => {
    return getFormatForCategory(category, subCategoryId);
  }, [category, subCategoryId, getFormatForCategory]);

  // Initialize form state
  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.name);
      setBrand(productToEdit.brand);
      setCategory(productToEdit.categoryId);
      setSubCategoryId(productToEdit.subCategoryId || '');
      setSubCategoryName(productToEdit.subCategoryName || '');
      setMrp(productToEdit.mrp);
      setSellingPrice(productToEdit.dealPrice || productToEdit.regularPrice);
      setPurchaseCost(productToEdit.purchaseCost || '');
      setShortDescription(productToEdit.shortDescription || productToEdit.description.slice(0, 140));
      setAboutProduct(productToEdit.description);
      setGstRate(productToEdit.gstRate ?? 18);
      setHsnCode(productToEdit.hsnCode || '8517');
      setWarrantyMonths(productToEdit.warrantyMonths || 12);
      setLengthCm(productToEdit.lengthCm || 18);
      setWidthCm(productToEdit.widthCm || 14);
      setHeightCm(productToEdit.heightCm || 8);
      setDeadWeightKg(productToEdit.deadWeightKg || productToEdit.weightKg || 0.35);
      setModelNumber(productToEdit.modelNumber || productToEdit.partNumber || '');
      setModuleName(productToEdit.moduleName || '');
      setStockOnHand(productToEdit.stock.onHand);
      setImages(productToEdit.images && productToEdit.images.length > 0 ? productToEdit.images : []);

      const specs = Object.entries(productToEdit.specifications || {}).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setSpecifications(specs);

      const fmt = getFormatForCategory(productToEdit.categoryId, productToEdit.subCategoryId);
      const initialFmtVals: Record<string, string> = { ...(productToEdit.categoryFormatValues || {}) };
      fmt.fields.forEach((f) => {
        if (!initialFmtVals[f.key]) {
          if (f.key === 'brand') initialFmtVals[f.key] = productToEdit.brand || '';
          else if (f.key === 'product_name') initialFmtVals[f.key] = productToEdit.name || '';
          else if (f.key === 'module') initialFmtVals[f.key] = productToEdit.moduleName || '';
          else if (f.key === 'part_number') initialFmtVals[f.key] = productToEdit.partNumber || productToEdit.modelNumber || '';
          else if (f.key === 'warranty_info') initialFmtVals[f.key] = productToEdit.warrantyInfo || `${productToEdit.warrantyMonths || 12} Months Official Warranty`;
          else if (f.key === 'manufacturer_name') initialFmtVals[f.key] = productToEdit.manufacturerName || '';
          else if (f.key === 'packer_name') initialFmtVals[f.key] = productToEdit.packerName || '';
          else if (productToEdit.specifications?.[f.label]) initialFmtVals[f.key] = productToEdit.specifications[f.label];
        }
      });
      setFormatFieldValues(initialFmtVals);
    } else {
      // Defaults for new product
      const defaultCat = initialCategory || 'tvs_accessories';
      const catObj = categories.find((c) => c.id === defaultCat);
      const defaultSub = catObj?.subCategories?.[0];
      const defaultSubId = defaultSub?.id || '';
      const defaultSubName = defaultSub?.name || '';

      const fmt = getFormatForCategory(defaultCat, defaultSubId);
      setTitle('');
      setBrand('');
      setCategory(defaultCat);
      setSubCategoryId(defaultSubId);
      setSubCategoryName(defaultSubName);
      setMrp('');
      setSellingPrice('');
      setPurchaseCost('');
      setShortDescription('');
      setAboutProduct('');
      setGstRate(fmt.defaultGstRate || 18);
      setHsnCode(fmt.defaultHsnCode || '8528');
      setWarrantyMonths(12);
      setLengthCm(18);
      setWidthCm(14);
      setHeightCm(8);
      setDeadWeightKg(0.35);
      setModelNumber('');
      setModuleName('');
      setStockOnHand(10);
      setImages([]);
      setSpecifications([]);
      setMatchingProducts([]);
      setPricingRationale('');
      const initialFmtVals: Record<string, string> = {};
      fmt.fields.forEach((f) => {
        initialFmtVals[f.key] = f.type === 'select' && f.options?.length ? f.options[0] : '';
      });
      setFormatFieldValues(initialFmtVals);
    }
  }, [productToEdit, isOpen, initialCategory]);

  const handleCategoryChange = (newCat: ProductCategory, newSubCatId?: string) => {
    setCategory(newCat);
    const catObj = categories.find((c) => c.id === newCat);
    const targetSubId = newSubCatId !== undefined ? newSubCatId : (catObj?.subCategories?.[0]?.id || '');
    const subObj = catObj?.subCategories?.find((sc) => sc.id === targetSubId);
    setSubCategoryId(targetSubId);
    setSubCategoryName(subObj?.name || '');

    const fmt = getFormatForCategory(newCat, targetSubId);
    setGstRate(fmt.defaultGstRate || 18);
    setHsnCode(fmt.defaultHsnCode || '8517');
    const nextVals: Record<string, string> = {};
    fmt.fields.forEach((f) => {
      if (f.key === 'brand' && brand) nextVals[f.key] = brand;
      else if (f.key === 'product_name' && title) nextVals[f.key] = title;
      else if (f.key === 'module' && moduleName) nextVals[f.key] = moduleName;
      else if (f.key === 'part_number' && modelNumber) nextVals[f.key] = modelNumber;
      else nextVals[f.key] = f.type === 'select' && f.options?.length ? f.options[0] : '';
    });
    setFormatFieldValues(nextVals);
  };

  const handleSubCategoryChange = (newSubId: string) => {
    setSubCategoryId(newSubId);
    const catObj = categories.find((c) => c.id === category);
    const subObj = catObj?.subCategories?.find((sc) => sc.id === newSubId);
    setSubCategoryName(subObj?.name || '');

    const fmt = getFormatForCategory(category, newSubId);
    setGstRate(fmt.defaultGstRate || 18);
    setHsnCode(fmt.defaultHsnCode || '8517');
  };

  const handleFormatFieldChange = (fieldKey: string, val: string) => {
    setFormatFieldValues((prev) => ({ ...prev, [fieldKey]: val }));
    if (fieldKey === 'brand') setBrand(val);
    if (fieldKey === 'product_name') setTitle(val);
    if (fieldKey === 'module') setModuleName(val);
    if (fieldKey === 'part_number') setModelNumber(val);
  };

  const handleFillCategoryFormatSample = () => {
    const sampleVals: Record<string, string> = {};
    activeCategoryFormat.fields.forEach((f) => {
      const sVal = f.sampleValue || (f.options && f.options[0]) || '';
      sampleVals[f.key] = sVal;
      if (f.key === 'brand' && sVal) setBrand(sVal);
      if (f.key === 'product_name' && sVal) setTitle(sVal);
      if (f.key === 'module' && sVal) setModuleName(sVal);
      if (f.key === 'part_number' && sVal) setModelNumber(sVal);
    });
    setFormatFieldValues(sampleVals);
    if (!mrp) setMrp(49990);
    if (!sellingPrice) setSellingPrice(36990);
    if (!purchaseCost) setPurchaseCost(31500);
    if (!shortDescription) {
      setShortDescription(
        `${sampleVals['product_name'] || activeCategoryFormat.categoryName} with ${sampleVals['display_size'] || ''} ${sampleVals['display_type'] || ''}, ${sampleVals['watt'] || ''}.`
      );
    }
    if (!aboutProduct) {
      setAboutProduct(
        `${sampleVals['product_name'] || ''} by ${sampleVals['brand'] || ''}. Module: ${sampleVals['module'] || ''}. Part No: ${sampleVals['part_number'] || ''}. Warranty: ${sampleVals['warranty_info'] || ''}. Manufacturer: ${sampleVals['manufacturer_name'] || ''}. Packer: ${sampleVals['packer_name'] || ''}. ${sampleVals['other_info'] || ''}`
      );
    }
  };

  // Real-time Master Catalogue Match Check
  useEffect(() => {
    if (productToEdit) return;
    if (title.trim().length >= 4) {
      const matches = findMatchingCatalogueProducts({
        title,
        brand,
        category,
      });
      setMatchingProducts(matches);
    } else {
      setMatchingProducts([]);
    }
  }, [title, brand, category, findMatchingCatalogueProducts, productToEdit]);

  // Quick Add Category
  const handleQuickAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const res = addCategory({
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim() || undefined,
      defaultGstRate: gstRate || 18,
    });
    if (res.success && res.category) {
      setCategory(res.category.id);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setShowNewCategoryForm(false);
      setCategoryFeedback(res.message);
      setTimeout(() => setCategoryFeedback(null), 3000);
    }
  };

  // Image Upload handler (supports 2 to 4 images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      alert('You can upload a maximum of 4 images for a product listing.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImages((prev) => (prev.length < 4 ? [...prev, base64] : prev));
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add Image via URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 4) {
      alert('Maximum 4 images allowed.');
      return;
    }
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  // AI Auto-Segregate & Optimize
  const handleAutoSegregate = async () => {
    if (!title.trim() && !aboutProduct.trim() && images.length === 0) {
      setAnalysisError('Please enter a product title, description, or add an image for AI analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/product-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTitle: title,
          brand,
          category,
          mrp: mrp ? Number(mrp) : undefined,
          purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
          rawNotes: aboutProduct,
          imageBase64: images[0]?.startsWith('data:') ? images[0] : undefined,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        if (d.name) setTitle(d.name);
        if (d.brand) setBrand(d.brand);
        if (d.categoryId) setCategory(d.categoryId);
        if (d.description) {
          setAboutProduct(d.description);
          if (!shortDescription) {
            setShortDescription(d.description.slice(0, 130).replace(/\n/g, ' '));
          }
        }
        if (d.recommendedSalePrice) setSellingPrice(d.recommendedSalePrice);
        if (d.hsnCode) setHsnCode(d.hsnCode);
        if (d.gstRate) setGstRate(d.gstRate);
        if (d.pricingRationale) setPricingRationale(d.pricingRationale);

        if (d.specifications && typeof d.specifications === 'object') {
          const specs = Object.entries(d.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecifications(specs);
        }

        // If no images yet, add recommended sample
        if (images.length === 0) {
          const sampleImg =
            d.categoryId === 'audio'
              ? 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
              : d.categoryId === 'chargers_cables'
              ? 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
              : d.categoryId === 'smartwatches'
              ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
              : 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80';
          setImages([sampleImg]);
        }
      } else {
        setAnalysisError(result.error || 'Failed to auto-segregate product. Please refine your inputs.');
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

  // Volumetric Courier Metrics
  const volMetrics = useMemo(() => {
    return calculateVolumetricMetrics({
      lengthCm,
      widthCm,
      heightCm,
      deadWeightKg,
    });
  }, [lengthCm, widthCm, heightCm, deadWeightKg]);

  // ============================================================================
  // PRODUCT LISTING HEALTH SCORE (1 to 100 Rank)
  // ============================================================================
  const listingHealth = useMemo(() => {
    let score = 0;
    const checks: Array<{ label: string; passed: boolean; points: number }> = [];

    // 1. Title Quality (max 20 pts)
    const titleLen = title.trim().length;
    if (titleLen >= 20) {
      score += 20;
      checks.push({ label: 'Title is descriptive with brand/model (≥20 chars)', passed: true, points: 20 });
    } else if (titleLen >= 8) {
      score += 10;
      checks.push({ label: 'Title provided (expand to 20+ chars for +10 pts)', passed: false, points: 10 });
    } else {
      checks.push({ label: 'Product title is missing or too short', passed: false, points: 0 });
    }

    // 2. Images (max 25 pts) - 2 to 4 images
    const imgCount = images.filter(Boolean).length;
    if (imgCount >= 4) {
      score += 25;
      checks.push({ label: '4 high-resolution images uploaded (Optimal 100%)', passed: true, points: 25 });
    } else if (imgCount === 3) {
      score += 22;
      checks.push({ label: '3 images uploaded (Add 1 more for +3 pts)', passed: true, points: 22 });
    } else if (imgCount === 2) {
      score += 18;
      checks.push({ label: '2 images uploaded (Meets minimum; add 2 more for +7 pts)', passed: true, points: 18 });
    } else if (imgCount === 1) {
      score += 8;
      checks.push({ label: 'Only 1 image uploaded (Upload at least 2 to 4 images for +10 pts)', passed: false, points: 8 });
    } else {
      checks.push({ label: 'No images uploaded (Upload 2 to 4 images for +25 pts)', passed: false, points: 0 });
    }

    // 3. Short Description & About Product (max 20 pts)
    const hasShort = shortDescription.trim().length >= 15;
    if (hasShort) {
      score += 10;
      checks.push({ label: 'Short description added for catalog preview', passed: true, points: 10 });
    } else {
      checks.push({ label: 'Short description missing (+10 pts)', passed: false, points: 0 });
    }

    const hasAbout = aboutProduct.trim().length >= 40;
    if (hasAbout) {
      score += 10;
      checks.push({ label: 'Detailed about product description populated', passed: true, points: 10 });
    } else {
      checks.push({ label: 'About product details too brief (+10 pts)', passed: false, points: 0 });
    }

    // 4. Pricing & Margins (max 15 pts)
    const hasMrp = Number(mrp) > 0;
    const hasPrice = Number(sellingPrice) > 0;
    if (hasMrp && hasPrice) {
      score += 10;
      checks.push({ label: 'MRP and selling price configured', passed: true, points: 10 });
    } else {
      checks.push({ label: 'MRP or selling price missing (+10 pts)', passed: false, points: 0 });
    }

    const hasCost = Number(purchaseCost) > 0;
    if (hasCost) {
      score += 5;
      checks.push({ label: 'Wholesale purchase cost defined for profit margins', passed: true, points: 5 });
    } else {
      checks.push({ label: 'Wholesale purchase cost missing (+5 pts)', passed: false, points: 0 });
    }

    // 5. GST & HSN Compliance (max 10 pts)
    const hasHsn = hsnCode.trim().length >= 4;
    if (hasHsn) {
      score += 5;
      checks.push({ label: `Valid HSN code (${hsnCode})`, passed: true, points: 5 });
    } else {
      checks.push({ label: 'HSN code missing (+5 pts)', passed: false, points: 0 });
    }

    if (gstRate >= 0) {
      score += 5;
      checks.push({ label: `GST tax rate assigned (${gstRate}%)`, passed: true, points: 5 });
    }

    // 6. Dimensions & Dead Weight (max 10 pts)
    const hasDim = lengthCm > 0 && widthCm > 0 && heightCm > 0;
    if (hasDim) {
      score += 5;
      checks.push({ label: `Dimensions set (${lengthCm}×${widthCm}×${heightCm} cm)`, passed: true, points: 5 });
    } else {
      checks.push({ label: 'Dimensions missing (+5 pts)', passed: false, points: 0 });
    }

    if (deadWeightKg > 0) {
      score += 5;
      checks.push({ label: `Dead weight set (${deadWeightKg} kg)`, passed: true, points: 5 });
    } else {
      checks.push({ label: 'Weight missing (+5 pts)', passed: false, points: 0 });
    }

    // Determine Rank Grade
    let rankGrade = 'C';
    let rankLabel = 'Needs Attention';
    let badgeColor = 'text-rose-700 bg-rose-50 border-rose-300';
    let barColor = 'bg-rose-500';

    if (score >= 85) {
      rankGrade = 'Rank A+';
      rankLabel = 'Excellent Listing Quality';
      badgeColor = 'text-emerald-800 bg-emerald-50 border-emerald-300';
      barColor = 'bg-emerald-500';
    } else if (score >= 70) {
      rankGrade = 'Rank A';
      rankLabel = 'Good Listing Quality';
      badgeColor = 'text-blue-800 bg-blue-50 border-blue-300';
      barColor = 'bg-blue-500';
    } else if (score >= 50) {
      rankGrade = 'Rank B';
      rankLabel = 'Fair Quality — Missing Key Info';
      badgeColor = 'text-amber-800 bg-amber-50 border-amber-300';
      barColor = 'bg-amber-500';
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      rankGrade,
      rankLabel,
      badgeColor,
      barColor,
      checks,
    };
  }, [
    title,
    images,
    shortDescription,
    aboutProduct,
    mrp,
    sellingPrice,
    purchaseCost,
    hsnCode,
    gstRate,
    lengthCm,
    widthCm,
    heightCm,
    deadWeightKg,
  ]);

  // Handle Mapping to Existing Master Catalogue
  const handleMapToCatalogue = (targetProduct: Product) => {
    const outlet = outlets.find((o) => o.id === selectedOutletId) || activeOutlet || outlets[0];
    const cost = purchaseCost
      ? Number(purchaseCost)
      : targetProduct.purchaseCost || Math.round(targetProduct.regularPrice * 0.78);
    const price = sellingPrice ? Number(sellingPrice) : targetProduct.dealPrice || targetProduct.regularPrice;

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

  // Submit Form
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setAnalysisError('Product title is required.');
      return;
    }

    const finalPrice = sellingPrice ? Number(sellingPrice) : mrp ? Math.round(Number(mrp) * 0.8) : 999;
    const finalMrp = mrp ? Number(mrp) : Math.round(finalPrice * 1.25);
    const finalCost = purchaseCost ? Number(purchaseCost) : Math.round(finalPrice * 0.75);

    // Build specs from both Category Format fields and custom specifications
    const specsObj: Record<string, string> = {};
    activeCategoryFormat.fields.forEach((f) => {
      const val = (formatFieldValues[f.key] || '').trim();
      if (val) {
        specsObj[f.label] = val;
      }
    });
    specifications.forEach((s) => {
      specsObj[s.key] = s.value;
    });

    const finalTitle = (title || formatFieldValues['product_name'] || '').trim();
    const finalBrand = (brand || formatFieldValues['brand'] || 'Javed Select').trim();
    const finalPartNo = (modelNumber || formatFieldValues['part_number'] || '').trim();
    const finalModule = (moduleName || formatFieldValues['module'] || '').trim();
    const finalWarrantyInfo = (formatFieldValues['warranty_info'] || `${warrantyMonths} Months Brand Warranty`).trim();
    const finalManufacturer = (formatFieldValues['manufacturer_name'] || '').trim();
    const finalPacker = (formatFieldValues['packer_name'] || '').trim();

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

    const finalImages =
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'];

    const dimString = `${lengthCm} × ${widthCm} × ${heightCm} cm`;

    if (productToEdit) {
      updateProduct({
        ...productToEdit,
        name: finalTitle,
        brand: finalBrand,
        categoryId: category,
        description: aboutProduct.trim() || productToEdit.description,
        shortDescription: shortDescription.trim() || undefined,
        mrp: finalMrp,
        regularPrice: finalPrice,
        dealPrice: finalPrice,
        purchaseCost: finalCost,
        hsnCode: hsnCode.trim() || '8517',
        gstRate,
        warrantyMonths,
        images: finalImages,
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
        modelNumber: finalPartNo,
        moduleName: finalModule,
        partNumber: finalPartNo,
        manufacturerName: finalManufacturer,
        packerName: finalPacker,
        warrantyInfo: finalWarrantyInfo,
        categoryFormatId: activeCategoryFormat.id,
        categoryFormatValues: { ...formatFieldValues },
      });
      alert('Product updated successfully.');
      if (onSuccess) onSuccess();
      onClose();
      return;
    }

    const productPayload: Omit<Product, 'id'> = {
      sku: finalPartNo || `JE-${finalBrand.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      barcode: `890${Date.now().toString().slice(-10)}`,
      name: finalTitle,
      brand: finalBrand,
      categoryId: category,
      subCategoryId: subCategoryId || undefined,
      subCategoryName: subCategoryName || undefined,
      images: finalImages,
      description: aboutProduct.trim() || `${finalTitle} available at Javed Electronics with official brand warranty.`,
      shortDescription: shortDescription.trim() || undefined,
      specifications: specsObj,
      mrp: finalMrp,
      regularPrice: finalPrice,
      dealPrice: finalPrice,
      purchaseCost: finalCost,
      gstRate,
      hsnCode: hsnCode.trim() || '8517',
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
      modelNumber: finalPartNo,
      moduleName: finalModule,
      partNumber: finalPartNo,
      manufacturerName: finalManufacturer,
      packerName: finalPacker,
      warrantyInfo: finalWarrantyInfo,
      categoryFormatId: activeCategoryFormat.id,
      categoryFormatValues: { ...formatFieldValues },
      status: isSuperAdmin ? 'published' : 'draft',
      rating: 4.8,
      reviewsCount: 0,
      seoTitle: `Buy ${finalTitle} | Javed Electronics`,
      seoDescription: shortDescription.trim() || `Buy genuine ${finalTitle} with fast express delivery.`,
      approvalStatus: isSuperAdmin ? 'approved' : 'pending',
      sellerListings: [initialSellerListing],
    };

    if (isSuperAdmin) {
      addProduct(productPayload);
      alert('Product published directly to the master catalogue.');
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
      className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150"
    >
      {/* FULL-SCREEN TOP NAVIGATION HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate">
              {productToEdit ? `Edit Product: ${productToEdit.name}` : 'Product Onboarding & Listing Studio'}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Complete product specifications, tax compliance, and upload 2 to 4 high-resolution images.
            </p>
          </div>
        </div>

        {/* Header Right: Listing Health Badge & Close */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[11px] text-slate-300 font-medium">Listing Health:</span>
            <span className="text-xs font-mono font-black text-white">{listingHealth.score}/100</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${listingHealth.badgeColor}`}>
              {listingHealth.rankGrade}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close Full Screen Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Duplicate / Existing Catalogue Warning Banner */}
      {matchingProducts.length > 0 && !productToEdit && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Matching Master Catalogue Found:</strong> &quot;{matchingProducts[0].name}&quot; already exists.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleMapToCatalogue(matchingProducts[0])}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            Map to Existing Catalogue
          </button>
        </div>
      )}

      {/* Error Message */}
      {analysisError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2 text-xs text-rose-800 flex items-center justify-between shrink-0">
          <span>{analysisError}</span>
          <button type="button" onClick={() => setAnalysisError(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN FULL-SCREEN SCROLLABLE CONTENT BODY */}
      <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* SECTION 1: PRODUCT IMAGES (ASK TO UPLOAD 2 TO 4 IMAGES) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Product Images (Upload 2 to 4 Images)</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    images.length >= 2 && images.length <= 4
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {images.length}/4 Uploaded
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload 2 to 4 high-resolution images of your product for best listing quality, zoom display, and customer trust.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photos</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* 4-Slot Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[0, 1, 2, 3].map((slotIndex) => {
              const img = images[slotIndex];
              const slotLabels = [
                '1. Cover / Front View',
                '2. Back / Side Angle',
                '3. Ports / Features',
                '4. Packaging / Box',
              ];

              return (
                <div
                  key={slotIndex}
                  className={`rounded-xl border p-2 flex flex-col justify-between min-h-[160px] transition-all relative ${
                    img
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>{slotLabels[slotIndex]}</span>
                    {slotIndex === 0 && img && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-extrabold uppercase">
                        Cover
                      </span>
                    )}
                  </div>

                  {img ? (
                    <div className="flex-1 flex flex-col items-center justify-center relative group py-1">
                      <img
                        src={img}
                        alt={`Product ${slotIndex + 1}`}
                        className="w-full h-24 object-contain rounded-lg bg-white border border-slate-200"
                      />
                      <div className="mt-2 flex items-center gap-1 w-full justify-between">
                        {slotIndex !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(slotIndex)}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold cursor-pointer"
                            title="Make this the main cover image"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(slotIndex)}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold cursor-pointer ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 py-3"
                    >
                      <Plus className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-600">Add Image</span>
                      <span className="text-[10px] text-slate-400">Click to upload</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Paste Image URL */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Or paste an image web URL (https://...)"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              disabled={!imageUrlInput.trim() || images.length >= 4}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add URL
            </button>
          </div>
        </section>

        {/* SECTION 2: BASIC PRODUCT INFORMATION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Basic Information</h2>
            </div>
            <button
              type="button"
              onClick={handleAutoSegregate}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Auto-Format with AI</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Title */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. boAt Rockerz 450 Bluetooth On-Ear Headphones with 40mm Drivers"
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Brand, Category, Subcategory, Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. boAt, Realme, Xiaomi, Sony"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm((p) => !p)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {showNewCategoryForm ? 'Close Custom' : '+ Write Custom'}
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__' || e.target.value === 'other') {
                      setShowNewCategoryForm(true);
                      handleCategoryChange('other');
                    } else {
                      handleCategoryChange(e.target.value as ProductCategory);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__add_new__">✍️ Other (Write Your Category Name)...</option>
                </select>

                {/* Inline Write-in Category Form for "Other" or custom input */}
                {(showNewCategoryForm || category === 'other') && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900">
                        ✍️ Write Your Custom Category Name:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-700"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Footwear, Handbags, Ethnic Sarees, Gym Gear..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0"
                      >
                        Apply &amp; Select
                      </button>
                    </div>
                    {categoryFeedback && (
                      <span className="text-[11px] font-bold text-emerald-700 block">
                        ✓ {categoryFeedback}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Subcategory</label>
                {(() => {
                  const activeCatObj = categories.find((c) => c.id === category);
                  const subs = activeCatObj?.subCategories || [];
                  if (subs.length === 0) {
                    return (
                      <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400">
                        General / None
                      </div>
                    );
                  }
                  return (
                    <select
                      value={subCategoryId}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">General (All Subcategories)</option>
                      {subs.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Model / Part Number</label>
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => {
                    setModelNumber(e.target.value);
                    setFormatFieldValues((prev) => ({ ...prev, part_number: e.target.value }));
                  }}
                  placeholder="e.g. UA55DUE77AKLXL"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2B: CATEGORY-BASED PRODUCT LISTING FORMAT FIELDS */}
        <section className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 rounded-2xl border-2 border-indigo-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2.5 border-b border-indigo-200/80 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-900">
                {activeCategoryFormat.categoryName}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleFillCategoryFormatSample}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs shrink-0"
            >
              Fill Sample
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {activeCategoryFormat.fields.map((field) => (
              <div
                key={field.id}
                className={field.type === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">
                    {field.label} {field.required && <span className="text-rose-600">*</span>}
                  </label>
                  {field.sampleValue && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[160px]" title={field.sampleValue}>
                      e.g. {field.sampleValue}
                    </span>
                  )}
                </div>

                {field.type === 'select' && field.options && field.options.length > 0 ? (
                  <select
                    value={formatFieldValues[field.key] || ''}
                    onChange={(e) => handleFormatFieldChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select {field.label} --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    value={formatFieldValues[field.key] || ''}
                    onChange={(e) => handleFormatFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={formatFieldValues[field.key] || ''}
                    onChange={(e) => handleFormatFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: SHORT DESCRIPTION & ABOUT PRODUCT */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Product Descriptions (Short &amp; About Product)</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Short Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  Short Description (Summary for Catalog &amp; Cards) *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {shortDescription.length} characters (1-2 sentences)
                </span>
              </div>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief highlight: e.g. Lightweight on-ear wireless headphones with deep bass, 15-hour playback, and fast charging support."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* About Product (Detailed) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  About Product (Detailed Overview, Features &amp; In-Box Contents) *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {aboutProduct.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={aboutProduct}
                onChange={(e) => setAboutProduct(e.target.value)}
                placeholder="Comprehensive details about driver size, battery life, connectivity, physical warranty, and box items..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: PRICING, MARGINS & TAX COMPLIANCE (GST & HSN) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Pricing, Wholesale Cost &amp; Tax Compliance (GST / HSN)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            {/* MRP */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">MRP (Maximum Retail Price in ₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value ? Number(e.target.value) : '')}
                  placeholder="3990"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Selling / Offer Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="1499"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl font-mono font-black text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Wholesale Cost */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Wholesale Cost (Wholesale in ₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="890"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* GST Rate, HSN Code, Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs">
            {/* GST Rate */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">GST Tax Rate *</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none"
              >
                <option value={0}>0% (Exempt / Nil)</option>
                <option value={5}>5% GST (Essential)</option>
                <option value={12}>12% GST (Electronics / Accessories)</option>
                <option value={18}>18% GST (Standard Electronics / Mobile)</option>
                <option value={28}>28% GST (Luxury Displays &amp; Audio)</option>
              </select>
            </div>

            {/* HSN Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">HSN / SAC Code *</label>
                <span className="text-[10px] text-slate-400">e.g. 8517, 8518</span>
              </div>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="8517"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            {/* Warranty Months */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Brand Warranty (Months) *</label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                placeholder="12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: PRODUCT DIMENSIONS & WEIGHT (COURIER SHIPPING) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Product Dimensions &amp; Dead Weight (Courier Shipping)</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowVolumetricModal(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              📐 Volumetric Calculator
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Length (cm) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lengthCm}
                onChange={(e) => setLengthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Width (cm) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={widthCm}
                onChange={(e) => setWidthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Height (cm) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dead Weight (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={deadWeightKg}
                onChange={(e) => setDeadWeightKg(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Courier Billable Weight Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-600">
              Formula: <code>(L × W × H) ÷ 5000</code> ={' '}
              <strong className="text-blue-700 font-mono">{volMetrics.volumetricWeightKg} kg</strong> (Volumetric)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Billable Courier Weight:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-xs">
                {volMetrics.billableWeightKg} kg
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 6: STORE ALLOCATION & OPENING STOCK */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Store Allocation &amp; Stock Count</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Assigned Branch / Hub</label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Opening Stock (Units) *</label>
              <input
                type="number"
                value={stockOnHand}
                onChange={(e) => setStockOnHand(Number(e.target.value))}
                min={0}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 7: PRODUCT LISTING HEALTH (1 TO 100 RANK) */}
        <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Award className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Product Listing Health Score</h2>
                <p className="text-xs text-slate-400">
                  Evaluates listing completeness, images, descriptions, pricing, and courier parameters.
                </p>
              </div>
            </div>

            {/* Score & Rank Display */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-white">{listingHealth.score}/100</div>
                <div className="text-[11px] text-slate-400">{listingHealth.rankLabel}</div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs border ${listingHealth.badgeColor}`}>
                {listingHealth.rankGrade}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${listingHealth.barColor}`}
                style={{ width: `${listingHealth.score}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (Incomplete)</span>
              <span>50 (Basic)</span>
              <span>85 (Recommended)</span>
              <span>100 (Optimal)</span>
            </div>
          </div>

          {/* Actionable Health Checklist */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-300 block mb-2">Listing Quality Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {listingHealth.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    check.passed
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />
                  )}
                  <span className="text-[11px] font-medium leading-tight flex-1">{check.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Space at bottom for fixed action bar */}
        <div className="h-20" />
      </form>

      {/* FULL-SCREEN FIXED BOTTOM ACTION BAR */}
      <footer className="h-18 px-4 sm:px-8 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Health:</span>
            <span className="text-sm font-mono font-black text-slate-900">{listingHealth.score}/100</span>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${listingHealth.badgeColor}`}>
              {listingHealth.rankGrade}
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden md:inline">• {images.length}/4 images</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          {matchingProducts.length > 0 && !productToEdit && (
            <button
              type="button"
              onClick={() => handleMapToCatalogue(matchingProducts[0])}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
            >
              Map to Existing Catalogue
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmitProduct}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <span>{productToEdit ? 'Save Changes' : isSuperAdmin ? 'Publish to Catalogue' : 'Submit for Approval'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

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
            productName: title || 'New Product',
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
