
import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  CalendarCheck,
  Contact,
  Settings,
  Users,
  Plug,
  Clock,
  Briefcase,
  FileText
} from 'lucide-react';

export const COLORS = {
  primary: '#4A90E2',
  slate900: '#0F172A',
  success: '#22C55E',
  warning: '#FACC15',
  danger: '#EF4444',
};

export const NAVIGATION_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Inbox', icon: <MessageSquare size={20} />, path: '/dashboard/inbox' },
  { label: 'Workspaces', icon: <Building2 size={20} />, path: '/dashboard/workspaces' },
  { label: 'Bookings', icon: <CalendarCheck size={20} />, path: '/dashboard/bookings' },
  { label: 'Booking Types', icon: <Briefcase size={20} />, path: '/dashboard/booking-types' },
  { label: 'Contacts', icon: <Contact size={20} />, path: '/dashboard/contacts' },
  { label: 'Forms', icon: <FileText size={20} />, path: '/dashboard/forms' },
  { label: 'Staff', icon: <Users size={20} />, path: '/dashboard/staff' },
  { label: 'Integrations', icon: <Plug size={20} />, path: '/dashboard/integrations' },
  { label: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
];
