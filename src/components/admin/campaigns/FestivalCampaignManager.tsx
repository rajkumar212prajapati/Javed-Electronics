import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  FestivalCampaignRecord,
  CampaignStatus,
  ComputedCampaignStatus,
  CampaignThemeColors,
  CampaignValidationResult,
} from '../../../types/festivalCampaign';
import {
  fetchFestivalCampaigns,
  persistFestivalCampaign,
  duplicateCampaignRecord,
  validateCampaign,
  computeCampaignStatus,
  formatKolkataDateTime,
  DEFAULT_TIMEZONE,
  selectActiveFestivalCampaign,
} from '../../../services/festivalCampaignService';
import { testSupabaseConnection, isSupabaseConfigured } from '../../../services/supabaseClient';
import {
  Sparkles,
  Plus,
  Copy,
  Archive,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Monitor,
  ExternalLink,
  ShieldAlert,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Gift,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const FestivalCampaignManager: React.FC = () => {
  const { products, categories, setActiveModal } = useStore();

  const [campaignsList, setCampaignsList] = useState<FestivalCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<{ checked: boolean; ok: boolean; message: string }>({
    checked: false,
    ok: false,
    message: '',
  });

  // Modal states
  const [editingCampaign, setEditingCampaign] = useState<Partial<FestivalCampaignRecord> | null>(null);
  const [isNewCampaign, setIsNewCampaign] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [previewCampaign, setPreviewCampaign] = useState<FestivalCampaignRecord | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load campaigns & check database connection
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFestivalCampaigns();
      setCampaignsList(data);

      const dbCheck = await testSupabaseConnection();
      setSupabaseStatus({ checked: true, ok: dbCheck.ok, message: dbCheck.message });
    } catch (err: any) {
      showNotification('Failed to load campaigns: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live computed statuses for each campaign
  const enrichedCampaigns = useMemo(() => {
    const now = new Date();
    return campaignsList.map((c) => ({
      ...c,
      computed_status: computeCampaignStatus(c, now),
    }));
  }, [campaignsList]);

  // Active live campaign according to deterministic selection rules
  const activeLiveCampaign = useMemo(() => {
    return selectActiveFestivalCampaign(campaignsList, new Date());
  }, [campaignsList]);

  // Filtered view
  const filteredCampaigns = useMemo(() => {
    if (filterStatus === 'all') return enrichedCampaigns;
    return enrichedCampaigns.filter((c) => c.computed_status === filterStatus || c.status === filterStatus);
  }, [enrichedCampaigns, filterStatus]);

  // Handler: Open new campaign form
  const handleOpenCreateModal = () => {
    const now = new Date();
    // Default start now, end in 7 days
    const startIso = now.toISOString().slice(0, 16);
    const endIso = new Date(now.getTime() + 86400000 * 7).toISOString().slice(0, 16);

    setEditingCampaign({
      id: `camp-${Date.now()}`,
      name: '',
      festival_name: 'Diwali',
      slug: '',
      description: '',
      status: 'draft',
      priority: 5,
      start_at: startIso,
      end_at: endIso,
      timezone: DEFAULT_TIMEZONE,
      theme_colors: {
        primary: '#b45309',
        secondary: '#451a03',
        accent: '#fbbf24',
        style: 'diwali',
      },
      desktop_banner_url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1920&q=80',
      mobile_banner_url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=800&q=80',
      hero_headline: '',
      hero_subtitle: '',
      badge_text: 'FESTIVE UTSAV',
      cta_text: 'Explore Festival Offers',
      cta_destination: '#products-section',
      coupon_code: '',
      discount_percentage: 10,
      min_cart_value: 999,
      gift_packaging_enabled: true,
      gift_packaging_note: 'Complimentary festive gift packaging and greeting card included!',
      featured_category_ids: ['smartphones', 'audio'],
      featured_product_ids: products.slice(0, 4).map((p) => p.id),
    });
    setIsNewCampaign(true);
    setValidationErrors({});
    setValidationWarnings([]);
  };

  // Handler: Edit existing campaign
  const handleOpenEditModal = (camp: FestivalCampaignRecord) => {
    setEditingCampaign({
      ...camp,
      start_at: new Date(camp.start_at).toISOString().slice(0, 16),
      end_at: new Date(camp.end_at).toISOString().slice(0, 16),
    });
    setIsNewCampaign(false);
    setValidationErrors({});
    setValidationWarnings([]);
  };

  // Handler: Save campaign (create or update)
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    // Convert local datetime-local format back to standard ISO
    const startDate = new Date(editingCampaign.start_at || '');
    const endDate = new Date(editingCampaign.end_at || '');

    const recordToSave: FestivalCampaignRecord = {
      id: editingCampaign.id || `camp-${Date.now()}`,
      name: editingCampaign.name?.trim() || '',
      festival_name: editingCampaign.festival_name?.trim() || 'Festival',
      slug:
        editingCampaign.slug?.trim() ||
        (editingCampaign.name || 'festive').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString().slice(-4)}`,
      description: editingCampaign.description || '',
      status: editingCampaign.status || 'draft',
      priority: Number(editingCampaign.priority || 1),
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      timezone: DEFAULT_TIMEZONE,
      theme_colors: editingCampaign.theme_colors || {
        primary: '#b45309',
        secondary: '#451a03',
        accent: '#fbbf24',
        style: 'diwali',
      },
      desktop_banner_url: editingCampaign.desktop_banner_url || '',
      mobile_banner_url: editingCampaign.mobile_banner_url || undefined,
      hero_headline: editingCampaign.hero_headline?.trim() || '',
      hero_subtitle: editingCampaign.hero_subtitle?.trim() || '',
      badge_text: editingCampaign.badge_text?.trim() || 'FESTIVE SPECIAL',
      cta_text: editingCampaign.cta_text?.trim() || 'Shop Festival Deals',
      cta_destination: editingCampaign.cta_destination || '#products-section',
      coupon_code: editingCampaign.coupon_code?.trim().toUpperCase() || undefined,
      discount_percentage: Number(editingCampaign.discount_percentage || 0),
      min_cart_value: Number(editingCampaign.min_cart_value || 0),
      gift_packaging_enabled: Boolean(editingCampaign.gift_packaging_enabled),
      gift_packaging_note: editingCampaign.gift_packaging_note || undefined,
      featured_category_ids: editingCampaign.featured_category_ids || [],
      featured_product_ids: editingCampaign.featured_product_ids || [],
      created_at: editingCampaign.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Validate
    const validation = validateCampaign(recordToSave, campaignsList);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      return;
    }

    try {
      const res = await persistFestivalCampaign(recordToSave);
      if (res.success) {
        showNotification(`Campaign "${recordToSave.name}" saved successfully.`);
        setEditingCampaign(null);
        await loadData();
      }
    } catch (err: any) {
      showNotification('Save failed: ' + err.message, 'error');
    }
  };

  // Handler: Duplicate campaign
  const handleDuplicate = async (source: FestivalCampaignRecord) => {
    const clone = duplicateCampaignRecord(source);
    try {
      await persistFestivalCampaign(clone);
      showNotification(`Duplicated "${source.name}" as new draft.`);
      await loadData();
    } catch (err: any) {
      showNotification('Duplicate failed: ' + err.message, 'error');
    }
  };

  // Handler: Toggle Publish / Unpublish
  const handleTogglePublish = async (camp: FestivalCampaignRecord) => {
    const newStatus: CampaignStatus = camp.status === 'published' ? 'draft' : 'published';
    const updated: FestivalCampaignRecord = { ...camp, status: newStatus };

    const validation = validateCampaign(updated, campaignsList);
    if (!validation.isValid && newStatus === 'published') {
      showNotification(Object.values(validation.errors).join(', '), 'error');
      return;
    }

    try {
      await persistFestivalCampaign(updated);
      showNotification(
        newStatus === 'published'
          ? `Campaign "${camp.name}" published! It will be live when schedule matches.`
          : `Campaign "${camp.name}" unpublished (switched to Draft).`
      );
      await loadData();
    } catch (err: any) {
      showNotification('Status update failed: ' + err.message, 'error');
    }
  };

  // Handler: Archive campaign
  const handleArchive = async (camp: FestivalCampaignRecord) => {
    const updated: FestivalCampaignRecord = { ...camp, status: 'archived' };
    try {
      await persistFestivalCampaign(updated);
      showNotification(`Campaign "${camp.name}" archived.`);
      await loadData();
    } catch (err: any) {
      showNotification('Archive failed: ' + err.message, 'error');
    }
  };

  // Helper status color badges
  const getStatusBadge = (status: ComputedCampaignStatus) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            LIVE ON HOMEPAGE
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            SCHEDULED
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            DRAFT (HIDDEN)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            EXPIRED
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ARCHIVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Supabase Connection Health Status */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
              FESTIVAL CAMPAIGN AUTOMATION
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Timezone: {DEFAULT_TIMEZONE}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
            Festival Homepage Campaign Architect
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automate festive promotions (Diwali, Eid, Holi, Navratri, New Year) with priority-based homepage switching, live countdown timers, and Supabase database synchronization.
          </p>

          {/* Supabase status indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300">Database:</span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Connected
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Local Resilient Mode (Supabase offline/not configured)
              </span>
            )}
            <button
              onClick={loadData}
              className="text-[11px] text-blue-300 underline hover:text-white cursor-pointer ml-2"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Live Authority Status Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Live Homepage Campaign (Authority Status)
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
              {activeLiveCampaign ? (
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeLiveCampaign.name} (Priority {activeLiveCampaign.priority})
                </span>
              ) : (
                <span className="text-slate-500">
                  No active festival campaign scheduled right now. Default homepage is showing.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeLiveCampaign && (
            <button
              onClick={() => {
                setPreviewCampaign(activeLiveCampaign);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live View</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All Campaigns (${campaignsList.length})` },
          { id: 'live', label: 'Live Now' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'draft', label: 'Drafts' },
          { id: 'expired', label: 'Expired' },
          { id: 'archived', label: 'Archived' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === f.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading festival campaigns from database...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No campaigns found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create your first festival campaign to automate your homepage during Diwali, Eid, or Holi.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Create New Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                camp.computed_status === 'live'
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Left Info Column */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {camp.name}
                  </h3>
                  {getStatusBadge(camp.computed_status || 'draft')}
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Festival: {camp.festival_name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Priority: {camp.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1">
                  {camp.hero_headline}
                </p>

                {/* Schedule & Timing in Asia/Kolkata */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Start: <strong>{formatKolkataDateTime(camp.start_at)}</strong>
                  </span>
                  <span>→</span>
                  <span>
                    End: <strong>{formatKolkataDateTime(camp.end_at)}</strong>
                  </span>
                  {camp.coupon_code && (
                    <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                      Coupon: {camp.coupon_code} ({camp.discount_percentage}% OFF)
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>
                    Categories: <strong>{camp.featured_category_ids?.length || 0}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Products: <strong>{camp.featured_product_ids?.length || 0}</strong>
                  </span>
                  {camp.gift_packaging_enabled && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Free Gift Packaging Enabled</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  onClick={() => setPreviewCampaign(camp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Preview on desktop/mobile"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(camp)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDuplicate(camp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Duplicate as new draft"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                {camp.status !== 'archived' && (
                  <button
                    onClick={() => handleTogglePublish(camp)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      camp.status === 'published'
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {camp.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                )}

                {camp.status !== 'archived' && (
                  <button
                    onClick={() => handleArchive(camp)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Archive Campaign"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isNewCampaign ? 'Create Festival Campaign' : `Edit Campaign: ${editingCampaign.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure scheduling, festive banners, theme colors, and product showcases in Asia/Kolkata timezone.
                </p>
              </div>
              <button
                onClick={() => setEditingCampaign(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Scheduling Warnings:</span>
                </div>
                {validationWarnings.map((w, idx) => (
                  <p key={idx}>{w}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
              {/* Section 1: Campaign Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Internal Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Tech Dhamaka 2026"
                    value={editingCampaign.name || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                  {validationErrors.name && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Festival Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali / Eid / Holi"
                    value={editingCampaign.festival_name || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, festival_name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Section 2: Timezone & Scheduling */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 block">
                  Authoritative Schedule (Asia/Kolkata Timezone)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Start Date & Time (IST) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCampaign.start_at || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, start_at: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg bg-white font-mono"
                    />
                    {validationErrors.start_at && (
                      <span className="text-rose-600 text-[10px] font-bold">{validationErrors.start_at}</span>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      End Date & Time (IST) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCampaign.end_at || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, end_at: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg bg-white font-mono"
                    />
                    {validationErrors.end_at && (
                      <span className="text-rose-600 text-[10px] font-bold">{validationErrors.end_at}</span>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Priority Rank (Higher Wins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingCampaign.priority ?? 5}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, priority: Number(e.target.value) })
                      }
                      className="w-full p-2 border rounded-lg bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Default: 5</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Visual Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Theme Preset
                  </label>
                  <select
                    value={editingCampaign.theme_colors?.style || 'diwali'}
                    onChange={(e) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        theme_colors: {
                          ...(editingCampaign.theme_colors || { primary: '', secondary: '', accent: '' }),
                          style: e.target.value as any,
                        },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="diwali">Diwali (Golden / Amber / Maroon)</option>
                    <option value="eid">Eid Mubarak (Emerald / Gold / Teal)</option>
                    <option value="holi">Holi Color Fest (Pink / Orange / Purple)</option>
                    <option value="navratri">Navratri (Fiery Red / Saffron)</option>
                    <option value="new_year">New Year (Sky Blue / Midnight)</option>
                    <option value="royal_gold">Royal Gold Luxe</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.badge_text || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, badge_text: e.target.value })
                    }
                    placeholder="e.g. DIWALI DHAMAKA"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Publish Status
                  </label>
                  <select
                    value={editingCampaign.status || 'draft'}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, status: e.target.value as any })
                    }
                    className="w-full p-2 border rounded-lg bg-white font-bold"
                  >
                    <option value="draft">Draft (Hidden from customers)</option>
                    <option value="published">Published (Live during schedule)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Creative Banners & Headline */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hero Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Tech Utsav: Flat 15% Extra Savings & Free Gifts"
                    value={editingCampaign.hero_headline || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, hero_headline: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                  {validationErrors.hero_headline && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.hero_headline}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Supporting details on 100% genuine electronics, official warranty, delivery..."
                    value={editingCampaign.hero_subtitle || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, hero_subtitle: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Desktop Banner Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={editingCampaign.desktop_banner_url || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, desktop_banner_url: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mobile Banner Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingCampaign.mobile_banner_url || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, mobile_banner_url: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Deals & Gift Packaging */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="DIWALI2026"
                    value={editingCampaign.coupon_code || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, coupon_code: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingCampaign.discount_percentage ?? 10}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, discount_percentage: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Min Cart Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCampaign.min_cart_value ?? 999}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, min_cart_value: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Gift packaging */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-950 block">Complimentary Gift Packaging Perk</span>
                  <span className="text-[11px] text-amber-800">
                    Offers shoppers a free festive gold-embossed gift box and ribbon at checkout.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(editingCampaign.gift_packaging_enabled)}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, gift_packaging_enabled: e.target.checked })
                  }
                  className="w-5 h-5 text-amber-600 rounded"
                />
              </div>

              {/* Section 6: Existing Catalog Featured Products Selector (no record duplication) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Select Featured Catalog Products ({editingCampaign.featured_product_ids?.length || 0} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50">
                  {products.map((p) => {
                    const isSelected = editingCampaign.featured_product_ids?.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none ${
                          isSelected
                            ? 'bg-amber-100 border-amber-400 font-bold text-amber-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(isSelected)}
                          onChange={(e) => {
                            const cur = editingCampaign.featured_product_ids || [];
                            const next = e.target.checked
                              ? [...cur, p.id]
                              : cur.filter((id) => id !== p.id);
                            setEditingCampaign({ ...editingCampaign, featured_product_ids: next });
                          }}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {formatINR(p.dealPrice || p.regularPrice)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESKTOP & MOBILE PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Top Bar with viewport switcher & close */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Campaign Live Preview:</span>
              <span className="text-amber-300 font-mono text-xs">{previewCampaign.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded ${
                    previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop View</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded ${
                    previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile View</span>
                </button>
              </div>

              <button
                onClick={() => setPreviewCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            className={`w-full overflow-y-auto bg-slate-100 rounded-2xl shadow-2xl transition-all duration-300 border border-slate-700 ${
              previewDevice === 'mobile'
                ? 'max-w-sm h-[750px] border-8 border-slate-800 rounded-[36px] overflow-x-hidden'
                : 'max-w-5xl h-[85vh]'
            }`}
          >
            {/* Embedded Preview Banner */}
            <div className="p-3">
              <div
                className="relative overflow-hidden rounded-2xl text-white p-5 shadow-lg border"
                style={{
                  background: `linear-gradient(135deg, ${previewCampaign.theme_colors?.secondary || '#020617'} 0%, ${previewCampaign.theme_colors?.primary || '#b45309'} 100%)`,
                }}
              >
                <span className="inline-block px-2.5 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/40 rounded-full text-[10px] font-bold uppercase mb-2">
                  {previewCampaign.badge_text || 'FESTIVE SALE'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black">{previewCampaign.hero_headline}</h1>
                <p className="text-xs text-slate-200 mt-1">{previewCampaign.hero_subtitle}</p>

                {previewCampaign.coupon_code && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-lg text-xs">
                    <span className="text-slate-400 text-[10px]">Code:</span>
                    <span className="font-mono font-bold text-amber-300">{previewCampaign.coupon_code}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Products in Preview */}
            <div className="p-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Featured {previewCampaign.festival_name} Showcase:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(previewCampaign.featured_product_ids || []).slice(0, 4).map((pid) => {
                  const p = products.find((prod) => prod.id === pid);
                  if (!p) return null;
                  return (
                    <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-50 mb-1.5">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 block truncate">{p.name}</span>
                      <span className="text-xs font-black text-rose-600 font-mono">
                        {formatINR(p.dealPrice || p.regularPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
