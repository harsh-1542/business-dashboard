import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Circle,
    ArrowRight,
    Zap,
    Mail,
    Calendar,
    Clock,
    Loader2
} from 'lucide-react';
import { Card, Button } from '../components/UI';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface SetupProgress {
    communicationConfigured: boolean;
    bookingTypesCreated: boolean;
    availabilityDefined: boolean;
}

interface SetupStatus {
    workspace: any;
    setupProgress: SetupProgress;
    completionPercentage: number;
    canActivate: boolean;
}

const WorkspaceSetup: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActivating, setIsActivating] = useState(false);

    useEffect(() => {
        if (workspaceId) {
            loadSetupStatus();
        }
    }, [workspaceId]);

    const loadSetupStatus = async () => {
        try {
            setIsLoading(true);
            const response = await apiFetch<{ success: boolean; data: SetupStatus }>(
                `/workspaces/${workspaceId}/status`
            );
            setSetupStatus(response.data);
        } catch (error: any) {
            console.error('Failed to load setup status:', error);
            toast.error('Failed to load setup status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivateWorkspace = async () => {
        if (!workspaceId || !setupStatus?.canActivate) return;

        try {
            setIsActivating(true);
            await apiFetch(`/workspaces/${workspaceId}/activate`, {
                method: 'POST',
            });
            toast.success('🎉 Workspace activated successfully!');
            navigate('/dashboard/workspaces');
        } catch (error: any) {
            toast.error(error.message || 'Failed to activate workspace');
        } finally {
            setIsActivating(false);
        }
    };

    const setupSteps = [
        {
            id: 'communication',
            title: 'Email Communication',
            description: 'All emails will be sent from *@harshshrimali.in domain',
            icon: <Mail size={24} />,
            completed: setupStatus?.setupProgress.communicationConfigured || false,
            action: null,
            actionLabel: '',
            isInfo: true,
        },
        {
            id: 'booking-types',
            title: 'Create Booking Types',
            description: 'Define services customers can book',
            icon: <Calendar size={24} />,
            completed: setupStatus?.setupProgress.bookingTypesCreated || false,
            action: () => navigate('/dashboard/booking-types'),
            actionLabel: 'Create Booking Types',
        },
        {
            id: 'availability',
            title: 'Set Availability',
            description: 'Define when you\'re available for bookings',
            icon: <Clock size={24} />,
            completed: setupStatus?.setupProgress.availabilityDefined || false,
            action: () => navigate('/dashboard/booking-types'),
            actionLabel: 'Set Availability',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!setupStatus) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Failed to load workspace setup status</p>
            </div>
        );
    }

    const completedSteps = setupSteps.filter(step => step.completed).length;
    const totalSteps = setupSteps.length;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                    <Zap size={40} className="text-white" fill="white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {setupStatus.workspace.businessName} Setup
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Complete these steps to activate your workspace and start accepting bookings
                </p>
            </div>

            {/* Progress Bar */}
            <Card className="p-6 border-none shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">Setup Progress</span>
                    <span className="text-sm font-bold text-blue-600">
                        {completedSteps} of {totalSteps} completed
                    </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${setupStatus.completionPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {setupStatus.completionPercentage}% complete
                </p>
            </Card>

            {/* Setup Steps */}
            <div className="space-y-4">
                {setupSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className={`p-6 border-2 transition-all ${step.completed
                                ? 'border-green-200 bg-green-50/30'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${step.completed
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-blue-50 text-blue-600'
                                        }`}
                                >
                                    {step.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                {step.title}
                                                {step.completed && (
                                                    <CheckCircle2 size={20} className="text-green-600" />
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {!step.completed && step.action && (
                                        <Button
                                            onClick={step.action}
                                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                        >
                                            {step.actionLabel}
                                            <ArrowRight size={14} />
                                        </Button>
                                    )}

                                    {step.completed && (
                                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-green-600">
                                            <CheckCircle2 size={16} />
                                            {step.id === 'communication' ? 'Pre-configured' : 'Completed'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Activation Button */}
            {setupStatus.canActivate ? (
                <Card className="p-8 border-none shadow-xl shadow-green-200/40 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Ready to Activate! 🎉
                            </h3>
                            <p className="text-gray-600 mt-2">
                                All setup requirements are complete. Activate your workspace to start
                                accepting bookings.
                            </p>
                        </div>
                        <Button
                            onClick={handleActivateWorkspace}
                            disabled={isActivating}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 text-base shadow-lg shadow-green-600/20"
                        >
                            {isActivating ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Activating...
                                </>
                            ) : (
                                <>
                                    <Zap size={20} className="mr-2" fill="white" />
                                    Activate Workspace
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="p-6 border-none shadow-xl shadow-slate-200/40 bg-blue-50/30">
                    <div className="text-center text-sm text-gray-600">
                        <Circle size={16} className="inline mr-2 text-blue-500" />
                        Complete all steps above to activate your workspace
                    </div>
                </Card>
            )}

            {/* Back Button */}
            <div className="text-center">
                <button
                    onClick={() => navigate('/dashboard/workspaces')}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                    ← Back to Workspaces
                </button>
            </div>
        </div>
    );
};

export default WorkspaceSetup;
