import React from 'react';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { FestivalHeroBanner } from './FestivalHeroBanner';
import { FestivalFeaturedCategories } from './FestivalFeaturedCategories';
import { FestivalFeaturedProducts } from './FestivalFeaturedProducts';
import { FestivalPromoSection } from './FestivalPromoSection';
import { Eye, AlertCircle } from 'lucide-react';

interface Props {
  activeCampaign: FestivalCampaignRecord | null;
  previewCampaign?: FestivalCampaignRecord | null;
  onExitPreview?: () => void;
}

export const FestivalHomepage: React.FC<Props> = ({
  activeCampaign,
  previewCampaign,
  onExitPreview,
}) => {
  const campaignToDisplay = previewCampaign || activeCampaign;

  if (!campaignToDisplay) {
    return null; // Fallback to default homepage
  }

  return (
    <div className="w-full space-y-2 sm:space-y-4">
      {/* Admin Preview Mode Floating Notice */}
      {previewCampaign && (
        <div className="sticky top-0 z-40 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>
              Previewing Campaign: <strong>{previewCampaign.name}</strong> ({previewCampaign.status.toUpperCase()} - {previewCampaign.computed_status})
            </span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* Festival Hero Banner */}
      <FestivalHeroBanner campaign={campaignToDisplay} />

      {/* Featured Categories */}
      <FestivalFeaturedCategories campaign={campaignToDisplay} />

      {/* Promotional Shelves */}
      <FestivalPromoSection campaign={campaignToDisplay} />

      {/* Curated Festival Products */}
      <FestivalFeaturedProducts campaign={campaignToDisplay} />
    </div>
  );
};
