import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Plus,
    Clock,
    MapPin,
    MoreVertical,
    Trash2,
    Edit2,
    Copy,
    ExternalLink,
    Settings,
    Sparkles,
    Check
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, EmptyState } from '../components/UI';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authService } from '../lib/services/api';
import { apiFetch } from '../lib/api';

interface ServiceType {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    location: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AvailabilitySchedule {
    id: string;
    workspaceId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const BookingTypes: React.FC = () => {
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [availability, setAvailability] = useState<AvailabilitySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceType | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        durationMinutes: 30,
        location: '',
    });

    const [availabilityFormData, setAvailabilityFormData] = useState({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
    });

    // AI Suggestions
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
    const [isAddingSuggestions, setIsAddingSuggestions] = useState(false);

    const SUGGESTION_TEMPLATES: Record<string, any[]> = {
        'salon': [
            { id: 'salon_1', name: 'Haircut', description: 'Standard haircut & styling', durationMinutes: 45, location: 'Salon' },
            { id: 'salon_2', name: 'Color Treatment', description: 'Full color service', durationMinutes: 120, location: 'Salon' },
            { id: 'salon_3', name: 'Beard Trim', description: 'Beard grooming & styling', durationMinutes: 20, location: 'Salon' },
            { id: 'salon_4', name: 'Manicure', description: 'Nail care service', durationMinutes: 40, location: 'Salon' },
        ],
        'clinic': [
            { id: 'clinic_1', name: 'Initial Consultation', description: 'First-time patient assessment', durationMinutes: 60, location: 'Office' },
            { id: 'clinic_2', name: 'Follow-up Visit', description: 'Routine check-up', durationMinutes: 30, location: 'Office' },
            { id: 'clinic_3', name: 'Therapy Session', description: 'Standard therapy session', durationMinutes: 50, location: 'Office' },
            { id: 'clinic_4', name: 'Telehealth Call', description: 'Video consultation', durationMinutes: 20, location: 'Online' },
        ],
        'gym': [
            { id: 'gym_1', name: 'Personal Training', description: '1-on-1 fitness session', durationMinutes: 60, location: 'Gym' },
            { id: 'gym_2', name: 'Group Class', description: 'Fitness class participation', durationMinutes: 45, location: 'Studio' },
            { id: 'gym_3', name: 'Fitness Assessment', description: 'Body composition & goals', durationMinutes: 30, location: 'Gym' },
        ],
        'consulting': [
            { id: 'cons_1', name: 'Strategy Call', description: 'Strategic planning session', durationMinutes: 60, location: 'Online' },
            { id: 'cons_2', name: 'Discovery Meeting', description: 'Initial project discussion', durationMinutes: 30, location: 'Online' },
            { id: 'cons_3', name: 'Client Onboarding', description: 'Project kickoff', durationMinutes: 45, location: 'Online' },
        ],
        'education': [
            { id: 'edu_1', name: 'Trial Lesson', description: 'Introductory lesson', durationMinutes: 30, location: 'Online' },
            { id: 'edu_2', name: 'Standard Lesson', description: 'Regular tutoring session', durationMinutes: 60, location: 'Online' },
        ],
        'default': [
            { id: 'def_1', name: 'Meeting', description: 'General meeting', durationMinutes: 30, location: 'Online' },
            { id: 'def_2', name: 'Consultation', description: 'Problem solving session', durationMinutes: 60, location: 'Office' },
            { id: 'def_3', name: 'Quick Chat', description: 'Brief sync-up', durationMinutes: 15, location: 'Online' },
            { id: 'def_4', name: 'Service Appointment', description: 'Standard service booking', durationMinutes: 60, location: 'Office' },
        ]
    };

    const getDynamicSuggestions = () => {
        const ws = workspaces.find(w => w.id === selectedWorkspaceId);
        if (!ws) return SUGGESTION_TEMPLATES['default'];

        const type = (ws.businessType || '').toLowerCase();
        const name = (ws.businessName || '').toLowerCase();
        const text = type + ' ' + name;

        if (text.match(/salon|hair|barber|beauty|spa|nail|makeup/)) return SUGGESTION_TEMPLATES['salon'];
        if (text.match(/clinic|doctor|medical|health|care|therapy|physio|dental|dentist|chiro/)) return SUGGESTION_TEMPLATES['clinic'];
        if (text.match(/consult|law|legal|agency|market|advis|coach|financ|manage/)) return SUGGESTION_TEMPLATES['consulting'];
        if (text.match(/gym|fitness|yoga|train|sport|pilates|dance/)) return SUGGESTION_TEMPLATES['gym'];
        if (text.match(/tutor|class|school|educat|learn|teach|lesson/)) return SUGGESTION_TEMPLATES['education'];

        return SUGGESTION_TEMPLATES['default'];
    };

    const dynamicSuggestions = getDynamicSuggestions();

