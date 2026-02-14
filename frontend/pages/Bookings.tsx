
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Check, X, Calendar as CalendarIcon, Download, ChevronRight, Copy, Link as LinkIcon } from 'lucide-react';
import { Card, Button, Badge, Input, Skeleton, EmptyState, Modal } from '../components/UI';
import { BookingStatus } from '../types';
import { toast } from 'react-hot-toast';
import { authService, bookingService } from '../lib/services/api';
import { Booking } from '../lib/services/api';

const Bookings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadBookings();
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

  const loadBookings = async () => {
    if (!selectedWorkspaceId) return;
    try {
      setIsLoading(true);
      const data = await bookingService.getWorkspaceBookings(selectedWorkspaceId);
      setBookings(data);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="info">Confirmed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      case 'no_show': return <Badge>No Show</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setIsUpdating(true);
      await bookingService.updateBookingStatus(selectedBooking.id, 'cancelled');
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b));
      setIsCancelModalOpen(false);
      toast.success('Booking cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    try {
      setIsUpdating(true);
      await bookingService.updateBookingStatus(booking.id, 'confirmed');
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed' } : b));
      toast.success('Booking confirmed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyBookingLink = () => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace first');
      return;
    }
    const url = `${window.location.origin}/book/${selectedWorkspaceId}`;
    navigator.clipboard.writeText(url);
    toast.success('Public booking link copied!');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    // timeStr is in HH:MM format, convert to 12-hour format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Show workspace selection message if no workspace
  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-gray-500 text-sm">Review, confirm and manage upcoming appointments.</p>
        </div>
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/40 min-h-[400px]">
          <EmptyState
            title="No workspace available"
            description="Please create a workspace first to start managing bookings."
            icon={<CalendarIcon size={32} />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-gray-500 text-sm">Review, confirm and manage upcoming appointments.</p>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyBookingLink} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <LinkIcon size={14} /> Copy Link
          </Button>
          <Button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-blue-600">
            <CalendarIcon size={14} /> New Appointment
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/40 min-h-[400px]">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input className="pl-11 h-10 text-xs bg-gray-50 border-none shadow-none focus:bg-white transition-all" placeholder="Search customer, service or status..." />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="h-10 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} /> Filters
            </Button>
          </div>
        </div>

        {!selectedWorkspaceId ? (
          <EmptyState
            title="Select a workspace"
            description="Choose a workspace from the dropdown above to view bookings."
            icon={<CalendarIcon size={32} />}
          />
        ) : isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Share your booking link to start receiving appointments from your customers."
            icon={<CalendarIcon size={32} />}
            action={
              <Button onClick={copyBookingLink} className="bg-blue-600">Share Booking Link</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">
                  <th className="px-6 py-4 border-b">Booking Ref</th>
                  <th className="px-6 py-4 border-b">Customer</th>
                  <th className="px-6 py-4 border-b">Service Details</th>
                  <th className="px-6 py-4 border-b">Scheduled</th>
                  <th className="px-6 py-4 border-b">Status</th>
                  <th className="px-6 py-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
                    <td className="px-6 py-5 text-xs font-mono font-bold text-gray-500">{booking.id.slice(0, 8)}...</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white">
                          {booking.contact.firstName[0]}{booking.contact.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{booking.contact.firstName} {booking.contact.lastName}</span>
                          <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                            {booking.contact.email || booking.contact.phone || 'No contact'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">{booking.serviceType.name}</span>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">{booking.serviceType.duration} min</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-900">{formatDate(booking.date)}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{formatTime(booking.time)}</div>
                    </td>
                    <td className="px-6 py-5">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                          <button
                            onClick={() => handleConfirmBooking(booking)}
                            disabled={isUpdating}
                            className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Confirm"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelClick(booking)}
                            disabled={isUpdating}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        )}
                        <button className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this booking? This action will notify the customer."
        variant="danger"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setIsCancelModalOpen(false)} disabled={isUpdating}>Keep Booking</Button>
            <Button variant="danger" className="flex-1" onClick={confirmCancel} disabled={isUpdating}>
              {isUpdating ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </>
        }
      >
        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
          <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Selected Booking</p>
          <p className="font-bold text-slate-900">
            {selectedBooking?.contact.firstName} {selectedBooking?.contact.lastName}
          </p>
          <p className="text-sm text-slate-500">
            {selectedBooking?.serviceType.name} • {selectedBooking ? formatDate(selectedBooking.date) : ''}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Bookings;
