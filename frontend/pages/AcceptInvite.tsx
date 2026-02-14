import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Button, Input } from '../components/UI';
import { staffService } from '../lib/services/api';
import { toast } from 'react-hot-toast';

const AcceptInvite: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<any>(null);

    // Form data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Missing invitation token');
            setLoading(false);
            return;
        }
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const data = await staffService.verifyInviteToken(token!);
            setInviteData(data);

            // If user already exists, we might want to handle that differently
            // but for now we just show the form without password fields?
            // backend check says existingUser data is returned

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid or expired invitation link');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setSubmitting(true);
            await staffService.acceptInvite({
                token: token!,
                firstName,
                lastName,
                password
            });

            toast.success('Invitation accepted!Redirecting...');

            // Redirect to login or dashboard
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (err: any) {
            toast.error(err.message || 'Failed to accept invitation');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Invitation Error</h2>
                    <p className="text-gray-500">{error}</p>
                    <Button onClick={() => navigate('/login')} className="w-full mt-4">
                        Go to Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-8 shadow-xl shadow-slate-200/50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-6 shadow-sm transform -rotate-3">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Join the Team</h1>
                    <p className="text-slate-500 mt-2">
                        You've been invited to join <span className="font-bold text-slate-900">{inviteData?.workspaceName}</span>
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                        <CheckCircle2 size={12} />
                        Invitation Valid
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                                <Input
                                    required
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="Jane"
                                    className="bg-slate-50 border-slate-100"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                                <Input
                                    required
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="bg-slate-50 border-slate-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email</label>
                            <Input
                                disabled
                                value={inviteData?.email || ''}
                                className="bg-slate-100 text-slate-500 border-none"
                            />
                        </div>

                        {!inviteData?.userExists && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Create Password</label>
                                    <Input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="bg-slate-50 border-slate-100"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirm Password</label>
                                    <Input
                                        required
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        className="bg-slate-50 border-slate-100"
                                    />
                                </div>
                            </>
                        )}
                        {inviteData?.userExists && (
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100">
                                You already have an account. Accepting this invite will just add you to the workspace.
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {submitting ? 'Setting up...' : 'Accept Invitation & Join'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default AcceptInvite;
