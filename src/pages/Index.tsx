import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ItemCard } from '@/components/items/ItemCard';
import { CategoryFilter } from '@/components/items/CategoryFilter';
import { FilterPanel } from '@/components/items/FilterPanel';
import { mockItems } from '@/data/mockData';
import { Category, Condition } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

function PersonalizedGreeting() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <p className="text-lg text-muted-foreground mb-2">
        <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to personalize your experience
      </p>
    );
  }

  const displayName = profile?.first_name || user.email?.split('@')[0] || 'there';

  return (
    <p className="text-lg text-primary font-medium mb-2">
      Hello {displayName}!
    </p>
  );
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  
  const maxPrice = useMemo(() => Math.max(...mockItems.map((item) => item.price)), []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);

  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || item.category === selectedCategory;

      const matchesCondition =
        selectedConditions.length === 0 || selectedConditions.includes(item.condition);

      const matchesPrice =
        item.price >= priceRange[0] && item.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
    });
  }, [searchQuery, selectedCategory, selectedConditions, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Hero Search Section */}
        <section className="mb-8 animate-fade-in">
          <PersonalizedGreeting />
          <h1 className="text-2xl font-bold text-foreground mb-4 md:text-3xl">
            What are you looking for?
          </h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for textbooks, electronics, furniture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-6 text-lg bg-secondary border-0 rounded-xl shadow-card"
            />
          </div>
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
          <FilterPanel
            selectedConditions={selectedConditions}
            onConditionsChange={setSelectedConditions}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            maxPrice={maxPrice}
          />
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
