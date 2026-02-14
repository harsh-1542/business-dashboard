
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../components/UI';
import { toast } from 'react-hot-toast';
import { formService } from '../lib/services/api';

const PublicContactForm: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  // Note: formId can be either a Form ID or a Workspace ID (legacy)

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [formConfig, setFormConfig] = useState<any>(null);

  // Dynamic form data state
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formId) {
      loadFormConfig();
    }
  }, [formId]);

  const loadFormConfig = async () => {
    if (!formId) return;
    try {
      setIsLoadingConfig(true);
      const config = await formService.getPublicConfig(formId);
      setFormConfig(config);

      // Initialize form data based on fields
      const initialData: Record<string, string> = {};
      if (config.fields && Array.isArray(config.fields)) {
        config.fields.forEach((field: any) => {
          initialData[field.name] = '';
        });
      } else if (config.fields && typeof config.fields === 'object') {
        // Handle legacy/simple object format if backend returns it (though updated backend returns array for custom forms)
        // But mapPublicFormConfig in backend might return array for 'default' too.
        // Let's assume array for now based on Implementation Plan
        Object.keys(config.fields).forEach(key => {
          initialData[key] = '';
        });
      }
      setFormData(initialData);

    } catch (error: any) {
      console.error('Failed to load form config:', error);
      toast.error(error.message || 'Failed to load form');
      // If 404/403, we handled in backend, here we just show error state
      setFormConfig(null);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) {
      toast.error('Invalid form');
      return;
    }

    try {
      setLoading(true);
      await formService.submitPublicForm(formId, formData);
      setLoading(false);
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || 'Failed to send message');
    }
  };

  // Helper to render field based on type
  const renderField = (field: any) => {
    const commonProps = {
      name: field.name,
      required: field.required,
      value: formData[field.name] || '',
      onChange: handleInputChange,
      placeholder: field.label, // or specific placeholder
      className: "bg-slate-50 border-slate-100 h-12 rounded-xl focus:bg-white transition-all w-full"
    };

    if (field.type === 'textarea') {
      return (
        <div className="space-y-2" key={field.name}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
          <textarea
            {...commonProps}
            className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all focus:bg-white"
            rows={4}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2" key={field.name}>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
        <Input {...commonProps} type={field.type} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col py-12 px-6">
      <div className="max-w-xl mx-auto w-full flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center shadow-xl shadow-slate-900/10 mb-8">
            <Zap className="text-blue-500" fill="currentColor" size={28} />
          </div>
          {isLoadingConfig ? (
            <>
              <Skeleton className="h-10 w-64 mb-3 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </>
          ) : formConfig ? (
            <>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">{formConfig.businessName}</h1>
              <p className="text-slate-500 text-sm font-medium">{formConfig.description || "Please fill out the form below and we'll get back to you shortly."}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Form Unavailable</h1>
              <p className="text-slate-500 text-sm font-medium">This form does not exist or is no longer active.</p>
            </>
          )}
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
              {isLoadingConfig ? (
                <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[32px]">
                  <Skeleton className="h-64 w-full" />
                </Card>
              ) : formConfig ? (
                <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[32px]">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900">{formConfig.name || 'Contact'} Inquiry</h2>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Please fill out the form below and our team will get back to you within 24 hours.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Render Fields */}
                    {Array.isArray(formConfig.fields) && formConfig.fields.map((field: any) => renderField(field))}

                    <Button
                      disabled={loading}
                      type="submit"
                      className="w-full h-14 bg-slate-900 text-white font-bold text-sm tracking-tight rounded-xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? 'Sending message...' : 'Submit Inquiry'}
                      {!loading && <Send size={18} />}
                    </Button>
                  </form>
                </Card>
              ) : (
                <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[32px] text-center">
                  <p className="text-slate-500">Form not found or unavailable.</p>
                </Card>
              )}

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
                      onClick={() => {
                        setSubmitted(false);
                        // Reset form
                        const initialData: Record<string, string> = {};
                        if (formConfig && formConfig.fields) {
                          formConfig.fields.forEach((field: any) => {
                            initialData[field.name] = '';
                          });
                        }
                        setFormData(initialData);
                      }}
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
