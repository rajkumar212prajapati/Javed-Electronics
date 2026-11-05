import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  BusinessCategory,
  CategoryApprovalStatus,
  CategoryListingFormat,
  CategoryFormatField,
  CategoryFormatFieldType,
  CategoryFormatFieldGroup,
  ProductCategory,
  SellerListing,
} from '../../types';
import {
  FolderTree,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Search,
  Check,
  X,
  Sliders,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Tv,
  Sparkles,
  Upload,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface CategoryApprovalManagerProps {
  onOpenProductStudioWithCategory?: (categoryId: ProductCategory) => void;
}

const DEFAULT_TELEVISION_PRESET_FIELDS: CategoryFormatField[] = [
  {
    id: 'tv_brand',
    key: 'brand',
    label: 'Brand',
    type: 'text',
    required: true,
    placeholder: 'e.g. Samsung, Sony, LG, Xiaomi, TCL',
    sampleValue: 'Samsung',
    group: 'identity',
  },
  {
    id: 'tv_product_name',
    key: 'product_name',
    label: 'Product Name',
    type: 'text',
    required: true,
    placeholder: 'e.g. Crystal 4K Vivid Pro Smart QLED Television',
    sampleValue: 'Samsung 55 Inch Crystal 4K Vivid Pro Ultra HD Smart QLED TV',
    group: 'identity',
  },
  {
    id: 'tv_module',
    key: 'module',
    label: 'Module / Processor / Series',
    type: 'text',
    required: true,
    placeholder: 'e.g. Crystal Processor 4K + Tizen OS Module',
    sampleValue: 'Crystal Processor 4K with HDR10+ & Tizen Smart Hub',
    group: 'identity',
  },
  {
    id: 'tv_part_number',
    key: 'part_number',
    label: 'Part Number',
    type: 'text',
    required: true,
    placeholder: 'e.g. UA55DUE77AKLXL',
    sampleValue: 'UA55DUE77AKLXL',
    group: 'identity',
  },
  {
    id: 'tv_display_size',
    key: 'display_size',
    label: 'Display Size',
    type: 'select',
    required: true,
    options: [
      '24 Inch (60 cm)',
      '32 Inch (80 cm)',
      '40 Inch (100 cm)',
      '43 Inch (108 cm)',
      '50 Inch (125 cm)',
      '55 Inch (138 cm)',
      '65 Inch (163 cm)',
      '75 Inch (189 cm)',
      '85 Inch (216 cm)',
    ],
    sampleValue: '55 Inch (138 cm)',
    group: 'technical',
  },
  {
    id: 'tv_display_type',
    key: 'display_type',
    label: 'Display Type',
    type: 'select',
    required: true,
    options: [
      '4K Ultra HD QLED',
      '4K Ultra HD LED',
      'OLED 4K',
      'Mini-LED 4K',
      'Full HD LED (1080p)',
      'HD Ready LED (720p)',
    ],
    sampleValue: '4K Ultra HD QLED',
    group: 'technical',
  },
  {
    id: 'tv_watt',
    key: 'watt',
    label: 'Watt (Power / Audio Output)',
    type: 'text',
    required: true,
    placeholder: 'e.g. 125W Power / 20W Dolby Audio Output',
    sampleValue: '125W Power / 20W Dolby Digital Plus Speakers',
    group: 'technical',
  },
  {
    id: 'tv_input_volt',
    key: 'input_volt',
    label: 'Input Volt',
    type: 'text',
    required: true,
    placeholder: 'e.g. AC 100-240V, 50/60Hz',
    sampleValue: 'AC 100-240V ~ 50/60Hz',
    group: 'technical',
  },
  {
    id: 'tv_warranty_info',
    key: 'warranty_info',
    label: 'Warranty Info',
    type: 'text',
    required: true,
    placeholder: 'e.g. 1 Year Comprehensive Warranty + 1 Year Additional on Panel',
    sampleValue: '1 Year Official Brand Warranty + 1 Year Additional on Panel',
    group: 'compliance',
  },
  {
    id: 'tv_manufacturer_name',
    key: 'manufacturer_name',
    label: 'Manufacturer Name & Address',
    type: 'text',
    required: true,
    placeholder: 'e.g. Samsung India Electronics Pvt. Ltd., Noida, UP',
    sampleValue: 'Samsung India Electronics Pvt. Ltd., Phase-II, Noida, UP - 201305',
    group: 'compliance',
  },
  {
    id: 'tv_packer_name',
    key: 'packer_name',
    label: 'Packer Name & Address',
    type: 'text',
    required: true,
    placeholder: 'e.g. Samsung India Packaging Hub, Sriperumbudur, TN',
    sampleValue: 'Samsung India Electronics Pvt. Ltd., Sriperumbudur Industrial Park, TN',
    group: 'compliance',
  },
  {
    id: 'tv_other_info',
    key: 'other_info',
    label: 'Other Info (Ports, Smart OS, Refresh Rate, In-Box Items)',
    type: 'textarea',
    required: false,
    placeholder: 'e.g. 60Hz Refresh Rate, 3x HDMI, 2x USB, Wi-Fi 5, Bluetooth 5.2, Voice Remote in box',
    sampleValue: 'Refresh Rate: 60Hz | Ports: 3x HDMI eARC, 2x USB, Optical | In Box: TV Unit, Voice Remote, Stand, Wall Mount Kit',
    group: 'other',
  },
];

export const CategoryApprovalManager: React.FC<CategoryApprovalManagerProps> = ({
  onOpenProductStudioWithCategory,
}) => {
  const {
    businessCategories,
    createBusinessCategory,
    updateCategoryApprovalStatus,
    currentRole,
    currentUser,
    categories,
    categoryFormats,
    getFormatForCategory,
    createCategoryFormat,
    updateCategoryFormat,
    deleteCategoryFormat,
    outlets,
    activeOutlet,
    addProduct,
    submitProductForApproval,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  const [activeView, setActiveView] = useState<'formats' | 'categories'>('formats');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Format Editor Modal State (Admin Create / Edit Format)
  const [showFormatEditor, setShowFormatEditor] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [fmtCategoryId, setFmtCategoryId] = useState<string>('tvs_accessories');
  const [fmtCustomCatName, setFmtCustomCatName] = useState<string>('');
  const [fmtSubCategoryId, setFmtSubCategoryId] = useState<string>('');
  const [fmtSubCategoryName, setFmtSubCategoryName] = useState<string>('');
  const [fmtTitle, setFmtTitle] = useState<string>('');
  const [fmtDescription, setFmtDescription] = useState<string>('');
  const [fmtHsnCode, setFmtHsnCode] = useState<string>('8528');
  const [fmtGstRate, setFmtGstRate] = useState<number>(18);
  const [fmtFields, setFmtFields] = useState<CategoryFormatField[]>([]);

  // New Field Input Inside Format Editor
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CategoryFormatFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldGroup, setNewFieldGroup] = useState<CategoryFormatFieldGroup>('technical');
  const [newFieldSample, setNewFieldSample] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Store Category-Based Product Upload Modal State
  const [uploadingFormat, setUploadingFormat] = useState<CategoryListingFormat | null>(null);
  const [selectedUploadCategoryId, setSelectedUploadCategoryId] = useState<ProductCategory>('tvs_accessories');
  const [selectedUploadSubCategoryId, setSelectedUploadSubCategoryId] = useState<string>('');
  const [formatValues, setFormatValues] = useState<Record<string, string>>({});
  const [uploadMrp, setUploadMrp] = useState<number | ''>('');
  const [uploadSellingPrice, setUploadSellingPrice] = useState<number | ''>('');
  const [uploadPurchaseCost, setUploadPurchaseCost] = useState<number | ''>('');
  const [uploadStock, setUploadStock] = useState<number>(10);
  const [uploadImageUrl, setUploadImageUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Legacy Category Governance states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewingCategory, setReviewingCategory] = useState<BusinessCategory | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [defaultCommission, setDefaultCommission] = useState(6.5);
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [requiresEanBarcode, setRequiresEanBarcode] = useState(true);
  const [requiresBatchNumber, setRequiresBatchNumber] = useState(false);
  const [requiresExpiryDate, setRequiresExpiryDate] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);

  // Combine saved formats + synthesized formats for all categories
  const allAvailableFormats = useMemo(() => {
    const map = new Map<string, CategoryListingFormat>();
    categoryFormats.forEach((f) => map.set(f.categoryId, f));
    categories.forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, getFormatForCategory(c.id));
      }
    });
    return Array.from(map.values());
  }, [categoryFormats, categories, getFormatForCategory]);

  // Open Admin Format Editor for Creating New Format
  const handleOpenCreateFormat = (presetType?: 'television' | 'blank') => {
    setEditingFormatId(null);
    if (presetType === 'television') {
      setFmtCategoryId('tvs_accessories');
      setFmtCustomCatName('Smart TVs & Media');
      setFmtSubCategoryId('4k_qled_oled_tv');
      setFmtSubCategoryName('4K QLED & OLED TV');
      setFmtTitle('Television & Smart Display Listing Format');
      setFmtDescription(
        'Mandatory Television listing format with Display Size, Display Type, Watt, Input Volt, Brand, Product Name, Module, Warranty Info, Part Number, Manufacturer & Packer.'
      );
      setFmtHsnCode('8528');
      setFmtGstRate(18);
      setFmtFields([...DEFAULT_TELEVISION_PRESET_FIELDS]);
    } else {
      setFmtCategoryId('tvs_accessories');
      setFmtCustomCatName('');
      setFmtSubCategoryId('');
      setFmtSubCategoryName('');
      setFmtTitle('New Category Product Listing Format');
      setFmtDescription('Custom category product listing format.');
      setFmtHsnCode('8517');
      setFmtGstRate(18);
      setFmtFields([...DEFAULT_TELEVISION_PRESET_FIELDS]);
    }
    setShowFormatEditor(true);
  };

  // Open Admin Format Editor for Editing Existing Format
  const handleOpenEditFormat = (format: CategoryListingFormat) => {
    setEditingFormatId(format.id);
    setFmtCategoryId(format.categoryId);
    setFmtCustomCatName(format.categoryName);
    setFmtSubCategoryId(format.subCategoryId || '');
    setFmtSubCategoryName(format.subCategoryName || '');
    setFmtTitle(format.formatTitle);
    setFmtDescription(format.description);
    setFmtHsnCode(format.defaultHsnCode);
    setFmtGstRate(format.defaultGstRate);
    setFmtFields(format.fields.map((f) => ({ ...f })));
    setShowFormatEditor(true);
  };

  // Delete Format
  const handleDeleteFormat = (format: CategoryListingFormat) => {
    const res = deleteCategoryFormat(format.id);
    setStatusMsg({ type: res.success ? 'success' : 'error', text: res.message });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Add Field inside Format Editor
  const handleAddFieldToEditor = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const optionsList =
      newFieldType === 'select'
        ? newFieldOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: CategoryFormatField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      key,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      sampleValue: newFieldSample.trim() || undefined,
      placeholder: newFieldSample.trim() ? `e.g. ${newFieldSample.trim()}` : `Enter ${newFieldLabel.trim()}`,
      options: optionsList,
      group: newFieldGroup,
    };

    setFmtFields((prev) => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldSample('');
    setNewFieldOptions('');
  };

  const handleUpdateFieldInEditor = (index: number, updates: Partial<CategoryFormatField>) => {
    setFmtFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleRemoveFieldFromEditor = (index: number) => {
    setFmtFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Format (Create or Update)
  const handleSaveFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmtTitle.trim() || fmtFields.length === 0) return;

    const finalCatId = (
      fmtCategoryId === '__custom__' && fmtCustomCatName.trim()
        ? fmtCustomCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : fmtCategoryId
    ) as ProductCategory;

    const matchedCat = categories.find((c) => c.id === finalCatId);
    const finalCatName =
      fmtCustomCatName.trim() ||
      matchedCat?.name ||
      String(finalCatId).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const subCatObj = matchedCat?.subCategories?.find((sc) => sc.id === fmtSubCategoryId);
    const finalSubCatName = fmtSubCategoryName.trim() || subCatObj?.name || undefined;

    if (editingFormatId) {
      const res = updateCategoryFormat(editingFormatId, {
        categoryId: finalCatId,
        categoryName: finalCatName,
        subCategoryId: fmtSubCategoryId || undefined,
        subCategoryName: finalSubCatName,
        formatTitle: fmtTitle.trim(),
        description: fmtDescription.trim(),
        defaultHsnCode: fmtHsnCode.trim() || '8528',
        defaultGstRate: Number(fmtGstRate) || 18,
        fields: fmtFields,
        updatedBy: isSuperAdmin ? 'Super Admin' : currentUser.name,
      });
      setStatusMsg({ type: 'success', text: res.message });
    } else {
      const res = createCategoryFormat({
        categoryId: finalCatId,
        categoryName: finalCatName,
        subCategoryId: fmtSubCategoryId || undefined,
        subCategoryName: finalSubCatName,
        formatTitle: fmtTitle.trim(),
        description: fmtDescription.trim(),
        defaultHsnCode: fmtHsnCode.trim() || '8528',
        defaultGstRate: Number(fmtGstRate) || 18,
        fields: fmtFields,
        isActive: true,
        updatedBy: isSuperAdmin ? 'Super Admin' : currentUser.name,
      });
      setStatusMsg({ type: res.success ? 'success' : 'error', text: res.message });
    }

    setShowFormatEditor(false);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Open Store Product Upload Form for a Selected Category Format
  const handleOpenUploadModalForCategory = (categoryId: ProductCategory, subCategoryId?: string) => {
    const fmt = getFormatForCategory(categoryId, subCategoryId);
    setSelectedUploadCategoryId(categoryId);
    setSelectedUploadSubCategoryId(subCategoryId || fmt.subCategoryId || '');
    setUploadingFormat(fmt);
    const initialVals: Record<string, string> = {};
    fmt.fields.forEach((f) => {
      initialVals[f.key] = f.type === 'select' && f.options?.length ? f.options[0] : '';
    });
    setFormatValues(initialVals);
    setUploadMrp('');
    setUploadSellingPrice('');
    setUploadPurchaseCost('');
    setUploadStock(10);
    setUploadImageUrl('');
    setUploadError(null);
  };

  // Switch Category inside Upload Modal
  const handleSwitchCategoryInUploadModal = (newCategoryId: ProductCategory, newSubCategoryId?: string) => {
    const fmt = getFormatForCategory(newCategoryId, newSubCategoryId);
    setSelectedUploadCategoryId(newCategoryId);
    setSelectedUploadSubCategoryId(newSubCategoryId || fmt.subCategoryId || '');
    setUploadingFormat(fmt);
    const initialVals: Record<string, string> = {};
    fmt.fields.forEach((f) => {
      initialVals[f.key] = f.type === 'select' && f.options?.length ? f.options[0] : '';
    });
    setFormatValues(initialVals);
    setUploadError(null);
  };

  // Fill Sample Values in Upload Modal
  const handleFillSampleFormatValues = () => {
    if (!uploadingFormat) return;
    const sampleMap: Record<string, string> = {};
    uploadingFormat.fields.forEach((f) => {
      sampleMap[f.key] = f.sampleValue || (f.options && f.options[0]) || `Sample ${f.label}`;
    });
    setFormatValues(sampleMap);
    if (!uploadMrp) setUploadMrp(49990);
    if (!uploadSellingPrice) setUploadSellingPrice(36990);
    if (!uploadPurchaseCost) setUploadPurchaseCost(31500);
    if (!uploadImageUrl) {
      setUploadImageUrl(
        uploadingFormat.categoryId === 'tvs_accessories'
          ? 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'
      );
    }
    setUploadError(null);
  };

  // Submit Product from Category Format Upload Modal
  const handleSubmitFormattedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingFormat) return;

    // Validate required fields in the format
    for (const field of uploadingFormat.fields) {
      if (field.required && !(formatValues[field.key] || '').trim()) {
        setUploadError(`Please enter required format field: "${field.label}"`);
        return;
      }
    }

    const prodName =
      (formatValues['product_name'] || '').trim() ||
      `${formatValues['brand'] || ''} ${uploadingFormat.categoryName}`.trim();
    const prodBrand = (formatValues['brand'] || 'Generic').trim();
    const prodModule = (formatValues['module'] || '').trim();
    const prodPartNumber = (formatValues['part_number'] || '').trim();
    const prodWarranty = (formatValues['warranty_info'] || '1 Year Brand Warranty').trim();
    const prodManufacturer = (formatValues['manufacturer_name'] || '').trim();
    const prodPacker = (formatValues['packer_name'] || '').trim();

    if (!prodName) {
      setUploadError('Product Name is required in the format.');
      return;
    }

    const finalPrice = uploadSellingPrice ? Number(uploadSellingPrice) : 14999;
    const finalMrp = uploadMrp ? Number(uploadMrp) : Math.round(finalPrice * 1.25);
    const finalCost = uploadPurchaseCost ? Number(uploadPurchaseCost) : Math.round(finalPrice * 0.8);

    // Build structured specifications from all format fields
    const specsObj: Record<string, string> = {};
    uploadingFormat.fields.forEach((f) => {
      const val = (formatValues[f.key] || '').trim();
      if (val) {
        specsObj[f.label] = val;
      }
    });

    const outlet = activeOutlet || outlets[0];
    const initialSellerListing: SellerListing = {
      id: `sl-${Date.now()}`,
      sellerId: outlet.id,
      sellerName: outlet.name,
      outletId: outlet.id,
      outletName: outlet.name,
      sellingPrice: finalPrice,
      mrp: finalMrp,
      purchaseCost: finalCost,
      stock: Number(uploadStock) || 10,
      isAvailable: true,
      deliveryPromiseHours: 4,
      isFeaturedSeller: true,
      lastUpdated: new Date().toISOString(),
    };

    const defaultImg =
      uploadImageUrl.trim() ||
      (uploadingFormat.categoryId === 'tvs_accessories'
        ? 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80');

    const descParts = [
      `${prodName} by ${prodBrand}.`,
      formatValues['display_size'] ? `Display Size: ${formatValues['display_size']}.` : '',
      formatValues['display_type'] ? `Display Type: ${formatValues['display_type']}.` : '',
      formatValues['watt'] ? `Power/Watt: ${formatValues['watt']}.` : '',
      formatValues['input_volt'] ? `Input Voltage: ${formatValues['input_volt']}.` : '',
      prodModule ? `Module: ${prodModule}.` : '',
      prodPartNumber ? `Part No: ${prodPartNumber}.` : '',
      prodWarranty ? `Warranty: ${prodWarranty}.` : '',
      prodManufacturer ? `Manufacturer: ${prodManufacturer}.` : '',
      prodPacker ? `Packer: ${prodPacker}.` : '',
      formatValues['other_info'] ? `${formatValues['other_info']}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const productPayload = {
      sku: prodPartNumber || `JE-${prodBrand.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      barcode: `890${Date.now().toString().slice(-10)}`,
      name: prodName,
      brand: prodBrand,
      modelNumber: prodPartNumber,
      moduleName: prodModule,
      partNumber: prodPartNumber,
      manufacturerName: prodManufacturer,
      packerName: prodPacker,
      warrantyInfo: prodWarranty,
      categoryFormatId: uploadingFormat.id,
      categoryFormatValues: { ...formatValues },
      categoryId: uploadingFormat.categoryId,
      subCategoryId: uploadingFormat.subCategoryId,
      subCategoryName: uploadingFormat.subCategoryName,
      images: [defaultImg],
      description: descParts,
      shortDescription: descParts.slice(0, 150),
      specifications: specsObj,
      mrp: finalMrp,
      regularPrice: finalPrice,
      dealPrice: finalPrice,
      purchaseCost: finalCost,
      gstRate: uploadingFormat.defaultGstRate || 18,
      hsnCode: uploadingFormat.defaultHsnCode || '8528',
      isTaxInclusive: true,
      stock: {
        onHand: Number(uploadStock) || 10,
        reserved: 0,
        minStockLevel: 3,
      },
      warrantyMonths: 12,
      returnEligibleDays: 7,
      weightKg: 1.5,
      dimensions: 'Standard Package',
      status: (isSuperAdmin ? 'published' : 'draft') as 'published' | 'draft',
      rating: 4.8,
      reviewsCount: 0,
      seoTitle: `Buy ${prodName} | Javed Electronics`,
      seoDescription: descParts.slice(0, 155),
      approvalStatus: (isSuperAdmin ? 'approved' : 'pending') as 'approved' | 'pending',
      sellerListings: [initialSellerListing],
    };

    if (isSuperAdmin) {
      addProduct(productPayload);
      setStatusMsg({
        type: 'success',
        text: `Product "${prodName}" published directly using ${uploadingFormat.formatTitle}!`,
      });
    } else {
      const res = submitProductForApproval(productPayload, {
        userId: currentUser.id || 'usr_store',
        userName: currentUser.name || 'Store Manager',
        role: currentRole,
        storeName: outlet.name,
      });
      setStatusMsg({
        type: 'success',
        text: res.message,
      });
    }

    setUploadingFormat(null);
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const filteredCategories = businessCategories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cat.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CategoryApprovalStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Live &amp; Published
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
            <FileCheck className="w-3 h-3" /> Approved
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Submitted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
            Draft
          </span>
        );
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    createBusinessCategory({
      name,
      code,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      iconName: 'Package',
      description,
      customAttributes: [
        {
          id: 'attr_1',
          name: 'Brand Warranty Period',
          type: 'select',
          required: true,
          options: ['6 Months', '1 Year', '2 Years'],
        },
        { id: 'attr_2', name: 'Color Finish', type: 'text', required: false },
      ],
      requiresBatchNumber,
      requiresExpiryDate,
      requiresPrescription,
      requiresEanBarcode,
      defaultGstRate: Number(defaultGstRate),
      returnWindowDays: Number(returnWindowDays),
      defaultCommissionPercent: Number(defaultCommission),
      approvalStatus: isSuperAdmin ? 'approved' : 'submitted',
      proposedBy: isSuperAdmin ? 'Super Admin' : 'Store Manager',
      approvedBy: isSuperAdmin ? 'Super Admin' : undefined,
      isActive: true,
    });

    setShowCreateModal(false);
    setName('');
    setCode('');
    setSlug('');
    setDescription('');
  };

  const handleUpdateStatus = (status: CategoryApprovalStatus) => {
    if (!reviewingCategory) return;
    updateCategoryApprovalStatus(reviewingCategory.id, status, reviewNote);
    setReviewingCategory(null);
    setReviewNote('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-900">Category Formats</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedUploadCategoryId}
            onChange={(e) => {
              const newCat = e.target.value as ProductCategory;
              setSelectedUploadCategoryId(newCat);
              const foundCat = categories.find((c) => c.id === newCat);
              setSelectedUploadSubCategoryId(foundCat?.subCategories?.[0]?.id || '');
            }}
            className="px-3 py-2 bg-slate-50 text-slate-900 rounded-xl text-xs font-bold border border-slate-200 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Subcategory Selector if active category has subcategories */}
          {(() => {
            const activeCat = categories.find((c) => c.id === selectedUploadCategoryId);
            const subs = activeCat?.subCategories || [];
            if (subs.length === 0) return null;
            return (
              <select
                value={selectedUploadSubCategoryId}
                onChange={(e) => setSelectedUploadSubCategoryId(e.target.value)}
                className="px-3 py-2 bg-indigo-50/80 text-indigo-950 rounded-xl text-xs font-bold border border-indigo-200 focus:outline-none"
              >
                <option value="">All / General Subcategory</option>
                {subs.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            );
          })()}

          <button
            type="button"
            onClick={() => handleOpenUploadModalForCategory(selectedUploadCategoryId, selectedUploadSubCategoryId || undefined)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open Format</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleOpenCreateFormat('television')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Format</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
          <button type="button" onClick={() => setStatusMsg(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* CREATED CATEGORY FORMATS LIST: ONLY CATEGORY NAME + EDIT / DELETE */}
      {activeView === 'formats' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {categoryFormats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No formats created.</div>
          ) : (
            categoryFormats.map((format) => (
              <div
                key={format.id}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleOpenUploadModalForCategory(format.categoryId, format.subCategoryId)}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 text-left cursor-pointer transition-colors truncate"
                  >
                    {format.categoryName}
                  </button>
                  {format.subCategoryName && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {format.subCategoryName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenUploadModalForCategory(format.categoryId, format.subCategoryId)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Open
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditFormat(format)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFormat(format)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: LEGACY BUSINESS CATEGORIES & TAX GOVERNANCE                   */}
      {/* ===================================================================== */}
      {activeView === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search category name, code, description..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {['all', 'published', 'approved', 'under_review', 'submitted', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {status === 'all' ? 'All Statuses' : status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Propose Category</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        {category.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{category.name}</h3>
                    </div>
                    {getStatusBadge(category.approvalStatus)}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{category.description}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-xs mb-3 border border-slate-100">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">GST Rate</span>
                      <span className="font-bold text-slate-800 font-mono">{category.defaultGstRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Commission</span>
                      <span className="font-bold text-blue-700 font-mono">
                        {category.defaultCommissionPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Return</span>
                      <span className="font-bold text-slate-800">{category.returnWindowDays} Days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Proposed by: <strong className="text-slate-600">{category.proposedBy || 'Admin'}</strong>
                  </span>

                  {isSuperAdmin && category.approvalStatus !== 'published' && (
                    <button
                      onClick={() => setReviewingCategory(category)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Review &amp; Status</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADMIN CREATE / EDIT CATEGORY LISTING FORMAT                  */}
      {/* ===================================================================== */}
      {showFormatEditor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base font-extrabold">
                {editingFormatId ? 'Edit Format' : 'Create Format'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormatEditor(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormat} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Row 1: Category Selection, Subcategory & Format Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Target Category *</label>
                  <select
                    value={fmtCategoryId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFmtCategoryId(val);
                      setFmtSubCategoryId('');
                      setFmtSubCategoryName('');
                      const catObj = categories.find((c) => c.id === val);
                      if (catObj) {
                        setFmtCustomCatName(catObj.name);
                        setFmtTitle(`${catObj.name} Listing Format`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Create New Category...</option>
                  </select>
                </div>

                {fmtCategoryId === '__custom__' ? (
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">New Category Name *</label>
                    <input
                      type="text"
                      value={fmtCustomCatName}
                      onChange={(e) => {
                        setFmtCustomCatName(e.target.value);
                        setFmtTitle(`${e.target.value} Listing Format`);
                      }}
                      placeholder="e.g. Television & Home Theatre"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Target Subcategory</label>
                    {(() => {
                      const activeCat = categories.find((c) => c.id === fmtCategoryId);
                      const subs = activeCat?.subCategories || [];
                      if (subs.length === 0) {
                        return (
                          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-medium">
                            No Subcategories Defined
                          </div>
                        );
                      }
                      return (
                        <select
                          value={fmtSubCategoryId}
                          onChange={(e) => {
                            const scId = e.target.value;
                            setFmtSubCategoryId(scId);
                            const scObj = subs.find((s) => s.id === scId);
                            if (scObj) {
                              setFmtSubCategoryName(scObj.name);
                              setFmtTitle(`${activeCat?.name || ''} - ${scObj.name} Listing Format`);
                            } else {
                              setFmtSubCategoryName('');
                              setFmtTitle(`${activeCat?.name || ''} Listing Format`);
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white"
                        >
                          <option value="">All / General (Category-Wide)</option>
                          {subs.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Format Title *</label>
                  <input
                    type="text"
                    value={fmtTitle}
                    onChange={(e) => setFmtTitle(e.target.value)}
                    placeholder="e.g. Television & Smart Display Listing Format"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: HSN, GST, Preset Helper */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default HSN Code</label>
                  <input
                    type="text"
                    value={fmtHsnCode}
                    onChange={(e) => setFmtHsnCode(e.target.value)}
                    placeholder="8528"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default GST Rate (%)</label>
                  <select
                    value={fmtGstRate}
                    onChange={(e) => setFmtGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  >
                    <option value={0}>0% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setFmtFields([...DEFAULT_TELEVISION_PRESET_FIELDS])}
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Load Television Sample Fields</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Existing Fields Table (Editable & Deletable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                    Format Fields ({fmtFields.length})
                  </label>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                  {fmtFields.map((fld, idx) => (
                    <div
                      key={fld.id}
                      className="p-3 bg-white hover:bg-slate-50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-400 font-bold block">Field Label</label>
                        <input
                          type="text"
                          value={fld.label}
                          onChange={(e) => handleUpdateFieldInEditor(idx, { label: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold block">Input Type</label>
                        <select
                          value={fld.type}
                          onChange={(e) =>
                            handleUpdateFieldInEditor(idx, { type: e.target.value as CategoryFormatFieldType })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown Select</option>
                          <option value="textarea">Multi-line Info</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-400 font-bold block">
                          {fld.type === 'select' ? 'Dropdown Options (comma-separated)' : 'Sample Format Value'}
                        </label>
                        {fld.type === 'select' ? (
                          <input
                            type="text"
                            value={(fld.options || []).join(', ')}
                            onChange={(e) =>
                              handleUpdateFieldInEditor(idx, {
                                options: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="32 Inch, 43 Inch, 55 Inch, 65 Inch"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                          />
                        ) : (
                          <input
                            type="text"
                            value={fld.sampleValue || ''}
                            onChange={(e) => handleUpdateFieldInEditor(idx, { sampleValue: e.target.value })}
                            placeholder="Sample value for store guidance"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                          />
                        )}
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2 pt-3 sm:pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={fld.required}
                            onChange={(e) => handleUpdateFieldInEditor(idx, { required: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Mandatory</span>
                        </label>
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveFieldFromEditor(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Remove Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Add New Custom Field to Format */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Add Another Field to This Category Format</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Field Name *</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. HDMI Ports, Panel Refresh Rate"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Field Type</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as CategoryFormatFieldType)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                      <option value="textarea">Multi-line</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Section</label>
                    <select
                      value={newFieldGroup}
                      onChange={(e) => setNewFieldGroup(e.target.value as CategoryFormatFieldGroup)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="identity">Core Identity</option>
                      <option value="technical">Display &amp; Power</option>
                      <option value="compliance">Warranty &amp; Legal</option>
                      <option value="other">Other Info</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      {newFieldType === 'select' ? 'Options (comma-separated)' : 'Sample Value'}
                    </label>
                    {newFieldType === 'select' ? (
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="e.g. 60Hz, 120Hz, 144Hz"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    ) : (
                      <input
                        type="text"
                        value={newFieldSample}
                        onChange={(e) => setNewFieldSample(e.target.value)}
                        placeholder="e.g. 3x HDMI 2.1, 2x USB"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddFieldToEditor}
                      disabled={!newFieldLabel.trim()}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer"
                    >
                      + Add Field
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormatEditor(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl cursor-pointer shadow-sm"
                >
                  {editingFormatId ? 'Save Format Changes' : 'Create Category Format'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: STORE CATEGORY-BASED PRODUCT UPLOAD & APPROVAL SUBMISSION    */}
      {/* ===================================================================== */}
      {uploadingFormat && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <h3 className="text-base font-extrabold">{uploadingFormat.categoryName}</h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSampleFormatValues}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-amber-300 border border-white/20 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fill Sample
                </button>
                <button
                  type="button"
                  onClick={() => setUploadingFormat(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs font-bold text-rose-800 flex items-center justify-between">
                <span>{uploadError}</span>
                <button type="button" onClick={() => setUploadError(null)} className="underline cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitFormattedProduct} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Category & Subcategory Selector Switcher inside Form */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-indigo-950 text-xs">Category:</span>
                  <select
                    value={selectedUploadCategoryId}
                    onChange={(e) => {
                      const newCat = e.target.value as ProductCategory;
                      const found = categories.find((c) => c.id === newCat);
                      const firstSub = found?.subCategories?.[0]?.id || '';
                      handleSwitchCategoryInUploadModal(newCat, firstSub);
                    }}
                    className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Subcategory dropdown if category has subcategories */}
                  {(() => {
                    const activeCat = categories.find((c) => c.id === selectedUploadCategoryId);
                    const subs = activeCat?.subCategories || [];
                    if (subs.length === 0) return null;
                    return (
                      <>
                        <span className="font-bold text-indigo-950 text-xs ml-1">Subcategory:</span>
                        <select
                          value={selectedUploadSubCategoryId}
                          onChange={(e) => {
                            const subId = e.target.value;
                            handleSwitchCategoryInUploadModal(selectedUploadCategoryId, subId);
                          }}
                          className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 text-xs"
                        >
                          <option value="">General (All Subcategories)</option>
                          {subs.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name}
                            </option>
                          ))}
                        </select>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Format Fields Grouped Cleanly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {uploadingFormat.fields.map((field) => (
                  <div
                    key={field.id}
                    className={field.type === 'textarea' ? 'sm:col-span-2' : 'sm:col-span-1'}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-600">*</span>}
                      </label>
                      {field.sampleValue && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          Sample: {field.sampleValue}
                        </span>
                      )}
                    </div>

                    {field.type === 'select' && field.options && field.options.length > 0 ? (
                      <select
                        value={formatValues[field.key] || ''}
                        onChange={(e) =>
                          setFormatValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        required={field.required}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
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
                        value={formatValues[field.key] || ''}
                        onChange={(e) =>
                          setFormatValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formatValues[field.key] || ''}
                        onChange={(e) =>
                          setFormatValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Pricing, Stock & Image Row */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Store Pricing, Stock &amp; Product Photo
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
                    <input
                      type="number"
                      value={uploadMrp}
                      onChange={(e) => setUploadMrp(e.target.value ? Number(e.target.value) : '')}
                      placeholder="49990"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={uploadSellingPrice}
                      onChange={(e) =>
                        setUploadSellingPrice(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="36990"
                      required
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      value={uploadPurchaseCost}
                      onChange={(e) =>
                        setUploadPurchaseCost(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="31500"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Opening Stock *</label>
                    <input
                      type="number"
                      value={uploadStock}
                      onChange={(e) => setUploadStock(Number(e.target.value))}
                      min={1}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={uploadImageUrl}
                    onChange={(e) => setUploadImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadingFormat(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSuperAdmin ? 'Publish Product' : 'Submit for Approval'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & STATUS CHANGE MODAL (LEGACY CATEGORY GOVERNANCE) */}
      {reviewingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit &amp; Review: {reviewingCategory.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">{reviewingCategory.code}</span>
              </div>
              <button
                onClick={() => setReviewingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit / Approval Feedback Note
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Catalog nomenclature verified; GST HSN verified; approved for marketplace vendors."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleUpdateStatus('rejected')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Reject Category
              </button>
              <button
                onClick={() => handleUpdateStatus('under_review')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Put Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus('approved')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus('published')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Approve &amp; Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Propose New Business Category
                </h3>
                <p className="text-xs text-slate-500">
                  Configure taxonomy, commission, GST rate, and barcode rules
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCategory}
              className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="e.g. Smart Wearables & Fitness"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CAT-WEAR-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Smartwatches, heart-rate bands, smart rings and biometric accessories..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Tax Rate %
                  </label>
                  <input
                    type="number"
                    value={defaultGstRate}
                    onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Commission %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Window (Days)
                  </label>
                  <input
                    type="number"
                    value={returnWindowDays}
                    onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {isSuperAdmin ? 'Create & Approve Category' : 'Submit Category for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
