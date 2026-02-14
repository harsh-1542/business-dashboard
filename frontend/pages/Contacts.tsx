import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { contactService, authService, Contact } from '../lib/services/api';
import { toast } from 'react-hot-toast';
import { Users, Mail, Phone, MessageSquare, Calendar } from 'lucide-react';

const Contacts: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sessionData = await authService.getSession();
            setSession(sessionData);
            if (sessionData.workspaces.length > 0) {
                const workspaceId = sessionData.workspaces[0].id; // Simplified: usually use selected workspace from context
                const fetched = await contactService.getContacts(workspaceId);
                setContacts(fetched);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contacts</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage your customer database ({contacts.length})</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 animate-pulse">Loading contacts database...</div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No contacts yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Contacts will appear here automatically when customers fill out your forms or book services.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {contacts.map((contact) => (
                        <Card key={contact.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg transition-all group border-gray-100 hover:border-blue-100">
                            <div className="flex items-center gap-5 mb-4 md:mb-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                    {contact.firstName[0]}{contact.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors text-base">
                                        {contact.firstName} {contact.lastName}
                                        {contact.lastInteraction && (
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Recently Active"></span>
                                        )}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5 font-medium">
                                        {contact.email && (
                                            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer">
                                                <Mail size={14} className="text-gray-400" /> {contact.email}
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={14} className="text-gray-400" /> {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pl-16 md:pl-0">
                                <div className="text-right hidden lg:block">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added</span>
                                    <p className="text-xs font-bold text-gray-900 mt-0.5 flex items-center justify-end gap-1.5">
                                        <Calendar size={14} className="text-gray-300" />
                                        {new Date(contact.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Source</span>
                                    <Badge variant="default" className="capitalize px-2 py-0.5 text-[10px]">{contact.source}</Badge>
                                </div>

                                <div className="w-px h-10 bg-gray-100 mx-2 hidden md:block"></div>

                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-10 px-4 gap-2 text-[10px] font-bold uppercase tracking-widest bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                                        <MessageSquare size={16} />
                                        {contact.conversationCount > 0 ? 'Chat' : 'Message'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Contacts;
