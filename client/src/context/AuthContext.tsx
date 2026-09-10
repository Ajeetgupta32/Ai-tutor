import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: 'student' | 'admin') => Promise<User>;
  registerWithOtp: (data: { name: string; email: string; password: string; role?: 'student' | 'admin'; otp: string }) => Promise<User>;
  sendOtp: (email: string, purpose?: string) => Promise<{ message: string }>;
  verifyOtp: (email: string, otp: string, purpose?: string) => Promise<boolean>;
  verifyAccountOtp: (email: string, otp: string) => Promise<User>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  resetPasswordOtp: (data: { email: string; otp: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      if (res.data.data.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      return u;
    }
    throw new Error('Login failed');
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'admin' = 'student'): Promise<User> => {
    const res = await API.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      if (res.data.data.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      return u;
    }
    throw new Error('Registration failed');
  };

  const registerWithOtp = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'admin';
    otp: string;
  }): Promise<User> => {
    const res = await API.post('/auth/register-with-otp', data);
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      if (res.data.data.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      return u;
    }
    throw new Error('Registration with OTP failed');
  };

  const sendOtp = async (email: string, purpose: string = 'registration') => {
    const res = await API.post('/auth/send-otp', { email, purpose });
    return {
      message: res.data?.message || 'Verification code sent to your email',
    };
  };

  const verifyOtp = async (email: string, otp: string, purpose: string = 'registration'): Promise<boolean> => {
    const res = await API.post('/auth/verify-otp', { email, otp, purpose });
    return res.data.success;
  };

  const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    await API.post('/auth/reset-password', { email, newPassword });
  };

  const resetPasswordOtp = async (data: { email: string; otp: string; newPassword: string }): Promise<void> => {
    await API.post('/auth/reset-password-otp', data);
  };

  const verifyAccountOtp = async (email: string, otp: string): Promise<User> => {
    const res = await API.post('/auth/verify-account-otp', { email, otp });
    if (res.data.success) {
      const u = res.data.data.user;
      setUser(u);
      if (res.data.data.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      return u;
    }
    throw new Error('Account verification failed');
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerWithOtp,
        sendOtp,
        verifyOtp,
        verifyAccountOtp,
        resetPassword,
        resetPasswordOtp,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
