import { Header } from '@/components/layout/Header';
import { Clock } from 'lucide-react';

export default function Pending() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Pending Purchases</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No pending purchases</h2>
          <p className="text-muted-foreground">Items you're buying will appear here</p>
        </div>
      </main>
    </div>
  );
}
