import { Header } from '@/components/layout/Header';
import { Heart } from 'lucide-react';

export default function Favourites() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Favourites</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No favourites yet</h2>
          <p className="text-muted-foreground">Items you favourite will appear here</p>
        </div>
      </main>
    </div>
  );
}
