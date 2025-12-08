import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ItemCard } from '@/components/items/ItemCard';
import { currentUser, mockItems } from '@/data/mockData';
import { LANGUAGES } from '@/types';
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
  Camera,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    currentUser.languages
  );

  const userListings = mockItems.filter((item) => item.sellerId === currentUser.id);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSave = () => {
    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved successfully.',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-6">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {currentUser.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt={currentUser.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                {isEditing && (
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {currentUser.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{currentUser.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{currentUser.university}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      <span>Speaks: {currentUser.languages.join(', ')}</span>
                    </div>
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

          {userListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userListings.map((item) => (
                <ItemCard key={item.id} item={item} />
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
