import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { ItemCard } from '@/components/items/ItemCard';
import { CategoryFilter } from '@/components/items/CategoryFilter';
import { mockItems } from '@/data/mockData';
import { Category } from '@/types';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} />

      <main className="container py-6">
        {/* Hero Section */}
        <section className="mb-8 rounded-2xl gradient-hero p-8 text-primary-foreground animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Student Marketplace</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 md:text-4xl">
            Buy & Sell Within Your Campus
          </h1>
          <p className="opacity-90 max-w-lg">
            Find great deals on textbooks, electronics, furniture, and more from fellow students at your university.
          </p>
        </section>

        {/* Filters */}
        <section className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Browse by category
          </h2>
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </section>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">
            {selectedCategory
              ? `${filteredItems.length} items in ${selectedCategory}`
              : `${filteredItems.length} items available`}
          </h2>
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              No items found
            </p>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
