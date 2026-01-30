import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CATEGORIES, Category, CONDITIONS, Condition } from '@/types';
import { cn } from '@/lib/utils';
import { ImagePlus, X, ArrowLeft, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCreateListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createListing = useCreateListing();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && images.length < 5) {
      // For now, use placeholder URLs - in production, upload to storage
      const newImages = Array.from(files).slice(0, 5 - images.length).map(
        () => `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop`
      );
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please sign in to create a listing.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!title || !description || !price || !category || !condition || images.length === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields and add at least one image.',
        variant: 'destructive',
      });
      return;
    }

    await createListing.mutateAsync({
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      images,
    });

    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-2xl py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create a Listing
          </h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details to list your item for sale
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label className="mb-3 block">Photos (1-5)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-transform hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">
                      Add
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What are you selling?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your item, including condition, size, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2"
                min="0"
                step="0.01"
              />
            </div>

            {/* Condition */}
            <div>
              <Label className="mb-3 block">Condition</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setCondition(cond.value)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-all',
                      condition === cond.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {cond.label}
                    {condition === cond.value && (
                      <Check className="inline ml-2 h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label className="mb-3 block">Category</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border-2 p-3 transition-all text-left',
                      category === cat.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.label}</span>
                    {category === cat.value && (
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={createListing.isPending}
            >
              {createListing.isPending ? 'Creating...' : 'Post Listing'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
