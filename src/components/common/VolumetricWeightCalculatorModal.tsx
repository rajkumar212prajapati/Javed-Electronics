import React, { useState, useMemo } from 'react';
import {
  calculateVolumetricMetrics,
  COURIER_DIVISORS,
  CourierDivisor,
} from '../../utils/volumetricWeight';
import {
  X,
  Box,
  Scale,
  Sparkles,
  Info,
  Check,
  ArrowRight,
  Truck,
  RotateCcw,
  Zap,
  Package,
} from 'lucide-react';

interface VolumetricWeightCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: {
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    deadWeightKg?: number;
    productName?: string;
  };
  onApply?: (metrics: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    deadWeightKg: number;
    volumetricWeightKg: number;
    billableWeightKg: number;
    dimensionsString: string;
  }) => void;
}

const PRESET_PACKAGES = [
  {
    name: 'Smartphone Retail Box',
    lengthCm: 18,
    widthCm: 9,
    heightCm: 5,
    deadWeightKg: 0.38,
    icon: '📱',
  },
  {
    name: 'TWS Earbuds Case',
    lengthCm: 10,
    widthCm: 8,
    heightCm: 4,
    deadWeightKg: 0.14,
    icon: '🎧',
  },
  {
    name: 'Fast Charger & Cable',
    lengthCm: 12,
    widthCm: 8,
    heightCm: 4.5,
    deadWeightKg: 0.22,
    icon: '⚡',
  },
  {
    name: 'Smartwatch Box',
    lengthCm: 12,
    widthCm: 10,
    heightCm: 6,
    deadWeightKg: 0.26,
    icon: '⌚',
  },
  {
    name: 'Bluetooth Soundbar',
    lengthCm: 85,
    widthCm: 12,
    heightCm: 10,
    deadWeightKg: 2.8,
    icon: '🔊',
  },
  {
    name: '43" LED Smart TV',
    lengthCm: 106,
    widthCm: 65,
    heightCm: 14,
    deadWeightKg: 8.5,
    icon: '📺',
  },
];