    const toggleSuggestion = (id: string) => {
        const newSelected = new Set(selectedSuggestions);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedSuggestions(newSelected);
    };

    const handleAddSuggestions = async () => {
        if (selectedSuggestions.size === 0) return;
        setIsAddingSuggestions(true);
        try {
            const promises = Array.from(selectedSuggestions).map(id => {
                const suggestion = dynamicSuggestions.find(s => s.id === id);
                if (!suggestion) return Promise.resolve();
                return apiFetch('/service-types', {
                    method: 'POST',
                    body: JSON.stringify({
                        workspaceId: selectedWorkspaceId,
                        name: suggestion.name,
                        description: suggestion.description,
                        durationMinutes: suggestion.durationMinutes,
                        location: suggestion.location,
                    }),
                });
            });

            await Promise.all(promises);
            toast.success(`${selectedSuggestions.size} booking types added`);
            setSelectedSuggestions(new Set());
            loadServiceTypes();
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error('Failed to add suggestions');
        } finally {
            setIsAddingSuggestions(false);
        }
    };

    useEffect(() => {
        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspaceId) {
            loadServiceTypes();
            loadAvailability();
        }
    }, [selectedWorkspaceId]);

    const loadWorkspaces = async () => {
        try {
            const session = await authService.getSession();
            setWorkspaces(session.workspaces || []);
            if (session.workspaces && session.workspaces.length > 0) {
                setSelectedWorkspaceId(session.workspaces[0].id);
            }
        } catch (error: any) {
            console.error('Failed to load workspaces:', error);
            toast.error('Failed to load workspaces');
        } finally {
            setIsLoading(false);
        }
    };

    const loadServiceTypes = async () => {
        try {
            const response = await apiFetch<{ success: boolean; data: { serviceTypes: any[] } }>(
                `/service-types/workspace/${selectedWorkspaceId}`
            );
            setServiceTypes(response.data.serviceTypes.map((st: any) => ({
                id: st.id,
                workspaceId: st.workspace_id,
                name: st.name,
                description: st.description,
                durationMinutes: st.duration_minutes,
                location: st.location,
                isActive: st.is_active,
                createdAt: st.created_at,
                updatedAt: st.updated_at,
            })));
        } catch (error: any) {
            console.error('Failed to load service types:', error);
            toast.error('Failed to load booking types');
        }
    };

    const loadAvailability = async () => {
        try {
            const response = await apiFetch<{ success: boolean; data: { schedules: any[] } }>(
                `/availability/workspace/${selectedWorkspaceId}`
            );
            setAvailability(response.data.schedules.map((s: any) => ({
                id: s.id,
                workspaceId: s.workspace_id,
                dayOfWeek: s.day_of_week,
                startTime: s.start_time,
                endTime: s.end_time,
                isActive: s.is_active,
            })));
        } catch (error: any) {
            console.error('Failed to load availability:', error);
        }
    };

    const handleOpenModal = (service?: ServiceType) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                durationMinutes: service.durationMinutes,
                location: service.location,
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                durationMinutes: 30,
                location: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                await apiFetch(`/service-types/${editingService.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description,
                        durationMinutes: formData.durationMinutes,
                        location: formData.location,
                    }),
                });
                toast.success('Booking type updated');
            } else {
                await apiFetch('/service-types', {
                    method: 'POST',
                    body: JSON.stringify({
                        workspaceId: selectedWorkspaceId,
                        name: formData.name,
                        description: formData.description,
                        durationMinutes: formData.durationMinutes,
                        location: formData.location,
                    }),
                });
                toast.success('Booking type created');
            }
            setIsModalOpen(false);
            loadServiceTypes();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save booking type');
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('Delete this booking type? This cannot be undone.')) return;
        try {
            await apiFetch(`/service-types/${id}`, { method: 'DELETE' });
            setServiceTypes(prev => prev.filter(s => s.id !== id));
            toast.success('Booking type deleted');
        } catch (error: any) {
            toast.error('Failed to delete booking type');
        }
    };

    const handleAddAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/availability', {
                method: 'POST',
                body: JSON.stringify({
                    workspaceId: selectedWorkspaceId,
                    dayOfWeek: availabilityFormData.dayOfWeek,
                    startTime: availabilityFormData.startTime,
                    endTime: availabilityFormData.endTime,
                }),
            });
            toast.success('Availability added');
            setIsAvailabilityModalOpen(false);
            loadAvailability();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add availability');
        }
    };

    const handleDeleteAvailability = async (id: string) => {
        try {
            await apiFetch(`/availability/${id}`, { method: 'DELETE' });
            setAvailability(prev => prev.filter(a => a.id !== id));
            toast.success('Availability removed');
        } catch (error: any) {
            toast.error('Failed to remove availability');
        }
    };

    const copyBookingLink = () => {
        if (!selectedWorkspaceId) return;
        const url = `${window.location.origin}/book/${selectedWorkspaceId}`;
        navigator.clipboard.writeText(url);
        toast.success('Booking link copied to clipboard');
    };

    if (isLoading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    if (!selectedWorkspaceId) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Booking Types</h1>
                <EmptyState
                    title="No workspace available"
                    description="Please create a workspace first to manage booking types."
                    icon={<Calendar size={32} />}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Types</h1>
                    <p className="text-gray-500 text-sm">Define services and availability for public bookings.</p>
                    {workspaces.length > 0 && (
                        <select
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            className="mt-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {workspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.businessName}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={copyBookingLink}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <Copy size={14} /> Copy Booking Link
                    </Button>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-600 text-xs font-bold uppercase tracking-wider"
                    >
                        <Plus size={16} /> New Booking Type
                    </Button>
                </div>
            </div>

            {/* Service Types Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-none shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Service Types</h2>
                        <Button
                            size="sm"
                            onClick={() => handleOpenModal()}
                            className="text-xs"
                        >
                            <Plus size={14} className="mr-1" /> Add
                        </Button>
                    </div>

                    {serviceTypes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No booking types yet</p>
                            <Button onClick={() => handleOpenModal()} className="mt-4 bg-slate-900 text-xs">
                                Create First Type
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {serviceTypes.map((service) => (
                                <motion.div
                                    key={service.id}
                                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{service.name}</h3>
                                            {service.description && (
                                                <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                                            )}
                                            <div className="flex gap-4 mt-2">
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Clock size={12} />
                                                    {service.durationMinutes} min
                                                </div>
                                                {service.location && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                                        <MapPin size={12} />
                                                        {service.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(service)}
                                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteService(service.id)}
                                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Availability Schedule */}
                <Card className="p-6 border-none shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Availability</h2>
                        <Button
                            size="sm"
                            onClick={() => setIsAvailabilityModalOpen(true)}
                            className="text-xs"
                        >
                            <Plus size={14} className="mr-1" /> Add
                        </Button>
                    </div>

                    {availability.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Clock size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No availability set</p>
                            <Button onClick={() => setIsAvailabilityModalOpen(true)} className="mt-4 bg-slate-900 text-xs">
                                Set Availability
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availability.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group"
                                >
                                    <div>
                                        <span className="font-semibold text-sm text-gray-900">
                                            {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {schedule.startTime} - {schedule.endTime}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAvailability(schedule.id)}
                                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>



            {/* Create/Edit Service Type Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingService ? 'Edit Booking Type' : 'Create Booking Type'}
                description="Define a service or meeting type that customers can book."
            >
                {!editingService && (
                    <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl relative">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-purple-600" />
                            <h3 className="font-bold text-sm text-gray-900"> Suggestions</h3>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                            {dynamicSuggestions.map((suggestion) => {
                                const isSelected = selectedSuggestions.has(suggestion.id);
                                return (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => toggleSuggestion(suggestion.id)}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border text-left
                                            ${isSelected
                                                ? 'bg-purple-50 border-purple-200 shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                                            ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}
                                        `}>
                                            {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-xs ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                                                {suggestion.name}
                                            </h4>
                                            <p className="text-[10px] text-gray-500">{suggestion.durationMinutes}m • {suggestion.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Button
                            onClick={handleAddSuggestions}
                            disabled={selectedSuggestions.size === 0 || isAddingSuggestions}
                            size="sm"
                            className={`w-full font-bold uppercase tracking-wider text-[10px]
                                ${selectedSuggestions.size > 0
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {isAddingSuggestions ? 'Adding...' : `Add ${selectedSuggestions.size} Selected`}
                        </Button>
                        <div className="mt-4 flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest justify-center relative">
                            <div className="absolute w-full h-px bg-gray-200 z-0"></div>
                            <span className="bg-white px-2 z-10 relative text-gray-400">Or Create Custom</span>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Service Name
                        </label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Consultation, Haircut, Strategy Session"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this service"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                Duration (minutes)
                            </label>
                            <Input
                                type="number"
                                required
                                min={5}
                                max={480}
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                Location
                            </label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Office, Online"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-slate-900">
                            {editingService ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Availability Modal */}
            <Modal
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                title="Add Availability"
                description="Set when you're available for bookings."
            >
                <form onSubmit={handleAddAvailability} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Day of Week
                        </label>
                        <select
                            value={availabilityFormData.dayOfWeek}
                            onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, dayOfWeek: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                Start Time
                            </label>
                            <Input
                                type="time"
                                required
                                value={availabilityFormData.startTime}
                                onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, startTime: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                End Time
                            </label>
                            <Input
                                type="time"
                                required
                                value={availabilityFormData.endTime}
                                onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsAvailabilityModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-slate-900">
                            Add Availability
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default BookingTypes;
