import React, { useState, useEffect } from 'react';
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
import { formService, authService, Form } from '../lib/services/api';
import { useNavigate } from 'react-router-dom';

const FormsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; formId: string | null }>({ isOpen: false, formId: null });

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = await authService.getSession();
      setSession(sessionData);

      if (sessionData.workspaces.length > 0) {
        // Default to first workspace (or last used)
        const workspaceId = sessionData.workspaces[0].id;
        setSelectedWorkspace(workspaceId);
        loadForms(workspaceId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session');
    }
  };

  const loadForms = async (workspaceId: string) => {
    try {
      setLoading(true);
      const fetchedForms = await formService.getForms(workspaceId);
      setForms(fetchedForms);
    } catch (error) {
      console.error('Failed to load forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrEdit = (formId?: string) => {
    navigate(`/dashboard/forms/${formId || 'new'}`);
  };

  const copyFormLink = (id: string) => {
    const url = window.location.origin + '/public/form/' + id;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ isOpen: true, formId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.formId) return;
    try {
      await formService.delete(deleteConfirmation.formId);
      setForms(prev => prev.filter(f => f.id !== deleteConfirmation.formId));
      toast.success('Form deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete form');
    } finally {
      setDeleteConfirmation({ isOpen: false, formId: null });
    }
  };

  if (!session || !selectedWorkspace) {
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    return <div className="p-10 text-center">No active workspace found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forms Management</h1>
          <p className="text-gray-500 text-sm">Create and deploy high-converting public contact forms.</p>
        </div>
        <Button
          onClick={() => handleCreateOrEdit()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> Create New Form
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading forms...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 text-blue-500">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">Create your first contact form to start collecting inquiries from potential customers.</p>
          <Button onClick={() => handleCreateOrEdit()} className="bg-slate-900 text-white shadow-xl shadow-slate-900/10">
            Create Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="overflow-hidden border-none shadow-xl shadow-slate-200/40 group flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={form.isActive ? 'success' : 'default'} className="text-[9px]">
                      {form.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                    <button className="text-gray-300 hover:text-gray-600 p-1"><MoreVertical size={16} /></button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{form.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{form.description || 'No description'}</p>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                    <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Contact Form
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fields</span>
                    <div className="flex gap-1 mt-1">
                      {/* Visual indicator of fields count */}
                      {Array.from({ length: Math.min(form.formFields.length, 5) }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      ))}
                      {form.formFields.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/forms/${form.id}/responses`)}
                  className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest gap-2 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                >
                  <MessageSquare size={16} /> Responses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyFormLink(form.id)}
                  className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest gap-2 bg-white"
                >
                  <Copy size={16} /> Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateOrEdit(form.id)}
                  className="w-12 h-9 p-0 bg-white"
                >
                  <Settings2 className="text-blue-600 h-12" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteClick(form.id)}
                  className="w-12 h-9 p-0 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                  disabled={form.id === 'default'}
                >
                  <Trash2 size={22} />
                </Button>
              </div>
            </Card>
          ))}

          <button
            onClick={() => handleCreateOrEdit()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Plus size={20} />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest">Deploy New Form</span>
          </button>
        </div>
      )}



      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation({ isOpen: false, formId: null })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Form?</h3>
              <p className="text-sm text-gray-500 mb-8">
                This action cannot be undone. All associated responses and metadata will be permanently lost.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false, formId: null })}
                  className="flex-1 h-12 text-xs font-bold uppercase tracking-widest border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-500/20"
                >
                  Yes, Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormsManagement;
