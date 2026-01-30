import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ItemCard } from '@/components/items/ItemCard';
import { CategoryFilter } from '@/components/items/CategoryFilter';
import { FilterPanel } from '@/components/items/FilterPanel';
import { useListings } from '@/hooks/useListings';
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
  
  const { data: dbListings = [], isLoading } = useListings();
  
  // Combine DB listings with mock items for display
  const allItems = useMemo(() => {
    // Transform DB listings to match the Item interface
    const transformedDbListings = dbListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      price: Number(listing.price),
      category: listing.category as Category,
      condition: listing.condition as Condition,
      images: listing.images,
      sellerId: listing.user_id,
      sellerName: listing.seller_name || 'Anonymous',
      sellerUniversity: listing.seller_university || 'Unknown',
      sellerLanguages: ['English'],
      sellerAvatar: listing.seller_avatar,
      createdAt: new Date(listing.created_at),
      isFavorite: false,
    }));
    
    // Return DB listings first, then mock items
    return [...transformedDbListings, ...mockItems];
  }, [dbListings]);
  
  const maxPrice = useMemo(() => Math.max(...allItems.map((item) => item.price), 1000), [allItems]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
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
  }, [searchQuery, selectedCategory, selectedConditions, priceRange, allItems]);

  // Transform items to Listing format for ItemCard
  const listingsForCards = useMemo(() => {
    return filteredItems.map(item => ({
      id: item.id,
      user_id: item.sellerId,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      condition: item.condition,
      images: item.images,
      status: 'active',
      created_at: item.createdAt.toISOString(),
      updated_at: item.createdAt.toISOString(),
      seller_name: item.sellerName,
      seller_avatar: item.sellerAvatar,
      seller_university: item.sellerUniversity,
    }));
  }, [filteredItems]);

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
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Loading listings...</p>
          </div>
        ) : listingsForCards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listingsForCards.map((listing, index) => (
              <div
                key={listing.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <ItemCard listing={listing} />
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
