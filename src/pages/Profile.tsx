import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LANGUAGES, CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import {
  Settings,
  LogOut,
  MapPin,
  Mail,
  Languages,
  Plus,
  Check,
  X,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserListings, useDeleteListing, type Listing } from '@/hooks/useListings';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

function ListingCard({ listing, onDelete }: { listing: Listing; onDelete: () => void }) {
  const category = CATEGORIES.find((c) => c.value === listing.category);
  
  return (
    <div className="group overflow-hidden rounded-xl bg-card shadow-card">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={listing.images[0] || 'https://via.placeholder.com/300'}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {category?.icon} {category?.label}
        </div>
        <button
          onClick={onDelete}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-all duration-200 hover:scale-110"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {listing.title}
          </h3>
          <span className="shrink-0 font-bold text-primary">
            ${listing.price}
          </span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { data: userListings = [], isLoading } = useUserListings();
  const deleteListing = useDeleteListing();
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Sync state from profile
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setBio(profile.bio || '');
      setUniversity(profile.university || '');
      setAccountNumber(profile.account_number || '');
      setAvatarUrl(profile.avatar_url || null);
      setSelectedLanguages(profile.languages?.length ? profile.languages : ['English']);
    }
  }, [profile]);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        bio,
        university,
        account_number: accountNumber || null,
        languages: selectedLanguages,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved successfully.',
    });
    setIsEditing(false);
    refreshProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteListing = (listingId: string) => {
    deleteListing.mutate(listingId);
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    refreshProfile();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-6">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <AvatarUpload
                userId={user.id}
                avatarUrl={avatarUrl}
                displayName={profile?.first_name || user.email || 'U'}
                isEditing={isEditing}
                onAvatarChange={handleAvatarChange}
              />

              {/* Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Your university"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell others about yourself..."
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Bank Account / IBAN
                      </Label>
                      <Input
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. PL61 1090 1014 0000 0712 1981 2874"
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Buyers will see this after purchase to transfer payment
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {profile?.first_name || 'Student'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {(profile?.university || university) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile?.university || university}</span>
                        </div>
                      )}
                    </div>
                    {selectedLanguages.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Languages className="h-4 w-4" />
                        <span>Speaks: {selectedLanguages.join(', ')}</span>
                      </div>
                    )}
                    {(profile?.account_number || accountNumber) && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        <span>Bank account added ✓</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Languages Editor */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-border">
                <Label className="mb-3 block">Languages Spoken</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                        selectedLanguages.includes(lang)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {lang}
                      {selectedLanguages.includes(lang) && (
                        <Check className="inline ml-1 h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Select at least one language
                </p>
              </div>
            )}
          </div>

          {/* User Listings */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Your Listings ({userListings.length})
            </h2>
            <Link to="/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading your listings...
            </div>
          ) : userListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userListings.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  onDelete={() => handleDeleteListing(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't listed anything yet
              </p>
              <Link to="/create">
                <Button>Create Your First Listing</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
