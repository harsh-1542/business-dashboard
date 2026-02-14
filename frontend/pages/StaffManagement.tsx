
import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  MoreHorizontal,
  Shield,
  Mail,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Filter,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Card, Button, Badge, Input, Skeleton, EmptyState, Modal } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { authService, staffService } from '../lib/services/api';
import { StaffMember } from '../lib/services/api';

interface Permission {
  id: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'inbox', label: 'Inbox', description: 'Can read and reply to customer messages.' },
  { id: 'bookings', label: 'Bookings', description: 'Can manage appointments and schedule.' },
  { id: 'forms', label: 'Forms', description: 'Can create and edit client intake forms.' },
  { id: 'inventory', label: 'Inventory', description: 'Can manage product stocks and services.' },
];

const StaffManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    permissions: {
      inbox: true,
      bookings: true,
      forms: false,
      inventory: false,
    } as any
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadStaff();
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
      toast.error(error.message || 'Failed to load workspaces');
    }
  };

  const loadStaff = async () => {
    if (!selectedWorkspaceId) return;
    try {
      setIsLoading(true);
      const data = await staffService.getWorkspaceStaff(selectedWorkspaceId);
      setStaff(data);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      toast.error(error.message || 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member);
      const perms = typeof member.permissions === 'string' ? JSON.parse(member.permissions) : member.permissions;
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        permissions: perms || { inbox: true, bookings: true, forms: false, inventory: false }
      });
    } else {
      setEditingStaff(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        permissions: { inbox: true, bookings: true, forms: false, inventory: false }
      });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [id]: !prev.permissions[id]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingStaff) {
        // Update permissions
        await staffService.updatePermissions(selectedWorkspaceId, editingStaff.userId, formData.permissions);
        await loadStaff();
        toast.success('Staff member updated');
      } else {
        // Add staff to workspace
        await staffService.addToWorkspace(selectedWorkspaceId, {
          staffEmail: formData.email,
          permissions: formData.permissions,
        });
        await loadStaff();
        toast.success('Staff member added successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (member: StaffMember) => {
    setSelectedForDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedForDelete || !selectedWorkspaceId) return;
    try {
      await staffService.removeFromWorkspace(selectedWorkspaceId, selectedForDelete.userId);
      await loadStaff();
      toast.success('Staff member removed');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff member');
    }
  };

  // Show workspace selection message if no workspace
  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 text-sm">Manage team members, roles, and access permissions.</p>
        </div>
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/40 min-h-[400px]">
          <EmptyState
            title="No workspace available"
            description="Please create a workspace first to start managing staff."
            icon={<UserPlus size={32} />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 text-sm">Manage team members, roles, and access permissions.</p>
          {workspaces.length > 0 && (
            <select
              value={selectedWorkspaceId || ''}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="mt-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.businessName}</option>
              ))}
            </select>
          )}
        </div>
        <Button
          onClick={() => handleOpenModal()}
          disabled={!selectedWorkspaceId}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={16} /> Add Staff Member
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/40 min-h-[400px]">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input className="pl-11 h-10 text-xs bg-gray-50 border-none shadow-none focus:bg-white transition-all" placeholder="Search by name, email or role..." />
          </div>
        </div>

        {!selectedWorkspaceId ? (
          <EmptyState
            title="Select a workspace"
            description="Choose a workspace from the dropdown above to view staff members."
            icon={<UserPlus size={32} />}
          />
        ) : isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState
            title="Your team is empty"
            description="Invite staff members to help you manage bookings, services and customer communications."
            icon={<UserPlus size={32} />}
            action={<Button onClick={() => handleOpenModal()} className="bg-blue-600">Invite First Member</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">
                  <th className="px-6 py-4 border-b">Member</th>
                  <th className="px-6 py-4 border-b">Role</th>
                  <th className="px-6 py-4 border-b">Permissions</th>
                  <th className="px-6 py-4 border-b">Status</th>
                  <th className="px-6 py-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{member.firstName} {member.lastName}</span>
                          <span className="text-xs text-gray-400">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Shield size={14} className="text-blue-500" />
                        {member.role}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {(() => {
                          const perms = typeof member.permissions === 'string' ? JSON.parse(member.permissions) : member.permissions;
                          return Object.entries(perms || {}).filter(([_, enabled]) => enabled).map(([key]) => (
                            <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-tighter">
                              {key}
                            </span>
                          ));
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={member.isActive ? 'success' : 'warning'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => openDeleteModal(member)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Invite Team Member'}
        description="Set roles and permissions for your staff member."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
              <Input
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!!editingStaff}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
              <Input
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!!editingStaff}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingStaff}
            />
            {!editingStaff && (
              <p className="text-xs text-gray-400 mt-1">Staff member must be registered first</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Permissions</label>
            <div className="grid gap-2">
              {AVAILABLE_PERMISSIONS.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleTogglePermission(p.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${formData.permissions[p.id] ? 'border-blue-100 bg-blue-50/50' : 'border-gray-50'
                    }`}
                >
                  <div>
                    <span className="text-xs font-bold">{p.label}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>
                  </div>
                  {formData.permissions[p.id] && <CheckCircle2 size={16} className="text-blue-600" />}
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 h-12 rounded-xl uppercase font-bold tracking-widest text-xs">
            {isSubmitting ? 'Saving...' : editingStaff ? 'Update Member' : 'Add Staff Member'}
          </Button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Staff Member"
        description="They will immediately lose all access to this workspace. This action cannot be undone."
        variant="danger"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={confirmRemove}>Remove Access</Button>
          </>
        }
      >
        <p className="font-bold text-slate-900">{selectedForDelete?.firstName} {selectedForDelete?.lastName}</p>
        <p className="text-sm text-slate-500">{selectedForDelete?.email}</p>
      </Modal>
    </div>
  );
};

export default StaffManagement;
