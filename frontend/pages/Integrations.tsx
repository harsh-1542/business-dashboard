
import React from 'react';
import { Mail, CheckCircle, AlertCircle, Calendar, MessageSquare, Shield } from 'lucide-react';
import { Card, Button } from '../components/UI';

const Integrations: React.FC = () => {
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
                {/* Email Integration - Active */}
                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                                <Mail size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-900">Email Communication</h3>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-200">
                                        Active
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed max-w-xl">
                                    Automated booking confirmations, reminders, and notifications.
                                </p>

                                <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                    <Shield size={16} className="text-blue-500" />
                                    <span className="text-gray-600 font-medium">
                                        All system emails are sent via verified domain: <span className="text-gray-900 font-bold">@harshshrimali.in</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" disabled className="text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
                            Configure
                        </Button>
                    </div>
                </Card>

                {/* Google Calendar - Coming Soon or Connect */}
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

                {/* WhatsApp - Coming Soon */}
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
