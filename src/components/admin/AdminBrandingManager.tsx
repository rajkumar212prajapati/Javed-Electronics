import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { BrandingSettings, BrandingTheme } from '../../types';
import {
  Palette,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building2,
  Sliders,
  Type,
  Layout,
  Globe,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Upload,
  Smartphone,
  Monitor,
  ExternalLink,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ShoppingCart,
  Heart,
  Star,
  MessageCircle,
  X,
} from 'lucide-react';

const CURATED_PALETTES = [
  {
    name: 'Royal Blue & Amber (Default)',
    primary: '#1d4ed8',
    secondary: '#0f172a',
    accent: '#f59e0b',
    desc: 'Trustworthy, authoritative electronics retail aesthetic',
  },
  {
    name: 'Emerald Green & Honey Gold',
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#eab308',
    desc: 'Fresh, organic, quick-commerce and consumer tech feel',
  },
  {
    name: 'Midnight Obsidian & Cyber Cyan',
    primary: '#0891b2',
    secondary: '#090d16',
    accent: '#06b6d4',
    desc: 'Modern flagship digital dark-luxe vibe',
  },
  {
    name: 'Velvet Crimson & Slate',
    primary: '#dc2626',
    secondary: '#18181b',
    accent: '#f97316',
    desc: 'Energetic festival sale and mega discounts tone',
  },
  {
    name: 'Amethyst Purple & Sunset Coral',
    primary: '#7c3aed',
    secondary: '#1e1b4b',
    accent: '#f43f5e',
    desc: 'Premium lifestyle, audio, and personal gadget flair',
  },
  {
    name: 'Oceanic Teal & Mango',
    primary: '#0d9488',
    secondary: '#134e4a',
    accent: '#fb923c',
    desc: 'Approachable, warm community retail experience',
  },
];

