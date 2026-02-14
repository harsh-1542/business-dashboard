import React, { useState, useEffect } from 'react';
import { Mail, Calendar, MessageSquare, Shield, Check } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { authService, integrationService } from '../lib/services/api';
import { toast } from 'react-hot-toast';

const Integrations: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [gmailIntegration, setGmailIntegration] = useState<any>(null);
    const [shouldReloadIntegrations, setShouldReloadIntegrations] = useState(false);

    useEffect(() => {
        loadSession();
        checkUrlParams();
    }, []);

    useEffect(() => {
        if (session?.workspaces?.[0]?.id) {
            loadIntegrations();
        }
    }, [session]);

    // Reload integrations when flag is set and session is ready
    useEffect(() => {
        if (shouldReloadIntegrations && session?.workspaces?.[0]?.id) {
            loadIntegrations();
            setShouldReloadIntegrations(false);
        }
    }, [shouldReloadIntegrations, session]);

    const loadSession = async () => {
        try {
            const sessionData = await authService.getSession();
            setSession(sessionData);
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadIntegrations = async () => {
        if (!session?.workspaces?.[0]?.id) return;

        try {
            const workspaceId = session.workspaces[0].id;
            const data = await integrationService.getIntegrations(workspaceId);
            setIntegrations(data);

            // Find Gmail integration
            const gmail = data.find((i: any) => i.type === 'email' && i.provider === 'gmail' && i.isActive);
            setGmailIntegration(gmail);
        } catch (error) {
            console.error('Failed to load integrations:', error);
        }
    };

    const checkUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        const gmailConnected = params.get('gmail_connected');
        const error = params.get('error');

        if (gmailConnected === 'true') {
            toast.success('Gmail connected successfully!');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            // Set flag to reload integrations once session is ready
            setShouldReloadIntegrations(true);
        } else if (gmailConnected === 'false') {
            toast.error(`Failed to connect Gmail: ${error || 'Unknown error'}`);
            window.history.replaceState({}, '', window.location.pathname);
        }
    };

    const handleConnectGmail = async () => {
        if (!session?.workspaces?.[0]?.id) {
            toast.error('No workspace found');
            return;
        }

        try {
            const workspaceId = session.workspaces[0].id;
            // Assuming integrationService.getGoogleAuthUrl is implemented in api.ts
            const url = await integrationService.getGoogleAuthUrl(workspaceId);
            window.location.href = url;
        } catch (error) {
            console.error('Failed to initiate Gmail auth', error);
            toast.error('Failed to initiate Gmail connection');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Integrations</h1>
                    <p className="text-gray-500 mt-1">Manage your connected services and tools.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="text-xs uppercase tracking-wider font-bold">Documentation</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* 1. Gmail Integration */}
                <Card className={`p-6 shadow-sm hover:shadow-md transition-all ${gmailIntegration ? 'border-l-4 border-l-green-500 bg-green-50/30' : 'border border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${gmailIntegration ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                <Mail size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-900">Gmail Integration</h3>
                                    {gmailIntegration && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-200">
                                            Connected
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed max-w-xl">
                                    Connect your Gmail account to send replies directly from the dashboard on your behalf.
                                </p>
                                {gmailIntegration && gmailIntegration.config?.email && (
                                    <div className="mt-3 flex items-center gap-2 p-2 bg-white rounded-lg border border-green-100 text-sm">
                                        <Check size={14} className="text-green-600" />
                                        <span className="text-gray-600 font-medium">
                                            Connected as: <span className="text-gray-900 font-bold">{gmailIntegration.config.email}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {gmailIntegration ? (
                            <Button
                                variant="outline"
                                disabled
                                className="text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed"
                            >
                                Connected
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConnectGmail}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider"
                            >
                                Connect
                            </Button>
                        )}
                    </div>
                </Card>

                {/* 2. System Email - Active */}
                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm bg-slate-50/50">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                                <Check size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-900">System Notifications</h3>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-200">
                                        Active
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed max-w-xl">
                                    Automated booking confirmations and system alerts.
                                </p>

                                <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 text-sm shadow-sm">
                                    <Shield size={16} className="text-blue-500" />
                                    <span className="text-gray-600 font-medium">
                                        Sent via verified domain: <span className="text-gray-900 font-bold">@harshshrimali.in</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" disabled className="text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
                            Configure
                        </Button>
                    </div>
                </Card>

                {/* 3. Google Calendar - Coming Soon */}
                <Card className="p-6 opacity-75 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-gray-100 grayscale opacity-70">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-700">Google Calendar</h3>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide rounded-full border border-gray-200">
                                        Coming Soon
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                    Two-way sync with your personal and business calendars.
                                </p>
                            </div>
                        </div>
                        <Button disabled className="text-xs font-bold uppercase tracking-wider bg-gray-200 text-gray-400 border-none shadow-none">
                            Connect
                        </Button>
                    </div>
                </Card>

                {/* 4. WhatsApp - Premium */}
                <Card className="p-6 opacity-75 border-dashed bg-gray-50/50">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm border border-gray-100 grayscale opacity-70">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-700">WhatsApp Business</h3>
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-yellow-200">
                                        Premium
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                    Send booking details and automated reminders via WhatsApp.
                                </p>
                            </div>
                        </div>
                        <Button disabled className="text-xs font-bold uppercase tracking-wider bg-gray-200 text-gray-400 border-none shadow-none">
                            Upgrade
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Integrations;

