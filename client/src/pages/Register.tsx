import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card } from '../components/ui/Card.js';
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const Register: React.FC = () => {
  const { registerWithOtp, sendOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step state: 'details' | 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [otp, setOtp] = useState('');

  // Loading & timer state
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step !== 'otp' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send OTP
  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast('error', 'Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email, 'registration');
      toast(
        'success',
        'Verification Code Sent!',
        'Please check your email inbox for your 6-digit verification code.'
      );
      setStep('otp');
      setTimeLeft(600);
    } catch (err: any) {
      toast('error', 'Registration Error', err.response?.data?.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    try {
      await sendOtp(email, 'registration');
      toast(
        'success',
        'New Code Sent!',
        'A new 6-digit code has been sent to your email.'
      );
      setTimeLeft(600);
    } catch (err: any) {
      toast('error', 'Failed to resend code', err.response?.data?.message || 'Error resending OTP');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify & Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast('error', 'Please enter the complete 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const newUser = await registerWithOtp({
        name,
        email,
        password,
        role,
        otp,
      });

      toast(
        'success',
        'Email Verified & Account Created!',
        `Welcome to EduMentor AI, ${newUser.name.split(' ')[0]}!`
      );

      if (newUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast('error', 'Verification Failed', err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">EduMentor AI</span>
          <span className="text-[11px] font-semibold text-slate-400 -mt-1">Personal AI Learning Platform</span>
        </div>
      </Link>

      <Card className="max-w-md w-full border border-slate-200/90 shadow-sm p-8 bg-white rounded-2xl">
        {step === 'details' ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create New Account</h2>
              <p className="text-xs text-slate-500 mt-1.5">
                Join EduMentor AI for personalized AI tutoring and verified skill mastery
              </p>
            </div>

            <form onSubmit={handleInitiateRegister} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Role</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'student'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                <Mail className="w-4 h-4 mr-1.5" /> Continue with Email Verification
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Already have an account?</span>
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Sign In →
              </Link>
            </div>
          </>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Email or Details
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                  <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? 'text-rose-600' : 'text-slate-500'}`}>
                    ⏱️ {formatTimer(timeLeft)}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl font-mono font-extrabold tracking-widest text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={loading} disabled={otp.length < 6}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Verify & Create Account
              </Button>

              <div className="flex items-center justify-between text-xs pt-3">
                <span className="text-slate-500">Didn't get the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || timeLeft > 540}
                  className={`font-semibold inline-flex items-center gap-1 ${
                    timeLeft > 540
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};
