import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card } from '../components/ui/Card.js';
import { GraduationCap, UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
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
      const newUser = await register(name.trim(), email.trim().toLowerCase(), password, 'student');
      toast(
        'success',
        'Account Created Successfully!',
        `Welcome to EduMentor AI, ${newUser.name.split(' ')[0]}!`
      );
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not create account';
      toast('error', 'Registration Error', msg);
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
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Create New Account</h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Join EduMentor AI for personalized AI tutoring and verified skill mastery
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Create Account & Sign In
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already have an account?</span>
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Sign In →
          </Link>
        </div>
      </Card>
    </div>
  );
};
