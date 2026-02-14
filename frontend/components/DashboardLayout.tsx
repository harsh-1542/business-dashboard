
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  LogOut,
  Search,
  User,
  Zap,
  Plus
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { clearAuth, REFRESH_TOKEN_KEY, getCurrentUser, AuthUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/services/api';
import { apiFetch } from '../lib/api';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const session = await authService.getSession();
        if (session.workspaces && session.workspaces.length > 0) {
          setWorkspaces(session.workspaces);
          // Try to get stored workspace selection or default to first
          const storedWorkspaceId = localStorage.getItem('careops_selected_workspace');
          const found = storedWorkspaceId ? session.workspaces.find(w => w.id === storedWorkspaceId) : null;
          setSelectedWorkspace(found || session.workspaces[0]);
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      }
    };
    loadWorkspaces();
  }, []);

  const handleWorkspaceChange = (workspace: any) => {
    setSelectedWorkspace(workspace);
    localStorage.setItem('careops_selected_workspace', workspace.id);
    // Optionally reload page or trigger context update if needed
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      // Get refresh token for backend logout
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      // Call backend to revoke refresh token
      if (refreshToken) {
        try {
          await apiFetch('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          // Continue with logout even if backend call fails
          console.error('Backend logout error:', error);
        }
      }

      // Sign out from Supabase if there's a session
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase sign out error:', error);
      }

      // Clear local storage
      clearAuth();

      // Show success message
      toast.success('Logged out successfully');

      // Navigate to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear auth and navigate even if something fails
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0F172A] text-white transition-all duration-300 ease-in-out border-r border-slate-800 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="p-6 flex items-center gap-3" id="sidebar-logo">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            <Zap size={20} fill="white" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CareOps
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide pt-4">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const tourId = `nav-${item.label.toLowerCase().replace(' ', '-')}`;
            return (
              <Link
                key={item.path}
                id={tourId}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${isActive
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                {isActive && <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />}
                <span className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full bg-[#0F172A] p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white"><Zap size={16} /></div>
                  <span className="font-bold text-xl text-white">CareOps</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              <nav className="space-y-2">
                {NAVIGATION_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'
                      }`}
                  >
                    {item.icon}
                    <span className="text-lg font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={22} />
            </button>
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-72 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search resources, bookings..."
                className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <div className="relative group">
              <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors" id="workspace-selector">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                  {selectedWorkspace ? selectedWorkspace.businessName.substring(0, 2) : 'WS'}
                </div>
                <span className="text-xs font-semibold text-gray-700 max-w-[150px] truncate">
                  {selectedWorkspace ? selectedWorkspace.businessName : 'Select Workspace'}
                </span>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              {/* Workspace Dropdown */}
              <div className="absolute top-full right-0   w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover:block z-50">
                <div className=" p-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Workspace</p>
                </div>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceChange(ws)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${selectedWorkspace?.id === ws.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedWorkspace?.id === ws.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className="truncate flex-1">{ws.businessName}</span>
                    {selectedWorkspace?.id === ws.id && <Zap size={12} className="text-blue-500" />}
                  </button>
                ))}
                <div className="mt-1 pt-1 border-t border-gray-50">
                  <button
                    onClick={() => navigate('/dashboard/workspaces')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Create New Workspace
                  </button>
                </div>
              </div>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors" id="notifications-bell">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 md:pl-5 md:border-l border-gray-100" id="user-profile">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {currentUser
                    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
                    : 'Loading...'}
                </p>
                <p className="text-[10px] font-medium text-blue-500 uppercase tracking-tighter">
                  {currentUser?.role === 'owner' ? 'Business Owner' : currentUser?.role === 'staff' ? 'Staff Member' : 'User'}
                </p>
              </div>
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm ring-2 ring-gray-50">
                {currentUser?.firstName ? (
                  <span className="text-xs font-bold">
                    {currentUser.firstName.charAt(0)}{currentUser.lastName?.charAt(0) || ''}
                  </span>
                ) : (
                  <User size={18} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
