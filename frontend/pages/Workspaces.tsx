
import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Settings, ExternalLink, Activity, Users, MapPin, Building2, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Skeleton, EmptyState, Modal } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Workspaces: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setWorkspaces([
        { id: '1', name: 'City Dental Clinic', type: 'Health', status: 'Active', bookings: 124, revenue: '$15.2k', score: 98 },
        { id: '2', name: 'Elite Spa & Wellness', type: 'Beauty', status: 'Onboarding', bookings: 0, revenue: '$0', score: 40 },
      ]);
      setIsLoading(false);
    }, 1200);
  }, []);

  const handleDeleteClick = (ws: any) => {
    setSelectedForDelete(ws);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setWorkspaces(prev => prev.filter(w => w.id !== selectedForDelete.id));
    setIsDeleteModalOpen(false);
    toast.success('Workspace deleted successfully');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
          <p className="text-gray-500 text-sm">Unified control for all your physical and virtual locations.</p>
        </div>
        <Button className="flex items-center gap-2 bg-slate-900 text-xs font-bold uppercase tracking-widest">
          <Plus size={16} /> Add Location
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
            action={<Button className="bg-slate-900">Add First Location</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <Card key={ws.id} className="overflow-hidden border-none shadow-xl shadow-slate-200/40 group">
              <div className="p-7 space-y-7">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-2xl shadow-inner border border-white">
                      {ws.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{ws.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge className="bg-slate-100 text-slate-500 px-1.5">{ws.type}</Badge>
                         <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                           <MapPin size={10} /> San Francisco
                         </span>
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
                      <p className="text-[10px] font-bold uppercase tracking-widest">Activity</p>
                    </div>
                    <p className="text-xl font-black text-slate-900">{ws.bookings}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                      <Users size={12} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Staff</p>
                    </div>
                    <p className="text-xl font-black text-slate-900">4 Active</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em]">
                      <span className="text-gray-400">Operation Health</span>
                      <span className={ws.score > 80 ? 'text-green-500' : 'text-yellow-500'}>{ws.score}%</span>
                   </div>
                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${ws.score}%` }}
                       transition={{ duration: 1, ease: 'easeOut' }}
                       className={`h-full rounded-full ${ws.score > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                     />
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest h-10">
                    <Settings size={14} /> Configure
                  </Button>
                  <Button variant="outline" className="w-11 flex items-center justify-center h-10">
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          <button className="border-2 border-dashed border-gray-200 rounded-[28px] p-8 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/20 transition-all group h-full min-h-[250px]">
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
          Workspace: <strong>{selectedForDelete?.name}</strong>
        </div>
      </Modal>
    </div>
  );
};

export default Workspaces;