export const AdminBrandingManager: React.FC = () => {
  const {
    brandingSettings,
    brandingHistory,
    updateBrandingSettings,
    rollbackBrandingSettings,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // Local form state for real-time live preview before saving
  const [brandName, setBrandName] = useState(brandingSettings.brandName);
  const [tagline, setTagline] = useState(brandingSettings.tagline);
  const [logoUrl, setLogoUrl] = useState(brandingSettings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(brandingSettings.faviconUrl || '');
  const [supportPhone, setSupportPhone] = useState(brandingSettings.supportPhone);
  const [supportWhatsApp, setSupportWhatsApp] = useState(brandingSettings.supportWhatsApp);
  const [supportEmail, setSupportEmail] = useState(brandingSettings.supportEmail);
  const [businessAddress, setBusinessAddress] = useState(brandingSettings.businessAddress);
  const [gstin, setGstin] = useState(brandingSettings.gstin);
  const [pan, setPan] = useState(brandingSettings.pan);
  const [promotionalTicker, setPromotionalTicker] = useState(brandingSettings.promotionalTicker);
  const [heroHeadline, setHeroHeadline] = useState(brandingSettings.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(brandingSettings.heroSubheadline);
  const [footerAbout, setFooterAbout] = useState(brandingSettings.footerAbout);
  const [businessHours, setBusinessHours] = useState(brandingSettings.businessHours);
  const [socialInstagram, setSocialInstagram] = useState(brandingSettings.socialLinks?.instagram || '');
  const [socialFacebook, setSocialFacebook] = useState(brandingSettings.socialLinks?.facebook || '');
  const [socialYoutube, setSocialYoutube] = useState(brandingSettings.socialLinks?.youtube || '');

  // Theme controls
  const [primaryColor, setPrimaryColor] = useState(brandingSettings.theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(brandingSettings.theme.secondaryColor);
  const [accentColor, setAccentColor] = useState(brandingSettings.theme.accentColor);
  const [fontFamily, setFontFamily] = useState(brandingSettings.theme.fontFamily);
  const [borderRadius, setBorderRadius] = useState(brandingSettings.theme.borderRadius);
  const [themeMode, setThemeMode] = useState(brandingSettings.theme.mode);

  // Navigation and view tabs
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('Updated theme styling, brand colors & contact parameters');
  const [copiedLink, setCopiedLink] = useState(false);

  // Computed brand initials for monogram
  const previewInitials = useMemo(() => {
    return (
      brandName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'JE'
    );
  }, [brandName]);

  // Handle local logo file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('File size exceeds 2MB limit. Please select a smaller logo.');
        return;
      }
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick palette preset application
  const applyPalette = (pal: typeof CURATED_PALETTES[0]) => {
    setPrimaryColor(pal.primary);
    setSecondaryColor(pal.secondary);
    setAccentColor(pal.accent);
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage('Only Super Admin is authorized to modify platform branding and legal information.');
      return;
    }
    setErrorMessage(null);

    const updatedSettings: Partial<BrandingSettings> = {
      brandName,
      tagline,
      logoUrl,
      faviconUrl,
      supportPhone,
      supportWhatsApp,
      supportEmail,
      businessAddress,
      gstin,
      pan,
      promotionalTicker,
      heroHeadline,
      heroSubheadline,
      footerAbout,
      businessHours,
      socialLinks: {
        instagram: socialInstagram,
        facebook: socialFacebook,
        youtube: socialYoutube,
      },
      theme: {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        borderRadius,
        mode: themeMode,
      },
    };

    updateBrandingSettings(updatedSettings, changeReason);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Rollback to prior version
  const handleRollback = (ver: number) => {
    if (!isSuperAdmin) return;
    rollbackBrandingSettings(ver);
    const target = brandingHistory.find((h) => h.version === ver);
    if (target) {
      const snap = target.settingsSnapshot;
      setBrandName(snap.brandName);
      setTagline(snap.tagline);
      setLogoUrl(snap.logoUrl);
      setFaviconUrl(snap.faviconUrl || '');
      setSupportPhone(snap.supportPhone);
      setSupportWhatsApp(snap.supportWhatsApp);
      setSupportEmail(snap.supportEmail);
      setBusinessAddress(snap.businessAddress);
      setGstin(snap.gstin);
      setPan(snap.pan);
      setPromotionalTicker(snap.promotionalTicker);
      setHeroHeadline(snap.heroHeadline);
      setHeroSubheadline(snap.heroSubheadline);
      setFooterAbout(snap.footerAbout);
      setBusinessHours(snap.businessHours);
      setPrimaryColor(snap.theme.primaryColor);
      setSecondaryColor(snap.theme.secondaryColor);
      setAccentColor(snap.theme.accentColor);
      setFontFamily(snap.theme.fontFamily);
      setBorderRadius(snap.theme.borderRadius);
      setThemeMode(snap.theme.mode);
    }
  };

  // Export Theme JSON
  const handleExportJson = () => {
    const payload = {
      brandName,
      tagline,
      logoUrl,
      supportPhone,
      supportWhatsApp,
      supportEmail,
      businessAddress,
      gstin,
      pan,
      theme: {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        borderRadius,
        mode: themeMode,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `branding-theme-${brandName.toLowerCase().replace(/\s+/g, '-')}-v${brandingSettings.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Top Banner & Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Centralized Theme Architecture
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Active Version: v{brandingSettings.version}.0
            </span>
            {isSuperAdmin ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Super Admin Authorized</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Read-Only (Manager Mode)</span>
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
            <Palette className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Admin Branding, Theming & Identity Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Customize the storefront logo, primary/secondary/accent color palette, typography font, announcement ticker, hero banner, customer helpline, and legal GSTIN details with instantaneous live preview and rollback support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                activeTab === 'editor' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theme Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Real-Time Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Versions ({brandingHistory.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportJson}
            title="Download JSON config"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Branding settings published successfully! Theme colors, logo, and contact details are live across all storefront portals.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: THEME & BRANDING EDITOR WITH SIDE-BY-SIDE LIVE PREVIEW CARD */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Quick Palette Presets Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Designer Curated Palettes</span>
              </label>
              <span className="text-[11px] text-slate-400">Click to apply palette instantly</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CURATED_PALETTES.map((pal) => {
                const isSelected =
                  primaryColor.toLowerCase() === pal.primary.toLowerCase() &&
                  secondaryColor.toLowerCase() === pal.secondary.toLowerCase();
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => applyPalette(pal)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: pal.primary }} />
                      <div className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: pal.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: pal.accent }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pal.name.split(' (')[0]}</span>
                    <span className="text-[9px] text-slate-400 line-clamp-1">{pal.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Form Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION A: BRAND IDENTITY & LOGO */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>1. Brand Identity & Logo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Brand / Store Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Javed Electronics"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Premium Consumer Electronics & Express Delivery"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Logo URL and Local File Upload */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Storefront Logo Source (Image URL or File Upload)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Live Logo Thumbnail */}
                    <div className="w-12 h-12 rounded-lg border border-slate-300 bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div
                          className="w-full h-full rounded text-white flex items-center justify-center font-extrabold text-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {previewInitials}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png (or upload below)"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer transition-colors border border-blue-200">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Logo File (PNG/SVG)</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="text-xs text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Clear Image (Use Monogram)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    If no logo image is provided, the platform automatically renders a sleek branded monogram with initials "{previewInitials}" in your primary color.
                  </p>
                </div>
              </div>

              {/* SECTION B: COLOR PALETTE & TYPOGRAPHY */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>2. Color Palette & Typography</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Primary Color */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full font-mono text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Buttons, Brand Headers, Main CTAs</span>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full font-mono text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Ticker Bar, Footers, Hero Gradients</span>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Accent Highlight</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full font-mono text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Discount Pills, Star Ratings, Highlights</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Typography Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern)</option>
                      <option value="Inter">Inter (Clean Tech)</option>
                      <option value="Roboto">Roboto (Google Standard)</option>
                      <option value="Poppins">Poppins (Friendly Geometric)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Corner Radius</label>
                    <select
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="rounded-md">Medium (rounded-md)</option>
                      <option value="rounded-lg">Standard (rounded-lg)</option>
                      <option value="rounded-xl">Curved (rounded-xl)</option>
                      <option value="rounded-2xl">Pill (rounded-2xl)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Theme Mode</label>
                    <select
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="light">Light Mode (Storefront Default)</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">Follow Device System</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION C: CONTACT DETAILS & BUSINESS CREDENTIALS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>3. Contact Details & Official Credentials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Customer Helpline Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+91 98390 12345"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      WhatsApp Support / Order Number
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={supportWhatsApp}
                        onChange={(e) => setSupportWhatsApp(e.target.value)}
                        placeholder="+91 98390 12345"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Official Support Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@javed-electronics.in"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Operating Hours</label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        placeholder="Mon - Sun: 10:00 AM - 09:30 PM"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Storefront Physical Headquarters Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={2}
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Shop 09, Sai Dham Apt, Vijaynagar, Nalasopara East, Palghar, Mumbai, Maharashtra - 401209"
                      className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="09AAACJ1234F1Z5"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Business PAN Card</label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      placeholder="AAACJ1234F"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: STOREFRONT COPY & MESSAGING */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Layout className="w-4 h-4 text-blue-600" />
                  <span>4. Storefront Copy & Messaging</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Top Announcement Ticker Banner
                  </label>
                  <input
                    type="text"
                    value={promotionalTicker}
                    onChange={(e) => setPromotionalTicker(e.target.value)}
                    placeholder="Festive Tech Dhamaka: Up to 60% OFF + 4-Hr Delivery in Lucknow"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hero Banner Headline</label>
                    <input
                      type="text"
                      value={heroHeadline}
                      onChange={(e) => setHeroHeadline(e.target.value)}
                      placeholder="Festive Electronics Mega Sale 2026"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hero Banner Subheadline</label>
                    <input
                      type="text"
                      value={heroSubheadline}
                      onChange={(e) => setHeroSubheadline(e.target.value)}
                      placeholder="Get genuine smartphones & appliances delivered in 4 hours."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Footer About Synopsis</label>
                  <textarea
                    rows={2}
                    value={footerAbout}
                    onChange={(e) => setFooterAbout(e.target.value)}
                    placeholder="Serving our local community in Lucknow with genuine smartphones and home appliances..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* SAVE / PUBLISH BAR */}
              <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Audit Note / Reason for Update
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g. Changed festival headline and primary accent color"
                    className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={!isSuperAdmin}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer min-h-[40px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Publish Changes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Real-Time Interactive Live Preview */}
            <div className="lg:col-span-5 space-y-4">
              {!showLivePreview ? (
                <div className="sticky top-20 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Live Storefront Preview Hidden</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Show Preview
                  </button>
                </div>
              ) : (
                <div className="sticky top-20 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Real-Time Storefront Preview
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex bg-slate-100 p-0.5 rounded text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-2 py-1 rounded cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-2 py-1 rounded cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLivePreview(false)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        title="Close Live Preview"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Changes made in the editor render here instantly on every keystroke:
                  </p>

                {/* Viewport Card Container */}
                <div
                  className={`border border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-inner space-y-3 p-2.5 transition-all ${
                    previewDevice === 'mobile' ? 'max-w-[340px] mx-auto ring-4 ring-slate-800 rounded-3xl' : 'w-full'
                  }`}
                  style={{ fontFamily }}
                >
                  {/* Mock Announcement Ticker */}
                  <div
                    className="text-white text-[10px] py-1 px-2.5 rounded flex items-center justify-between transition-colors"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
                      <span className="truncate font-medium">{promotionalTicker || 'Festive Offer Live'}</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-80 shrink-0">{supportPhone}</span>
                  </div>

                  {/* Mock Navigation Header */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="w-7 h-7 object-contain rounded shrink-0 border" />
                      ) : (
                        <div
                          className="w-7 h-7 rounded text-white flex items-center justify-center font-extrabold text-xs shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {previewInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 block truncate leading-tight">
                          {brandName.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate leading-tight">
                          {tagline || 'Electronics Retail'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`text-white text-[10px] font-bold px-2.5 py-1 ${borderRadius} shrink-0 cursor-default`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      Cart (3)
                    </button>
                  </div>

                  {/* Mock Hero Banner */}
                  <div
                    className="p-3.5 rounded-xl text-white relative overflow-hidden space-y-1.5 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
                    }}
                  >
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full inline-block"
                      style={{ backgroundColor: accentColor, color: '#0f172a' }}
                    >
                      Festive Dhamaka
                    </span>
                    <h4 className="text-xs sm:text-sm font-black leading-tight">{heroHeadline}</h4>
                    <p className="text-[10px] text-slate-200 line-clamp-2">{heroSubheadline}</p>
                    <div className="pt-1 flex gap-1.5">
                      <button
                        type="button"
                        className={`text-[10px] font-bold px-2.5 py-1 ${borderRadius} cursor-default`}
                        style={{ backgroundColor: accentColor, color: '#0f172a' }}
                      >
                        Shop Best Deals
                      </button>
                    </div>
                  </div>

                  {/* Mock Product Card */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-md shrink-0 flex items-center justify-center text-slate-400 text-[10px] font-bold border">
                      Item
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-700">4.8</span>
                        <span
                          className="text-[9px] font-bold px-1 rounded ml-1"
                          style={{ backgroundColor: `${accentColor}25`, color: primaryColor }}
                        >
                          22% OFF
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 block truncate">
                        OnePlus Nord CE 3 Lite 5G
                      </span>
                      <span className="text-xs font-black" style={{ color: primaryColor }}>
                        ₹17,999
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`text-white text-[10px] font-bold px-2.5 py-1.5 ${borderRadius} shrink-0 cursor-default shadow-xs`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Mock Footer Details */}
                  <div className="bg-slate-900 text-slate-400 p-2.5 rounded-lg text-[9px] space-y-1">
                    <div className="text-white font-bold text-[10px]">{brandName}</div>
                    <div className="truncate">{businessAddress}</div>
                    <div className="flex justify-between text-[8px] text-slate-400 pt-0.5">
                      <span>GSTIN: {gstin}</span>
                      <span>Phone: {supportPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(false)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Preview</span>
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FULL REAL-TIME EXPANDED PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Expanded Real-Time Storefront Preview</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-width rendering of the brand header, announcement bar, hero section, and footer as customers will see it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono bg-slate-100 px-2.5 py-1 rounded font-bold text-slate-700">
                Font: {fontFamily}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Preview</span>
              </button>
            </div>
          </div>

          <div className="space-y-4" style={{ fontFamily }}>
            {/* Announcement Ticker */}
            <div
              className="text-white text-xs py-2 px-4 rounded-xl flex items-center justify-between shadow-xs transition-colors"
              style={{ backgroundColor: secondaryColor }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                <span className="font-medium text-xs">{promotionalTicker}</span>
              </div>
              <span className="text-[11px] font-mono opacity-80 hidden sm:inline">{supportPhone}</span>
            </div>

            {/* Header */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-200" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg text-white flex items-center justify-center font-extrabold text-sm shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {previewInitials}
                  </div>
                )}
                <div>
                  <span className="font-black text-lg text-slate-900 tracking-tight block">
                    {brandName.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{tagline}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className={`px-4 py-2 text-white font-bold text-xs ${borderRadius} shadow-sm cursor-default`}
                  style={{ backgroundColor: primaryColor }}
                >
                  Shopping Cart (2 Items)
                </button>
              </div>
            </div>

            {/* Hero Banner */}
            <div
              className="p-8 rounded-2xl text-white relative overflow-hidden space-y-3 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
              }}
            >
              <span
                className="px-3 py-1 text-xs font-black uppercase rounded-full inline-block shadow-xs"
                style={{ backgroundColor: accentColor, color: '#0f172a' }}
              >
                Limited Festive Deal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black max-w-xl">{heroHeadline}</h1>
              <p className="text-sm text-slate-200 max-w-xl leading-relaxed">{heroSubheadline}</p>
              <div className="pt-2 flex gap-3">
                <button
                  className={`px-5 py-2.5 font-bold text-xs ${borderRadius} shadow-md cursor-default`}
                  style={{ backgroundColor: accentColor, color: '#0f172a' }}
                >
                  Browse Deals Now
                </button>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-950 text-slate-300 p-6 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <h4 className="text-white font-black text-sm">{brandName}</h4>
                  <p className="text-slate-400 text-xs">{footerAbout}</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white">Contact & Support:</div>
                  <div>Phone: {supportPhone}</div>
                  <div>WhatsApp: {supportWhatsApp}</div>
                  <div>Email: {supportEmail}</div>
                  <div>Hours: {businessHours}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex flex-wrap justify-between text-[11px] text-slate-500">
                <span>Address: {businessAddress}</span>
                <span>GSTIN: {gstin}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERSION HISTORY & ROLLBACK AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Branding & Theme Version Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every published change is automatically snapshot. Super Admin can restore any historical version with 1-click.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Palette</th>
                  <th className="px-4 py-3">Change Summary</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brandingHistory.map((entry) => {
                  const isCurrent = entry.version === brandingSettings.version;
                  const snap = entry.settingsSnapshot;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        v{entry.version}.0
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: snap.theme.primaryColor }}
                            title={`Primary: ${snap.theme.primaryColor}`}
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: snap.theme.secondaryColor }}
                            title={`Secondary: ${snap.theme.secondaryColor}`}
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: snap.theme.accentColor }}
                            title={`Accent: ${snap.theme.accentColor}`}
                          />
                          <span className="text-[10px] font-mono text-slate-500 ml-1">
                            {snap.theme.fontFamily.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{entry.changeSummary}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.changedBy}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {entry.timestamp ? entry.timestamp.replace('T', ' ').slice(0, 16) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSuperAdmin && !isCurrent && (
                          <button
                            onClick={() => handleRollback(entry.version)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-semibold text-xs cursor-pointer flex items-center gap-1 ml-auto transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Rollback</span>
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
      )}
    </div>
  );
};
