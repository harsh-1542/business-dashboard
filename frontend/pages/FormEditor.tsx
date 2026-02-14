import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/UI';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Check, GripVertical } from 'lucide-react';
import { authService, formService, Form, Workspace } from '../lib/services/api';

const FormEditor: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<any[]>([]);

    // New Field State
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);

    // AI Suggestions
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [formId]);

    const loadData = async () => {
        try {
            const session = await authService.getSession();
            if (session.workspaces.length > 0) {
                setWorkspace(session.workspaces[0]);
            }

            if (formId && formId !== 'new') {
                const fetchedForm = await formService.getById(formId);
                setName(fetchedForm.name);
                setDescription(fetchedForm.description || '');
                // Backend fields might be stored differently, ensure array
                setFields(fetchedForm.formFields || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load form data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = () => {
        if (!newFieldLabel) return;
        const fieldName = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setFields([...fields, {
            name: fieldName,
            label: newFieldLabel,
            type: newFieldType,
            required: newFieldRequired
        }]);
        setNewFieldLabel('');
        setNewFieldType('text');
        setNewFieldRequired(false);
    };

    const handleDeleteField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name) return toast.error('Form name is required');
        if (!workspace) return toast.error('No active workspace');

        setSaving(true);
        try {
            if (formId === 'new') {
                await formService.create({
                    workspaceId: workspace.id,
                    name,
                    description,
                    fields
                });
                toast.success('Form created successfully');
            } else if (formId) {
                await formService.update(formId, {
                    name,
                    description,
                    fields
                });
                toast.success('Form updated successfully');
            }
            navigate('/dashboard/forms');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    // AI Template Logic
    const getTemplates = () => {
        if (!workspace) return [];
        const type = (workspace.businessType || '').toLowerCase();

        const templates: any[] = [];

        // Context-aware logic
        if (type.match(/salon|hair|barber|beauty|spa/)) {
            templates.push({
                id: 'client_intake', name: 'New Client Intake', description: 'Essential client history & preferences',
                fields: [
                    { label: 'Full Name', type: 'text', required: true },
                    { label: 'Phone Number', type: 'tel', required: true },
                    { label: 'Hair History', type: 'textarea', required: false },
                    { label: 'Allergies', type: 'textarea', required: true }
                ]
            });
            templates.push({
                id: 'feedback', name: 'Service Feedback', description: 'Post-service satisfaction survey',
                fields: [
                    { label: 'Service Rating (1-5)', type: 'select', required: true, options: ['1', '2', '3', '4', '5'] },
                    { label: 'Stylist Name', type: 'text', required: true },
                    { label: 'Comments', type: 'textarea', required: false }
                ]
            });
        } else if (type.match(/clinic|medical|health|doctor/)) {
            templates.push({
                id: 'patient_reg', name: 'Patient Registration', description: 'Medical history and contact info',
                fields: [
                    { label: 'Full Name', type: 'text', required: true },
                    { label: 'Date of Birth', type: 'date', required: true },
                    { label: 'Insurance Provider', type: 'text', required: true },
                    { label: 'Current Medications', type: 'textarea', required: false }
                ]
            });
        }

        // Default Templates
        templates.push({
            id: 'contact_gen', name: 'General Contact', description: 'Standard contact form',
            fields: [
                { label: 'Name', type: 'text', required: true },
                { label: 'Email', type: 'email', required: true },
                { label: 'Subject', type: 'text', required: true },
                { label: 'Message', type: 'textarea', required: true }
            ]
        });

        return templates;
    };

    const applyTemplate = (template: any) => {
        setName(template.name);
        setDescription(template.description);
        // Map fields to include internal 'name' property
        setFields(template.fields.map((f: any) => ({
            ...f,
            name: f.label.toLowerCase().replace(/[^a-z0-9]/g, '_')
        })));
        setSelectedTemplate(template.id);
        toast.success('Template applied');
    };

    if (loading) return <div className="p-10 text-center">Loading editor...</div>;

    const templates = getTemplates();
    const showSuggestions = formId === 'new' && name === '';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/dashboard/forms')} className="gap-2 text-gray-500">
                    <ArrowLeft size={16} /> Back to Forms
                </Button>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/forms')}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white min-w-[120px]"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save size={16} /> Save Form
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* AI Suggestions Section */}
                {showSuggestions && (
                    <Card className="p-6 border-2 border-dashed border-purple-100 bg-purple-50/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-purple-600" />
                            <h3 className="font-bold text-gray-900">Start with an Template</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className={`
                                        p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                        ${selectedTemplate === template.id
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200'
                                            : 'bg-white border-gray-200 hover:border-purple-300'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-bold ${selectedTemplate === template.id ? 'text-white' : 'text-gray-900'}`}>{template.name}</h4>
                                        {selectedTemplate === template.id && <Check size={16} />}
                                    </div>
                                    <p className={`text-xs ${selectedTemplate === template.id ? 'text-purple-100' : 'text-gray-500'}`}>{template.description}</p>
                                    <div className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${selectedTemplate === template.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                        {template.fields.length} Fields
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Main Form Settings */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Form Details</h2>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Form Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Client Intake Form"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose of this form..."
                        />
                    </div>
                </Card>

                {/* Form Fields Editor */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Form Fields</h2>

                    {/* Field List */}
                    <div className="space-y-3 mb-8">
                        {fields.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                No fields added yet. Add one below.
                            </div>
                        ) : (
                            fields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <GripVertical size={16} className="text-gray-300 cursor-move" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{field.label}</span>
                                            {field.required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Required</span>}
                                        </div>
                                        <span className="text-xs text-gray-400 capitalize">{field.type} Field</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteField(idx)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New Field */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Add Custom Field</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Label</label>
                                <Input
                                    value={newFieldLabel}
                                    onChange={(e) => setNewFieldLabel(e.target.value)}
                                    placeholder="e.g. Date of Birth"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                <select
                                    value={newFieldType}
                                    onChange={(e) => setNewFieldType(e.target.value)}
                                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="text">Text</option>
                                    <option value="textarea">Long Text</option>
                                    <option value="email">Email</option>
                                    <option value="tel">Phone</option>
                                    <option value="date">Date</option>
                                    <option value="select">Dropdown</option>
                                    <option value="checkbox">Checkbox</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 h-11">
                                <input
                                    type="checkbox"
                                    id="req"
                                    checked={newFieldRequired}
                                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="req" className="text-sm text-gray-700 select-none cursor-pointer">Required</label>
                            </div>
                        </div>
                        <Button
                            onClick={handleAddField}
                            disabled={!newFieldLabel}
                            className="w-full mt-4 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                        >
                            <Plus size={16} className="mr-2" /> Add Field to Form
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FormEditor;
