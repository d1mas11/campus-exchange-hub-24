import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { z } from 'zod';

// University email format: 6 digits + @student.pwr.wroc.pl
const universityEmailSchema = z.string().trim().regex(
  /^\d{6}@student\.pwr\.wroc\.pl$/,
  { message: "Email must be in format: 123456@student.pwr.wroc.pl" }
);
const emailSchema = z.string().trim().email({ message: "Invalid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });
const nameSchema = z.string().trim().min(1, { message: "Name is required" });

type SignupStep = 'email' | 'verify' | 'details';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendVerificationCode = async () => {
    const emailResult = universityEmailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('send-verification-code', {
        body: { email: email.trim() },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send verification code');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Verification code sent to your email!');
      setSignupStep('verify');
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-code', {
        body: { email: email.trim(), code: verificationCode },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to verify code');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.valid) {
        toast.success('Email verified successfully!');
        setSignupStep('details');
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    await handleSendVerificationCode();
  };

  const handleSignup = async () => {
    const nameResult = nameSchema.safeParse(firstName);
    if (!nameResult.success) {
      toast.error(nameResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim(),
          },
        },
      });
      if (error) throw error;
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      if (error.message?.includes('User already registered')) {
        toast.error('An account with this email already exists. Please log in.');
      } else {
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin(e);
    } else if (signupStep === 'email') {
      handleSendVerificationCode();
    } else if (signupStep === 'verify') {
      handleVerifyCode();
    } else if (signupStep === 'details') {
      handleSignup();
    }
  };

  const resetSignup = () => {
    setSignupStep('email');
    setVerificationCode('');
    setEmail('');
    setPassword('');
    setFirstName('');
  };

  const renderSignupContent = () => {
    if (signupStep === 'email') {
      return (
        <div className="space-y-2">
          <Label htmlFor="email">University Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="123456@student.pwr.wroc.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter your university email with your 6-digit index number
          </p>
        </div>
      );
    }

    if (signupStep === 'verify') {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We sent a verification code to
            </p>
            <p className="font-medium">{email}</p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <Label>Enter verification code</Label>
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={(value) => setVerificationCode(value)}
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
            <p className="text-xs text-muted-foreground">
              Code expires in 5 minutes
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="link"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || loading}
              className="text-primary"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Please send again'}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setSignupStep('email')}
            className="w-full"
          >
            Change email
          </Button>
        </div>
      );
    }

    if (signupStep === 'details') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-green-600">✓ Email verified</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </>
      );
    }
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (isLogin) return 'Sign In';
    if (signupStep === 'email') return 'Send Verification Code';
    if (signupStep === 'verify') return 'Verify Code';
    return 'Create Account';
  };

  const getTitle = () => {
    if (isLogin) return 'Welcome Back';
    if (signupStep === 'email') return 'Create Account';
    if (signupStep === 'verify') return 'Verify Your Email';
    return 'Complete Your Profile';
  };

  const getDescription = () => {
    if (isLogin) return 'Sign in to your account to continue';
    if (signupStep === 'email') return 'Enter your university email to get started';
    if (signupStep === 'verify') return 'Enter the 6-digit code we sent you';
    return 'Just a few more details to complete your registration';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              renderSignupContent()
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {getButtonText()}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                resetSignup();
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
