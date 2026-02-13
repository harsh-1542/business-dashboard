
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Input } from '../components/UI';
import { toast } from 'react-hot-toast';

const PublicContactForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock form config (In real app, fetch based on URL ID)
  const formConfig = {
    title: "City Dental Clinic Inquiry",
    description: "Please fill out the form below and our team will get back to you within 24 hours.",
    fields: { name: true, email: true, phone: true, message: true }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setSubmitted(true);
    toast.success('Message sent successfully!');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col py-12 px-6">
      <div className="max-w-xl mx-auto w-full flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center shadow-xl shadow-slate-900/10 mb-8">
            <Zap className="text-blue-500" fill="currentColor" size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">CareOps Connect</h1>
          <p className="text-slate-500 text-sm font-medium">Powering enterprise communications for City Dental Clinic.</p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[32px]">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900">{formConfig.title}</h2>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{formConfig.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {formConfig.fields.name && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <Input required placeholder="Alex Rivera" className="bg-slate-50 border-slate-100 h-12 rounded-xl focus:bg-white transition-all" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formConfig.fields.email && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <Input required type="email" placeholder="alex@example.com" className="bg-slate-50 border-slate-100 h-12 rounded-xl focus:bg-white transition-all" />
                      </div>
                    )}
                    {formConfig.fields.phone && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                        <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-slate-50 border-slate-100 h-12 rounded-xl focus:bg-white transition-all" />
                      </div>
                    )}
                  </div>

                  {formConfig.fields.message && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">How can we help?</label>
                      <textarea 
                        required
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all focus:bg-white"
                        rows={4}
                        placeholder="Tell us about your requirements..."
                      />
                    </div>
                  )}

                  <Button 
                    disabled={loading}
                    className="w-full h-14 bg-slate-900 text-white font-bold text-sm tracking-tight rounded-xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? 'Sending encrypted message...' : 'Submit Inquiry'}
                    {!loading && <Send size={18} />}
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-6 opacity-30 grayscale">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">GDPR Compliant</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full text-center"
            >
              <Card className="p-12 border-none shadow-2xl bg-white rounded-[40px] relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Message Received</h2>
                  <p className="text-slate-500 max-w-xs mx-auto mb-10 leading-relaxed">Thank you for reaching out. A copy of your inquiry has been sent to your email.</p>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setSubmitted(false)}
                      variant="outline" 
                      className="w-full h-12 text-xs font-bold uppercase tracking-widest rounded-xl"
                    >
                      Send Another Message
                    </Button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Response time: <span className="text-blue-500">~2 hours</span>
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50/50 rounded-full blur-3xl -ml-16 -mb-16" />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-16 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Secured by CareOps Enterprise</p>
          <div className="flex items-center gap-4 justify-center">
            <span className="w-8 h-[1px] bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="w-8 h-[1px] bg-slate-200" />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicContactForm;
