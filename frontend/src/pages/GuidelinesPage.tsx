import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, AlertCircle, BookOpen, X, Plus } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { GuidelineCard } from '../components/guidelines/GuidelineCard';
import { GuidelineFilters } from '../components/guidelines/GuidelineFilters';
import { AddGuidelineModal } from '../components/guidelines/AddGuidelineModal';
import { getGuidelines } from '../lib/guidelines';
import type { Guideline } from '../types/guideline';

// Helper function to extract array of categories from comma/semicolon/pipe separated string
export function getGuidelineCategories(category?: string | null): string[] {
  if (!category || !category.trim()) return ['Unclassified'];
  return category
    .split(/[,;/|]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export const GuidelinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);

  // Sync category with URL search parameters
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    } else if (!cat && selectedCategory !== 'All') {
      setSelectedCategory('All');
    }
  }, [searchParams]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === 'All') {
        next.delete('category');
      } else {
        next.set('category', cat);
      }
      return next;
    });
  };

  // Load guidelines from Supabase
  const loadGuidelinesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await getGuidelines();
      if (fetchErr) {
        setError('Unable to load guidelines.');
      } else {
        setGuidelines(data);
      }
    } catch {
      setError('Unable to load guidelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuidelinesData();
  }, []);

  // Compute canonical + dynamic categories present in the database
  const categoriesList = useMemo(() => {
    const canonical = [
      'All',
      'Nephrology',
      'Pain Management',
      'Endocrinology',
      'Diabetes',
      'Cardiovascular',
      'Hypertension',
      'Infectious Disease',
      'General',
    ];
    const categorySet = new Set<string>(canonical);

    guidelines.forEach((g) => {
      getGuidelineCategories(g.category).forEach((c) => {
        if (c.toLowerCase() === 'unclassified') {
          categorySet.add('Unclassified');
        } else {
          categorySet.add(c);
        }
      });
    });

    return Array.from(categorySet);
  }, [guidelines]);

  // Compute category counts for filter buttons
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      All: guidelines.length,
    };

    categoriesList.forEach((cat) => {
      if (cat === 'All') return;
      if (cat === 'Unclassified') {
        counts[cat] = guidelines.filter((g) => {
          const cats = getGuidelineCategories(g.category).map((c) => c.toLowerCase());
          return cats.includes('unclassified') || !g.category;
        }).length;
      } else {
        counts[cat] = guidelines.filter((g) => {
          const cats = getGuidelineCategories(g.category).map((c) => c.toLowerCase());
          return cats.includes(cat.trim().toLowerCase());
        }).length;
      }
    });

    return counts;
  }, [guidelines, categoriesList]);

  // Client-side instant filter across title, organization, category, description
  const filteredGuidelines = useMemo(() => {
    let result = guidelines;

    // Filter by Category
    if (selectedCategory !== 'All') {
      if (selectedCategory.toLowerCase() === 'unclassified') {
        result = result.filter((g) => {
          const cats = getGuidelineCategories(g.category).map((c) => c.toLowerCase());
          return cats.includes('unclassified') || !g.category;
        });
      } else {
        result = result.filter((g) => {
          const cats = getGuidelineCategories(g.category).map((c) => c.toLowerCase());
          return cats.includes(selectedCategory.trim().toLowerCase());
        });
      }
    }

    // Filter by Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((g) => {
        const titleMatch = g.title.toLowerCase().includes(query);
        const orgMatch = g.organization.toLowerCase().includes(query);
        const catMatch = g.category?.toLowerCase().includes(query);
        const descMatch = g.description?.toLowerCase().includes(query);
        const versionMatch = g.version?.toLowerCase().includes(query);
        return titleMatch || orgMatch || catMatch || descMatch || versionMatch;
      });
    }

    return result;
  }, [guidelines, selectedCategory, searchQuery]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b122e] tracking-tight">
              Clinical Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-[#665a7c] mt-1">
              Explore trusted clinical guidance and evidence sources.
            </p>
          </div>

          {/* Search Guidelines & Add Button */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-[#8a7d9e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guidelines..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-purple-100/90 rounded-xl text-[#1b122e] placeholder:text-[#9e92b3] focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/25 focus:border-[#5b21b6] transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-bold whitespace-nowrap shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guideline</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/80 pb-4">
          <GuidelineFilters
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            countsByCategory={countsByCategory}
            categories={categoriesList}
          />

          <div className="text-xs text-[#716588] shrink-0 font-medium self-end sm:self-center">
            Showing <span className="font-bold text-[#1b122e]">{filteredGuidelines.length}</span> of{' '}
            <span className="font-bold text-[#1b122e]">{guidelines.length}</span> sources
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          /* Loading State: 4 Skeleton Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs animate-pulse flex flex-col justify-between h-64"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-5 w-20 bg-purple-100/70 rounded-lg"></div>
                    <div className="h-5 w-24 bg-emerald-100/60 rounded-full"></div>
                  </div>
                  <div className="h-5 w-4/5 bg-purple-100/70 rounded-md mb-2"></div>
                  <div className="h-4 w-3/5 bg-purple-50 rounded-md mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-purple-50 rounded"></div>
                    <div className="h-3 w-5/6 bg-purple-50 rounded"></div>
                    <div className="h-3 w-2/3 bg-purple-50 rounded"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-purple-50 flex justify-between items-center">
                  <div className="h-4 w-20 bg-purple-50 rounded"></div>
                  <div className="h-7 w-24 bg-purple-100/60 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl p-10 border border-rose-100 shadow-xs text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1b122e] mb-1">Unable to load guidelines.</h3>
            <p className="text-xs sm:text-sm text-[#716588] mb-6">
              There was a problem communicating with the guideline database.
            </p>
            <button
              type="button"
              onClick={loadGuidelinesData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5b21b6] text-white text-xs font-semibold hover:bg-[#4c1d95] transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </div>
        ) : guidelines.length === 0 ? (
          /* Empty State: No guidelines in database */
          <div className="bg-white rounded-2xl p-12 border border-purple-100 shadow-xs text-center max-w-lg mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-[#5b21b6] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#1b122e] mb-2">No clinical guidelines available</h3>
            <p className="text-xs sm:text-sm text-[#716588] max-w-sm mx-auto leading-relaxed">
              Verified guideline sources will appear here once they are added.
            </p>
          </div>
        ) : filteredGuidelines.length === 0 ? (
          /* Empty State: Search or category filter produces no matches */
          <div className="bg-white rounded-2xl p-12 border border-purple-100 shadow-xs text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1b122e] mb-1">
              {searchQuery
                ? `No guidelines matching "${searchQuery}"`
                : `No guidelines in ${selectedCategory}`}
            </h3>
            <p className="text-xs sm:text-sm text-[#716588] mb-5">
              {selectedCategory !== 'All'
                ? `No clinical guidelines are currently cataloged under "${selectedCategory}".`
                : 'Try adjusting your search terms or filters.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-[#5b21b6] text-white hover:bg-[#4c1d95] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                View All Guidelines
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-[#5b21b6] text-xs font-semibold border border-purple-100 transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Grid of Guideline Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredGuidelines.map((guideline) => (
              <GuidelineCard key={guideline.id} guideline={guideline} />
            ))}
          </div>
        )}

        {/* Quality Controlled Add Guideline Modal */}
        <AddGuidelineModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={loadGuidelinesData}
        />
      </div>
    </AppLayout>
  );
};
