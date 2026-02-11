import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, User, Plus, Menu, X, Home, Heart, Clock, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasUnread, markAsSeen } = useUnreadMessages();

  // Mark messages as seen when user navigates to /messages
  useEffect(() => {
    if (location.pathname === '/messages') {
      markAsSeen();
    }
  }, [location.pathname, markAsSeen]);

  const navItems = [
    { to: '/', label: 'Browse', icon: Home },
    { to: '/create', label: 'Sell', icon: Plus },
    { to: '/favourites', label: 'Favourites', icon: Heart },
    { to: '/pending', label: 'Pending', icon: Clock },
    { to: '/messages', label: 'Messages', icon: MessageCircle },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-hero flex h-9 w-9 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="hidden font-semibold text-foreground sm:inline-block">
            StudentMarket
          </span>
        </Link>

        {/* Nav - Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            const showDot = item.to === '/messages' && hasUnread;
            return (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 relative',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                  )}
                </Button>
              </Link>
            );
          })}
          {user ? (
            <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              const showDot = item.to === '/messages' && hasUnread;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 relative',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {showDot && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                    )}
                  </Button>
                </Link>
              );
            })}
            {user ? (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3" 
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
