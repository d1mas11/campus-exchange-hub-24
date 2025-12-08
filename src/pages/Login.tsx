import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Welcome back!',
        description: 'You have logged in successfully.',
      });
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur mb-8">
            <span className="text-3xl font-bold">S</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">StudentMarket</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            The trusted marketplace for university students. Buy and sell textbooks, electronics, furniture, and more within your campus community.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-hero mb-4">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">StudentMarket</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
