import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  MoreVertical, 
  Eye, 
  Copy, 
  Trash2, 
  Settings2,
  X,
  CheckCircle2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ContactForm } from '../types';

const FormsManagement: React.FC = () => {
  const [forms, setForms] = useState<ContactForm[]>([
    { 
      id: 'f1', 
      title: 'General Inquiry', 
      description: 'Standard contact form for the main website.', 
      fields: { name: true, email: true, phone: false, message: true },
      responsesCount: 142,
      status: 'Active'
    },
    { 
      id: 'f2', 
      title: 'VIP Consultation Request', 
      description: 'Special form for high-value client intake.', 
      fields: { name: true, email: true, phone: true, message: true },
      responsesCount: 28,
      status: 'Active'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<ContactForm | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: { name: true, email: true, phone: false, message: true },
    // Fix: cast to the union type 'Active' | 'Draft' to allow 'Draft' status during updates in handleOpenModal
    status: 'Active' as 'Active' | 'Draft'
  });

  const handleOpenModal = (form?: ContactForm) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        title: form.title,
        description: form.description,
        fields: { ...form.fields },
        status: form.status
      });
    } else {
      setEditingForm(null);
      setFormData({ 
        title: '', 
        description: '', 
        fields: { name: true, email: true, phone: false, message: true },
        status: 'Active' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingForm) {
      setForms(prev => prev.map(f => f.id === editingForm.id ? { ...f, ...formData } : f));
      toast.success('Form configuration updated');
    } else {
      const newForm: ContactForm = {
        id: 'f-' + Math.random().toString(36).substr(2, 5),
        ...formData,
        responsesCount: 0
      };
      setForms(prev => [newForm, ...prev]);
      toast.success('New public form created');
    }
    setIsModalOpen(false);
  };

  const copyFormLink = (id: string) => {
    const url = window.location.origin + '/#/f/' + id;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this form? All associated response metadata will be lost.')) {
      setForms(prev => prev.filter(f => f.id !== id));
      toast.success('Form deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forms Management</h1>
          <p className="text-gray-500 text-sm">Create and deploy high-converting public contact forms.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> Create New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Card key={form.id} className="overflow-hidden border-none shadow-xl shadow-slate-200/40 group flex flex-col">
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                  <FileText size={20} />
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={form.status === 'Active' ? 'success' : 'default'} className="text-[9px]">
                    {form.status}
                  </Badge>
                  <button className="text-gray-300 hover:text-gray-600 p-1"><MoreVertical size={16} /></button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{form.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{form.description}</p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submissions</span>
                  <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-blue-500" />
                    {form.responsesCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fields</span>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(form.fields).map(([key, enabled]) => (
                      enabled && <div key={key} title={key} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyFormLink(form.id)}
                className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest gap-2 bg-white"
              >
                <Copy size={12} /> Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOpenModal(form)}
                className="w-10 h-9 p-0 bg-white"
              >
                <Settings2 size={14} />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDelete(form.id)}
                className="w-10 h-9 p-0 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}

        <button 
          onClick={() => handleOpenModal()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/20 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
            <Plus size={20} />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">Deploy New Form</span>
        </button>
      </div>

      {/* Form Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{editingForm ? 'Edit Form' : 'New Contact Form'}</h3>
                    <p className="text-xs text-gray-400">Configure your public response gateway.</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Form Title</label>
                    <Input 
                      required 
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Website Inquiry" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Internal Description</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Briefly describe the purpose of this form..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Included Fields</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(formData.fields).map((fieldName) => {
                      const enabled = (formData.fields as any)[fieldName];
                      return (
                        <div 
                          key={fieldName}
                          onClick={() => setFormData({
                            ...formData,
                            fields: { ...formData.fields, [fieldName]: !enabled }
                          })}
                          className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                            enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-50 bg-gray-50/30 grayscale opacity-60'
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-900 capitalize">{fieldName}</span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                            enabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 bg-white'
                          }`}>
                            {enabled && <CheckCircle2 size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 text-xs font-bold uppercase tracking-widest bg-gray-50 border-none">
                    Discard
                  </Button>
                  <Button type="submit" className="flex-1 h-12 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10">
                    {editingForm ? 'Save Changes' : 'Deploy Form'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormsManagement;
