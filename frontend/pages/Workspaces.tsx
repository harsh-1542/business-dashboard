

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Settings, ExternalLink, Activity, Users, MapPin, Building2, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Skeleton, EmptyState, Modal, Input } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authService, workspaceService, bookingService } from '../lib/services/api';
import { Workspace } from '../lib/services/api';
import { TIMEZONES } from '../lib/constants';

const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Workspace | null>(null);
  const [createFormData, setCreateFormData] = useState({
    businessName: '',
    businessType: '',
    address: '',
    contactEmail: '',
    timezone: 'America/New_York',
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const session = await authService.getSession();
      setWorkspaces(session.workspaces || []);
    } catch (error: any) {
      console.error('Failed to load workspaces:', error);
      toast.error(error.message || 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (ws: Workspace) => {
    setSelectedForDelete(ws);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedForDelete) return;

    try {
      await workspaceService.delete(selectedForDelete.id);
      setWorkspaces(prev => prev.filter(ws => ws.id !== selectedForDelete.id));
      setIsDeleteModalOpen(false);
      toast.success('Workspace deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workspace');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const newWorkspace = await workspaceService.create({
        businessName: createFormData.businessName,
        businessType: createFormData.businessType || undefined,
        address: createFormData.address || undefined,
        contactEmail: createFormData.contactEmail,
        timezone: createFormData.timezone || undefined,
      });
      setWorkspaces(prev => [newWorkspace, ...prev]);
      setIsCreateModalOpen(false);
      setCreateFormData({ businessName: '', businessType: '', address: '', contactEmail: '', timezone: 'America/New_York' });
      toast.success('Workspace created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
          <p className="text-gray-500 text-sm">Unified control for all your physical and virtual locations.</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> Add Workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="p-12 border-none shadow-xl shadow-slate-200/40">
          <EmptyState
            title="No workspaces found"
            description="Create your first workspace to start managing your service operations."
            icon={<Building2 size={32} />}
            action={<Button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900">Add First Location</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const score = ws.setupPercentage ?? (ws.setupCompleted ? 100 : ws.isActive ? 75 : 40);
            return (
              <Card key={ws.id} className="overflow-hidden border-none shadow-xl shadow-slate-200/40 group">
                <div className="p-7 space-y-7">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-2xl shadow-inner border border-white">
                        {ws.businessName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{ws.businessName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-slate-100 text-slate-500 px-1.5">Business</Badge>
                          {ws.address && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              <MapPin size={10} /> {ws.address.split(',')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteClick(ws)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                      <button className="text-slate-300 hover:text-slate-600 transition-colors p-1"><MoreVertical size={18} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                        <Activity size={12} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Status</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">{ws.isActive ? 'Active' : 'Setup'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                        <Users size={12} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Timezone</p>
                      </div>
                      <p className="text-sm font-black text-slate-900">{ws.timezone}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em]">
                      <span className="text-gray-400">Operation Health</span>
                      <span className={score > 80 ? 'text-green-500' : 'text-yellow-500'}>{score}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${score > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest h-10"
                      onClick={() => navigate(`/dashboard/workspaces/${ws.id}/setup`)}
                    >
                      <Settings size={14} /> Configure
                    </Button>
                    <Button variant="outline" className="w-11 flex items-center justify-center h-10">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="border-2 border-dashed border-gray-200 rounded-[28px] p-8 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/20 transition-all group h-full min-h-[250px]"
          >
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Plus size={28} strokeWidth={2.5} />
            </div>
            <div className="text-center">
              <span className="font-bold text-sm uppercase tracking-widest block">Add Workspace</span>
              <span className="text-xs text-gray-400 mt-1 block">Scale your service business</span>
            </div>
          </button>
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Workspace"
        description="This will permanently delete the workspace and all its data. This action is irreversible."
        variant="danger"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete}>Delete Everything</Button>
          </>
        }
      >
        <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm font-medium">
          Workspace: <strong>{selectedForDelete?.businessName}</strong>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workspace"
        description="Add a new location or business unit to manage separately."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
            <Input
              required
              value={createFormData.businessName}
              onChange={e => setCreateFormData({ ...createFormData, businessName: e.target.value })}
              placeholder="e.g. City Dental Clinic"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Type</label>
            <Input
              value={createFormData.businessType}
              onChange={e => setCreateFormData({ ...createFormData, businessType: e.target.value })}
              placeholder="e.g. Clinic, Agency, Salon"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address</label>
            <Input
              value={createFormData.address}
              onChange={e => setCreateFormData({ ...createFormData, address: e.target.value })}
              placeholder="e.g. 123 Main St, San Francisco, CA"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
            <Input
              required
              type="email"
              value={createFormData.contactEmail}
              onChange={e => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
              placeholder="contact@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Timezone</label>
            <select
              value={createFormData.timezone}
              onChange={e => setCreateFormData({ ...createFormData, timezone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating} className="flex-1 bg-slate-900">
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Workspaces;