export const VolumetricWeightCalculatorModal: React.FC<VolumetricWeightCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onApply,
}) => {
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');
  const [lengthInput, setLengthInput] = useState<string>(
    initialValues?.lengthCm ? String(initialValues.lengthCm) : '18'
  );
  const [widthInput, setWidthInput] = useState<string>(
    initialValues?.widthCm ? String(initialValues.widthCm) : '14'
  );
  const [heightInput, setHeightInput] = useState<string>(
    initialValues?.heightCm ? String(initialValues.heightCm) : '8'
  );
  const [weightInput, setWeightInput] = useState<string>(
    initialValues?.deadWeightKg ? String(initialValues.deadWeightKg) : '0.45'
  );
  const [selectedDivisor, setSelectedDivisor] = useState<CourierDivisor>(5000);

  // Convert inputs to standard CM and KG for calculation
  const lengthCm = useMemo(() => {
    const val = parseFloat(lengthInput) || 0;
    return unit === 'inch' ? Number((val * 2.54).toFixed(1)) : val;
  }, [lengthInput, unit]);

  const widthCm = useMemo(() => {
    const val = parseFloat(widthInput) || 0;
    return unit === 'inch' ? Number((val * 2.54).toFixed(1)) : val;
  }, [widthInput, unit]);

  const heightCm = useMemo(() => {
    const val = parseFloat(heightInput) || 0;
    return unit === 'inch' ? Number((val * 2.54).toFixed(1)) : val;
  }, [heightInput, unit]);

  const deadWeightKg = useMemo(() => {
    const val = parseFloat(weightInput) || 0;
    return weightUnit === 'g' ? Number((val / 1000).toFixed(3)) : val;
  }, [weightInput, weightUnit]);

  const metrics = useMemo(() => {
    return calculateVolumetricMetrics({
      lengthCm,
      widthCm,
      heightCm,
      deadWeightKg,
      divisor: selectedDivisor,
    });
  }, [lengthCm, widthCm, heightCm, deadWeightKg, selectedDivisor]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_PACKAGES[0]) => {
    setUnit('cm');
    setWeightUnit('kg');
    setLengthInput(String(preset.lengthCm));
    setWidthInput(String(preset.widthCm));
    setHeightInput(String(preset.heightCm));
    setWeightInput(String(preset.deadWeightKg));
  };

  const handleConfirmApply = () => {
    if (onApply) {
      onApply({
        lengthCm: metrics.lengthCm,
        widthCm: metrics.widthCm,
        heightCm: metrics.heightCm,
        deadWeightKg: metrics.deadWeightKg,
        volumetricWeightKg: metrics.volumetricWeightKg,
        billableWeightKg: metrics.billableWeightKg,
        dimensionsString: `${metrics.lengthCm} × ${metrics.widthCm} × ${metrics.heightCm} cm`,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  Volumetric (Dimensional) Weight Calculator
                </h3>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Shiprocket Ready
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                {initialValues?.productName
                  ? `Optimizing shipping weight for: ${initialValues.productName}`
                  : 'Calculate chargeable billable weight across Indian courier partners (Divisor 5000)'}
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Quick Presets Carousel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Retail Box Presets
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill standard dimensions</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_PACKAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {preset.lengthCm}×{preset.widthCm}×{preset.heightCm} cm • {preset.deadWeightKg} kg
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Unit Selectors & Divisor */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">Measurement Units:</span>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      unit === 'cm' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('inch')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      unit === 'inch' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inches (in)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">Weight Unit:</span>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      weightUnit === 'kg' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kilograms (kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('g')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                      weightUnit === 'g' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Grams (g)
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Length ({unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={lengthInput}
                  onChange={(e) => setLengthInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Width / Breadth ({unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={widthInput}
                  onChange={(e) => setWidthInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Height ({unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dead / Scale Weight ({weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Courier Divisor Selector */}
            <div className="pt-2">
              <label className="font-bold text-slate-700 block mb-1">
                Courier Divisor Formula:
              </label>
              <select
                value={selectedDivisor}
                onChange={(e) => setSelectedDivisor(Number(e.target.value) as CourierDivisor)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {COURIER_DIVISORS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label} — {d.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Comparison Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Actual Dead Weight vs Volumetric Weight */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-slate-500" />
                  <span>Weight Comparison</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Vol: {metrics.volumeCubicCm.toLocaleString()} cm³
                </span>
              </div>

              <div className="space-y-2">
                {/* Dead Weight */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-600">Scale / Dead Weight:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {metrics.deadWeightKg} kg
                  </span>
                </div>

                {/* Volumetric Weight */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div>
                    <span className="font-bold text-blue-900 block">Volumetric Weight:</span>
                    <span className="text-[10px] text-blue-600 font-mono">
                      ({metrics.lengthCm} × {metrics.widthCm} × {metrics.heightCm}) ÷ {selectedDivisor}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-blue-900 text-sm">
                    {metrics.volumetricWeightKg} kg
                  </span>
                </div>
              </div>

              {/* Difference notice */}
              <div className="text-[11px] text-slate-500">
                {metrics.isVolumetricHigher ? (
                  <span className="text-amber-700 font-medium">
                    ⚠️ Volumetric weight is <strong>+{metrics.weightDifferenceKg} kg higher</strong> than actual dead weight. Couriers will bill on volumetric dimensions.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    ✓ Dead weight exceeds volumetric weight. Couriers will bill on actual scale weight.
                  </span>
                )}
              </div>
            </div>

            {/* Box 2: CHARGEABLE / BILLABLE WEIGHT */}
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Official Chargeable Weight
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    Max(Scale, Volumetric)
                  </span>
                </div>

                <div className="mt-2 text-center py-2">
                  <div className="font-mono font-black text-3xl text-emerald-950">
                    {metrics.billableWeightKg} <span className="text-lg">kg</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 mt-1">
                    {metrics.isVolumetricHigher ? 'Billed on Dimensional Volume' : 'Billed on Actual Scale Weight'}
                  </div>
                </div>
              </div>

              {/* Package category & recommendation */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 space-y-1 text-[11px]">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">Package Type:</span>
                  <span className="text-slate-900">{metrics.packageCategory}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">Courier Tier:</span>
                  <span className="text-indigo-700 font-mono">{metrics.estimatedFreightTier}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                  {metrics.packagingRecommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer text-xs"
          >
            Close
          </button>

          {onApply && (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Apply Dimensions to Product</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
