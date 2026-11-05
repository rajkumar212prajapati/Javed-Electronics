import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  FestivalCampaignRecord,
  CampaignStatus,
  ComputedCampaignStatus,
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
import {
  Sparkles,
  Plus,
  Copy,
  Archive,
  Eye,
  Edit2,
  Clock,
  AlertTriangle,
  Smartphone,
  Monitor,
  Calendar,
  X,
} from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const FestivalCampaignManager: React.FC = () => {
  const { products } = useStore();

  const [campaignsList, setCampaignsList] = useState<FestivalCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFestivalCampaigns();
      setCampaignsList(data);
    } catch (err: any) {
      showNotification('Failed to load campaigns: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enrichedCampaigns = useMemo(() => {
    const now = new Date();
    return campaignsList.map((c) => ({
      ...c,
      computed_status: computeCampaignStatus(c, now),
    }));
  }, [campaignsList]);

  const activeLiveCampaign = useMemo(() => {
    return selectActiveFestivalCampaign(campaignsList, new Date());
  }, [campaignsList]);

  const filteredCampaigns = useMemo(() => {
    if (filterStatus === 'all') return enrichedCampaigns;
    return enrichedCampaigns.filter((c) => c.computed_status === filterStatus || c.status === filterStatus);
  }, [enrichedCampaigns, filterStatus]);

  const handleOpenCreateModal = () => {
    const now = new Date();
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
      badge_text: 'FESTIVE SALE',
      cta_text: 'Shop Deals',
      cta_destination: '#products-section',
      coupon_code: '',
      discount_percentage: 10,
      min_cart_value: 999,
      gift_packaging_enabled: true,
      gift_packaging_note: 'Complimentary gift packaging included',
      featured_category_ids: ['smartphones', 'audio'],
      featured_product_ids: products.slice(0, 4).map((p) => p.id),
    });
    setIsNewCampaign(true);
    setValidationErrors({});
    setValidationWarnings([]);
  };

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

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

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
      badge_text: editingCampaign.badge_text?.trim() || 'FESTIVE SALE',
      cta_text: editingCampaign.cta_text?.trim() || 'Shop Deals',
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

    const validation = validateCampaign(recordToSave, campaignsList);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      return;
    }

    try {
      const res = await persistFestivalCampaign(recordToSave);
      if (res.success) {
        showNotification(`Campaign "${recordToSave.name}" saved.`);
        setEditingCampaign(null);
        await loadData();
      }
    } catch (err: any) {
      showNotification('Save failed: ' + err.message, 'error');
    }
  };

  const handleDuplicate = async (source: FestivalCampaignRecord) => {
    const clone = duplicateCampaignRecord(source);
    try {
      await persistFestivalCampaign(clone);
      showNotification(`Duplicated "${source.name}".`);
      await loadData();
    } catch (err: any) {
      showNotification('Duplicate failed: ' + err.message, 'error');
    }
  };

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
          ? `Campaign "${camp.name}" published.`
          : `Campaign "${camp.name}" switched to draft.`
      );
      await loadData();
    } catch (err: any) {
      showNotification('Status update failed: ' + err.message, 'error');
    }
  };

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

  const getStatusBadge = (status: ComputedCampaignStatus) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Live
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Scheduled
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Expired
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Archived
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Festive Campaigns
          </h2>
          {activeLiveCampaign && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active: {activeLiveCampaign.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeLiveCampaign && (
            <button
              onClick={() => setPreviewCampaign(activeLiveCampaign)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Active</span>
            </button>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All (${campaignsList.length})` },
          { id: 'live', label: 'Live' },
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
                ? 'bg-slate-900 text-white'
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
          Loading campaigns...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
          <Sparkles className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No campaigns found</h3>
          <button
            onClick={handleOpenCreateModal}
            className="mt-3 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {camp.name}
                  </h3>
                  {getStatusBadge(camp.computed_status || 'draft')}
                  <span className="text-xs text-slate-500 font-medium">
                    • {camp.festival_name}
                  </span>
                </div>

                {camp.hero_headline && (
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {camp.hero_headline}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatKolkataDateTime(camp.start_at)} — {formatKolkataDateTime(camp.end_at)}
                  </span>
                  {camp.coupon_code && (
                    <span className="text-slate-700 font-mono font-semibold">
                      Code: {camp.coupon_code} ({camp.discount_percentage}% OFF)
                    </span>
                  )}
                  <span>
                    Products: {camp.featured_product_ids?.length || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  onClick={() => setPreviewCampaign(camp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(camp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDuplicate(camp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                {camp.status !== 'archived' && (
                  <button
                    onClick={() => handleTogglePublish(camp)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      camp.status === 'published'
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {camp.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                )}

                {camp.status !== 'archived' && (
                  <button
                    onClick={() => handleArchive(camp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT FULL-SCREEN MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isNewCampaign ? 'Create Festive Campaign' : `Edit Campaign: ${editingCampaign.name}`}
            </h3>
            <button
              onClick={() => setEditingCampaign(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveCampaign} className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-5 text-xs">
              {validationWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Schedule Notice</span>
                  </div>
                  {validationWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {/* Campaign Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Sale 2026"
                    value={editingCampaign.name || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                  {validationErrors.name && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Festival *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Diwali / Eid / Holi"
                    value={editingCampaign.festival_name || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, festival_name: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingCampaign.start_at || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, start_at: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  {validationErrors.start_at && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.start_at}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingCampaign.end_at || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, end_at: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  {validationErrors.end_at && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.end_at}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingCampaign.priority ?? 5}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, priority: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              {/* Theme & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Theme
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="diwali">Diwali</option>
                    <option value="eid">Eid</option>
                    <option value="holi">Holi</option>
                    <option value="navratri">Navratri</option>
                    <option value="new_year">New Year</option>
                    <option value="royal_gold">Royal Gold</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.badge_text || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, badge_text: e.target.value })
                    }
                    placeholder="FESTIVE SALE"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingCampaign.status || 'draft'}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, status: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Banners & Headline */}
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Campaign headline"
                    value={editingCampaign.hero_headline || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, hero_headline: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                  />
                  {validationErrors.hero_headline && (
                    <span className="text-rose-600 text-[10px] font-bold">{validationErrors.hero_headline}</span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Subtitle
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional subtitle"
                    value={editingCampaign.hero_subtitle || ''}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, hero_subtitle: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Desktop Banner URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={editingCampaign.desktop_banner_url || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, desktop_banner_url: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mobile Banner URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingCampaign.mobile_banner_url || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, mobile_banner_url: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Coupon & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingCampaign.discount_percentage ?? 10}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, discount_percentage: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Gift Packaging */}
              <label className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-800">Complimentary Gift Packaging</span>
                <input
                  type="checkbox"
                  checked={Boolean(editingCampaign.gift_packaging_enabled)}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, gift_packaging_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-slate-900 rounded"
                />
              </label>

              {/* Featured Products */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Featured Products ({editingCampaign.featured_product_ids?.length || 0} selected)
                </label>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50">
                  {products.map((p) => {
                    const isSelected = editingCampaign.featured_product_ids?.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none ${
                          isSelected
                            ? 'bg-white border-slate-900 font-semibold text-slate-900'
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
                          className="w-4 h-4 text-slate-900 rounded"
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
            </div>

            <div className="max-w-4xl mx-auto flex justify-end gap-2 pt-5 mt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex flex-col">
          <div className="w-full flex items-center justify-between gap-2 bg-slate-900 border-b border-slate-800 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">{previewCampaign.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewCampaign(null)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex justify-center">
            <div
              className={`w-full overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 ${
                previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-5xl'
              }`}
            >
              <div className="p-4">
                <div
                  className="relative overflow-hidden rounded-xl text-white p-5 border"
                  style={{
                    background: `linear-gradient(135deg, ${previewCampaign.theme_colors?.secondary || '#020617'} 0%, ${previewCampaign.theme_colors?.primary || '#b45309'} 100%)`,
                  }}
                >
                  {previewCampaign.badge_text && (
                    <span className="inline-block px-2 py-0.5 bg-white/15 text-white rounded text-[10px] font-bold uppercase mb-2">
                      {previewCampaign.badge_text}
                    </span>
                  )}
                  <h1 className="text-xl sm:text-2xl font-black">{previewCampaign.hero_headline}</h1>
                  {previewCampaign.hero_subtitle && (
                    <p className="text-xs text-slate-200 mt-1">{previewCampaign.hero_subtitle}</p>
                  )}

                  {previewCampaign.coupon_code && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-slate-950/70 px-2.5 py-1 rounded-lg text-xs">
                      <span className="text-slate-300 text-[10px]">Code:</span>
                      <span className="font-mono font-bold text-amber-300">{previewCampaign.coupon_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <h3 className="text-xs font-bold text-slate-800 mb-2">
                  Featured Products
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(previewCampaign.featured_product_ids || []).slice(0, 4).map((pid) => {
                    const p = products.find((prod) => prod.id === pid);
                    if (!p) return null;
                    return (
                      <div key={p.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="w-full h-24 rounded-md overflow-hidden bg-slate-50 mb-1.5">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 block truncate">{p.name}</span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {formatINR(p.dealPrice || p.regularPrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
