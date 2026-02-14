
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from './components/DashboardLayout';
import { isAuthenticated as isAuthed, syncAuthFromSupabase } from './lib/auth';

// Pages
import DashboardHome from './pages/DashboardHome';
import Workspaces from './pages/Workspaces';
import Bookings from './pages/Bookings';
import Register from './pages/Register';
import Login from './pages/Login';
import PublicBooking from './pages/PublicBooking';
import StaffManagement from './pages/StaffManagement';
import FormsManagement from './pages/FormsManagement';
import FormEditor from './pages/FormEditor';
import PublicContactForm from './pages/PublicContactForm';
import Settings from './pages/Settings';
import BookingTypes from './pages/BookingTypes';
import WorkspaceSetup from './pages/WorkspaceSetup';
import Integrations from './pages/Integrations';
import FormResponses from './pages/FormResponses';
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import AcceptInvite from './pages/AcceptInvite';

// Added React.FC to resolve children missing errors
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = isAuthed();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Public route that redirects authenticated users to dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = isAuthed();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await syncAuthFromSupabase();
      } finally {
        setAuthReady(true);
      }
    };
    initializeAuth();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500 tracking-widest uppercase">
          Loading your workspace...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#0F172A',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600'
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/invite/accept" element={<AcceptInvite />} />
        <Route path="/book/:workspaceId" element={<PublicBooking />} />
        <Route path="/f/:formId" element={<PublicContactForm />} />
        <Route path="/public/form/:formId" element={<PublicContactForm />} />

        {/* Admin Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout><DashboardHome /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/workspaces" element={
          <ProtectedRoute>
            <DashboardLayout><Workspaces /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/bookings" element={
          <ProtectedRoute>
            <DashboardLayout><Bookings /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/staff" element={
          <ProtectedRoute>
            <DashboardLayout><StaffManagement /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/forms" element={
          <ProtectedRoute>
            <DashboardLayout><FormsManagement /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/forms/:formId" element={
          <ProtectedRoute>
            <DashboardLayout><FormEditor /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/forms/:formId/responses" element={
          <ProtectedRoute>
            <DashboardLayout><FormResponses /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/booking-types" element={
          <ProtectedRoute>
            <DashboardLayout><BookingTypes /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/workspaces/:workspaceId/setup" element={
          <ProtectedRoute>
            <DashboardLayout><WorkspaceSetup /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/integrations" element={
          <ProtectedRoute>
            <DashboardLayout><Integrations /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute>
            <DashboardLayout><Settings /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/inbox" element={
          <ProtectedRoute>
            <DashboardLayout><Inbox /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contacts" element={
          <ProtectedRoute>
            <DashboardLayout><Contacts /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Wildcard / Feature in Progress */}
        <Route path="/dashboard/:feature" element={
          <ProtectedRoute>
            <DashboardLayout>
              <div className="flex flex-col items-center justify-center py-32 text-center max-w-sm mx-auto">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-8 border border-blue-100 shadow-inner">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Premium Feature</h2>
                <p className="text-gray-500 mt-3 text-sm font-medium leading-relaxed">This module is currently in development. Upgrade to our Enterprise plan for early beta access.</p>
                <div className="mt-10 flex gap-3 w-full">
                  <button onClick={() => window.history.back()} className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">Go Back</button>
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Upgrade Now</button>
                </div>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route
          path="/"
          element={<Navigate to={isAuthed() ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </Router >
  );
};

export default App;
