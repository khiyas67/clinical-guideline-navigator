import React from 'react';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    'General',
    'Diabetes',
    'Cardiovascular',
    'Hypertension',
    'Infectious Disease',
    'Medications',
    'Diagnosis',
    'Treatment',
    'Other',
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
      <span className="text-xs font-bold text-[#716588] shrink-0 mr-1 hidden sm:inline">
        Category:
      </span>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-[#4a189a] text-white shadow-xs'
                : 'bg-white hover:bg-purple-50 text-[#5a4d70] border border-purple-100 hover:border-purple-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
