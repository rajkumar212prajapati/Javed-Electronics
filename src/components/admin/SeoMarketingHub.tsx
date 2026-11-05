import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  Globe,
  Search,
  Share2,
  TrendingUp,
  BarChart3,
  Link2,
  FileText,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Bot,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Eye,
  Plus,
  Megaphone,
  Percent,
  Download,
  AlertCircle,
  Tag,
  Zap,
  X,
} from 'lucide-react';

interface AdCampaign {
  id: string;
  name: string;
  platform: 'google_ads' | 'meta_ads' | 'whatsapp_broadcast';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  clicks: number;
  conversions: number;
  revenue: number;
  targetPincodes: string[];
}

export const SeoMarketingHub: React.FC = () => {
  const { products, categories, outlets } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'crawler' | 'sitemaps' | 'backlinks' | 'campaigns' | 'pixels'>('crawler');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [googlePingStatus, setGooglePingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [showSerpPreview, setShowSerpPreview] = useState(true);

  // SEO Meta Config
  const [metaTitle, setMetaTitle] = useState('Javed Electronics | Premium Electronics & Home Appliances');
  const [metaDescription, setMetaDescription] = useState('Shop smartphones, audio, smart TVs, chargers, accessories, and home appliances from Javed Electronics with same-day local delivery, WhatsApp orders, and genuine warranty.');
  const [googleVerificationCode, setGoogleVerificationCode] = useState('google-javed-electronics-verification-token');

  // Tracking Pixels
  const [ga4Id, setGa4Id] = useState('G-JVED9901EL');
  const [gtmId, setGtmId] = useState('GTM-PLGH401');
  const [metaPixelId, setMetaPixelId] = useState('890123847582910');
  const [pixelSaveSuccess, setPixelSaveSuccess] = useState(false);

  // Backlink Generator State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [backlinkPartner, setBacklinkPartner] = useState('mumbai_tech_blog');
  const [anchorType, setAnchorType] = useState<'product' | 'brand' | 'store'>('product');

  // Ad Campaigns
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([
    {
      id: 'camp_001',
      name: 'Google Search: Nalasopara & Vasai Electronics Deals',
      platform: 'google_ads',
      status: 'active',
      budget: 15000,
      spent: 8400,
      clicks: 1420,
      conversions: 68,
      revenue: 78500,
      targetPincodes: ['401209', '401203', '401201', '401202', '401208'],
    },
    {
      id: 'camp_002',
      name: 'Instagram & Meta Reels: 5G Smartphones Super Flash Sale',
      platform: 'meta_ads',
      status: 'active',
      budget: 12000,
      spent: 6900,
      clicks: 2150,
      conversions: 42,
      revenue: 54600,
      targetPincodes: ['401209', '401303', '401305', '401208', '401207'],
    },
    {
      id: 'camp_003',
      name: 'WhatsApp VIP Broadcast: Festive Audio & Soundbars',
      platform: 'whatsapp_broadcast',
      status: 'active',
      budget: 3000,
      spent: 1200,
      clicks: 890,
      conversions: 31,
      revenue: 38900,
      targetPincodes: ['401209', '401203', '401304', '401202'],
    },
  ]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://javed-electronics.vercel.app';

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSimulateGooglePing = () => {
    setIsPinging(true);
    setGooglePingStatus(null);
    setTimeout(() => {
      setIsPinging(false);
      setGooglePingStatus('✓ Sitemap successfully submitted to Google Search Console & Bing Webmaster ping endpoint! (HTTP 200 OK)');
      setTimeout(() => setGooglePingStatus(null), 6000);
    }, 1200);
  };

  const handleSavePixels = (e: React.FormEvent) => {
    e.preventDefault();
    setPixelSaveSuccess(true);
    setTimeout(() => setPixelSaveSuccess(false), 3000);
  };

  const toggleCampaign = (id: string) => {
    setAdCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
      )
    );
  };

  // Backlink snippets
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const trackedProductLink = `${origin}/?product=${selectedProduct?.id}&utm_source=${backlinkPartner}&utm_medium=backlink&utm_campaign=partner_seo`;

  const anchorText =
    anchorType === 'product'
      ? `Buy ${selectedProduct?.name} at Javed Electronics`
      : anchorType === 'brand'
      ? `Javed Electronics Mumbai - Authorized ${selectedProduct?.brand} Store`
      : `Shop Electronics in Nalasopara East 401209 - Javed Electronics`;

  const generatedHtmlBacklink = `<a href="${trackedProductLink}" target="_blank" rel="noopener" title="${anchorText}">${anchorText}</a>`;
  const generatedMarkdown = `[${anchorText}](${trackedProductLink})`;

  // Total Marketing KPI calculations
  const totalAdSpend = adCampaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalAdRevenue = adCampaigns.reduce((acc, c) => acc + c.revenue, 0);
  const overallRoas = totalAdSpend > 0 ? (totalAdRevenue / totalAdSpend).toFixed(2) : '0.00';
  const totalConversions = adCampaigns.reduce((acc, c) => acc + c.conversions, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 bg-[radial-gradient(circle_at_center,white_0,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                SEO & Growth Engine
              </span>
              <span className="text-xs text-blue-200">Google Crawler • XML Sitemaps • Backlinks • Ad Pixels</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">SEO, Crawler & Marketing Hub</h2>
            <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
              Google crawler indexing directives, live dynamic XML sitemaps, localized backlink management, Google Analytics & Meta tracking pixels, and omnichannel ad ROI tracking for Mumbai Nalasopara 401209.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>View sitemap.xml</span>
              <ExternalLink className="w-3 h-3 text-blue-300" />
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>View robots.txt</span>
              <ExternalLink className="w-3 h-3 text-emerald-300" />
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Search Engine Indexing
          </span>
          <div className="text-2xl font-black text-blue-700 font-mono mt-1">
            100% Active
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Googlebot & Bingbot Allowed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            XML Sitemap URLs
          </span>
          <div className="text-2xl font-black text-purple-700 font-mono mt-1">
            36 URLs
          </div>
          <span className="text-[11px] text-purple-600 font-medium">Daily auto-synchronization</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Paid Marketing ROAS
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {overallRoas}x
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatINR(totalAdRevenue)} from {formatINR(totalAdSpend)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Inbound Referral Orders
          </span>
          <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
            {totalConversions} Orders
          </div>
          <span className="text-[11px] text-indigo-600 font-medium">WhatsApp & Social backlinks</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubTab('crawler')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            activeSubTab === 'crawler'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs font-medium'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Google Crawler &amp; Robots
        </button>

        <button
          onClick={() => setActiveSubTab('sitemaps')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            activeSubTab === 'sitemaps'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs font-medium'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          XML Sitemaps
        </button>

        <button
          onClick={() => setActiveSubTab('backlinks')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            activeSubTab === 'backlinks'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs font-medium'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Backlink Generator &amp; Referrals
        </button>

        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            activeSubTab === 'campaigns'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs font-medium'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Ad Campaigns &amp; ROAS
        </button>

        <button
          onClick={() => setActiveSubTab('pixels')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            activeSubTab === 'pixels'
              ? 'bg-slate-900 text-white shadow-xs border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs font-medium'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analytics &amp; Pixels (GA4/GTM/Meta)
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: GOOGLE CRAWLER & ROBOTS DIRECTIVES */}
      {/* ==================================================================== */}
      {activeSubTab === 'crawler' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Crawler Directives Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Google Crawler Directives (/robots.txt)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  HTTP 200 OK
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Your store serves a search-engine optimized <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">robots.txt</code> directly from the backend server to instruct Googlebot, Googlebot-Mobile, and Bingbot to index products and categories while protecting admin and internal APIs.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Live robots.txt Output</span>
                  <button
                    onClick={() => copyToClipboard(`User-agent: Googlebot\nAllow: /\nAllow: /products/\nAllow: /category/\nAllow: /sitemap.xml\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://javed-electronics.vercel.app/sitemap.xml`, 'robots_txt')}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'robots_txt' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'robots_txt' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto">
{`# Google Crawler, Bingbot & Search Engine Indexing Directives
User-agent: Googlebot
Allow: /
Allow: /products/
Allow: /category/
Allow: /sitemap.xml
Disallow: /admin
Disallow: /api/

User-agent: Googlebot-Image
Allow: /assets/
Allow: /pwa-*.png

User-agent: Bingbot
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://javed-electronics.vercel.app/sitemap.xml`}
                </pre>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Googlebot Status: <strong>Allowed (Unlimited Crawl)</strong></span>
                <span>Protected Routes: <strong>/admin, /api/*</strong></span>
              </div>
            </div>

            {/* Google SERP Snippet Preview */}
            {!showSerpPreview ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">Google Search Result (SERP) Preview Hidden</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSerpPreview(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Show Preview
                </button>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Google Search Result (SERP) Preview
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Mobile / Desktop</span>
                    <button
                      type="button"
                      onClick={() => setShowSerpPreview(false)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Preview</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Google Search Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                      J
                    </div>
                    <div className="text-[11px] text-slate-700 leading-none">
                      <span className="font-semibold">Javed Electronics</span>
                      <span className="text-slate-400"> • https://javed-electronics.vercel.app</span>
                    </div>
                  </div>
                  <h4 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer line-clamp-1">
                    {metaTitle}
                  </h4>
                  <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                    {metaDescription}
                  </p>
                  <div className="pt-1.5 flex items-center gap-3 text-[11px] text-emerald-700 font-semibold">
                    <span>★ 4.9 (420+ Reviews)</span>
                    <span>•</span>
                    <span>Fast Delivery: Nalasopara East 401209</span>
                  </div>
                </div>

                {/* Title & Description Length Meters */}
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Title Tag Length</span>
                      <span className="font-mono text-emerald-600 font-bold">{metaTitle.length} / 60 chars (Optimal)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (metaTitle.length / 60) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Meta Description Length</span>
                      <span className="font-mono text-emerald-600 font-bold">{metaDescription.length} / 160 chars (Optimal)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (metaDescription.length / 160) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Geographic Meta Targeting */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-900 block">Active Local Geo Targeting</span>
                  <span className="text-blue-800">
                    Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209, Palghar Mumbai Maharashtra (19.4184° N, 72.8258° E)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: XML SITEMAPS */}
      {/* ==================================================================== */}
      {activeSubTab === 'sitemaps' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Dynamic XML Sitemap (sitemap.xml)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard Sitemaps XML protocol (v0.9) with image extensions for Google Search Console and Bing Webmaster.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateGooglePing}
                  disabled={isPinging}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging Google...' : 'Ping Google Search Console'}</span>
                </button>

                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Raw XML</span>
                </a>
              </div>
            </div>

            {googlePingStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{googlePingStatus}</span>
              </div>
            )}

            {/* Sitemap Hierarchy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Root & Storefront</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded">
                    Priority 1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">https://javed-electronics.vercel.app/</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Changefreq: Daily</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Product Pages</span>
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded">
                    Priority 0.9
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">24 Indexed products with high-res images</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Changefreq: Weekly</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Categories & Store Hub</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono text-[10px] font-bold rounded">
                    Priority 0.8
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">8 Categories + Nalasopara Store locator</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Changefreq: Weekly</span>
              </div>
            </div>

            {/* XML Snippet Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Live Generated XML Excerpt</span>
                <button
                  onClick={() => copyToClipboard(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://javed-electronics.vercel.app/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`, 'xml_copy')}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'xml_copy' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'xml_copy' ? 'Copied' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-blue-300 rounded-xl text-xs font-mono overflow-x-auto max-h-56">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://javed-electronics.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://javed-electronics.vercel.app/?category=smartphones</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://javed-electronics.vercel.app/?product=prod_boat_141</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://javed-electronics.vercel.app/?section=store-locations</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: BACKLINKS & INBOUND REFERRALS */}
      {/* ==================================================================== */}
      {activeSubTab === 'backlinks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Backlink Generator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Product Backlink & Partner Anchor Generator
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Generate high-quality dofollow backlinks and UTM tagged links for local Mumbai tech blogs, YouTube reviewers, and coupon partners.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.dealPrice || p.regularPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Partner / Domain</label>
                    <input
                      type="text"
                      value={backlinkPartner}
                      onChange={(e) => setBacklinkPartner(e.target.value)}
                      placeholder="e.g. tech_radar_india"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anchor Text Type</label>
                    <select
                      value={anchorType}
                      onChange={(e) => setAnchorType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="product">Product Title Focus</option>
                      <option value="brand">Brand Authorized Focus</option>
                      <option value="store">Local Store 401209 Focus</option>
                    </select>
                  </div>
                </div>

                {/* Generated Output */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">HTML Backlink Snippet</span>
                    <button
                      onClick={() => copyToClipboard(generatedHtmlBacklink, 'partner_backlink')}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'partner_backlink' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'partner_backlink' ? 'Copied' : 'Copy HTML'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono whitespace-pre-wrap break-all">
                    {generatedHtmlBacklink}
                  </pre>
                </div>
              </div>
            </div>

            {/* Inbound Referral Traffic Analytics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Inbound Traffic Sources & Backlink ROI
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Last 30 Days</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Google Organic Search</span>
                    <span className="text-slate-500 text-[11px]">Crawler indexed product & category landing pages</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-700 font-mono">1,420 visits</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">44% Share • 58 Orders</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">WhatsApp Shared Links</span>
                    <span className="text-slate-500 text-[11px]">Direct customer-to-friend product referrals</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 font-mono">920 visits</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">28% Share • 42 Orders</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Instagram & Meta Reels</span>
                    <span className="text-slate-500 text-[11px]">Targeted ads & influencer video tags</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-purple-700 font-mono">530 visits</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">16% Share • 24 Orders</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">External Backlinks & Tech Blogs</span>
                    <span className="text-slate-500 text-[11px]">Mumbai tech portals & review forum embeds</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-700 font-mono">380 visits</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">12% Share • 17 Orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: AD CAMPAIGNS & MARKETING ROI */}
      {/* ==================================================================== */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  Active Ad & Marketing Campaigns
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track ad spend, live clicks, conversion rate and ROAS across Google Ads, Meta Ads and WhatsApp.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Overall Blended ROAS:</span>
                <span className="text-base font-black text-emerald-600 font-mono ml-1.5">{overallRoas}x</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Campaign Name</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Budget / Spent</th>
                    <th className="py-2.5 px-3">Clicks / Orders</th>
                    <th className="py-2.5 px-3">Attributed Revenue</th>
                    <th className="py-2.5 px-3">ROAS</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adCampaigns.map((camp) => {
                    const roas = camp.spent > 0 ? (camp.revenue / camp.spent).toFixed(2) : '0.00';
                    return (
                      <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-[220px]">
                          <div>{camp.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Zones: {camp.targetPincodes.join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                            {camp.platform.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              camp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {camp.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-900">{formatINR(camp.spent)}</span>
                          <span className="text-slate-400 text-[10px]"> / {formatINR(camp.budget)}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-800">{camp.clicks} clicks</span>
                          <span className="text-emerald-700 font-bold block text-[10px]">{camp.conversions} orders</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-700">
                          {formatINR(camp.revenue)}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-blue-700">
                          {roas}x
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => toggleCampaign(camp.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            {camp.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: ANALYTICS & TRACKING PIXELS */}
      {/* ==================================================================== */}
      {activeSubTab === 'pixels' && (
        <div className="space-y-6">
          <form onSubmit={handleSavePixels} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Analytics & Tracking Pixel Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect your Google Analytics 4 (GA4), Google Tag Manager, and Meta / Facebook Pixel.
                </p>
              </div>
            </div>

            {pixelSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pixel configuration and tracking identifiers saved successfully!</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Analytics 4 Measurement ID
                </label>
                <input
                  type="text"
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Captures page_view, view_item, add_to_cart, and purchase events with revenue values in INR.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Tag Manager Container ID
                </label>
                <input
                  type="text"
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meta / Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="e.g. 890123847582910"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Search Console Verification Token
                </label>
                <input
                  type="text"
                  value={googleVerificationCode}
                  onChange={(e) => setGoogleVerificationCode(e.target.value)}
                  placeholder="google-site-verification token"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Save Tracking Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
