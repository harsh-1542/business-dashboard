import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, Search, Send, MoreVertical,
    Phone, Mail, User, Clock, Check, CheckCheck
} from 'lucide-react';
import { Button, Input, Badge } from '../components/UI';
import { conversationService, authService, Conversation, Message } from '../lib/services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Inbox: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyContent, setReplyContent] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const sessionData = await authService.getSession();
            setSession(sessionData);
            if (sessionData.workspaces.length > 0) {
                loadConversations(sessionData.workspaces[0].id);
            } else {
                setLoadingConversations(false);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            setLoadingConversations(false);
        }
    };

    const loadConversations = async (workspaceId: string) => {
        try {
            setLoadingConversations(true);
            const data = await conversationService.getConversations(workspaceId);
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    };

    useEffect(() => {
        if (selectedConversationId) {
            loadMessages(selectedConversationId);
        }
    }, [selectedConversationId]);

    const loadMessages = async (conversationId: string) => {
        try {
            setLoadingMessages(true);
            const data = await conversationService.getMessages(conversationId);
            setMessages(data);
            scrollToBottom();

            // Mark as read locally
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, isLastMessageRead: true } : c
            ));

        } catch (error) {
            console.error('Failed to load messages', error);
            toast.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversationId || !replyContent.trim()) return;

        try {
            setSendingReply(true);
            const newMessage = await conversationService.reply(selectedConversationId, replyContent);
            setMessages(prev => [...prev, newMessage]);
            setReplyContent('');
            scrollToBottom();

            // Update last message in conversation list
            setConversations(prev => prev.map(c =>
                c.id === selectedConversationId ? {
                    ...c,
                    lastMessage: newMessage.content,
                    lastMessageAt: newMessage.sentAt,
                    updatedAt: newMessage.sentAt
                } : c
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

        } catch (error) {
            console.error('Failed to send reply', error);
            toast.error('Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="h-[calc(100vh-100px)] flex bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-gray-100">
            {/* Sidebar - Conversations List */}
            <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-100 bg-gray-50/50`}>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-600" />
                        Inbox
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loadingConversations ? (
                        <div className="p-4 text-center text-gray-400 text-xs">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No conversations available</div>
                    ) : (
                        conversations.map(conv => (
                            <motion.div
                                key={conv.id}
                                whileHover={{ scale: 0.98 }}
                                onClick={() => setSelectedConversationId(conv.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-all ${selectedConversationId === conv.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'hover:bg-white border border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm ${!conv.isLastMessageRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {conv.contact.firstName} {conv.contact.lastName}
                                    </h3>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={`text-xs line-clamp-2 ${!conv.isLastMessageRead ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                    {conv.lastMessage || 'No messages'}
                                </p>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white h-full`}>
                {selectedConversationId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="md:hidden mr-2">
                                    <Button variant="ghost" onClick={() => setSelectedConversationId(null)} className="p-0 h-8 w-8">←</Button>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                    {selectedConversation?.contact.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {selectedConversation?.contact.firstName} {selectedConversation?.contact.lastName}
                                    </h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <span className="flex items-center gap-1"><Mail size={10} /> {selectedConversation?.contact.email}</span>
                                        {selectedConversation?.contact.phone && <span className="flex items-center gap-1"><Phone size={10} /> {selectedConversation?.contact.phone}</span>}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-gray-400"><MoreVertical size={18} /></Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {loadingMessages ? (
                                <div className="text-center py-10 text-gray-400">Loading messages...</div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderType === 'staff';
                                    // If senderType is System, align center?
                                    const isSystem = msg.senderType === 'system';

                                    if (isSystem) return (
                                        <div key={msg.id} className="flex justify-center my-4">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] md:max-w-[70%] space-y-1 ${isMe ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                                <div className={`p-4 rounded-2xl shadow-sm border ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none border-blue-600'
                                                    : 'bg-white text-gray-800 rounded-bl-none border-gray-100'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 px-2 flex items-center gap-1">
                                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && (msg.isRead ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-100">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none min-h-[50px] max-h-32"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply(e);
                                        }
                                    }}
                                />
                                <Button
                                    disabled={sendingReply || !replyContent.trim()}
                                    className="h-[50px] w-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 p-0 flex items-center justify-center"
                                >
                                    {sendingReply ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} className="ml-0.5 mt-0.5" />}
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <MessageSquare size={32} />
                        </div>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
