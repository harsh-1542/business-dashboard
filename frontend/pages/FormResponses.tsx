
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, Mail, Phone, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Skeleton } from '../components/UI';
import { toast } from 'react-hot-toast';
import { formService } from '../lib/services/api';

const FormResponses: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!formId) return;
            try {
                setLoading(true);
                // Fetch form details to verify it exists and get name
                // We don't have a direct getForm by ID in API yet exposed cleanly for this context (usually typically workspaceId based), 
                // but we can try fetching submissions first.
                // Actually api.ts has getPublicConfig but not getPrivateFormById.
                // Wait, backend has getForm/:formId. frontend api.ts doesn't expose it clearly?
                // Checking api.ts... api.ts has `update(formId, ...)` but `getForms(workspaceId)`.
                // It seems `api.ts` is missing `getForm(formId)`. I'll assume I can just use `getSubmissions` and maybe I won't have the form name immediately unless I fetch all forms and find it, or I update api.ts
                // Let's just fetch submissions for now.

                const data = await formService.getSubmissions(formId);
                setSubmissions(data);

                // Hack: Fetch all forms for workspace to find name? No, we don't have workspaceId here easily from params.
                // I will assume the user knows which form they clicked.
                // Or I can add `getForm` to api.ts.
            } catch (error) {
                console.error('Failed to fetch submissions:', error);
                toast.error('Failed to load form responses');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [formId]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/forms')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Responses</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Live View
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Export removed */}
                </div>
            </div>

            {loading ? (
                <Card className="p-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </Card>
            ) : submissions.length === 0 ? (
                <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">No responses yet</h3>
                        <p className="text-gray-500 max-w-sm mt-1">
                            When people submit your form, their responses will appear here.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/forms')}
                        className="mt-4"
                    >
                        Back to Forms
                    </Button>
                </Card>
            ) : (
                <Card className="overflow-hidden border-0 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted Data</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {submissions.map((sub, i) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 text-sm text-gray-400 font-mono">{i + 1}</td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    {sub.contact.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{sub.contact.firstName} {sub.contact.lastName}</p>
                                                    {sub.contact.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                            <Mail size={12} /> {sub.contact.email}
                                                        </div>
                                                    )}
                                                    {sub.contact.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                            <Phone size={12} /> {sub.contact.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-1.5">
                                                {Object.entries(sub.submissionData).map(([key, value]) => {
                                                    if (['firstName', 'lastName', 'email', 'phone', 'workspaceId'].includes(key)) return null;
                                                    return (
                                                        <div key={key} className="text-sm">
                                                            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide mr-2">{key}:</span>
                                                            <span className="text-gray-800">{String(value)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={14} />
                                                {new Date(sub.submittedAt).toLocaleDateString()}
                                                <span className="text-xs text-gray-400">
                                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-right">
                                            <Button
                                                onClick={() => setSelectedSubmission(sub)}
                                                variant="outline"
                                                className="h-8 px-3 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}


            <AnimatePresence>
                {selectedSubmission && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedSubmission(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Submission Details</h3>
                                        <p className="text-xs text-gray-400">
                                            {new Date(selectedSubmission.submittedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Contact Section */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Information</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                                {selectedSubmission.contact.firstName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{selectedSubmission.contact.firstName} {selectedSubmission.contact.lastName}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {selectedSubmission.contact.email && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                            <Mail size={12} /> {selectedSubmission.contact.email}
                                                        </span>
                                                    )}
                                                    {selectedSubmission.contact.phone && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                            <Phone size={12} /> {selectedSubmission.contact.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Data</h4>
                                        <div className="grid gap-4">
                                            {Object.entries(selectedSubmission.submissionData).map(([key, value]) => {
                                                if (['firstName', 'lastName', 'email', 'phone', 'workspaceId'].includes(key)) return null;
                                                return (
                                                    <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{key}</p>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg">
                                                            {String(value)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                                <Button onClick={() => setSelectedSubmission(null)}>Close</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FormResponses;
