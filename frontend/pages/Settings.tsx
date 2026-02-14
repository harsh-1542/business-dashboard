
import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Camera,
  Smartphone,
  CheckCircle2,
  Mail,
  UserCheck
} from 'lucide-react';
// Added Badge to the imports from UI components
import { Card, Button, Input, Badge } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { userService, UserProfile } from '../lib/services/api';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Profile Form State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });

  // Password Form State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const userProfile = await userService.getProfile();
      setProfile(userProfile);
      setProfileForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile = await userService.updateProfile(profileForm);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success('Password changed successfully. Please log in again.');
      setPasswords({ current: '', new: '', confirm: '' });

      // Optionally redirect to login after password change
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: <User size={16} /> },
    { id: 'security', label: 'Security & Access', icon: <Lock size={16} /> },
    { id: 'notifications', label: 'Notification Rules', icon: <Bell size={16} /> },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your personal account preferences and security protocols.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm shadow-slate-200 border border-slate-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-500' : 'text-slate-300'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {profileLoading ? (
                  <Card className="p-8 border-none shadow-xl shadow-slate-200/40 bg-white rounded-[24px]">
                    <div className="flex items-center justify-center py-20">
                      <div className="text-sm font-semibold text-slate-500 tracking-widest uppercase">
                        Loading profile...
                      </div>
                    </div>
                  </Card>
                ) : profile ? (
                  <Card className="p-8 border-none shadow-xl shadow-slate-200/40 bg-white rounded-[24px]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-10 border-b border-slate-50">
                      <div className="relative group">
                        <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-slate-900/20">
                          {`${profileForm.firstName?.[0] || ''}${profileForm.lastName?.[0] || ''}`}
                        </div>
                        <button type="button" className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-all">
                          <Camera size={18} />
                        </button>
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{`${profileForm.firstName} ${profileForm.lastName}`}</h2>
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                          <UserCheck size={14} /> {profile.role}
                        </p>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Profile photo will be visible to your team and customers.</p>
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                          <Input
                            value={profileForm.firstName}
                            onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                            className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                          <Input
                            value={profileForm.lastName}
                            onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                            className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                          <Input
                            type="email"
                            value={profile.email}
                            disabled
                            className="bg-slate-100 border-none h-12 rounded-xl grayscale opacity-60 cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                          <Input
                            value={profileForm.phone}
                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Role</label>
                          <Input
                            disabled
                            value={profile.role}
                            className="bg-slate-100 border-none h-12 rounded-xl grayscale opacity-60 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Professional Bio</label>
                        <textarea
                          className="w-full bg-slate-50 border-none focus:bg-white rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          rows={4}
                          value={profileForm.bio}
                          onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button
                          disabled={loading}
                          className="h-12 px-10 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                        >
                          {loading ? 'Saving Changes...' : 'Save Profile Details'}
                          <Save size={16} />
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : null}
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-xl shadow-slate-200/40 bg-white rounded-[24px]">
                  <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900">Change Password</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">Strengthen your account security by updating your credentials.</p>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Current Password</label>
                      <Input
                        type="password"
                        required
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                        placeholder="••••••••••••"
                      />
                    </div>

                    <div className="h-px bg-slate-50 my-2" />

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">New Secure Password</label>
                      <Input
                        type="password"
                        required
                        value={passwords.new}
                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                        placeholder="Minimum 12 characters"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                      <Input
                        type="password"
                        required
                        value={passwords.confirm}
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="bg-slate-50 border-none focus:bg-white h-12 rounded-xl"
                        placeholder="Re-type new password"
                      />
                    </div>

                    <div className="pt-4">
                      <Button
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all"
                      >
                        {loading ? 'Processing...' : 'Update Password Protocol'}
                        <Shield size={16} />
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="p-8 border-none shadow-xl shadow-slate-200/40 bg-white rounded-[24px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Two-Factor Authentication</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">Add an extra layer of security to your session logins.</p>
                    </div>
                    <Badge variant="warning" className="px-3">Disabled</Badge>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-50">
                    <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest gap-2 bg-slate-50 border-none hover:bg-slate-100 h-10 px-6 rounded-xl">
                      <Smartphone size={14} /> Enable 2FA
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-xl shadow-slate-200/40 bg-white rounded-[24px]">
                  <div className="space-y-10">
                    {[
                      { title: 'New Booking Alerts', desc: 'Notify me immediately when a customer books a slot.', icon: <Bell size={18} />, enabled: true },
                      { title: 'Weekly Summary', desc: 'Receive a digest of your operational performance every Monday.', icon: <CheckCircle2 size={18} />, enabled: false },
                      { title: 'Security Logins', desc: 'Alert me whenever a new device accesses my workspace.', icon: <Shield size={18} />, enabled: true },
                      { title: 'System Emails', desc: 'Important technical updates and service notifications.', icon: <Mail size={18} />, enabled: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="text-slate-400 text-xs font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <button className={`w-12 h-6 rounded-full transition-all relative ${item.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.enabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Settings;
