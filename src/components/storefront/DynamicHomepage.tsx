import React from 'react';
import { useStore } from '../../context/StoreContext';
import { FestiveBaseSection } from './sections/FestiveBaseSection';
import { SaleBaseSection } from './sections/SaleBaseSection';
import { CategoryBasedSection } from './sections/CategoryBasedSection';
import { PriceSaleBaseSection } from './sections/PriceSaleBaseSection';
import { BrandBaseSection } from './sections/BrandBaseSection';
import { ComboBaseSection } from './sections/ComboBaseSection';
import { OfferBaseSection } from './sections/OfferBaseSection';
import { ActivityBasedSection } from './sections/ActivityBasedSection';
import { LikeBasedSection } from './sections/LikeBasedSection';
import { HomepageSectionType } from '../../types';

export const DynamicHomepage: React.FC = () => {
  const { homepageSettings } = useStore();

  // Sort enabled sections by order
  const sortedSections = [...homepageSettings.sections]
    .filter((sec) => sec.isEnabled)
    .sort((a, b) => a.order - b.order);

  const renderSection = (type: HomepageSectionType) => {
    switch (type) {
      case 'festive_base':
        return <FestiveBaseSection key="festive_base" />;
      case 'sale_base':
        return <SaleBaseSection key="sale_base" />;
      case 'category_based':
        return <CategoryBasedSection key="category_based" />;
      case 'price_sale_base':
        return <PriceSaleBaseSection key="price_sale_base" />;
      case 'brand_base':
        return <BrandBaseSection key="brand_base" />;
      case 'combo_base':
        return <ComboBaseSection key="combo_base" />;
      case 'offer_base':
        return <OfferBaseSection key="offer_base" />;
      case 'activity_based':
        return <ActivityBasedSection key="activity_based" />;
      case 'like_based':
        return <LikeBasedSection key="like_based" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-2 sm:space-y-4">
      {sortedSections.map((sec) => renderSection(sec.id))}
    </div>
  );
};
