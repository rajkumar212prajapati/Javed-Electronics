import React from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  Activity,
  Briefcase,
  Gamepad2,
  Tv,
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ActivityItem } from '../../../types';

export const ActivityBasedSection: React.FC = () => {
  const {
    homepageSettings,
    activeActivityFilter,
    setActiveActivityFilter,
    setSelectedCategory,
    setSearchQuery,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'activity_based');
  const activities = homepageSettings.activities.filter((a) => a.isActive);

  if (!section || !section.isEnabled) return null;

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return <Activity className="w-5 h-5 text-white" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-white" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-white" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-white" />;
      case 'Compass':
      default:
        return <Compass className="w-5 h-5 text-white" />;
    }
  };

  const handleSelectActivity = (act: ActivityItem) => {
    if (activeActivityFilter === act.id) {
      setActiveActivityFilter(null);
      setSelectedCategory('all');
      setSearchQuery('');
    } else {
      setActiveActivityFilter(act.id);
      if (act.categoryFilter && act.categoryFilter !== 'all') {
        setSelectedCategory(act.categoryFilter);
      }
      if (act.keywords && act.keywords.length > 0) {
        setSearchQuery(act.keywords[0]);
      }
      const target = document.getElementById('products-section-anchor');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              {section.badge || 'LIFESTYLE'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {section.subtitle}
          </p>
        </div>

        {activeActivityFilter && (
          <button
            onClick={() => {
              setActiveActivityFilter(null);
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            Clear Activity Filter ✕
          </button>
        )}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {activities.map((act) => {
          const isSelected = activeActivityFilter === act.id;

          return (
            <div
              key={act.id}
              onClick={() => handleSelectActivity(act)}
              className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer border relative select-none group ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-rose-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Icon Container */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${act.bgGradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  {getActivityIcon(act.iconName)}
                </div>
                {act.badge && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {act.badge}
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h3
                  className={`text-sm sm:text-base font-extrabold tracking-tight ${
                    isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'
                  }`}
                >
                  {act.name}
                </h3>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {act.tagline}
                </p>
              </div>

              {/* Status Action */}
              <div className="mt-3 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[10px] font-semibold">
                <span className={isSelected ? 'text-rose-400' : 'text-slate-400'}>
                  {isSelected ? 'Active Filter' : 'Shop Gear'}
                </span>
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
