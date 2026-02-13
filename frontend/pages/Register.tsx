
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { Input, Button } from '../components/UI';
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

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessIdentity, setBusinessIdentity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  type RegisterResponse = {
    success: boolean;
    message: string;
    data: AuthPayload;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: 'owner',
        }),
      });

      saveAuth(response.data);
      toast.success('Welcome to CareOps!');
      navigate('/dashboard');
    } catch (error: any) {
      console.log(error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      toast.loading('Initializing Google Account...');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      toast.dismiss();

      if (error) {
        toast.error(error.message || 'Google sign up failed');
        return;
      }

      // Supabase will handle the redirect; after returning, the user
      // will have an active Supabase session.
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Google sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Visual Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0F172A] p-16 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-20 group cursor-default">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Zap size={24} fill="white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">CareOps</span>
          </div>
          
          <h1 className="text-5xl font-black leading-[1.15] mb-8 tracking-tight">
            The platform for <span className="text-blue-500">ambitious</span> service teams.
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed max-w-lg font-medium">
            Streamline your operations, automate bookings, and scale your business with the ultimate SaaS dashboard.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-5">
            {[
              'Universal multi-location scheduling',
              'Enterprise-grade staff permissions',
              'Real-time automated customer workflows',
              'Deep performance and revenue analytics'
            ].map(feature => (
              <div key={feature} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-slate-300 font-bold text-sm uppercase tracking-wide">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-10 border-t border-slate-800 flex items-center gap-6">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 ring-2 ring-slate-800" />)}
             </div>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Joined by 2,400+ operators</p>
          </div>
        </div>

        {/* Dynamic Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Right Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-20 relative overflow-y-auto">
        <div className="w-full max-w-md py-12">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white"><Zap size={20} /></div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">CareOps</span>
          </div>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={10} /> Secure Onboarding
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Get started</h2>
            <p className="text-gray-500 mt-2 text-sm font-medium">Start your free 14-day trial today. No credit card required.</p>
          </div>

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
                <span className="bg-white px-4 text-slate-400">or use work email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <Input
                    required
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <Input
                    required
                    placeholder="Rivera"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Identity</label>
                <Input
                  required
                  placeholder="Acme Operations Ltd."
                  value={businessIdentity}
                  onChange={(e) => setBusinessIdentity(e.target.value)}
                  className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
                <Input
                  required
                  type="email"
                  placeholder="alex@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Security Password</label>
                <div className="relative">
                  <Input 
                    required
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                disabled={loading}
                className="w-full h-14 bg-slate-900 text-xs font-bold uppercase tracking-widest shadow-2xl shadow-slate-900/10 active:scale-[0.98] transition-all rounded-xl"
              >
                {loading ? 'Initializing Workspace...' : 'Create Account'}
                {!loading && <ArrowRight size={18} className="ml-3" />}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline transition-all">Sign in here</Link>
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-8 opacity-40 grayscale">
             <div className="font-black text-xs tracking-tighter">STRIPE</div>
             <div className="font-black text-xs tracking-tighter">VERCEL</div>
             <div className="font-black text-xs tracking-tighter">LINEAR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
