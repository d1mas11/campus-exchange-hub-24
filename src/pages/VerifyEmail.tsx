import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your@email.edu';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Email verified!',
        description: 'Your account has been verified successfully.',
      });
      navigate('/');
    }, 1000);
  };

  const handleResend = async () => {
    setIsResending(true);

    // Simulate resend
    setTimeout(() => {
      setIsResending(false);
      toast({
        title: 'Code sent',
        description: 'A new verification code has been sent to your email.',
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Verify your email
        </h1>
        <p className="text-muted-foreground mb-8">
          We've sent a 6-digit verification code to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        {/* OTP Input */}
        <div className="flex justify-center mb-8">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          variant="hero"
          size="lg"
          className="w-full mb-4"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            'Verifying...'
          ) : (
            <>
              Verify Email
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <button
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isResending && 'animate-spin')} />
          {isResending ? 'Sending...' : 'Resend code'}
        </button>

        <p className="mt-8 text-xs text-muted-foreground">
          Code expires in 15 minutes
        </p>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
