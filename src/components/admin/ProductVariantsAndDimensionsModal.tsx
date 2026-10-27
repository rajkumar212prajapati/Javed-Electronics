import React, { useState } from 'react';
import {
  Product,
  ColorVariantOption,
  SizeVariantOption,
  ModuleVariantOption,
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { calculateVolumetricMetrics } from '../../utils/volumetricWeight';
import { VolumetricWeightCalculatorModal } from '../common/VolumetricWeightCalculatorModal';
import {
  X,
  Box,
  Scale,
  Palette,
  Maximize2,
  Cpu,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Package,
} from 'lucide-react';

interface ProductVariantsAndDimensionsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Midnight Black', hex: '#111827' },
  { name: 'Phantom White', hex: '#f8fafc' },
  { name: 'Glacier Blue', hex: '#38bdf8' },
  { name: 'Titanium Grey', hex: '#64748b' },
  { name: 'Sunset Gold', hex: '#f59e0b' },
  { name: 'Coral Red', hex: '#ef4444' },
  { name: 'Forest Emerald', hex: '#10b981' },
  { name: 'Mystic Purple', hex: '#a855f7' },
];

export const ProductVariantsAndDimensionsModal: React.FC<ProductVariantsAndDimensionsModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateProduct } = useStore();

  const [activeTab, setActiveTab] = useState<'dimensions' | 'colors' | 'sizes' | 'modules'>('dimensions');

  // 1. Dimensions State
  const [lengthCm, setLengthCm] = useState<number>(product.lengthCm || 18);
  const [widthCm, setWidthCm] = useState<number>(product.widthCm || 14);
  const [heightCm, setHeightCm] = useState<number>(product.heightCm || 8);
  const [deadWeightKg, setDeadWeightKg] = useState<number>(product.deadWeightKg || product.weightKg || 0.35);
  const [packageType, setPackageType] = useState<string>(
    product.packageDimensions?.packageType || 'small_box'
  );

  // 2. Colors State
  const initialColors: ColorVariantOption[] = product.colorVariants || [
    { name: 'Midnight Black', hex: '#111827', priceDiff: 0 },
    { name: 'Glacier Blue', hex: '#38bdf8', priceDiff: 0 },
  ];
  const [colors, setColors] = useState<ColorVariantOption[]>(initialColors);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111827');
  const [newColorPriceDiff, setNewColorPriceDiff] = useState<number>(0);

  // 3. Sizes / Capacities State
  const initialSizes: SizeVariantOption[] = product.sizeVariants || [
    { size: '128GB Storage', priceDiff: 0, stock: 10 },
    { size: '256GB Storage', priceDiff: 2000, stock: 6 },
  ];
  const [sizes, setSizes] = useState<SizeVariantOption[]>(initialSizes);
  const [newSizeLabel, setNewSizeLabel] = useState('');
  const [newSizePriceDiff, setNewSizePriceDiff] = useState<number>(0);
  const [newSizeStock, setNewSizeStock] = useState<number>(5);

  // 4. Module & Identification State
  const [modelNumber, setModelNumber] = useState<string>(
    product.modelNumber || `MOD-${product.brand.slice(0, 3).toUpperCase()}-${product.sku.slice(-4)}`
  );
  const [moduleName, setModuleName] = useState<string>(
    product.moduleName || `${product.brand} Core Series Pro`
  );
  const initialModules: ModuleVariantOption[] = product.moduleVariants || [
    { moduleName: 'Standard Base Module', priceDiff: 0, description: 'Factory default specifications' },
  ];
  const [modules, setModules] = useState<ModuleVariantOption[]>(initialModules);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModulePriceDiff, setNewModulePriceDiff] = useState<number>(0);
  const [newModuleDesc, setNewModuleDesc] = useState('');

  // Box contents
  const [boxContents, setBoxContents] = useState<string[]>(
    product.boxContents || [
      'Main Unit / Device',
      'Power Adapter / Turbo Charger',
      'USB Braided Connecting Cable',
      'User Manual & Warranty Booklet',
    ]
  );
  const [newBoxItem, setNewBoxItem] = useState('');

  // Volumetric Weight standalone modal state
  const [showVolumetricCalcModal, setShowVolumetricCalcModal] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Computed Volumetric Metrics
  const volumetricMetrics = calculateVolumetricMetrics({
    lengthCm,
    widthCm,
    heightCm,
    deadWeightKg,
  });

  if (!isOpen) return null;

  // Add Color Handler
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setColors((prev) => [
      ...prev,
      {
        name: newColorName.trim(),
        hex: newColorHex,
        priceDiff: Number(newColorPriceDiff) || 0,
      },
    ]);
    setNewColorName('');
    setNewColorHex('#111827');
    setNewColorPriceDiff(0);
  };

  const handleRemoveColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Size Handler
  const handleAddSize = () => {
    if (!newSizeLabel.trim()) return;
    setSizes((prev) => [
      ...prev,
      {
        size: newSizeLabel.trim(),
        priceDiff: Number(newSizePriceDiff) || 0,
        stock: Number(newSizeStock) || 0,
      },
    ]);
    setNewSizeLabel('');
    setNewSizePriceDiff(0);
    setNewSizeStock(5);
  };

  const handleRemoveSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Module Handler
  const handleAddModule = () => {
    if (!newModuleName.trim()) return;
    setModules((prev) => [
      ...prev,
      {
        moduleName: newModuleName.trim(),
        priceDiff: Number(newModulePriceDiff) || 0,
        description: newModuleDesc.trim() || undefined,
      },
    ]);
    setNewModuleName('');
    setNewModulePriceDiff(0);
    setNewModuleDesc('');
  };

  const handleRemoveModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  // Box item handler
  const handleAddBoxItem = () => {
    if (!newBoxItem.trim()) return;
    setBoxContents((prev) => [...prev, newBoxItem.trim()]);
    setNewBoxItem('');
  };

  const handleRemoveBoxItem = (index: number) => {
    setBoxContents((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all changes
  const handleSaveAll = () => {
    const updatedDimensionsString = `${lengthCm} × ${widthCm} × ${heightCm} cm`;

    // Map into standard ProductVariant structure for backward compatibility
    const synthesizedVariants = [];
    if (colors.length > 0) {
      synthesizedVariants.push({
        id: `var-color-${Date.now()}`,
        name: 'Color',
        type: 'color' as const,
        options: colors.map((c) => (c.priceDiff ? `${c.name} (+₹${c.priceDiff})` : c.name)),
        priceDiff: 0,
        colorOptions: colors,
      });
    }
    if (sizes.length > 0) {
      synthesizedVariants.push({
        id: `var-size-${Date.now()}`,
        name: 'Size / Capacity',
        type: 'size' as const,
        options: sizes.map((s) => (s.priceDiff ? `${s.size} (+₹${s.priceDiff})` : s.size)),
        priceDiff: sizes[0]?.priceDiff || 0,
        sizeOptions: sizes,
      });
    }
    if (modules.length > 0) {
      synthesizedVariants.push({
        id: `var-mod-${Date.now()}`,
        name: 'Module / Edition',
        type: 'module' as const,
        options: modules.map((m) => (m.priceDiff ? `${m.moduleName} (+₹${m.priceDiff})` : m.moduleName)),
        priceDiff: 0,
        moduleOptions: modules,
      });
    }

    const updatedProduct: Product = {
      ...product,
      lengthCm,
      widthCm,
      heightCm,
      deadWeightKg,
      volumetricWeightKg: volumetricMetrics.volumetricWeightKg,
      billableWeightKg: volumetricMetrics.billableWeightKg,
      weightKg: deadWeightKg,
      dimensions: updatedDimensionsString,
      packageDimensions: {
        lengthCm,
        widthCm,
        heightCm,
        packageType,
      },
      colorVariants: colors,
      sizeVariants: sizes,
      moduleVariants: modules,
      modelNumber: modelNumber.trim(),
      moduleName: moduleName.trim(),
      boxContents,
      variants: synthesizedVariants.length > 0 ? synthesizedVariants : product.variants,
    };

    updateProduct(updatedProduct);
    setSavedSuccessMsg(true);
    setTimeout(() => {
      setSavedSuccessMsg(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={
                product.images[0] ||
                'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'
              }
              alt={product.name}
              className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  {product.brand}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</span>
              </div>
              <h3 className="font-black text-base text-white tracking-tight line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-blue-200/80">
                Configure Physical Dimensions, Volumetric Weight, Color &amp; Size Variations, and Hardware Modules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dimensions')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'dimensions'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Box className="w-4 h-4 text-blue-600" />
            <span>Dimensions &amp; Volumetric Weight</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'colors'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Colors ({colors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sizes')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'sizes'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Maximize2 className="w-4 h-4 text-emerald-600" />
            <span>Sizes &amp; Capacities ({sizes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'modules'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Module, Model &amp; Box ({modules.length})</span>
          </button>
        </div>

        {/* Tab 1: Dimensions & Volumetric Weight */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span>Physical Dimensions &amp; Volumetric Weight Calculation</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Indian express couriers (Shiprocket, Delhivery, Blue Dart) charge freight on the greater of Dead Weight vs Volumetric Weight.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVolumetricCalcModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Interactive Calculator</span>
                </button>
              </div>

              {/* Physical Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Length (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Width / Breadth (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Dead / Scale Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={deadWeightKg}
                    onChange={(e) => setDeadWeightKg(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Volumetric Results Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cubic Volume
                  </span>
                  <div className="font-mono font-bold text-base text-slate-900">
                    {volumetricMetrics.volumeCubicCm.toLocaleString()} cm³
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {lengthCm} × {widthCm} × {heightCm} cm
                  </span>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Volumetric Weight (Divisor 5000)
                  </span>
                  <div className="font-mono font-black text-base text-blue-900">
                    {volumetricMetrics.volumetricWeightKg} kg
                  </div>
                  <span className="text-[10px] text-blue-700">
                    (L × W × H) ÷ 5000 standard
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    Chargeable Billable Weight
                  </span>
                  <div className="font-mono font-black text-lg text-emerald-950">
                    {volumetricMetrics.billableWeightKg} kg
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {volumetricMetrics.isVolumetricHigher
                      ? 'Billed on Dimensions (+ Volumetric)'
                      : 'Billed on Scale (Dead Weight)'}
                  </span>
                </div>
              </div>

              {/* Packaging classification */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Package Classification: {volumetricMetrics.packageCategory}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {volumetricMetrics.packagingRecommendation}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px] rounded-lg border border-indigo-200 shrink-0">
                  {volumetricMetrics.estimatedFreightTier}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Color Variations */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>Product Color Variations</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add color choices for customers with visual swatches and custom price adjustments.
                  </p>
                </div>
              </div>

              {/* Add Color Form */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs block">
                  Add New Color Variation
                </span>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Quick Presets:</span>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewColorName(preset.name);
                        setNewColorHex(preset.hex);
                      }}
                      className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Color Name *</label>
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="e.g. Titanium Blue"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Color Swatch (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Price Difference (₹)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newColorPriceDiff}
                        onChange={(e) => setNewColorPriceDiff(Number(e.target.value))}
                        placeholder="0"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Color Variants List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs block">
                  Active Colors ({colors.length})
                </span>
                {colors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No color variants added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {colors.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {c.hex} {c.priceDiff ? `• +₹${c.priceDiff}` : '• Standard Price'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove color"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Sizes & Capacities */}
          {activeTab === 'sizes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-emerald-600" />
                    <span>Product Sizes, Capacities &amp; Spec Variants</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Configure storage (e.g. 128GB, 256GB), screen sizes (43", 55"), wattage (65W, 100W), or physical apparel sizes.
                  </p>
                </div>
              </div>

              {/* Add Size Form */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Add New Size / Capacity Variant
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Variant Label (Size / Storage / Wattage) *
                    </label>
                    <input
                      type="text"
                      value={newSizeLabel}
                      onChange={(e) => setNewSizeLabel(e.target.value)}
                      placeholder="e.g. 12GB RAM + 256GB Storage"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Price Difference (₹)
                    </label>
                    <input
                      type="number"
                      value={newSizePriceDiff}
                      onChange={(e) => setNewSizePriceDiff(Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Available Stock
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newSizeStock}
                        onChange={(e) => setNewSizeStock(Number(e.target.value))}
                        placeholder="5"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSize}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs block">
                  Active Size Variants ({sizes.length})
                </span>
                {sizes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No size variants added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {sizes.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block">{s.size}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {s.priceDiff ? `+₹${s.priceDiff.toLocaleString('en-IN')}` : 'Base Price'} • Stock: {s.stock ?? 10} units
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove size variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Modules, Model & Box Contents */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Hardware Modules, Model Number &amp; Box Contents</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Define technical module series, official model numbers, hardware variations, and unboxed items.
                  </p>
                </div>
              </div>

              {/* Model Number & Main Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Official Model / Module Number *
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. RN-13PRO-5G-LKO"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Module / Hardware Series Name *
                  </label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. Qualcomm Snapdragon 7s Gen 2 Edition"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Module Variations */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Add Hardware Module Variation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      placeholder="Module Name (e.g. Dual-Band WiFi 6E)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={newModulePriceDiff}
                      onChange={(e) => setNewModulePriceDiff(Number(e.target.value))}
                      placeholder="Price Diff (₹)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                      placeholder="Short notes"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddModule}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {modules.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs mt-1"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{m.moduleName}</span>
                      {m.priceDiff ? <span className="font-mono text-indigo-600 ml-2">(+₹{m.priceDiff})</span> : null}
                      {m.description && <span className="text-slate-400 block text-[10px]">{m.description}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Box Contents ("In The Box") */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Package Contents ("In the Box")
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBoxItem}
                    onChange={(e) => setNewBoxItem(e.target.value)}
                    placeholder="e.g. 67W GaN Fast Charger, Braided USB-C Cable"
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBoxItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBoxItem}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer text-xs"
                  >
                    Add Item
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {boxContents.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBoxItem(idx)}
                        className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {savedSuccessMsg && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Dimensions &amp; Variants Saved Successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Dimensions &amp; Variants</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Interactive Volumetric Calculator Modal */}
      {showVolumetricCalcModal && (
        <VolumetricWeightCalculatorModal
          isOpen={showVolumetricCalcModal}
          onClose={() => setShowVolumetricCalcModal(false)}
          initialValues={{
            lengthCm,
            widthCm,
            heightCm,
            deadWeightKg,
            productName: product.name,
          }}
          onApply={(applied) => {
            setLengthCm(applied.lengthCm);
            setWidthCm(applied.widthCm);
            setHeightCm(applied.heightCm);
            setDeadWeightKg(applied.deadWeightKg);
          }}
        />
      )}
    </div>
  );
};
