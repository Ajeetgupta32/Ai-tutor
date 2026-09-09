import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card } from '../components/ui/Card.js';
import { GraduationCap, KeyRound, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, sendOtp, resetPasswordOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mode: 'login' | 'forgot'
  const [viewMode, setViewMode] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password / OTP state
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      toast('success', `Welcome back, ${loggedInUser.name.split(' ')[0]}!`, 'Successfully signed in to EduMentor AI');
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      toast('error', 'Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);

    try {
      await sendOtp(forgotEmail, 'password_reset');
      toast('success', 'Reset Code Sent!', 'Please check your email inbox for your 6-digit password reset code.');
      setForgotStep('otp');
    } catch (err: any) {
      toast('error', 'Failed to send OTP', err.response?.data?.message || 'Email not registered');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) return;
    setForgotLoading(true);

    try {
      await resetPasswordOtp({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword,
      });
      toast('success', 'Password Reset Successful', 'You can now sign in with your new password.');
      setViewMode('login');
      setForgotStep('email');
      setEmail(forgotEmail);
      setPassword('');
    } catch (err: any) {
      toast('error', 'Reset Failed', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setForgotLoading(false);
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
        {viewMode === 'login' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Sign In to Your Account</h2>
              <p className="text-xs text-slate-500 mt-1.5">Enter your credentials to access your personalized learning portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setForgotEmail(email);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Don't have an account?</span>
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Create Account →
              </Link>
            </div>
          </>
        )}

        {viewMode === 'forgot' && (
          <div>
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Reset Password with OTP</h2>
              <p className="text-xs text-slate-500 mt-1">
                {forgotStep === 'email'
                  ? 'Enter your registered email to receive a 6-digit verification code'
                  : `Enter the 6-digit code sent to ${forgotEmail}`}
              </p>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="student@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" isLoading={forgotLoading}>
                  <Mail className="w-4 h-4 mr-1.5" /> Send Verification Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full" isLoading={forgotLoading}>
                  <ShieldCheck className="w-4 h-4 mr-1.5" /> Reset Password & Continue
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                    disabled={forgotLoading}
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
