
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Zap, Lock } from 'lucide-react';
import { Input, Button, Card } from '../components/UI';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { saveAuth, AuthPayload } from '../lib/auth';
import { supabase } from '../lib/supabase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  type LoginResponse = {
    success: boolean;
    message: string;
    data: AuthPayload;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      saveAuth(response.data);
      toast.success('Successfully signed in');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      toast.loading('Redirecting to Google...');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      toast.dismiss();

      if (error) {
        toast.error(error.message || 'Google sign-in failed');
        return;
      }

      // Supabase will handle the redirect; after returning, the user
      // will have an active Supabase session.
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-[440px] space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform">
              <Zap size={24} className="text-blue-500" fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">CareOps</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mt-2 font-medium">Please enter your details to sign in.</p>
        </div>

        <Card className="p-8 border-none shadow-2xl shadow-slate-200/60 bg-white rounded-[24px]">
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleGoogleAuth}
              className="w-full h-12 flex items-center justify-center gap-3 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm tracking-tight rounded-xl"
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white px-4 text-slate-400">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <Input 
                  required 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  {/* FIX: Removed non-existent 'size' prop from Link component */}
                  {/* <Link to="/forgot-password" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Forgot password?</Link> */}
                </div>
                <div className="relative">
                  <Input 
                    required
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 h-12 pr-12 rounded-xl"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                disabled={loading}
                className="w-full h-12 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign in to dashboard'}
                {!loading && <ArrowRight size={18} />}
              </Button>
            </form>
          </div>
        </Card>

        <p className="text-center text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all">Start your free trial</Link>
        </p>

        <div className="flex items-center justify-center gap-6 opacity-30">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
