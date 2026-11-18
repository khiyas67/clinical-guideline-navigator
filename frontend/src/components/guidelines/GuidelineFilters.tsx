import React from 'react';
import type { GuidelineCategory } from '../../types/guideline';

interface GuidelineFiltersProps {
  selectedCategory: GuidelineCategory;
  onSelectCategory: (category: GuidelineCategory) => void;
  countsByCategory?: Record<string, number>;
  categories?: string[];
}

const DEFAULT_CATEGORIES: string[] = [
  'All',
  'Nephrology',
  'Pain Management',
  'Endocrinology',
  'Diabetes',
  'Cardiovascular',
  'Hypertension',
  'Infectious Disease',
  'General',
  'Unclassified',
];

export const GuidelineFilters: React.FC<GuidelineFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  countsByCategory = {},
  categories = DEFAULT_CATEGORIES,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
      {categories.map((category) => {
        const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
        const count = countsByCategory[category];

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-[#5b21b6] text-white shadow-sm shadow-purple-900/15 ring-2 ring-[#5b21b6]/20'
                : 'bg-white text-[#6b5f83] hover:text-[#2d1b4e] hover:bg-purple-50/70 border border-purple-100/80 shadow-2xs'
            }`}
          >
            <span>{category}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-purple-100/70 text-[#6b5f83]'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
