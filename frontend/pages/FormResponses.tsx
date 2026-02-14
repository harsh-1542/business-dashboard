
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, User, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { Card, Button, Skeleton } from '../components/UI';
import { toast } from 'react-hot-toast';
import { formService } from '../lib/services/api';

const FormResponses: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                    <Button variant="outline" className="text-xs uppercase tracking-wider font-bold gap-2">
                        <Download size={16} /> Export CSV
                    </Button>
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
                                            <Button variant="outline" className="h-8 px-3 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
    );
};

export default FormResponses;
