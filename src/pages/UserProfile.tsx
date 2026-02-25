import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Languages, Mail } from 'lucide-react';
import { ItemCard } from '@/components/items/ItemCard';
import type { Listing } from '@/hooks/useListings';

function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

function usePublicListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['public-listings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            first_name,
            avatar_url,
            university
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((listing: any) => ({
        ...listing,
        seller_name: listing.profiles?.first_name || 'Anonymous',
        seller_avatar: listing.profiles?.avatar_url,
        seller_university: listing.profiles?.university || 'Unknown University',
      })) as Listing[];
    },
    enabled: !!userId,
  });
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { data: profile, isLoading: profileLoading } = usePublicProfile(userId);
  const { data: listings = [], isLoading: listingsLoading } = usePublicListings(userId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-6">
        {profileLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading profile...</div>
        ) : !profile ? (
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">User not found</h1>
            <Link to="/" className="text-primary hover:underline">Back to marketplace</Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Profile Header */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-20 w-20 text-2xl">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.first_name || 'User'} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {(profile.first_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {profile.first_name || 'Student'}
                  </h1>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profile.university && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.university}</span>
                      </div>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Languages className="h-4 w-4" />
                        <span>{profile.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Listings */}
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Listings ({listings.length})
            </h2>

            {listingsLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading listings...</div>
            ) : listings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ItemCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">This user hasn't listed anything yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
