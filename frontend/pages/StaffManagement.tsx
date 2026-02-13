
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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Staff';
  status: 'Active' | 'Invited';
  permissions: string[];
}

const StaffManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff' as const,
    permissions: [] as string[]
  });

  useEffect(() => {
    setTimeout(() => {
      setStaff([
        { id: '1', name: 'Alex Rivera', email: 'alex@careops.com', role: 'Owner', status: 'Active', permissions: ['inbox', 'bookings', 'forms', 'inventory'] },
        { id: '2', name: 'Sarah Jenkins', email: 'sarah@careops.com', role: 'Admin', status: 'Active', permissions: ['inbox', 'bookings'] },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role as any,
        permissions: member.permissions
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', email: '', role: 'Staff', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...formData } : s));
      toast.success('Staff member updated');
    } else {
      const newMember: StaffMember = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        status: 'Invited'
      };
      setStaff(prev => [...prev, newMember]);
      toast.success('Invitation sent to ' + formData.email);
    }
    setIsModalOpen(false);
  };

  const openDeleteModal = (member: StaffMember) => {
    setSelectedForDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmRemove = () => {
    if (selectedForDelete) {
      setStaff(prev => prev.filter(s => s.id !== selectedForDelete.id));
      toast.success('Staff member removed');
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 text-sm">Manage team members, roles, and access permissions.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
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

        {isLoading ? (
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
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{member.name}</span>
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
                        {member.permissions.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-tighter">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={member.status === 'Active' ? 'success' : 'warning'}>
                        {member.status}
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
                        {member.role !== 'Owner' && (
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
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Permissions</label>
            <div className="grid gap-2">
              {AVAILABLE_PERMISSIONS.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleTogglePermission(p.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    formData.permissions.includes(p.id) ? 'border-blue-100 bg-blue-50/50' : 'border-gray-50'
                  }`}
                >
                  <span className="text-xs font-bold">{p.label}</span>
                  {formData.permissions.includes(p.id) && <CheckCircle2 size={16} className="text-blue-600" />}
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full bg-slate-900 h-12 rounded-xl uppercase font-bold tracking-widest text-xs">
            {editingStaff ? 'Update Member' : 'Send Invitation'}
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
        <p className="font-bold text-slate-900">{selectedForDelete?.name}</p>
        <p className="text-sm text-slate-500">{selectedForDelete?.email}</p>
      </Modal>
    </div>
  );
};

export default StaffManagement;
